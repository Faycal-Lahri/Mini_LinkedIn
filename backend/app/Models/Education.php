<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Education extends Model
{
    use HasFactory;

    protected $table = 'educations';

    protected $fillable = [
        'profile_id',
        'school',
        'degree',
        'field_of_study',
        'city',
        'start_date',
        'end_date',
        'description',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class, 'education_id');
    }
}
