<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Post;
use App\Models\Like;
use App\Models\Comment;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Get the latest posts with user, comments, and like data.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Post::with(['author.profile', 'comments.author', 'likes.user.profile', 'originalPost', 'shares.author.profile'])
            ->withCount(['comments', 'likes']);

        // Filtering by user
        if ($request->has('user_id')) {
            $query->where('author_id', $request->user_id);
        } else {
            // Hide reposts from the main feed
            $query->whereNull('original_post_id');
        }

        // Filtering by commented_by user
        if ($request->has('commented_by')) {
            $query->whereHas('comments', function($q) use ($request) {
                $q->where('author_id', $request->commented_by);
            });
        }

        // Filtering by media type (IMAGE, VIDEO, PDF)
        if ($request->has('media_type')) {
            $query->where('media_type', $request->media_type);
        }

        // Filtering by type
        if ($request->has('type') && $request->type !== 'ALL') {
            $query->where('type', $request->type);
        }

        // Search in content
        if ($request->has('q')) {
            $q = $request->q;
            $query->where(function($q2) use ($q) {
                $q2->where('content', 'like', "%$q%")
                   ->orWhere('article_title', 'like', "%$q%")
                   ->orWhere('title', 'like', "%$q%");
            });
        }

        // Sorting
        if ($request->sort === 'popular') {
            $query->orderBy('likes_count', 'desc');
        } else {
            $query->latest();
        }

        $posts = $query->get();
        $posts->each(function ($post) {
            $post->is_liked = $post->isLikedBy(auth()->user());
            
            $userLike = $post->likes()->where('user_id', auth()->id())->first();
            $post->user_reaction = $userLike ? $userLike->type : null;
        });

        return response()->json($posts);
    }

    public function share(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'share_comment' => 'nullable|string',
        ]);

        $repost = Post::create([
            'author_id' => auth()->id(),
            'content' => $validated['share_comment'] ?? '', // Comment added by the sharer
            'original_post_id' => $post->id,
            'type' => $post->type, // Keep same type for filtering
        ]);

        return response()->json($repost->load(['author.profile', 'originalPost.author.profile', 'comments.author', 'likes']));
    }



    /**
     * Store a new post.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'         => 'nullable|string|max:255',
            'content'       => 'nullable|string',
            'type'          => 'required|in:UNIVERSITY_PROJECT,SCIENTIFIC_ARTICLE,GENERAL',
            'media_type'    => 'nullable|in:IMAGE,VIDEO,PDF',
            'files'         => 'nullable|array|max:5',
            'files.*'       => 'file|max:20480',
            'file'          => 'nullable|file|max:102400',
            'link_url'      => 'nullable|url',
            'article_title' => 'nullable|string|max:255',
            'journal'       => 'nullable|string|max:255',
            'doi'           => 'nullable|string|max:255',
            'keywords'      => 'nullable|string|max:500',
            'abstract'      => 'nullable|string',
            'cover_image'   => 'nullable|image|max:5120',
        ]);

        // Seuls Enseignants et Chercheurs peuvent publier des articles scientifiques
        if ($validated['type'] === 'SCIENTIFIC_ARTICLE' && !in_array($request->user()->role, ['TEACHER', 'RESEARCHER'])) {
            return response()->json([
                'message' => 'Seuls les enseignants et chercheurs peuvent publier des articles scientifiques.'
            ], 403);
        }

        if (empty($validated['content']) && !$request->hasFile('file') && !$request->hasFile('files')) {
            return response()->json(['message' => 'Contenu ou fichier requis.'], 422);
        }

        $fileUrls = [];
        $fileUrl = null;
        $coverImageUrl = null;
        $mediaType = $validated['media_type'] ?? null;

        if ($request->hasFile('cover_image')) {
            $coverImageUrl = $request->file('cover_image')->store('posts/covers', 'public');
        }

        if ($mediaType === 'IMAGE' && $request->hasFile('files')) {
            foreach ($request->file('files') as $uploadedFile) {
                $path = $uploadedFile->store('posts', 'public');
                $fileUrls[] = $path;
            }
            if (!empty($fileUrls)) {
                $fileUrl = $fileUrls[0];
            }
        } elseif (($mediaType === 'VIDEO' || $mediaType === 'PDF') && $request->hasFile('file')) {
            $path = $request->file('file')->store('posts', 'public');
            $fileUrls[] = $path;
            $fileUrl = $path;
        } elseif ($request->hasFile('file')) {
            // Default file upload (for backward compatibility if media_type is not sent)
            $path = $request->file('file')->store('posts', 'public');
            $fileUrls[] = $path;
            $fileUrl = $path;
            
            // Auto detect media type from extension
            $extension = strtolower($request->file('file')->getClientOriginalExtension());
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                $mediaType = 'IMAGE';
            } elseif (in_array($extension, ['mp4', 'mov', 'avi', 'mpeg'])) {
                $mediaType = 'VIDEO';
            } elseif ($extension === 'pdf') {
                $mediaType = 'PDF';
            }
        }

        $post = $request->user()->posts()->create([
            'title'         => $validated['title'] ?? null,
            'content'       => $validated['content'] ?? '',
            'type'          => $validated['type'],
            'media_type'    => $mediaType,
            'file_url'      => $fileUrl,
            'file_urls'     => !empty($fileUrls) ? $fileUrls : null,
            'link_url'      => $validated['link_url'] ?? null,
            'article_title' => $validated['article_title'] ?? null,
            'journal'       => $validated['journal'] ?? null,
            'doi'           => $validated['doi'] ?? null,
            'keywords'      => $validated['keywords'] ?? null,
            'abstract'      => $validated['abstract'] ?? null,
            'cover_image_url' => $coverImageUrl,
        ]);

        return response()->json($post->load('author.profile'), 201);
    }

    /**
     * Toggle like/unlike on a post.
     */
    public function toggleLike(Request $request, Post $post): JsonResponse
    {
        $userId = auth()->id();
        $reactionType = $request->input('reaction', 'LIKE');
        $like = $post->likes()->where('user_id', $userId)->first();

        if ($like) {
            if ($like->type === $reactionType) {
                // Same reaction: remove it (unlike)
                $like->delete();
                $status = 'unliked';
            } else {
                // Different reaction: update it!
                $like->update(['type' => $reactionType]);
                $status = 'updated';
            }
        } else {
            // No reaction: create it!
            $post->likes()->create([
                'user_id' => $userId,
                'type' => $reactionType
            ]);
            $status = 'liked';

            // Notify author
            if ($post->author_id !== $userId) {
                $emojiLabel = 'aimé';
                if ($reactionType === 'LOVE') $emojiLabel = 'adoré';
                elseif ($reactionType === 'CLAP') $emojiLabel = 'applaudi';
                elseif ($reactionType === 'INSIGHTFUL') $emojiLabel = 'trouvé instructive';
                elseif ($reactionType === 'DISLIKE') $emojiLabel = 'réagi négativement à';

                $post->author->notifications()->create([
                    'type' => 'POST_LIKED',
                    'message' => auth()->user()->first_name . ' a ' . $emojiLabel . ' votre publication.',
                    'reference_id' => $post->id,
                    'reference_type' => 'POST',
                ]);
            }
        }

        // Return count of each reaction and total count
        $reactions = $post->likes()->selectRaw('type, count(*) as count')->groupBy('type')->pluck('count', 'type');

        return response()->json([
            'status' => $status,
            'likes_count' => $post->likes()->count(),
            'reactions' => $reactions,
        ]);
    }

    /**
     * Store a new comment on a post.
     */
    public function comment(Request $request, Post $post): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment = $post->comments()->create([
            'author_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        // Notify author
        if ($post->author_id !== auth()->id()) {
            $post->author->notifications()->create([
                'type' => 'POST_COMMENTED',
                'message' => auth()->user()->first_name . ' a commenté votre publication.',
                'reference_id' => $post->id,
                'reference_type' => 'POST',
            ]);
        }

        return response()->json($comment->load('author.profile'), 201);
    }

    /**
     * Remove a post.
     */
    public function destroy(Post $post): JsonResponse
    {
        if ($post->author_id !== auth()->id() && auth()->user()->role !== 'ADMIN') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        if ($post->file_url) {
            Storage::disk('public')->delete($post->file_url);
        }

        $post->delete();

        return response()->json(['message' => 'Post supprimé avec succès.']);
    }
}
