<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = ['user_id', 'type', 'message', 'reference_id', 'reference_type', 'is_read', 'data'];

    protected $casts = [
        'data' => 'array',
        'is_read' => 'boolean'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
