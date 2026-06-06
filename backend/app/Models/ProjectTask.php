<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class ProjectTask extends Model
{
    protected $fillable = ['project_id', 'title', 'status', 'assigned_to', 'description', 'sub_tasks'];

    protected $casts = [
        'sub_tasks' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
