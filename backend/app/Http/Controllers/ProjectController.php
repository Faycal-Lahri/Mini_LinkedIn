<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Project;
use App\Models\ProjectMembership;
use App\Models\ProjectTask;
use App\Models\User;

class ProjectController extends Controller
{
    public function index(): JsonResponse
    {
        $userId = auth()->id();
        $projects = Project::with(['owner.profile', 'members.profile'])
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function($query) {
                $query->where('status', 'COMPLETED');
            }])
            ->latest()
            ->get();

        // Fetch all project memberships for the current user in one query
        $memberships = \App\Models\ProjectMembership::where('user_id', $userId)->get()->keyBy('project_id');

        $projects->each(function ($p) use ($userId, $memberships) {
            if ($p->owner_id === $userId) {
                $p->user_membership_status = 'OWNER';
            } else {
                $membership = $memberships->get($p->id);
                $p->user_membership_status = $membership ? $membership->status : 'NONE';
            }
        });

        return response()->json($projects);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'           => 'required|string|max:255',
            'description'     => 'required|string',
            'objectives'      => 'nullable|string',
            'required_skills' => 'nullable|string',
            'type'            => 'required|string|in:ACADEMIC,RESEARCH,ENGINEERING,STUDY_GROUP',
            'max_members'     => 'nullable|integer|min:1',
            'conditions'      => 'nullable|string',
        ]);

        // Seuls les Enseignants et Chercheurs peuvent créer un projet de RECHERCHE
        if ($validated['type'] === 'RESEARCH' && !in_array($request->user()->role, ['TEACHER', 'RESEARCHER'])) {
            return response()->json([
                'message' => 'Seuls les enseignants et chercheurs peuvent proposer un projet de recherche.'
            ], 403);
        }

        $project = $request->user()->ownedProjects()->create($validated);

        // Add owner as a member with 'OWNER' role
        $project->memberships()->create([
            'user_id'   => $request->user()->id,
            'role'      => 'OWNER',
            'status'    => 'APPROVED',
            'joined_at' => now(),
        ]);

        return response()->json($project->load(['owner.profile', 'members.profile']), 201);
    }

    public function show(Project $project): JsonResponse
    {
        return response()->json($project->load(['owner.profile', 'members.profile']));
    }

    public function getMembers(Request $request, Project $project): JsonResponse
    {
        $isOwner = $project->owner_id === auth()->id();
        $isAdmin = auth()->user()->role === 'ADMIN';

        $query = $project->memberships()->with('user.profile');
        if (!$isOwner && !$isAdmin) {
            $query->where('status', '!=', 'PENDING');
        }

        $memberships = $query->get()
            ->map(fn($m) => [
                'id'        => $m->id,
                'user'      => $m->user,
                'role'      => $m->role,
                'status'    => $m->role === 'OWNER' ? 'OWNER' : $m->status,
                'joined_at' => $m->joined_at,
            ]);

        // Si le propriétaire n'est pas dans la liste des membres (cas des anciens projets), on l'ajoute manuellement
        if (!$memberships->contains('role', 'OWNER')) {
            $owner = [
                'id'        => 'owner-' . $project->owner_id,
                'user'      => $project->owner()->with('profile')->first(),
                'role'      => 'OWNER',
                'status'    => 'OWNER',
                'joined_at' => $project->created_at,
            ];
            $memberships->prepend($owner);
        }

        return response()->json($memberships);
    }

    /** Le propriétaire invite un utilisateur à rejoindre le projet */
    public function invite(Request $request, Project $project, User $user): JsonResponse
    {
        if ($project->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé. Vous n\'êtes pas le propriétaire de ce projet.'], 403);
        }

        // Vérifier que l'utilisateur n'est pas déjà membre ou invité
        $existing = $project->memberships()->where('user_id', $user->id)->first();
        if ($existing) {
            $statusLabel = match($existing->status) {
                'APPROVED' => 'déjà membre',
                'PENDING'  => 'a déjà fait une demande',
                'INVITED'  => 'déjà invité',
                default    => 'déjà dans une relation avec ce projet',
            };
            return response()->json(['message' => "Cet utilisateur est {$statusLabel}."], 400);
        }

        // Créer l'invitation
        $project->memberships()->create([
            'user_id' => $user->id,
            'role'    => 'MEMBER',
            'status'  => 'INVITED',
        ]);

        // Notifier l'utilisateur invité
        $inviter = $request->user();
        $user->notifications()->create([
            'type'           => 'PROJECT_INVITATION',
            'message'        => "{$inviter->first_name} {$inviter->last_name} vous invite à rejoindre le projet : {$project->title}",
            'reference_id'   => $project->id,
            'reference_type' => 'PROJECT',
            'data'           => ['inviter_id' => $inviter->id],
        ]);

        return response()->json(['message' => 'Invitation envoyée avec succès.']);
    }

    /** L'utilisateur invité accepte l'invitation */
    public function acceptInvitation(Request $request, Project $project): JsonResponse
    {
        $membership = $project->memberships()
            ->where('user_id', $request->user()->id)
            ->where('status', 'INVITED')
            ->first();

        if (!$membership) {
            return response()->json(['message' => 'Aucune invitation trouvée pour ce projet.'], 404);
        }

        $membership->update([
            'status'    => 'APPROVED',
            'joined_at' => now(),
        ]);

        // Delete the PROJECT_INVITATION notification for the invited user
        \App\Models\Notification::where('user_id', $request->user()->id)
            ->where('type', 'PROJECT_INVITATION')
            ->where('reference_id', $project->id)
            ->delete();

        // Notifier le propriétaire
        $project->owner->notifications()->create([
            'type'           => 'PROJECT_JOIN_ACCEPTED',
            'message'        => $request->user()->first_name . ' a accepté votre invitation pour le projet : ' . $project->title,
            'reference_id'   => $project->id,
            'reference_type' => 'PROJECT',
        ]);

        return response()->json(['message' => 'Invitation acceptée. Vous êtes maintenant membre du projet.']);
    }

    /** L'utilisateur invité refuse l'invitation */
    public function declineInvitation(Request $request, Project $project): JsonResponse
    {
        $membership = $project->memberships()
            ->where('user_id', $request->user()->id)
            ->where('status', 'INVITED')
            ->first();

        if (!$membership) {
            return response()->json(['message' => 'Aucune invitation trouvée pour ce projet.'], 404);
        }

        $membership->delete();

        // Delete the PROJECT_INVITATION notification for the invited user
        \App\Models\Notification::where('user_id', $request->user()->id)
            ->where('type', 'PROJECT_INVITATION')
            ->where('reference_id', $project->id)
            ->delete();

        return response()->json(['message' => 'Invitation refusée.']);
    }

    public function join(Request $request, Project $project): JsonResponse
    {
        if ($project->members()->where('user_id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'Déjà membre ou en attente.'], 400);
        }

        $project->memberships()->create([
            'user_id' => $request->user()->id,
            'role'    => 'MEMBER',
            'status'  => 'PENDING', // Owner must approve
        ]);

        // Notify owner
        $project->owner->notifications()->create([
            'type'           => 'PROJECT_JOIN_REQUEST',
            'message'        => $request->user()->first_name . ' ' . $request->user()->last_name . ' souhaite rejoindre votre projet : ' . $project->title,
            'reference_id'   => $project->id,
            'reference_type' => 'PROJECT',
            'data'           => ['requester_id' => $request->user()->id],
        ]);

        return response()->json(['message' => 'Demande envoyée avec succès.']);
    }

    public function approveMember(Request $request, Project $project, $userId): JsonResponse
    {
        if ($project->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé. Vous n\'êtes pas le propriétaire de ce projet.'], 403);
        }

        $membership = $project->memberships()
            ->where('user_id', $userId)
            ->where('status', 'PENDING')
            ->first();

        if (!$membership) {
            return response()->json(['message' => 'Demande d\'adhésion introuvable ou déjà traitée.'], 404);
        }

        $membership->update([
            'status'    => 'APPROVED',
            'joined_at' => now(),
        ]);

        // Delete the PROJECT_JOIN_REQUEST notification for the project owner
        \App\Models\Notification::where('user_id', $project->owner_id)
            ->where('type', 'PROJECT_JOIN_REQUEST')
            ->where('reference_id', $project->id)
            ->whereJsonContains('data->requester_id', (int)$userId)
            ->delete();

        // Notify user
        $membership->user->notifications()->create([
            'type'           => 'PROJECT_JOIN_ACCEPTED',
            'message'        => 'Votre demande pour rejoindre le projet a été approuvée : ' . $project->title,
            'reference_id'   => $project->id,
            'reference_type' => 'PROJECT',
        ]);

        return response()->json(['message' => 'Membre approuvé avec succès.']);
    }

    public function rejectMember(Request $request, Project $project, $userId): JsonResponse
    {
        if ($project->owner_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé. Vous n\'êtes pas le propriétaire de ce projet.'], 403);
        }

        $membership = $project->memberships()
            ->where('user_id', $userId)
            ->where('status', 'PENDING')
            ->first();

        if (!$membership) {
            return response()->json(['message' => 'Demande d\'adhésion introuvable ou déjà traitée.'], 404);
        }

        $membership->delete();

        // Delete the PROJECT_JOIN_REQUEST notification for the project owner
        \App\Models\Notification::where('user_id', $project->owner_id)
            ->where('type', 'PROJECT_JOIN_REQUEST')
            ->where('reference_id', $project->id)
            ->whereJsonContains('data->requester_id', (int)$userId)
            ->delete();

        // Notify user
        User::find($userId)->notifications()->create([
            'type'           => 'PROJECT_JOIN_REJECTED',
            'message'        => 'Votre demande pour rejoindre le projet a été refusée : ' . $project->title,
            'reference_id'   => $project->id,
            'reference_type' => 'PROJECT',
        ]);

        return response()->json(['message' => 'Demande refusée avec succès.']);
    }

    public function leave(Request $request, Project $project): JsonResponse
    {
        $membership = $project->memberships()->where('user_id', $request->user()->id)->firstOrFail();

        if ($membership->role === 'OWNER') {
            return response()->json(['message' => 'Le propriétaire ne peut pas quitter. Il doit supprimer le projet.'], 400);
        }

        $membership->delete();

        return response()->json(['message' => 'Vous avez quitté le projet.']);
    }

    public function destroy(Project $project): JsonResponse
    {
        if ($project->owner_id !== auth()->id() && auth()->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $project->delete();

        return response()->json(['message' => 'Projet supprimé.']);
    }

    /** Gestion des tâches */
    public function getTasks(Project $project): JsonResponse
    {
        return response()->json($project->tasks()->with('assignee.profile')->latest()->get());
    }

    public function addTask(Request $request, Project $project): JsonResponse
    {
        if ($project->owner_id !== auth()->id() && auth()->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Seul le propriétaire peut ajouter des tâches.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'assigned_to' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
            'sub_tasks' => 'nullable|array',
        ]);

        $task = $project->tasks()->create($validated);

        return response()->json($task->load('assignee.profile'), 201);
    }

    public function updateTask(Request $request, Project $project, ProjectTask $task): JsonResponse
    {
        $isOwner = $project->owner_id === auth()->id();
        $isAdmin = auth()->user()->role === 'ADMIN';

        if (!$isOwner && !$isAdmin) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'status' => 'sometimes|in:PENDING,COMPLETED',
            'assigned_to' => 'nullable|exists:users,id',
            'description' => 'nullable|string',
            'sub_tasks' => 'nullable|array',
        ]);

        $task->update($validated);

        return response()->json($task->load('assignee.profile'));
    }

    public function deleteTask(Project $project, ProjectTask $task): JsonResponse
    {
        if ($project->owner_id !== auth()->id() && auth()->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Seul le propriétaire peut supprimer des tâches.'], 403);
        }

        $task->delete();

        return response()->json(['message' => 'Tâche supprimée.']);
    }
}
