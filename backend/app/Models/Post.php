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
        'author_id', 'content', 'file_url', 'link_url', 'type',
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
