<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;

class NetworkController extends Controller
{
    /**
     * Get all users with connection state.
     */
    public function index(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $users = User::where('id', '!=', $userId)
            ->where('status', 'ACTIVE')
            ->with(['profile'])
            ->get();

        // Fetch all connections of the current user in one query
        $connections = \App\Models\Connection::where(function($q) use ($userId) {
            $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
        })->get();

        // Map connections by the other user's ID for O(1) in-memory lookup
        $connectionMap = [];
        foreach ($connections as $c) {
            $key = $c->sender_id === $userId ? $c->receiver_id : $c->sender_id;
            $connectionMap[$key] = $c;
        }

        // Attach connection status from memory (No N+1 queries!)
        $users->each(function ($u) use ($connectionMap, $userId) {
            if (isset($connectionMap[$u->id])) {
                $connection = $connectionMap[$u->id];
                $u->connection_status = $connection->status;
                $u->is_sender = $connection->sender_id === $userId;
            } else {
                $u->connection_status = 'NONE';
                $u->is_sender = false;
            }
        });

        return response()->json($users);
    }

    /**
     * Search users.
     */
    public function search(Request $request): JsonResponse
    {
        $q = $request->query('q');
        $userId = auth()->id();

        if (empty($q)) return response()->json([]);

        $users = User::where('id', '!=', $userId)
            ->where('status', 'ACTIVE')
            ->where(function ($query) use ($q) {
                $query->where('first_name', 'like', "%$q%")
                    ->orWhere('last_name', 'like', "%$q%");
            })
            ->with('profile')
            ->get();

        // Fetch all connections between current user and the found users in one query
        $foundUserIds = $users->pluck('id')->toArray();
        $connections = \App\Models\Connection::where(function($q) use ($userId, $foundUserIds) {
            $q->where('sender_id', $userId)->whereIn('receiver_id', $foundUserIds);
        })->orWhere(function($q) use ($userId, $foundUserIds) {
            $q->whereIn('sender_id', $foundUserIds)->where('receiver_id', $userId);
        })->get();

        // Map connections by the other user's ID for O(1) in-memory lookup
        $connectionMap = [];
        foreach ($connections as $c) {
            $key = $c->sender_id === $userId ? $c->receiver_id : $c->sender_id;
            $connectionMap[$key] = $c;
        }

        $users->each(function ($u) use ($connectionMap, $userId) {
            if (isset($connectionMap[$u->id])) {
                $connection = $connectionMap[$u->id];
                $u->connection_status = $connection->status;
                $u->is_sender = $connection->sender_id === $userId;
            } else {
                $u->connection_status = 'NONE';
                $u->is_sender = false;
            }
        });

        return response()->json($users);
    }

    /**
     * Send connection request.
     */
    public function sendRequest(User $user): JsonResponse
    {
        $sender = auth()->user();
        
        if ($sender->id === $user->id) {
            return response()->json(['message' => 'Action impossible'], 400);
        }

        $existing = \App\Models\Connection::where(function($q) use ($sender, $user) {
            $q->where('sender_id', $sender->id)->where('receiver_id', $user->id);
        })->orWhere(function($q) use ($sender, $user) {
            $q->where('sender_id', $user->id)->where('receiver_id', $sender->id);
        })->first();

        if ($existing) {
            return response()->json(['message' => 'Une connexion existe déjà'], 400);
        }

        \App\Models\Connection::create([
            'sender_id' => $sender->id,
            'receiver_id' => $user->id,
            'status' => 'PENDING'
        ]);

        // Notify
        $user->notifications()->create([
            'type' => 'CONNECTION_REQUEST',
            'message' => $sender->first_name . " souhaite se connecter avec vous.",
            'reference_id' => $sender->id,
            'reference_type' => 'USER'
        ]);

        return response()->json(['message' => 'Demande envoyée.']);
    }

    public function acceptRequest(User $user): JsonResponse
    {
        $receiverId = auth()->id();
        $connection = \App\Models\Connection::where('sender_id', $user->id)
            ->where('receiver_id', $receiverId)
            ->where('status', 'PENDING')
            ->first();

        if (!$connection) {
            // Maybe already accepted — just clean up the notification
            \App\Models\Notification::where('user_id', $receiverId)
                ->where('type', 'CONNECTION_REQUEST')
                ->where('reference_id', $user->id)
                ->delete();
            return response()->json(['message' => 'Demande déjà traitée ou inexistante.'], 200);
        }

        $connection->update(['status' => 'ACCEPTED']);

        // Delete receiver's CONNECTION_REQUEST notification
        \App\Models\Notification::where('user_id', $receiverId)
            ->where('type', 'CONNECTION_REQUEST')
            ->where('reference_id', $user->id)
            ->delete();

        // Notify sender
        $user->notifications()->create([
            'type' => 'CONNECTION_ACCEPTED',
            'message' => auth()->user()->first_name . " a accepté votre demande de connexion.",
            'reference_id' => $receiverId,
            'reference_type' => 'USER'
        ]);

        return response()->json(['message' => 'Connexion acceptée.']);
    }

    public function removeConnection(User $user): JsonResponse
    {
        $userId = auth()->id();

        // Delete related notifications in both directions
        \App\Models\Notification::where('user_id', $userId)
            ->where('type', 'CONNECTION_REQUEST')
            ->where('reference_id', $user->id)
            ->delete();

        $deleted = \App\Models\Connection::where(function($q) use ($userId, $user) {
            $q->where('sender_id', $userId)->where('receiver_id', $user->id);
        })->orWhere(function($q) use ($userId, $user) {
            $q->where('sender_id', $user->id)->where('receiver_id', $userId);
        })->delete();

        return response()->json(['message' => $deleted ? 'Connexion supprimée.' : 'Aucune connexion trouvée.']);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $userId = auth()->id();
        
        // Users who already have a connection (pending or accepted)
        $connectedUserIds = \App\Models\Connection::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->get()
            ->flatMap(function ($c) use ($userId) {
                return [$c->sender_id, $c->receiver_id];
            })
            ->unique()
            ->toArray();

        $suggestions = User::where('id', '!=', $userId)
            ->whereNotIn('id', $connectedUserIds)
            ->where('status', 'ACTIVE')
            ->with('profile')
            ->inRandomOrder()
            ->limit(3)
            ->get();

        return response()->json($suggestions);
    }

    /**
     * Get only accepted connections.
     */
    public function getConnections(Request $request): JsonResponse
    {
        $userId = $request->query('user_id') ?: auth()->id();
        $connectedIds = \App\Models\Connection::where('status', 'ACCEPTED')
            ->where(function($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->get()
            ->map(function($c) use ($userId) {
                return $c->sender_id == $userId ? $c->receiver_id : $c->sender_id;
            });

        $connections = User::whereIn('id', $connectedIds)
            ->with('profile')
            ->orderBy('first_name')
            ->get();

        return response()->json($connections);
    }
}
