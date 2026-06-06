<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Channel;
use App\Models\ChatMessage;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    public function getChannels(): JsonResponse
    {
        $user = auth()->user();
        $userId = $user->id;

        // Ensure at least one Global channel exists
        if (Channel::where('type', 'GLOBAL')->count() === 0) {
            Channel::create([
                'name' => 'Général',
                'slug' => 'general',
                'type' => 'GLOBAL',
                'description' => 'Discussion ouverte à tous'
            ]);
        }

        $global = Channel::where('type', 'GLOBAL')->get()->map(function($c) {
            $lastMsg = $c->messages()->latest()->first();
            if ($lastMsg) {
                $c->description = $lastMsg->content ? $lastMsg->content : ($lastMsg->file_url ? '📁 Pièce jointe' : '');
                $c->last_message = $lastMsg;
            }
            return $c;
        });

        $private = Channel::where('type', 'PRIVATE')
            ->where(function ($q) use ($userId) {
                $q->where('user1_id', $userId)->orWhere('user2_id', $userId);
            })
            ->with(['user1.profile', 'user2.profile'])
            ->get()
            ->map(function($c) use ($userId) {
                // Determine the other user for the UI
                $otherUser = $c->user1_id == $userId ? $c->user2 : $c->user1;
                $c->name = $otherUser->first_name . ' ' . $otherUser->last_name;
                $c->other_user = $otherUser;
                
                $lastMsg = $c->messages()->latest()->first();
                if ($lastMsg) {
                    $c->description = $lastMsg->content ? $lastMsg->content : ($lastMsg->file_url ? '📁 Pièce jointe' : '');
                    $c->last_message = $lastMsg;
                }
                return $c;
            });

        $projectIds = \App\Models\ProjectMembership::where('user_id', $userId)
            ->where('status', 'APPROVED')
            ->pluck('project_id');

        // Ensure Project channels exist for these memberships
        foreach ($projectIds as $pId) {
            $exists = Channel::where('type', 'PROJECT')->where('project_id', $pId)->exists();
            if (!$exists) {
                $project = \App\Models\Project::find($pId);
                if ($project) {
                    Channel::create([
                        'name' => 'Projet: ' . $project->title,
                        'slug' => 'project-' . $project->id,
                        'type' => 'PROJECT',
                        'project_id' => $project->id,
                        'description' => 'Espace de travail pour ' . $project->title
                    ]);
                }
            }
        }

        $project = Channel::where('type', 'PROJECT')
            ->whereIn('project_id', $projectIds)
            ->get()
            ->map(function($c) {
                $lastMsg = $c->messages()->latest()->first();
                if ($lastMsg) {
                    $c->description = $lastMsg->content ? $lastMsg->content : ($lastMsg->file_url ? '📁 Pièce jointe' : '');
                    $c->last_message = $lastMsg;
                }
                return $c;
            });

        $articlePosts = \App\Models\Post::where('type', 'SCIENTIFIC_ARTICLE')->latest()->limit(20)->get();
        foreach ($articlePosts as $post) {
            $exists = Channel::where('type', 'ARTICLE')->where('post_id', $post->id)->exists();
            if (!$exists) {
                Channel::create([
                    'name' => 'Article: ' . substr($post->content, 0, 20) . '...',
                    'slug' => 'article-' . $post->id,
                    'type' => 'ARTICLE',
                    'post_id' => $post->id,
                    'description' => 'Discussion autour de l\'article: ' . substr($post->content, 0, 50) . '...'
                ]);
            }
        }

        $article = Channel::where('type', 'ARTICLE')
            ->get()
            ->map(function($c) {
                $lastMsg = $c->messages()->latest()->first();
                if ($lastMsg) {
                    $c->description = $lastMsg->content ? $lastMsg->content : ($lastMsg->file_url ? '📁 Pièce jointe' : '');
                    $c->last_message = $lastMsg;
                }
                return $c;
            });

        return response()->json([
            'global' => $global,
            'private' => $private,
            'project' => $project,
            'article' => $article
        ]);
    }

    public function startPrivateChat(Request $request, \App\Models\User $otherUser): JsonResponse
    {
        $userId = auth()->id();
        $otherUserId = $otherUser->id;

        if ($userId == $otherUserId) {
            return response()->json(['message' => 'Impossible de discuter avec soi-même.'], 400);
        }

        // Check if connection exists
        $connected = \App\Models\Connection::where(function($q) use ($userId, $otherUserId) {
            $q->where('sender_id', $userId)->where('receiver_id', $otherUserId);
        })->orWhere(function($q) use ($userId, $otherUserId) {
            $q->where('sender_id', $otherUserId)->where('receiver_id', $userId);
        })->where('status', 'ACCEPTED')->exists();

        if (!$connected) {
             return response()->json(['message' => 'Vous devez être connectés pour discuter en privé.'], 403);
        }

        // Find or create channel
        $channel = Channel::where('type', 'PRIVATE')
            ->where(function ($q) use ($userId, $otherUserId) {
                $q->where('user1_id', $userId)->where('user2_id', $otherUserId);
            })->orWhere(function ($q) use ($userId, $otherUserId) {
                $q->where('user1_id', $otherUserId)->where('user2_id', $userId);
            })->first();

        if (!$channel) {
            $channel = Channel::create([
                'name' => 'Chat with ' . $otherUser->first_name,
                'slug' => 'private-' . min($userId, $otherUserId) . '-' . max($userId, $otherUserId),
                'type' => 'PRIVATE',
                'user1_id' => min($userId, $otherUserId),
                'user2_id' => max($userId, $otherUserId),
                'is_private' => true
            ]);
        }

        return response()->json($channel);
    }

    public function createChannel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);

        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $validated['name'])));
        
        $channel = Channel::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'],
        ]);

        return response()->json($channel, 201);
    }

    public function getMessages(Channel $channel): JsonResponse
    {
        $messages = $channel->messages()->with('sender.profile')->latest()->limit(50)->get();
        return response()->json($messages->reverse()->values());
    }

    public function sendMessage(Request $request, Channel $channel): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'nullable|string',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        if (empty($validated['content']) && !$request->hasFile('file')) {
            return response()->json(['message' => 'Le message ne peut pas être vide'], 422);
        }

        $fileUrl = null;
        if ($request->hasFile('file')) {
            $fileUrl = $request->file('file')->store('chat_files', 'public');
        }

        $message = $channel->messages()->create([
            'sender_id' => $request->user()->id,
            'content' => $validated['content'] ?? '',
            'file_url' => $fileUrl,
        ]);

        // Create Notifications
        if ($channel->type === 'PRIVATE') {
            $receiverId = $channel->user1_id == $request->user()->id ? $channel->user2_id : $channel->user1_id;
            if ($receiverId) {
                \App\Models\Notification::create([
                    'user_id' => $receiverId,
                    'type' => 'DIRECT_MESSAGE_RECEIVED',
                    'message' => $request->user()->first_name . ' vous a envoyé un message.',
                    'reference_id' => $channel->id,
                    'reference_type' => 'App\Models\Channel',
                ]);
            }
        } elseif ($channel->type === 'PROJECT') {
            $projectMembers = \App\Models\ProjectMembership::where('project_id', $channel->project_id)
                ->where('status', 'APPROVED')
                ->where('user_id', '!=', $request->user()->id)
                ->pluck('user_id');
                
            foreach ($projectMembers as $memberId) {
                \App\Models\Notification::create([
                    'user_id' => $memberId,
                    'type' => 'PROJECT_NEW_MESSAGE',
                    'message' => $request->user()->first_name . ' a envoyé un message dans le projet ' . $channel->name,
                    'reference_id' => $channel->id,
                    'reference_type' => 'App\Models\Channel',
                ]);
            }
        }

        return response()->json($message->load('sender.profile'), 201);
    }
}
