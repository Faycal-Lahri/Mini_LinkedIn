<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Skill extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    public $timestamps = false;
    
    protected $fillable = ['profile_id', 'name', 'category', 'level', 'education_id', 'is_autoformation'];

    protected $casts = [
        'is_autoformation' => 'boolean',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function education(): BelongsTo
    {
        return $this->belongsTo(Education::class, 'education_id');
    }
}
