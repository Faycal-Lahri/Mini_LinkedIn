<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\Skill;
use App\Models\Certification;
use App\Models\Experience;
use App\Models\Publication;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile with all relationships.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load(['profile.skills.education', 'profile.experiences', 'profile.publications', 'profile.certifications', 'profile.educations']);
        
        $userId = $user->id;
        $connectedIds = \App\Models\Connection::where('status', 'ACCEPTED')
            ->where(function($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->get()
            ->map(function($c) use ($userId) {
                return $c->sender_id == $userId ? $c->receiver_id : $c->sender_id;
            })
            ->toArray();
        
        $user->connections_count = count($connectedIds);
        
        return response()->json($user);
    }

    /**
     * Get a public profile by ID.
     */
    public function publicShow(User $user): JsonResponse
    {
        $user->load(['profile.skills.education', 'profile.experiences', 'profile.publications', 'profile.certifications', 'profile.educations']);
        
        $userId = $user->id;
        $authUserId = auth()->id();
        
        // Connections count of public user
        $connectedIds = \App\Models\Connection::where('status', 'ACCEPTED')
            ->where(function($q) use ($userId) {
                $q->where('sender_id', $userId)->orWhere('receiver_id', $userId);
            })
            ->get()
            ->map(function($c) use ($userId) {
                return $c->sender_id == $userId ? $c->receiver_id : $c->sender_id;
            })
            ->toArray();
        
        $user->connections_count = count($connectedIds);
        
        // Connection status with auth user
        $connection = \App\Models\Connection::where(function($q) use ($authUserId, $userId) {
            $q->where('sender_id', $authUserId)->where('receiver_id', $userId);
        })->orWhere(function($q) use ($authUserId, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $authUserId);
        })->first();
        
        $user->connection_status = $connection ? $connection->status : 'NONE';
        $user->is_sender = $connection ? ($connection->sender_id === $authUserId) : false;
        
        // Mutual connections
        $authUserConnectedIds = \App\Models\Connection::where('status', 'ACCEPTED')
            ->where(function($q) use ($authUserId) {
                $q->where('sender_id', $authUserId)->orWhere('receiver_id', $authUserId);
            })
            ->get()
            ->map(function($c) use ($authUserId) {
                return $c->sender_id == $authUserId ? $c->receiver_id : $c->sender_id;
            })
            ->toArray();
        
        $mutualIds = array_values(array_intersect($authUserConnectedIds, $connectedIds));
        $mutualUsers = User::whereIn('id', $mutualIds)->with('profile')->limit(5)->get();
        
        $user->mutual_connections = $mutualUsers;
        $user->mutual_count = count($mutualIds);
        
        return response()->json($user);
    }

    /**
     * Update basic profile information and photo.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($request->has('user_id') && $user->role === 'ADMIN') {
            $user = User::find($request->input('user_id')) ?? $user;
        }
        $profile = $user->profile;

        $validated = $request->validate([
            'first_name' => 'string|max:255',
            'last_name' => 'string|max:255',
            'biography' => 'nullable|string',
            'institution' => 'nullable|string|max:255',
            'photo' => 'nullable|image|max:2048', // 2MB max
            'banner' => 'nullable|image|max:2048', // 2MB max
            'linkedin_url' => 'nullable|url',
            'github_url' => 'nullable|url',
            'department' => 'nullable|string|max:255',
            'laboratory' => 'nullable|string|max:255',
            'field' => 'nullable|string|max:255',
            'study_level' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'languages' => 'nullable|array',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('profiles', 'public');
            $profile->update(['photo_url' => $path]);
        }

        if ($request->hasFile('banner')) {
            $path = $request->file('banner')->store('banners', 'public');
            $profile->update(['website_url' => $path]);
        }

        $user->update([
            'first_name' => $validated['first_name'] ?? $user->first_name,
            'last_name' => $validated['last_name'] ?? $user->last_name,
        ]);

        $profileData = [];
        $fields = ['biography', 'institution', 'linkedin_url', 'github_url', 'department', 'laboratory', 'field', 'study_level', 'location', 'phone', 'languages'];
        foreach ($fields as $key) {
            if ($request->has($key)) {
                $profileData[$key] = $request->input($key);
            }
        }
        $profile->update($profileData);

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user' => $user->load('profile')
        ]);
    }

    // --- Skills ---
    public function addSkill(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string|max:100',
            'level' => 'required|string|in:BEGINNER,INTERMEDIATE,ADVANCED,EXPERT,Beginner,Intermediate,Advanced,Expert',
            'education_id' => 'nullable|integer|exists:educations,id',
            'is_autoformation' => 'nullable|boolean',
        ]);

        $user = $request->user();
        if ($request->has('user_id') && $user->role === 'ADMIN') {
            $user = User::find($request->input('user_id')) ?? $user;
        }
        $skill = $user->profile->skills()->create($validated);
        return response()->json($skill, 201);
    }

    public function removeSkill(Skill $skill): JsonResponse
    {
        if ($skill->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);
        $skill->delete();
        return response()->json(['message' => 'Compétence supprimée.']);
    }

    // --- Experiences ---
    public function addExperience(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'organization' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'is_current' => 'boolean',
            'type' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $user = $request->user();
        if ($request->has('user_id') && $user->role === 'ADMIN') {
            $user = User::find($request->input('user_id')) ?? $user;
        }
        $experience = $user->profile->experiences()->create($validated);
        return response()->json($experience, 201);
    }

    public function removeExperience(Experience $experience): JsonResponse
    {
        if ($experience->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);
        $experience->delete();
        return response()->json(['message' => 'Expérience supprimée.']);
    }

    public function updateExperience(Request $request, Experience $experience): JsonResponse
    {
        if ($experience->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'organization' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'type' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $experience->update($validated);
        return response()->json($experience);
    }

    // --- Publications ---
    public function addPublication(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'journal' => 'nullable|string|max:255',
            'published_at' => 'nullable|date',
            'url' => 'nullable|url',
        ]);

        $user = $request->user();
        if ($request->has('user_id') && $user->role === 'ADMIN') {
            $user = User::find($request->input('user_id')) ?? $user;
        }
        $publication = $user->profile->publications()->create($validated);
        return response()->json($publication, 201);
    }

    public function removePublication(Publication $publication): JsonResponse
    {
        if ($publication->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);
        $publication->delete();
        return response()->json(['message' => 'Publication supprimée.']);
    }

    // --- Certifications ---
    public function addCertification(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'organization' => 'required|string|max:255',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'credential_url' => 'nullable|string',
            'credential_id' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $user = $request->user();
        if ($request->has('user_id') && $user->role === 'ADMIN') {
            $user = User::find($request->input('user_id')) ?? $user;
        }
        $certification = $user->profile->certifications()->create([
            'title' => $validated['title'],
            'issuing_organization' => $validated['organization'],
            'issue_date' => $validated['issue_date'] ?? null,
            'expiry_date' => $validated['expiry_date'] ?? null,
            'credential_url' => $validated['credential_url'] ?? null,
            'credential_id' => $validated['credential_id'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);
        return response()->json($certification, 201);
    }

    public function updateCertification(Request $request, Certification $certification): JsonResponse
    {
        if ($certification->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'organization' => 'required|string|max:255',
            'issue_date' => 'nullable|date',
            'expiry_date' => 'nullable|date',
            'credential_url' => 'nullable|string',
            'credential_id' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        $certification->update([
            'title' => $validated['title'],
            'issuing_organization' => $validated['organization'],
            'issue_date' => $validated['issue_date'] ?? null,
            'expiry_date' => $validated['expiry_date'] ?? null,
            'credential_url' => $validated['credential_url'] ?? null,
            'credential_id' => $validated['credential_id'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);
        return response()->json($certification);
    }

    public function removeCertification(Certification $certification): JsonResponse
    {
        if ($certification->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);
        $certification->delete();
        return response()->json(['message' => 'Certification supprimée.']);
    }

    // --- Educations ---
    public function addEducation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'school' => 'required|string|max:255',
            'degree' => 'required|string|max:255',
            'field_of_study' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $user = $request->user();
        if ($request->has('user_id') && $user->role === 'ADMIN') {
            $user = User::find($request->input('user_id')) ?? $user;
        }
        $education = $user->profile->educations()->create($validated);
        return response()->json($education, 201);
    }

    public function updateEducation(Request $request, \App\Models\Education $education): JsonResponse
    {
        if ($education->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);

        $validated = $request->validate([
            'school' => 'required|string|max:255',
            'degree' => 'required|string|max:255',
            'field_of_study' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'description' => 'nullable|string',
        ]);

        $education->update($validated);
        return response()->json($education);
    }

    public function removeEducation(\App\Models\Education $education): JsonResponse
    {
        if ($education->profile->user_id !== auth()->id() && auth()->user()->role !== 'ADMIN')
            return response()->json(['message' => 'Non autorisé'], 403);
        $education->delete();
        return response()->json(['message' => 'Éducation supprimée.']);
    }
}
