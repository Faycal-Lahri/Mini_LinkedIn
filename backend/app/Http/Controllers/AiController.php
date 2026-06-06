<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    private function callOpenRouter($prompt, $systemMessage)
    {
        $apiKey = env('OPENROUTER_API_KEY') ?? env('OPENAI_API_KEY');
        
        if (!$apiKey) {
            return [
                'error' => true,
                'message' => 'Clé API non configurée.',
                'mock' => "Ceci est un texte de démonstration généré par l'IA de Nexux. Pour activer la vraie génération, veuillez configurer votre clé API."
            ];
        }

        try {
            $response = Http::withToken($apiKey)
                ->withHeaders([
                    'HTTP-Referer' => 'http://localhost:5173',
                    'X-Title' => 'mini_linkdin',
                    'Content-Type' => 'application/json',
                ])
                ->timeout(60)
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'openai/gpt-3.5-turbo',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemMessage],
                        ['role' => 'user', 'content' => $prompt]
                    ],
                    'temperature' => 0.7,
                ]);

            if ($response->failed()) {
                $errorData = $response->json();
                return [
                    'error' => true,
                    'message' => $errorData['error']['message'] ?? 'Erreur OpenRouter inconnue'
                ];
            }

            return [
                'error' => false,
                'content' => trim($response->json('choices.0.message.content'))
            ];

        } catch (\Exception $e) {
            return [
                'error' => true,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Improve a post content or suggest one.
     */
    public function assistPost(Request $request): JsonResponse
    {
        $content = $request->input('content');
        $type = $request->input('type', 'GENERAL');
        $hasFile = $request->input('has_file', false);
        $fileName = $request->input('file_name');
        
        $fileContext = "";
        if ($hasFile) {
            $fileContext = "Note : L'utilisateur va joindre un fichier (Probablement une image ou un document nommé : {$fileName}). Adapte le texte pour introduire ce média.";
        }

        $prompt = "";
        if ($content) {
            $prompt = "Améliore et professionnalise la publication suivante pour Nexux. 
            Type : {$type}
            {$fileContext}
            Contenu original : {$content}";
        } else {
            $user = $request->user();
            $prompt = "Suggère-moi une publication captivante pour Nexux. Je suis un(e) {$user->role}. 
            Type : {$type}. 
            {$fileContext}
            Donne-moi juste le texte final.";
        }

        $systemMessage = "Tu es un assistant de rédaction d'élite pour Nexux, un réseau social académique. Ton but est d'aider les utilisateurs à briller par leurs écrits.";
        
        $result = $this->callOpenRouter($prompt, $systemMessage);

        if ($result['error']) {
            if (isset($result['mock'])) {
                return response()->json([
                    'content' => $result['mock'],
                    'message' => 'Mode démonstration actif.'
                ]);
            }
            return response()->json(['message' => $result['message']], 500);
        }

        return response()->json(['content' => $result['content']]);
    }
}
