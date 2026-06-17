<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\NetworkController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/ai/assist-post', [AiController::class, 'assistPost']);
    Route::post('/ai/analyze-pdf', [AiController::class, 'analyzeArticlePdf']);
    Route::get('/ai/connections', [AiController::class, 'connectionSuggestions']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::get('/profile/{user}', [ProfileController::class, 'publicShow']);
    Route::post('/profile/update', [ProfileController::class, 'update']);
    Route::post('/profile/ai-bio', [ProfileController::class, 'generateAiBiography']);
    
    Route::post('/profile/skills', [ProfileController::class, 'addSkill']);
    Route::delete('/profile/skills/{skill}', [ProfileController::class, 'removeSkill']);
    
    Route::post('/profile/experiences', [ProfileController::class, 'addExperience']);
    Route::patch('/profile/experiences/{experience}', [ProfileController::class, 'updateExperience']);
    Route::delete('/profile/experiences/{experience}', [ProfileController::class, 'removeExperience']);
    
    Route::post('/profile/publications', [ProfileController::class, 'addPublication']);
    Route::delete('/profile/publications/{publication}', [ProfileController::class, 'removePublication']);
    
    Route::post('/profile/certifications', [ProfileController::class, 'addCertification']);
    Route::patch('/profile/certifications/{certification}', [ProfileController::class, 'updateCertification']);
    Route::delete('/profile/certifications/{certification}', [ProfileController::class, 'removeCertification']);

    Route::post('/profile/educations', [ProfileController::class, 'addEducation']);
    Route::patch('/profile/educations/{education}', [ProfileController::class, 'updateEducation']);
    Route::delete('/profile/educations/{education}', [ProfileController::class, 'removeEducation']);

    // Post Routes
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/{post}/like', [PostController::class, 'toggleLike']);
    Route::post('/posts/{post}/comment', [PostController::class, 'comment']);
    Route::post('/posts/{post}/share', [PostController::class, 'share']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Network Routes
    Route::get('/network', [NetworkController::class, 'index']);
    Route::get('/network/connections', [NetworkController::class, 'getConnections']);
    Route::get('/network/suggestions', [NetworkController::class, 'suggestions']);
    Route::get('/network/search', [NetworkController::class, 'search']);
    Route::post('/network/request/{user}', [NetworkController::class, 'sendRequest']);
    Route::post('/network/accept/{user}', [NetworkController::class, 'acceptRequest']);
    Route::delete('/network/remove/{user}', [NetworkController::class, 'removeConnection']);

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'stats']);
        Route::get('/activity', [AdminController::class, 'activity']);

        // User Management
        Route::get('/users', [AdminController::class, 'getAllUsers']);
        Route::get('/pending-users', [AdminController::class, 'getPendingUsers']);
        Route::post('/users/{user}/approve', [AdminController::class, 'approveUser']);
        Route::post('/users/{user}/reject', [AdminController::class, 'rejectUser']);
        Route::post('/users/{user}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
        Route::put('/users/{user}', [AdminController::class, 'updateUser']);
        Route::patch('/users/{user}/role', [AdminController::class, 'changeUserRole']);
        Route::post('/users/{user}/warn', [AdminController::class, 'sendWarning']);
        Route::post('/users/{user}/ban', [AdminController::class, 'banUser']);

        // Post Moderation
        Route::get('/posts', [AdminController::class, 'getAllPosts']);
        Route::delete('/posts/{post}', [AdminController::class, 'deletePost']);
        Route::put('/posts/{post}', [AdminController::class, 'updatePost']);
        Route::delete('/comments/{comment}', [AdminController::class, 'deleteComment']);

        // Reports
        Route::get('/reports', [AdminController::class, 'getReports']);
        Route::post('/reports/{report}/resolve', [AdminController::class, 'resolveReport']);
    });

    // Chat Hub Routes
    Route::get('/chat/channels', [ChatController::class, 'getChannels']);
    Route::post('/chat/channels', [ChatController::class, 'createChannel'])->middleware('admin');
    Route::get('/chat/channels/{channel}/messages', [ChatController::class, 'getMessages']);
    Route::post('/chat/channels/{channel}/messages', [ChatController::class, 'sendMessage']);
    Route::post('/chat/private/{otherUser}', [ChatController::class, 'startPrivateChat']);

    // Project Routes
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::get('/projects/{project}/members', [ProjectController::class, 'getMembers']);
    Route::post('/projects/{project}/join', [ProjectController::class, 'join']);
    Route::post('/projects/{project}/leave', [ProjectController::class, 'leave']);
    Route::post('/projects/{project}/invite/accept', [ProjectController::class, 'acceptInvitation']);
    Route::post('/projects/{project}/invite/decline', [ProjectController::class, 'declineInvitation']);
    Route::post('/projects/{project}/invite/{user}', [ProjectController::class, 'invite']);
    Route::post('/projects/{project}/members/{userId}/approve', [ProjectController::class, 'approveMember']);
    Route::post('/projects/{project}/members/{userId}/reject', [ProjectController::class, 'rejectMember']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

    // Project Task Routes
    Route::get('/projects/{project}/tasks', [ProjectController::class, 'getTasks']);
    Route::post('/projects/{project}/tasks', [ProjectController::class, 'addTask']);
    Route::patch('/projects/{project}/tasks/{task}', [ProjectController::class, 'updateTask']);
    Route::delete('/projects/{project}/tasks/{task}', [ProjectController::class, 'deleteTask']);

    // Report Route
    Route::post('/report', [ReportController::class, 'store']);

    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications', [NotificationController::class, 'clearAll']);
});
