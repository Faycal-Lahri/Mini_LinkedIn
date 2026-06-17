<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\Skill;
use App\Models\Certification;
use App\Models\Experience;
use App\Models\Publication;
use Illuminate\Support\Facades\Http;

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

    /**
     * Generate an AI-powered professional biography in French.
     */
    public function generateAiBiography(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($request->has('user_id') && $user->role === 'ADMIN') {
            $user = User::find($request->input('user_id')) ?? $user;
        }
        $user->load(['profile.skills', 'profile.experiences', 'profile.certifications', 'profile.educations']);

        $apiKey = env('OPENROUTER_API_KEY');

        // Check if key is configured, if not, do fallback
        if (empty($apiKey)) {
            $bio = $this->getMockBio($user);
            return response()->json([
                'biography' => $bio,
                'mock_mode' => true,
                'message' => 'Généré en mode démonstration (aucune clé API configurée dans .env)'
            ]);
        }

        $prompt = $this->buildBioPrompt($user);
        $bio = '';

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => 'http://localhost:8000',
                'X-Title' => 'Mini-LinkedIn',
            ])->post('https://openrouter.ai/api/v1/chat/completions', [
                'model' => 'google/gemma-4-31b-it:free',
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $bio = $data['choices'][0]['message']['content'] ?? '';
            } else {
                // Try fallback to openrouter/free
                $fallbackResponse = Http::withoutVerifying()->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => 'http://localhost:8000',
                    'X-Title' => 'Mini-LinkedIn',
                ])->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'openrouter/free',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ]
                ]);

                if ($fallbackResponse->successful()) {
                    $data = $fallbackResponse->json();
                    $bio = $data['choices'][0]['message']['content'] ?? '';
                } else {
                    throw new \Exception('Erreur OpenRouter (Gemma + Fallback) : ' . $fallbackResponse->body());
                }
            }
        } catch (\Exception $e) {
            try {
                $fallbackResponse = Http::withoutVerifying()->withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => 'http://localhost:8000',
                    'X-Title' => 'Mini-LinkedIn',
                ])->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'openrouter/free',
                    'messages' => [
                        ['role' => 'user', 'content' => $prompt]
                    ]
                ]);

                if ($fallbackResponse->successful()) {
                    $data = $fallbackResponse->json();
                    $bio = $data['choices'][0]['message']['content'] ?? '';
                } else {
                    throw new \Exception($e->getMessage());
                }
            } catch (\Exception $e2) {
                return response()->json([
                    'biography' => $this->getMockBio($user),
                    'error' => 'Erreur lors de la génération avec l\'IA : ' . $e2->getMessage(),
                    'mock_mode' => true
                ], 200);
            }
        }

        return response()->json([
            'biography' => trim($bio),
            'mock_mode' => false
        ]);
    }

    /**
     * Build the generation prompt based on user profile.
     */
    private function buildBioPrompt(User $user): string
    {
        $prompt = "Tu es un rédacteur professionnel de profils LinkedIn. Génère une biographie professionnelle captivante, fluide et naturelle en français (environ 2 ou 3 paragraphes, maximum 150 mots) pour " . $user->first_name . " " . $user->last_name . ".\n\n";

        $prompt .= "Voici ses informations réelles issues de la base de données :\n";
        $prompt .= "- Rôle : " . ($user->role === 'STUDENT' ? 'Étudiant' : ($user->role === 'TEACHER' ? 'Enseignant' : 'Chercheur')) . "\n";
        
        if ($user->profile) {
            if ($user->profile->biography) {
                $bioLines = explode("\n", $user->profile->biography);
                $headline = trim($bioLines[0]);
                if ($headline) {
                    $prompt .= "- Titre professionnel (Headline) : " . $headline . "\n";
                }
            }
            if ($user->profile->location) {
                $prompt .= "- Localisation : " . $user->profile->location . "\n";
            }
            if ($user->profile->institution) {
                $prompt .= "- Établissement/Institution : " . $user->profile->institution . "\n";
            }
            
            if ($user->role === 'STUDENT') {
                if ($user->profile->field) {
                    $prompt .= "- Filière : " . $user->profile->field . "\n";
                }
                if ($user->profile->study_level) {
                    $prompt .= "- Niveau d'études : " . $user->profile->study_level . "\n";
                }
            } else {
                if ($user->profile->department) {
                    $prompt .= "- Département : " . $user->profile->department . "\n";
                }
                if ($user->profile->laboratory) {
                    $prompt .= "- Laboratoire : " . $user->profile->laboratory . "\n";
                }
            }
        }

        if ($user->profile && count($user->profile->experiences) > 0) {
            $prompt .= "- Expériences :\n";
            foreach ($user->profile->experiences as $exp) {
                $prompt .= "  * " . $exp->title . " chez " . $exp->organization . " (" . $exp->type . ")";
                if ($exp->description) {
                    $prompt .= " : " . $exp->description;
                }
                $prompt .= "\n";
            }
        }

        if ($user->profile && count($user->profile->certifications) > 0) {
            $prompt .= "- Certifications :\n";
            foreach ($user->profile->certifications as $cert) {
                $prompt .= "  * " . $cert->title . " (délivrée par " . $cert->issuing_organization . ")\n";
            }
        }

        if ($user->profile && count($user->profile->skills) > 0) {
            $skills = $user->profile->skills->pluck('name')->toArray();
            $prompt .= "- Compétences : " . implode(', ', $skills) . "\n";
        }

        $prompt .= "\n--- INSTRUCTIONS DE RÉDACTION STRICTES SELON LE PROFIL ---\n";
        $prompt .= "1. **Ton & Style** : Rédige à la première personne du singulier ('Je'). Le ton doit être professionnel, chaleureux, fluide et sans répétitions.\n";
        $prompt .= "2. **Cas de Profil Vide** (pas d'expériences, pas de compétences, pas de titre) :\n";
        $prompt .= "   - Ne mentionne aucune expérience fictive ou compétence non listée.\n";
        $prompt .= "   - Rédige un texte motivé axé sur l'apprentissage, la curiosité académique et la volonté de grandir professionnellement au sein de son établissement (" . ($user->profile->institution ?? 'son école') . ").\n";
        $prompt .= "3. **Cas de Profil Partiel** :\n";
        $prompt .= "   - Si pas d'expériences : Mets l'accent sur sa formation (" . ($user->profile->field ?? 'ses études') . "), ses compétences et ses objectifs professionnels.\n";
        $prompt .= "   - Si pas de compétences ou pas de certifications : N'invente rien, structure le texte autour de ses expériences et de son parcours académique.\n";
        $prompt .= "4. **Cas de Profil Complet** : Fusionne les expériences, compétences et certifications de manière cohérente pour raconter son histoire professionnelle.\n";
        $prompt .= "5. **Format** : Pas de titres, pas d'introduction, pas de salutations (pas de 'Bonjour !' ou 'Voici sa biographie :'). Renvoie DIRECTEMENT le texte de la biographie générée.\n";

        return $prompt;
    }

    /**
     * Generate a premium fallback biography dynamically in French.
     */
    private function getMockBio(User $user): string
    {
        $institution = $user->profile->institution ?? 'IGA';
        $location = $user->profile->location;
        
        $hasSkills = $user->profile && count($user->profile->skills) > 0;
        $hasExperiences = $user->profile && count($user->profile->experiences) > 0;
        $hasCertifications = $user->profile && count($user->profile->certifications) > 0;

        // Determine Headline
        $headline = "";
        if ($user->profile && $user->profile->biography) {
            $bioLines = explode("\n", $user->profile->biography);
            $headline = trim($bioLines[0]);
        }

        // Student Role
        if ($user->role === 'STUDENT') {
            $field = $user->profile->field;
            $studyLevel = $user->profile->study_level;

            // Empty Profile Case
            if (!$hasSkills && !$hasExperiences && !$hasCertifications && !$field && !$studyLevel && !$headline) {
                $bio = "Actuellement étudiant au sein de l'établissement " . $institution;
                if ($location) {
                    $bio .= " à " . $location;
                }
                $bio .= ", je suis particulièrement motivé par l'apprentissage et le développement de mes compétences académiques. Rigoureux et curieux, je m'intéresse de près aux nouvelles technologies et aux méthodologies de travail collaboratives. Mon objectif est de m'investir pleinement dans mon parcours d'études tout en préparant mon intégration future dans le monde professionnel par le biais de projets enrichissants.";
                return $bio;
            }

            // Normal / Partial Profile Case
            $introSentence = "Passionné par mes études, je suis actuellement étudiant";
            if ($studyLevel) {
                $introSentence .= " en " . $studyLevel;
            }
            if ($field) {
                $introSentence .= " spécialisé en " . $field;
            }
            $introSentence .= " à " . $institution;
            if ($location) {
                $introSentence .= " (" . $location . ")";
            }
            $introSentence .= ". ";
            $bio = $introSentence;

            if ($headline) {
                $lowerHeadline = mb_strtolower($headline, 'UTF-8');
                $isGeneric = str_contains($lowerHeadline, 'étudiant') || 
                             str_contains($lowerHeadline, 'etudiant') ||
                             str_contains($lowerHeadline, 'enseignant') || 
                             str_contains($lowerHeadline, 'chercheur') || 
                             str_contains($lowerHeadline, 'chez') ||
                             strlen($headline) < 5;
                if (!$isGeneric) {
                    $bio .= "Mon ambition est d'évoluer en tant que " . $headline . ". ";
                }
            }

            if ($hasExperiences) {
                $firstExp = $user->profile->experiences[0];
                $bio .= "Mon parcours est déjà marqué par des expériences concrètes, notamment en tant que " . $firstExp->title . " chez " . $firstExp->organization . ". ";
            }

            if ($hasSkills) {
                $skills = $user->profile->skills->take(4)->pluck('name')->toArray();
                $bio .= "J'ai développé des compétences clés dans les domaines suivants : " . implode(', ', $skills) . ". ";
            }

            if ($hasCertifications) {
                $firstCert = $user->profile->certifications[0];
                $bio .= "Pour valider mes acquis, j'ai également obtenu la certification " . $firstCert->title . " délivrée par " . $firstCert->issuing_organization . ". ";
            }

            $bio .= "Je cherche constamment à relever de nouveaux défis académiques et professionnels.";
            return $bio;
        }

        // Teacher / Researcher Role
        $dept = $user->profile->department;
        $lab = $user->profile->laboratory;
        $roleLabel = $user->role === 'TEACHER' ? "enseignant" : "chercheur";

        // Empty Profile Case
        if (!$hasSkills && !$hasExperiences && !$hasCertifications && !$dept && !$lab && !$headline) {
            $bio = "Actuellement " . $roleLabel . " au sein de l'établissement " . $institution;
            if ($location) {
                $bio .= " à " . $location;
            }
            $bio .= ", je me consacre pleinement à la transmission des connaissances, à l'encadrement académique et aux activités de recherche. Passionné par l'enseignement et l'évolution des savoirs, je m'efforce de contribuer activement à l'excellence pédagogique et au développement scientifique de notre communauté.";
            return $bio;
        }

        // Normal / Partial Profile Case
        $bio = "En tant qu'" . $roleLabel . " au sein de " . $institution;
        if ($dept) {
            $bio .= " dans le département " . $dept;
        }
        if ($lab) {
            $bio .= " et membre du laboratoire " . $lab;
        }
        if ($location) {
            $bio .= " (" . $location . ")";
        }
        $bio .= ", je participe activement au développement de projets académiques et scientifiques. ";

        if ($headline) {
            $lowerHeadline = mb_strtolower($headline, 'UTF-8');
            $isGeneric = str_contains($lowerHeadline, 'étudiant') || 
                         str_contains($lowerHeadline, 'etudiant') ||
                         str_contains($lowerHeadline, 'enseignant') || 
                         str_contains($lowerHeadline, 'chercheur') || 
                         str_contains($lowerHeadline, 'chez') ||
                         strlen($headline) < 5;
            if (!$isGeneric) {
                $bio .= "J'exerce principalement en tant que " . $headline . ". ";
            }
        }

        if ($hasExperiences) {
            $firstExp = $user->profile->experiences[0];
            $bio .= "Mon parcours m'a permis d'occuper le poste de " . $firstExp->title . " au sein de " . $firstExp->organization . ". ";
        }

        if ($hasSkills) {
            $skills = $user->profile->skills->take(4)->pluck('name')->toArray();
            $bio .= "Mes axes d'enseignement et d'expertise technique incluent : " . implode(', ', $skills) . ". ";
        }

        if ($hasCertifications) {
            $firstCert = $user->profile->certifications[0];
            $bio .= "Je suis également certifié " . $firstCert->title . " par " . $firstCert->issuing_organization . ". ";
        }

        $bio .= "Mon objectif reste de stimuler l'innovation et de guider les étudiants vers la réussite.";
        return $bio;
    }
}
