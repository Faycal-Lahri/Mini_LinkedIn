<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Experience extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'profile_id',
        'title',
        'organization',
        'location',
        'start_date',
        'end_date',
        'is_current',
        'type',
        'duration',
        'description',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
