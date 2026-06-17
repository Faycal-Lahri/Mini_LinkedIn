<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    private string $model = 'google/gemma-4-31b-it:free';

    private function tryFallbackOpenRouter(string $apiKey, string $prompt, string $systemMessage, float $temperature): array
    {
        try {
            $response = Http::withoutVerifying()->withToken($apiKey)
                ->withHeaders([
                    'HTTP-Referer'   => config('app.url', 'http://localhost:5173'),
                    'X-Title'        => 'Scholar - Réseau Académique IGA',
                    'Content-Type'   => 'application/json',
                ])
                ->timeout(60)
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model'       => 'openrouter/free',
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemMessage],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'temperature' => $temperature,
                    'max_tokens'  => 1024,
                ]);

            if ($response->failed()) {
                $err = $response->json();
                return ['error' => true, 'message' => $err['error']['message'] ?? 'Erreur IA inconnue (fallback)'];
            }

            return ['error' => false, 'content' => trim($response->json('choices.0.message.content'))];
        } catch (\Exception $e) {
            return ['error' => true, 'message' => 'Erreur lors du fallback : ' . $e->getMessage()];
        }
    }

    private function callOpenRouter(string $prompt, string $systemMessage, float $temperature = 0.7): array
    {
        $apiKey = env('OPENROUTER_API_KEY') ?? env('OPENAI_API_KEY');

        if (!$apiKey) {
            return [
                'error'   => true,
                'message' => 'Clé API non configurée.',
                'mock'    => "Ceci est un texte de démonstration généré par l'IA Scholar. Pour activer la vraie génération, configurez votre clé OPENROUTER_API_KEY."
            ];
        }

        try {
            $response = Http::withoutVerifying()->withToken($apiKey)
                ->withHeaders([
                    'HTTP-Referer'   => config('app.url', 'http://localhost:5173'),
                    'X-Title'        => 'Scholar - Réseau Académique IGA',
                    'Content-Type'   => 'application/json',
                ])
                ->timeout(60)
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model'       => $this->model,
                    'messages'    => [
                        ['role' => 'system', 'content' => $systemMessage],
                        ['role' => 'user',   'content' => $prompt],
                    ],
                    'temperature' => $temperature,
                    'max_tokens'  => 1024,
                ]);

            if ($response->failed()) {
                return $this->tryFallbackOpenRouter($apiKey, $prompt, $systemMessage, $temperature);
            }

            return ['error' => false, 'content' => trim($response->json('choices.0.message.content'))];

        } catch (\Exception $e) {
            return $this->tryFallbackOpenRouter($apiKey, $prompt, $systemMessage, $temperature);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. AMÉLIORATION DE POST
    // ─────────────────────────────────────────────────────────────────────────

    private function getFallbackImprovedPost(string $title, string $content, string $type, string $role, string $field, bool $hasFile, ?string $fileName): string
    {
        $resolvedTitle = !empty($title) ? trim($title) : "Partage d'expérience académique";
        $resolvedContent = !empty($content) ? trim($content) : "Ravi de partager nos derniers travaux au sein de l'IGA Casablanca. C'est une excellente occasion d'apprendre et de collaborer avec mes pairs.";

        // Emojis based on type
        $emoji = match($type) {
            'SCIENTIFIC_ARTICLE' => '🔬',
            'UNIVERSITY_PROJECT' => '💻',
            default => '📢',
        };

        // Construct a structured post
        $text = "{$emoji} **{$resolvedTitle}**\n\n";
        
        if ($type === 'SCIENTIFIC_ARTICLE') {
            $text .= "Cher réseau Scholar,\n\nJe suis ravi de partager mes perspectives sur ce sujet scientifique d'actualité en tant que **{$role}** spécialisé(e) en **{$field}**.\n\n";
            $text .= "📌 **Points clés de la publication :**\n";
            $text .= "• **Sujet principal :** {$resolvedContent}\n";
            $text .= "• **Objectif :** Contribuer à l'avancement des connaissances académiques et stimuler la discussion scientifique.\n";
            if ($hasFile) {
                $text .= "• **Document joint :** Vous pouvez consulter le fichier « {$fileName} » attaché pour plus de détails.\n";
            }
            $text .= "\n💬 Qu'en pensez-vous ? N'hésitez pas à partager vos avis et suggestions en commentaire !\n\n";
            $text .= "#IGA #Recherche #Science #AcademicNetwork #{$field}";
        } elseif ($type === 'UNIVERSITY_PROJECT') {
            $text .= "Bonjour à tous,\n\nEn tant que **{$role}** en **{$field}**, je suis fier de vous présenter l'avancement de notre projet universitaire.\n\n";
            $text .= "Target **Objectifs du projet :**\n";
            $text .= "• **Description :** {$resolvedContent}\n";
            $text .= "• **Objectif :** Mettre en pratique nos acquis théoriques et relever des défis concrets.\n";
            if ($hasFile) {
                $text .= "• **Ressources :** Voir le fichier joint « {$fileName} » pour explorer notre travail.\n";
            }
            $text .= "\n🚀 Un grand merci aux membres de l'équipe et à nos encadrants pour leur soutien continu.\n\n";
            $text .= "#IGA #ProjetUniversitaire #Innovation #Technologie #{$field}";
        } else {
            $text .= "Chers collègues et étudiants,\n\nJe partage aujourd'hui une réflexion importante concernant notre parcours académique et professionnel en **{$field}**.\n\n";
            $text .= "💡 **Idée principale :**\n";
            $text .= "{$resolvedContent}\n\n";
            if ($hasFile) {
                $text .= "📎 **Pièce jointe :** N'hésitez pas à consulter le fichier « {$fileName} ».\n\n";
            }
            $text .= "🤝 Échanger nos idées nous permet de grandir ensemble. Hâte de lire vos retours !\n\n";
            $text .= "#IGA #Communaute #Etudiant #Partage #{$field}";
        }

        return $text;
    }

    public function assistPost(Request $request): JsonResponse
    {
        $title    = $request->input('title', '');
        $content  = $request->input('content', '');
        $type     = $request->input('type', 'GENERAL');
        $hasFile  = $request->input('has_file', false);
        $fileName = $request->input('file_name') ?? '';

        $user     = $request->user();
        $role     = match($user->role ?? 'STUDENT') {
            'TEACHER'    => 'enseignant(e)',
            'RESEARCHER' => 'chercheur(se)',
            default      => 'étudiant(e)',
        };
        $field = $user->profile?->field ?? '';

        $fileNote = $hasFile
            ? "\nNote : L'utilisateur joint un fichier nommé « {$fileName} ». Adapte le texte pour introduire ce média de façon pertinente."
            : '';

        $typeLabel = match($type) {
            'SCIENTIFIC_ARTICLE'  => 'article scientifique',
            'UNIVERSITY_PROJECT'  => 'projet universitaire',
            default               => 'publication générale',
        };

        $prompt = <<<PROMPT
Tu es un expert mondial en communication académique, recherche et réseaux professionnels. Ton rôle est de réécrire et d'améliorer de façon spectaculaire cette publication pour le réseau Scholar (IGA Casablanca).

Informations sur l'auteur et la publication :
- Rôle de l'auteur : {$role}
- Domaine d'étude / Filière : {$field}
- Type de post : {$typeLabel}
{$fileNote}

Consignes de rédaction extrêmement strictes :
1. Structure claire et aérée : Organise le post avec des titres de sections clairs, des paragraphes courts et des puces d'énumération (bullet points).
2. Ton professionnel et engageant : Le style doit être captivant, dynamique, inspirant et digne d'un réseau professionnel d'élite.
3. Développement du contenu : Parle d'avantage du sujet présenté, développe les points clés, approfondis et enrichis le texte avec des explications plus détaillées et scientifiques/académiques.
4. Structure recommandée :
   - Un titre principal accrocheur (précédé d'un emoji pertinent).
   - Une introduction captivante expliquant le contexte ou l'importance du sujet.
   - Le corps du message structuré et détaillé avec des points clés à l'aide d'émoticons professionnels.
   - Un appel à l'action ou une question ouverte pour inciter le réseau à réagir en commentaire.
   - Une liste de 4 à 5 hashtags professionnels pertinents (ex: #IGA, #Recherche, #Innovation, #{$field}).
5. Pas de blabla méta : Donne uniquement le texte final amélioré de la publication, sans introduction ("Voici le texte..."), sans salutations à l'utilisateur, sans guillemets autour du post.

Voici le titre : "{$title}"
Voici le contenu : "{$content}"
Améliore le ou parle d'avantage.
PROMPT;

        $system = "Tu es un expert en communication académique et scientifique. Tu rédiges et structures des publications professionnelles de grande qualité pour LinkedIn et les réseaux académiques. Réponds toujours en français, sois concis, structuré et professionnel.";

        $result = $this->callOpenRouter($prompt, $system, 0.75);

        if ($result['error']) {
            $fallback = $this->getFallbackImprovedPost($title, $content, $type, $role, $field, $hasFile, $fileName);
            return response()->json([
                'content' => $fallback,
                'mock_mode' => true,
                'error' => $result['message'] ?? 'Erreur de connexion IA'
            ]);
        }

        return response()->json(['content' => $result['content']]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ANALYSE PDF D'ARTICLE SCIENTIFIQUE
    // ─────────────────────────────────────────────────────────────────────────

    public function analyzeArticlePdf(Request $request): JsonResponse
    {
        // Remove memory limit and increase execution time to support parsing large 25MB+ PDFs
        ini_set('memory_limit', '-1');
        set_time_limit(300);

        $request->validate(['pdf' => 'required|file|mimes:pdf|max:51200']);

        $file = $request->file('pdf');

        // Extract text from PDF using smalot/pdfparser
        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile($file->getPathname());
            $text   = $pdf->getText();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Impossible de lire le PDF : ' . $e->getMessage()], 422);
        }

        if (empty(trim($text))) {
            return response()->json(['message' => 'Le PDF ne contient pas de texte extractible (PDF scanné non supporté).'], 422);
        }

        // Extract up to 150k characters to read the entire PDF text (approx 30,000 words)
        $excerpt = mb_substr($text, 0, 150000);

        $prompt = <<<PROMPT
Analyse cet article scientifique dans son intégralité et retourne un objet JSON valide avec exactement ces champs :
{
  "title": "Titre exact de l'article",
  "abstract": "Résumé complet et professionnel en français (150-250 mots) basé sur le texte",
  "content": "Rédige l'introduction et le corps complet de l'article scientifique de façon très détaillée en français (au moins 600-800 mots) basé sur le document complet fourni. Il doit être structuré avec des sections formelles claires (Introduction, Méthodologie, Résultats, Conclusion) et contenir toutes les informations et analyses cruciales contenues dans l'article.",
  "keywords": "mot1, mot2, mot3, mot4, mot5",
  "journal": "Nom du journal ou conférence suggéré ou identifié dans l'article (ex: IEEE Transactions on...)",
  "doi": "DOI identifié dans le document (si présent, sinon laisser vide)"
}

Texte de l'article :
{$excerpt}

IMPORTANT : Réponds UNIQUEMENT avec le JSON, sans aucun texte avant ou après.
PROMPT;

        $system = "Tu es un expert en analyse d'articles scientifiques. Tu extrais et génères des métadonnées académiques précises. Tu rédiges au format JSON valide uniquement, sans markdown ni explication.";

        $result = $this->callOpenRouter($prompt, $system, 0.3);

        if ($result['error']) {
            return response()->json(['message' => $result['message'] ?? 'Erreur IA'], 500);
        }

        // Clean markdown backticks and trim
        $content = preg_replace('/```(?:json)?\s*/i', '', $result['content']);
        $content = preg_replace('/```\s*$/', '', $content);
        $content = trim($content);

        $parsed = json_decode($content, true);

        if (!$parsed) {
            // Try to extract JSON using regex { ... }
            if (preg_match('/\{.*\}/s', $content, $matches)) {
                $parsed = json_decode($matches[0], true);
            }
        }

        // If json_decode still failed or was cut off, use regex-based parsing as a robust fallback
        if (!$parsed) {
            $parsed = [];
            
            // Regex to match fields: "field" : "value" (supporting multiline values, escaped quotes)
            $fields = ['title', 'abstract', 'content', 'keywords', 'journal', 'doi'];
            foreach ($fields as $field) {
                if (preg_match('/"' . $field . '"\s*:\s*"(.*?)"/s', $content, $matches)) {
                    $parsed[$field] = stripcslashes($matches[1]);
                }
            }
        }

        // Reconstruct fields if they are missing or if we failed completely
        $titleVal    = $parsed['title']    ?? '';
        $abstractVal = $parsed['abstract'] ?? '';
        $contentVal  = $parsed['content']  ?? '';
        $keywordsVal = $parsed['keywords'] ?? '';
        $journalVal  = $parsed['journal']  ?? '';
        $doiVal      = $parsed['doi']      ?? '';

        // Backup strategy if we got absolutely nothing (e.g. AI failed to respond or response was entirely empty)
        if (empty($titleVal) && empty($abstractVal)) {
            // Re-attempt parsing by grabbing the first non-empty lines of the text as title
            $lines = array_filter(array_map('trim', explode("\n", $text)));
            $guessedTitle = count($lines) > 0 ? array_shift($lines) : 'Article scientifique';
            if (strlen($guessedTitle) > 150) {
                $guessedTitle = substr($guessedTitle, 0, 150) . '...';
            }
            
            $titleVal = $guessedTitle;
            $abstractVal = "Résumé indisponible. L'analyse IA n'a pas pu s'exécuter correctement. Voici un extrait du texte :\n\n" . substr($text, 0, 300) . "...";
        }

        // Populate content if empty using standard extraction
        if (empty($contentVal)) {
            $contentVal = "## Introduction\n\n" . substr($text, 0, 1500) . "...\n\n## Méthodologie et Analyse\n\n" . substr($text, 1500, 1500) . "...";
        }

        return response()->json([
            'title'    => $titleVal,
            'abstract' => $abstractVal,
            'content'  => $contentVal,
            'keywords' => $keywordsVal,
            'journal'  => $journalVal,
            'doi'      => $doiVal,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SUGGESTIONS DE CONNEXIONS INTELLIGENTES
    // ─────────────────────────────────────────────────────────────────────────

    public function connectionSuggestions(Request $request): JsonResponse
    {
        $me = $request->user()->load('profile.skills');

        // My skills and field
        $mySkills = $me->profile?->skills?->pluck('name')->join(', ') ?? '';
        $myField  = $me->profile?->field ?? $me->role;
        $myRole   = $me->role;
        $myName   = $me->first_name . ' ' . $me->last_name;

        // Get basic suggestions from existing endpoint logic
        $connectedIds = \App\Models\Connection::where('sender_id', $me->id)
            ->orWhere('receiver_id', $me->id)
            ->get()
            ->flatMap(fn($c) => [$c->sender_id, $c->receiver_id])
            ->unique()
            ->toArray();

        $candidates = \App\Models\User::whereNotIn('id', array_merge($connectedIds, [$me->id]))
            ->where('status', 'ACTIVE')
            ->with('profile.skills')
            ->inRandomOrder()
            ->limit(8)
            ->get();

        if ($candidates->isEmpty()) {
            return response()->json([]);
        }

        // Build candidates description for AI
        $candidateList = $candidates->map(function ($u) {
            $skills = $u->profile?->skills?->pluck('name')->join(', ') ?? '';
            $field  = $u->profile?->field ?? '';
            $lab    = $u->profile?->laboratory ?? '';
            $role   = match($u->role) {
                'TEACHER'    => 'Enseignant',
                'RESEARCHER' => 'Chercheur',
                default      => 'Étudiant',
            };
            return "ID:{$u->id}|{$u->first_name} {$u->last_name}|{$role}|Domaine:{$field}|Lab:{$lab}|Compétences:{$skills}";
        })->join("\n");

        $myRoleLabel = match($myRole) {
            'TEACHER'    => 'Enseignant',
            'RESEARCHER' => 'Chercheur',
            default      => 'Étudiant',
        };

        $prompt = <<<PROMPT
Tu es un algorithme de recommandation de connexions pour un réseau académique.

Profil de l'utilisateur : {$myName} | {$myRoleLabel} | Domaine : {$myField} | Compétences : {$mySkills}

Voici des candidats potentiels à connecter :
{$candidateList}

Pour chaque candidat pertinent (maximum 4), génère une courte explication de pourquoi cette connexion serait bénéfique (1 phrase, max 80 caractères, en français).
Retourne UNIQUEMENT un JSON valide de ce format :
[
  {"id": 123, "reason": "Chercheur en NLP, domaine complémentaire au vôtre en IA."},
  {"id": 456, "reason": "Partage vos compétences en Python et Data Science."}
]

IMPORTANT : Réponds uniquement avec le JSON, sans markdown.
PROMPT;

        $system = "Tu es un assistant de recommandation académique. Tu identifies les connexions pertinentes entre chercheurs, enseignants et étudiants. Tu réponds toujours avec du JSON valide uniquement.";

        $result = $this->callOpenRouter($prompt, $system, 0.5);

        if ($result['error']) {
            // Fallback: return candidates without AI reasons
            return response()->json($candidates->take(4)->map(fn($u) => [
                'user'   => $u,
                'reason' => "Membre du réseau Scholar avec des intérêts similaires.",
            ])->values());
        }

        // Parse AI JSON response
        $content = preg_replace('/```(?:json)?\s*/i', '', $result['content']);
        $content = preg_replace('/```\s*$/', '', $content);
        $content = trim($content);

        preg_match('/\[.*\]/s', $content, $matches);
        $parsed = $matches ? json_decode($matches[0], true) : null;

        if (!$parsed) {
            // Fallback
            return response()->json($candidates->take(4)->map(fn($u) => [
                'user'   => $u,
                'reason' => "Profil académique compatible avec le vôtre.",
            ])->values());
        }

        // Build final response with full user data
        $candidateMap = $candidates->keyBy('id');
        $suggestions  = [];
        foreach ($parsed as $item) {
            $uid = $item['id'] ?? null;
            if ($uid && $candidateMap->has($uid)) {
                $suggestions[] = [
                    'user'   => $candidateMap[$uid],
                    'reason' => $item['reason'] ?? "Connexion suggérée par l'IA.",
                ];
            }
            if (count($suggestions) >= 4) break;
        }

        // If AI returned fewer than 2, pad with remaining candidates
        if (count($suggestions) < 2) {
            foreach ($candidates->take(3) as $u) {
                $alreadyIn = collect($suggestions)->pluck('user.id')->contains($u->id);
                if (!$alreadyIn) {
                    $suggestions[] = [
                        'user'   => $u,
                        'reason' => "Membre actif du réseau académique IGA.",
                    ];
                }
                if (count($suggestions) >= 3) break;
            }
        }

        return response()->json($suggestions);
    }
}
