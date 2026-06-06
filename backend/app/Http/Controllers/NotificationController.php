<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Notification;

class NotificationController extends Controller
{
    /**
     * Get the authenticated user's notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()
            ->latest()
            ->limit(30)
            ->get();
            
        return response()->json($notifications);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Notification $notification): JsonResponse
    {
        if ($notification->user_id !== auth()->id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $notification->update(['is_read' => true]);
        return response()->json(['message' => 'Notification marquée comme lue.']);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->notifications()->where('is_read', false)->update(['is_read' => true]);
        return response()->json(['message' => 'Toutes les notifications sont marquées comme lues.']);
    }

    /**
     * Clear all notifications.
     */
    public function clearAll(Request $request): JsonResponse
    {
        $request->user()->notifications()
            ->whereNotIn('type', ['CONNECTION_REQUEST', 'PROJECT_JOIN_REQUEST', 'PROJECT_INVITATION'])
            ->delete();
        return response()->json(['message' => 'Toutes les notifications non-actionnables ont été supprimées.']);
    }
}
