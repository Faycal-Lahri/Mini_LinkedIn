<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id', 'content', 'file_url', 'cover_image_url', 'link_url', 'type',
        'article_title', 'journal', 'doi', 'keywords', 'abstract',
        'original_post_id', 'share_comment', 'title', 'media_type', 'file_urls',
    ];

    protected $casts = [
        'file_urls' => 'array',
    ];

    public function shares(): HasMany
    {
        return $this->hasMany(Post::class, 'original_post_id')->with('author.profile');
    }

    public function originalPost(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'original_post_id')->with(['author.profile']);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($post) {
            // Delete files from storage
            if ($post->file_url) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($post->file_url);
            }
            if ($post->file_urls && is_array($post->file_urls)) {
                foreach ($post->file_urls as $url) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($url);
                }
            }

            // Delete associated likes and comments
            $post->likes()->delete();
            $post->comments()->delete();

            // Set original_post_id of shared posts to null to prevent foreign key errors
            self::where('original_post_id', $post->id)->update(['original_post_id' => null]);

            // Delete reports targeting this post
            \App\Models\Report::where('type', 'POST')->where('reported_id', $post->id)->delete();
        });
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function isLikedBy(User $user): bool
    {
        return $this->likes()->where('user_id', $user->id)->exists();
    }
}
