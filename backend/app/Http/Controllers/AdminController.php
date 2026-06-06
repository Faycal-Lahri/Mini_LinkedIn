<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\Post;
use App\Models\Report;
use App\Models\Project;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /** Get system statistics. */
    public function stats(): JsonResponse
    {
        return response()->json([
            'total_users'       => User::count(),
            'active_users'      => User::where('status', 'ACTIVE')->count(),
            'pending_users'     => User::where('status', 'PENDING')->count(),
            'blocked_users'     => User::where('status', 'BLOCKED')->count(),
            'total_posts'       => Post::count(),
            'total_projects'    => Project::count(),
            'pending_reports'   => Report::where('status', 'PENDING')->count(),
            'role_distribution' => [
                'STUDENT'    => User::where('role', 'STUDENT')->count(),
                'TEACHER'    => User::where('role', 'TEACHER')->count(),
                'RESEARCHER' => User::where('role', 'RESEARCHER')->count(),
                'ADMIN'      => User::where('role', 'ADMIN')->count(),
            ]
        ]);
    }

    /** List users pending validation (Teachers/Researchers). */
    public function getPendingUsers(): JsonResponse
    {
        $users = User::where('status', 'PENDING')->with('profile')->latest()->get();
        return response()->json($users);
    }

    /** Approve a user. */
    public function approveUser(User $user): JsonResponse
    {
        $user->update(['status' => 'ACTIVE']);
        $user->notifications()->create([
            'type'    => 'ACCOUNT_VALIDATED',
            'message' => "Félicitations ! Votre compte a été validé par l'administration.",
        ]);
        return response()->json(['message' => "Utilisateur {$user->email} activé avec succès."]);
    }

    /** Reject a user. */
    public function rejectUser(User $user): JsonResponse
    {
        $user->update(['status' => 'DISABLED']);
        $user->notifications()->create([
            'type'    => 'ACCOUNT_REJECTED',
            'message' => "Malheureusement, votre demande d'inscription a été rejetée.",
        ]);
        return response()->json(['message' => "Inscription de {$user->email} rejetée."]);
    }

    /** Toggle user account status (ACTIVE <-> BLOCKED). */
    public function toggleUserStatus(User $user): JsonResponse
    {
        if ($user->role === 'ADMIN') {
            return response()->json(['message' => 'Impossible de modifier un compte admin.'], 403);
        }
        $newStatus = $user->status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        $user->update(['status' => $newStatus]);

        $user->notifications()->create([
            'type'    => $newStatus === 'BLOCKED' ? 'ACCOUNT_REJECTED' : 'ACCOUNT_VALIDATED',
            'message' => $newStatus === 'BLOCKED'
                ? "Votre compte a été désactivé par un administrateur."
                : "Votre compte a été réactivé par un administrateur.",
        ]);
        return response()->json(['message' => "Statut changé en {$newStatus}.", 'status' => $newStatus]);
    }

    /** Delete a user account permanently. */
    public function deleteUser(User $user): JsonResponse
    {
        if ($user->role === 'ADMIN') {
            return response()->json(['message' => 'Impossible de supprimer un compte admin.'], 403);
        }
        $user->delete();
        return response()->json(['message' => "Compte supprimé avec succès."]);
    }

    /** Change a user's role. */
    public function changeUserRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|in:STUDENT,TEACHER,RESEARCHER,ADMIN'
        ]);
        $oldRole = $user->role;
        $user->update(['role' => $validated['role']]);
        $user->notifications()->create([
            'type'    => 'ACCOUNT_VALIDATED',
            'message' => "Votre rôle a été modifié de {$oldRole} à {$validated['role']} par l'administration.",
        ]);
        return response()->json(['message' => "Rôle mis à jour.", 'role' => $validated['role']]);
    }

    /** Send a warning notification to a user. */
    public function sendWarning(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500'
        ]);
        $user->notifications()->create([
            'type'    => 'ADMIN_WARNING',
            'message' => "⚠️ Avertissement administrateur : " . $validated['message'],
        ]);
        return response()->json(['message' => "Avertissement envoyé à {$user->email}."]);
    }

    /** Get recent platform activity. */
    public function activity(): JsonResponse
    {
        $recentUsers = User::with('profile')->latest()->limit(5)->get()->map(fn($u) => [
            'id'          => $u->id,
            'type'        => 'NEW_USER',
            'description' => "Nouvel inscrit : {$u->first_name} {$u->last_name}",
            'timestamp'   => $u->created_at,
            'meta'        => ['role' => $u->role]
        ]);

        $recentPosts = Post::with('author.profile')->latest()->limit(5)->get()->map(fn($p) => [
            'id'          => $p->id,
            'type'        => 'NEW_POST',
            'description' => "Publication par {$p->author->first_name} : " . substr($p->content, 0, 50) . "...",
            'timestamp'   => $p->created_at,
            'meta'        => ['type' => $p->type]
        ]);

        return response()->json(
            $recentUsers->concat($recentPosts)->sortByDesc('timestamp')->values()
        );
    }

    /** Full user list for management. */
    public function getAllUsers(): JsonResponse
    {
        return response()->json(User::with('profile')->latest()->get());
    }

    /** Get all posts for moderation. */
    public function getAllPosts(): JsonResponse
    {
        return response()->json(
            Post::with(['author.profile'])
                ->withCount(['comments', 'likes'])
                ->latest()
                ->get()
        );
    }

    /** Delete a post (moderation). */
    public function deletePost(Post $post): JsonResponse
    {
        if ($post->file_url) {
            Storage::disk('public')->delete($post->file_url);
        }
        $post->author->notifications()->create([
            'type'    => 'ACCOUNT_REJECTED',
            'message' => "Votre publication a été supprimée par l'administration pour non-conformité.",
        ]);
        $post->delete();
        return response()->json(['message' => 'Publication supprimée.']);
    }

    /** Moderation: Get all reports. */
    public function getReports(): JsonResponse
    {
        return response()->json(Report::with('reporter.profile')->latest()->get());
    }

    /** Moderation: Resolve a report. */
    public function resolveReport(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate(['status' => 'required|in:RESOLVED,DISMISSED']);
        $report->update(['status' => $validated['status']]);
        return response()->json(['message' => 'Signalement mis à jour.']);
    }

    /** Moderation: Ban a user. */
    public function banUser(User $user): JsonResponse
    {
        if ($user->role === 'ADMIN') {
            return response()->json(['message' => 'Impossible de bannir un admin.'], 403);
        }
        $user->update(['status' => 'BLOCKED']);
        $user->notifications()->create([
            'type'    => 'ACCOUNT_REJECTED',
            'message' => "Votre compte a été banni par l'administration.",
        ]);
        return response()->json(['message' => "L'utilisateur {$user->email} a été banni."]);
    }
}
