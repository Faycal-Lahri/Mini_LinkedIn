<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\Post;
use App\Models\Report;
use App\Models\Project;
use App\Models\Comment;
use App\Models\Like;
use App\Models\ChatMessage;
use App\Models\Connection;
use App\Models\Channel;
use App\Models\Profile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    /** Get system statistics. */
    public function stats(): JsonResponse
    {
        // ── STATISTIQUES CLES (10+ Metrics) ───────────────────────────
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'ACTIVE')->count();
        $pendingUsers = User::where('status', 'PENDING')->count();
        $blockedUsers = User::where('status', 'BLOCKED')->count();
        $totalPosts = Post::count();
        $totalProjects = Project::count();
        $pendingReports = Report::where('status', 'PENDING')->count();
        $totalLikes = Like::count();
        $totalComments = Comment::count();
        $totalMessages = ChatMessage::count();
        $totalConnections = Connection::count();
        $totalChannels = Channel::count();

        // ── GRAPHIQUES (10 Charts) ────────────────────────────────────
        // 1. Inscriptions Mensuelles
        $signupsTrend = User::selectRaw("count(*) as count, DATE_FORMAT(created_at, '%Y-%m') as month")
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->limit(6)
            ->get();

        // 2. Rôles
        $roleDistribution = [
            'STUDENT'    => User::where('role', 'STUDENT')->count(),
            'TEACHER'    => User::where('role', 'TEACHER')->count(),
            'RESEARCHER' => User::where('role', 'RESEARCHER')->count(),
            'ADMIN'      => User::where('role', 'ADMIN')->count(),
        ];

        // 3. Catégories Publications
        $postsByType = [
            'GENERAL' => Post::where('type', 'GENERAL')->count(),
            'UNIVERSITY_PROJECT' => Post::where('type', 'UNIVERSITY_PROJECT')->count(),
            'SCIENTIFIC_ARTICLE' => Post::where('type', 'SCIENTIFIC_ARTICLE')->count(),
        ];

        // 4. Signalements résolus/rejetés/attente
        $reportsModerationRatio = [
            'RESOLVED' => Report::where('status', 'RESOLVED')->count(),
            'DISMISSED' => Report::where('status', 'DISMISSED')->count(),
            'PENDING' => Report::where('status', 'PENDING')->count(),
        ];

        // 5. Activité Hebdomadaire
        $weeklyPostsRaw = Post::selectRaw("DAYOFWEEK(created_at) as day_index, count(*) as count")
            ->groupBy('day_index')
            ->get();
        $daysMap = [1 => 'Dim', 2 => 'Lun', 3 => 'Mar', 4 => 'Mer', 5 => 'Jeu', 6 => 'Ven', 7 => 'Sam'];
        $weeklyPostsActivity = [];
        foreach ($daysMap as $idx => $dayName) {
            $match = $weeklyPostsRaw->firstWhere('day_index', $idx);
            $weeklyPostsActivity[] = [
                'day' => $dayName,
                'count' => $match ? $match->count : 0
            ];
        }

        // 6. Projets
        $projectsStatusBreakdown = [
            'OPEN' => Project::where('status', 'OPEN')->count(),
            'CLOSED' => Project::where('status', 'CLOSED')->count(),
            'COMPLETED' => Project::where('status', 'COMPLETED')->count(),
        ];

        // 7. Emojis Réactions
        $reactionsBreakdown = [
            'LIKE' => Like::where('type', 'LIKE')->count(),
            'LOVE' => Like::where('type', 'LOVE')->count(),
            'CLAP' => Like::where('type', 'CLAP')->count(),
            'INSIGHTFUL' => Like::where('type', 'INSIGHTFUL')->count(),
            'DISLIKE' => Like::where('type', 'DISLIKE')->count(),
        ];

        // 8. Médias Partagés
        $sharedMediaBreakdown = [
            'TEXT' => Post::where(function($q) {
                $q->whereNull('media_type')->orWhere('media_type', 'TEXT');
            })->count(),
            'IMAGE' => Post::where('media_type', 'IMAGE')->count(),
            'VIDEO' => Post::where('media_type', 'VIDEO')->count(),
            'PDF' => Post::where('media_type', 'PDF')->count(),
        ];

        // 9. Tendance Messages
        $monthlyMessagesTrend = ChatMessage::selectRaw("count(*) as count, DATE_FORMAT(created_at, '%Y-%m') as month")
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->limit(6)
            ->get();

        // 10. Tendance Publications
        $monthlyPostsTrend = Post::selectRaw("count(*) as count, DATE_FORMAT(created_at, '%Y-%m') as month")
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->limit(6)
            ->get();

        // ── TABLEAUX (10 Tables) ─────────────────────────────────────
        // 1. Top membres actifs
        $topUsers = User::withCount('posts')
            ->orderBy('posts_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => "{$u->first_name} {$u->last_name}",
                'email' => $u->email,
                'posts_count' => $u->posts_count,
                'role' => $u->role,
            ]);

        // 2. Derniers inscrits
        $recentUsers = User::select('id', 'first_name', 'last_name', 'email', 'status', 'created_at')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'name' => "{$u->first_name} {$u->last_name}",
                'email' => $u->email,
                'status' => $u->status,
                'created_at' => $u->created_at->toIso8601String(),
            ]);

        // 3. Projets académiques récents
        $recentProjects = Project::select('id', 'title', 'type', 'status', 'max_members', 'created_at')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'title' => $p->title,
                'type' => $p->type,
                'status' => $p->status,
                'max_members' => $p->max_members,
                'created_at' => $p->created_at->toIso8601String(),
            ]);

        // 4. Fort Engagement
        $highEngagementPosts = Post::with('author')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->get()
            ->sortByDesc(fn($p) => $p->likes_count + $p->comments_count)
            ->take(5)
            ->values()
            ->map(fn($p) => [
                'title' => $p->title ?? mb_substr($p->content, 0, 30),
                'author' => $p->author ? "{$p->author->first_name} {$p->author->last_name}" : 'Inconnu',
                'likes' => $p->likes_count,
                'comments' => $p->comments_count,
            ]);

        // 5. Signalements Récents non résolus
        $recentPendingReports = Report::with('reporter')
            ->where('status', 'PENDING')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'reporter' => $r->reporter ? "{$r->reporter->first_name} {$r->reporter->last_name}" : 'Système',
                'reason' => $r->reason,
                'reported_id' => $r->reported_id,
                'created_at' => $r->created_at ? $r->created_at->toIso8601String() : null,
            ]);

        // 6. Demandes académiques en attente
        $pendingAcademicUsers = User::with('profile')
            ->where('status', 'PENDING')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'name' => "{$u->first_name} {$u->last_name}",
                'institution' => $u->profile->institution ?? 'N/A',
                'role' => $u->role,
                'created_at' => $u->created_at->toIso8601String(),
            ]);

        // 7. Bloqués récemment
        $recentlyBlockedUsers = User::where('status', 'BLOCKED')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'name' => "{$u->first_name} {$u->last_name}",
                'email' => $u->email,
                'updated_at' => $u->updated_at->toIso8601String(),
            ]);

        // 8. Commentaires signalés (ou récents)
        $recentFlaggedComments = Comment::with(['author', 'post'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'author' => $c->author ? "{$c->author->first_name} {$c->author->last_name}" : 'N/A',
                'post_title' => $c->post->title ?? 'Post #' . $c->post_id,
                'content' => mb_substr($c->content, 0, 45) . '...',
                'created_at' => $c->created_at->toIso8601String(),
            ]);

        // 9. Activité par Institution / Département
        $departmentActivity = Profile::selectRaw("institution as department, count(user_id) as users_count")
            ->whereNotNull('institution')
            ->groupBy('institution')
            ->orderBy('users_count', 'desc')
            ->limit(5)
            ->get();

        // 10. Comptes Administration
        $adminAccounts = User::where('role', 'ADMIN')
            ->select('first_name', 'last_name', 'email', 'status')
            ->get()
            ->map(fn($u) => [
                'name' => "{$u->first_name} {$u->last_name}",
                'email' => $u->email,
                'status' => $u->status,
            ]);

        // ── LISTES (10 Lists) ─────────────────────────────────────────
        // 1. Activités système récentes (concaténation new users/posts)
        $recentUsersAct = User::latest()->limit(5)->get()->map(fn($u) => [
            'type'        => 'NEW_USER',
            'description' => "Nouvel inscrit : {$u->first_name} {$u->last_name}",
            'timestamp'   => $u->created_at->toIso8601String(),
        ]);
        $recentPostsAct = Post::with('author')->latest()->limit(5)->get()->map(fn($p) => [
            'type'        => 'NEW_POST',
            'description' => "Publication par " . ($p->author ? "{$p->author->first_name}" : "Membre") . " : " . mb_substr($p->content, 0, 40) . "...",
            'timestamp'   => $p->created_at->toIso8601String(),
        ]);
        $recentActivitiesList = $recentUsersAct->concat($recentPostsAct)->sortByDesc('timestamp')->values()->take(5);

        // 2. Annonces des Enseignants
        $teacherAnnouncements = Post::whereHas('author', fn($q) => $q->where('role', 'TEACHER'))
            ->with('author')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'author' => $p->author ? "{$p->author->first_name} {$p->author->last_name}" : 'Membre',
                'content' => mb_substr($p->content, 0, 50) . '...',
                'date' => $p->created_at->toIso8601String(),
            ]);

        // 3. Fichiers récents partagés
        $uploadedFilesList = [];
        $profilesWithDocs = Profile::with('user')
            ->whereNotNull('diploma_url')
            ->orWhereNotNull('certificate_url')
            ->latest()
            ->limit(3)
            ->get();
        foreach ($profilesWithDocs as $p) {
            if ($p->diploma_url) {
                $uploadedFilesList[] = [
                    'name' => 'Diplôme : ' . ($p->user ? "{$p->user->first_name} {$p->user->last_name}" : 'Membre'),
                    'url' => $p->diploma_url,
                    'type' => 'PDF'
                ];
            }
            if ($p->certificate_url) {
                $uploadedFilesList[] = [
                    'name' => 'Certificat : ' . ($p->user ? "{$p->user->first_name} {$p->user->last_name}" : 'Membre'),
                    'url' => $p->certificate_url,
                    'type' => 'PDF'
                ];
            }
        }
        $postsWithFiles = Post::with('author')->whereNotNull('file_url')->latest()->limit(3)->get();
        foreach ($postsWithFiles as $p) {
            $uploadedFilesList[] = [
                'name' => 'Fichier Post : ' . ($p->author ? "{$p->author->first_name} {$p->author->last_name}" : 'Membre'),
                'url' => $p->file_url,
                'type' => 'Média'
            ];
        }
        $uploadedFilesList = array_slice($uploadedFilesList, 0, 5);

        // 4. Candidats à l'avertissement (les plus signalés)
        $warningCandidatesData = Report::groupBy('reported_id')
            ->selectRaw('reported_id, count(*) as count')
            ->latest()
            ->limit(5)
            ->get();
        $warningUserIds = $warningCandidatesData->pluck('reported_id')->filter()->toArray();
        $warningUsers = User::whereIn('id', $warningUserIds)->get()->keyBy('id');
        $warningCandidates = $warningCandidatesData->map(function($r) use ($warningUsers) {
            $u = $warningUsers->get($r->reported_id);
            return [
                'name' => $u ? "{$u->first_name} {$u->last_name}" : "Contenu #{$r->reported_id}",
                'count' => $r->count
            ];
        });

        // 5. Leaders de réseau (utilisateurs les plus connectés)
        $networkLeadersData = Connection::where('status', 'ACCEPTED')
            ->selectRaw('sender_id as user_id, count(*) as count')
            ->groupBy('sender_id')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();
        $leaderUserIds = $networkLeadersData->pluck('user_id')->filter()->toArray();
        $leaderUsers = User::whereIn('id', $leaderUserIds)->get()->keyBy('id');
        $networkLeaders = $networkLeadersData->map(function($c) use ($leaderUsers) {
            $u = $leaderUsers->get($c->user_id);
            return [
                'name' => $u ? "{$u->first_name} {$u->last_name}" : 'Utilisateur',
                'count' => $c->count
            ];
        });

        // 6. Mots-clés populaires
        $trendingKeywords = [
            ['tag' => '#Recherche', 'score' => 98],
            ['tag' => '#IGA_Casablanca', 'score' => 85],
            ['tag' => '#ProjetEtudiant', 'score' => 74],
            ['tag' => '#ArticleScientifique', 'score' => 61],
            ['tag' => '#ScholarNetwork', 'score' => 55],
        ];

        // 7. Historique des avertissements envoyés
        $warningsHistory = User::whereHas('notifications', fn($q) => $q->where('type', 'ADMIN_WARNING'))
            ->with(['notifications' => fn($q) => $q->where('type', 'ADMIN_WARNING')])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function($u) {
                $n = $u->notifications->first();
                return [
                    'name' => "{$u->first_name} {$u->last_name}",
                    'message' => $n ? $n->message : 'Avertissement',
                    'date' => $n ? $n->created_at->toIso8601String() : $u->updated_at->toIso8601String(),
                ];
            });

        // 8. Titres des projets créés
        $latestCreatedProjects = Project::select('title', 'max_members', 'status')
            ->latest()
            ->limit(5)
            ->get();

        // 9. Canaux de discussion actifs
        $activeDiscussionChannels = Channel::withCount('messages')
            ->orderBy('messages_count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'name' => $c->name,
                'count' => $c->messages_count,
            ]);

        // 10. Logs système récents (dernières connexions)
        $recentLoginLogs = User::where('status', 'ACTIVE')
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($u) => [
                'name' => "{$u->first_name} {$u->last_name}",
                'time' => $u->updated_at->toIso8601String(),
            ]);

        return response()->json([
            // Stats (12)
            'total_users'       => $totalUsers,
            'active_users'      => $activeUsers,
            'pending_users'     => $pendingUsers,
            'blocked_users'     => $blockedUsers,
            'total_posts'       => $totalPosts,
            'total_projects'    => $totalProjects,
            'pending_reports'   => $pendingReports,
            'total_likes'       => $totalLikes,
            'total_comments'    => $totalComments,
            'total_messages'    => $totalMessages,
            'total_connections' => $totalConnections,
            'total_channels'    => $totalChannels,

            // Charts (10)
            'signups_trend'            => $signupsTrend,
            'role_distribution'        => $roleDistribution,
            'posts_by_type'            => $postsByType,
            'reports_moderation_ratio' => $reportsModerationRatio,
            'weekly_posts_activity'    => $weeklyPostsActivity,
            'projects_status_breakdown'=> $projectsStatusBreakdown,
            'reactions_breakdown'      => $reactionsBreakdown,
            'shared_media_breakdown'   => $sharedMediaBreakdown,
            'monthly_messages_trend'   => $monthlyMessagesTrend,
            'monthly_posts_trend'      => $monthlyPostsTrend,

            // Tables (10)
            'top_users'              => $topUsers,
            'recent_users'           => $recentUsers,
            'recent_projects'        => $recentProjects,
            'high_engagement_posts'  => $highEngagementPosts,
            'recent_pending_reports' => $recentPendingReports,
            'pending_academic_users' => $pendingAcademicUsers,
            'recently_blocked_users' => $recentlyBlockedUsers,
            'recent_flagged_comments'=> $recentFlaggedComments,
            'department_activity'    => $departmentActivity,
            'admin_accounts'         => $adminAccounts,

            // Lists (10)
            'recent_activities'         => $recentActivitiesList,
            'teacher_announcements'     => $teacherAnnouncements,
            'uploaded_files_log'        => $uploadedFilesList,
            'warning_candidates'        => $warningCandidates,
            'network_leaders'           => $networkLeaders,
            'trending_keywords'         => $trendingKeywords,
            'warnings_history'          => $warningsHistory,
            'latest_created_projects'   => $latestCreatedProjects,
            'active_discussion_channels'=> $activeDiscussionChannels,
            'recent_login_logs'         => $recentLoginLogs,
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
            'description' => "Publication par " . ($p->author ? $p->author->first_name : "Membre") . " : " . mb_substr($p->content, 0, 50) . "...",
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
            Post::with([
                'author.profile',
                'comments.author.profile',
                'likes.user.profile'
            ])
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

    /** Update a post (moderation). */
    public function updatePost(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'title'   => 'nullable|string',
            'type'    => 'required|in:UNIVERSITY_PROJECT,SCIENTIFIC_ARTICLE,GENERAL',
        ]);

        $post->update($validated);

        $post->author->notifications()->create([
            'type'    => 'ACCOUNT_VALIDATED',
            'message' => "Votre publication a été modifiée par l'administration pour non-conformité.",
        ]);

        return response()->json([
            'message' => 'Publication mise à jour avec succès.',
            'post'    => $post->load('author.profile')
        ]);
    }

    /** Delete a comment (moderation). */
    public function deleteComment(Comment $comment): JsonResponse
    {
        $comment->delete();
        return response()->json(['message' => 'Commentaire supprimé.']);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email,' . $user->id,
            'role'         => 'required|in:STUDENT,TEACHER,RESEARCHER,ADMIN',
            'status'       => 'required|in:ACTIVE,PENDING,BLOCKED,DISABLED',
            'institution'  => 'nullable|string|max:255',
            'bio'          => 'nullable|string',
            'password'     => 'nullable|string|min:6',
            'field'        => 'nullable|string|max:255',
            'study_level'  => 'nullable|string|max:255',
            'department'   => 'nullable|string|max:255',
            'laboratory'   => 'nullable|string|max:255',
            'location'     => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:255',
            'linkedin_url' => 'nullable|string|max:255',
            'github_url'   => 'nullable|string|max:255',
            'website_url'  => 'nullable|string|max:255',
        ]);

        $user->update([
            'first_name' => $validated['first_name'],
            'last_name'  => $validated['last_name'],
            'email'      => $validated['email'],
            'role'       => $validated['role'],
            'status'     => $validated['status'],
        ]);

        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        // Update profile relation
        $profileData = [];
        if (array_key_exists('institution', $validated)) {
            $profileData['institution'] = $validated['institution'];
        }
        if (array_key_exists('bio', $validated)) {
            $profileData['biography'] = $validated['bio'];
        }
        if (array_key_exists('field', $validated)) {
            $profileData['field'] = $validated['field'];
        }
        if (array_key_exists('study_level', $validated)) {
            $profileData['study_level'] = $validated['study_level'];
        }
        if (array_key_exists('department', $validated)) {
            $profileData['department'] = $validated['department'];
        }
        if (array_key_exists('laboratory', $validated)) {
            $profileData['laboratory'] = $validated['laboratory'];
        }
        if (array_key_exists('location', $validated)) {
            $profileData['location'] = $validated['location'];
        }
        if (array_key_exists('phone', $validated)) {
            $profileData['phone'] = $validated['phone'];
        }
        if (array_key_exists('linkedin_url', $validated)) {
            $profileData['linkedin_url'] = $validated['linkedin_url'];
        }
        if (array_key_exists('github_url', $validated)) {
            $profileData['github_url'] = $validated['github_url'];
        }
        if (array_key_exists('website_url', $validated)) {
            $profileData['website_url'] = $validated['website_url'];
        }

        if (!empty($profileData)) {
            $user->profile()->updateOrCreate([], $profileData);
        }

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès.',
            'user'    => $user->load('profile'),
        ]);
     }
}
