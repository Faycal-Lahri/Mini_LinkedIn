<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certification extends Model
{
    use HasFactory;

    const UPDATED_AT = null;

    protected $fillable = [
        'profile_id', 
        'title', 
        'issuing_organization', 
        'issue_date', 
        'expiry_date', 
        'credential_id', 
        'credential_url',
        'description'
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }
}
