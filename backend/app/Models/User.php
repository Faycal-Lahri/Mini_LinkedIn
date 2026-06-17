<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'role',
        'status',
        'email_verified',
        'email_verification_token',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($user) {
            // 1. Delete profile and files
            if ($user->profile) {
                if ($user->profile->photo_url) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile->photo_url);
                }
                if ($user->profile->diploma_url) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile->diploma_url);
                }
                if ($user->profile->certificate_url) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($user->profile->certificate_url);
                }
                $user->profile->skills()->delete();
                $user->profile->experiences()->delete();
                $user->profile->publications()->delete();
                $user->profile->certifications()->delete();
                $user->profile->educations()->delete();
                $user->profile->delete();
            }

            // 2. Delete posts
            $user->posts->each(function ($post) {
                $post->delete();
            });

            // 3. Delete comments
            $user->comments()->delete();

            // 4. Delete likes
            \App\Models\Like::where('user_id', $user->id)->delete();

            // 5. Delete connections
            $user->sentConnections()->delete();
            $user->receivedConnections()->delete();

            // 6. Delete notifications
            $user->notifications()->delete();

            // 7. Delete owned projects
            $user->ownedProjects->each(function ($project) {
                $project->tasks()->delete();
                $project->memberships()->delete();
                \App\Models\Channel::where('project_id', $project->id)->each(function($ch) {
                    $ch->messages()->delete();
                    $ch->delete();
                });
                $project->delete();
            });

            // 8. Delete project memberships and unassign tasks
            $user->projectMemberships()->delete();
            \App\Models\ProjectTask::where('assigned_to', $user->id)->update(['assigned_to' => null]);

            // 9. Delete direct chats involving this user
            \App\Models\Channel::where(function($query) use ($user) {
                $query->where('user1_id', $user->id)
                      ->orWhere('user2_id', $user->id);
            })->each(function ($channel) {
                $channel->messages()->delete();
                $channel->delete();
            });

            // 10. Delete chat messages sent by this user
            \App\Models\ChatMessage::where('sender_id', $user->id)->delete();

            // 11. Delete reports involving this user
            \App\Models\Report::where('reporter_id', $user->id)->delete();
            \App\Models\Report::where('type', 'USER')->where('reported_id', $user->id)->delete();
        });
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class, 'author_id');
    }

    public function sentConnections()
    {
        return $this->hasMany(Connection::class, 'sender_id');
    }

    public function receivedConnections()
    {
        return $this->hasMany(Connection::class, 'receiver_id');
    }

    public function followers()
    {
        return $this->belongsToMany(User::class, 'connections', 'receiver_id', 'sender_id')->wherePivot('status', 'ACCEPTED');
    }

    public function following()
    {
        return $this->belongsToMany(User::class, 'connections', 'sender_id', 'receiver_id')->wherePivot('status', 'ACCEPTED');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function ownedProjects()
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_memberships', 'user_id', 'project_id')
                    ->withPivot('role', 'status', 'joined_at');
    }

    public function projectMemberships()
    {
        return $this->hasMany(ProjectMembership::class);
    }
}
