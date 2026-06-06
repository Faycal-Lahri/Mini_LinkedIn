<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'photo_url',
        'institution',
        'field',
        'study_level',
        'department',
        'laboratory',
        'biography',
        'linkedin_url',
        'github_url',
        'website_url',
        'diploma_url',
        'certificate_url',
        'location',
        'phone',
        'languages',
    ];

    protected $casts = [
        'languages' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skills()
    {
        return $this->hasMany(Skill::class);
    }

    public function experiences()
    {
        return $this->hasMany(Experience::class);
    }

    public function publications()
    {
        return $this->hasMany(Publication::class);
    }

    public function certifications()
    {
        return $this->hasMany(Certification::class);
    }

    public function educations()
    {
        return $this->hasMany(Education::class);
    }
}
