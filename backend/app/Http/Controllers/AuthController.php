<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $status = $request->role === 'STUDENT' ? 'ACTIVE' : 'PENDING';

        $user = User::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'status' => $status,
        ]);

        $diplomaUrl = null;
        if ($request->hasFile('diploma')) {
            $diplomaUrl = $request->file('diploma')->store('verification_docs', 'public');
        }

        $certUrl = null;
        if ($request->hasFile('certification')) {
            $certUrl = $request->file('certification')->store('verification_docs', 'public');
        }

        // Create associated profile
        $profile = $user->profile()->create([
            'institution' => $request->institution ?? 'IGA',
            'field' => $request->filiere,
            'study_level' => $request->nv,
            'department' => $request->department,
            'laboratory' => $request->laboratory,
            'diploma_url' => $diplomaUrl,
            'certificate_url' => $certUrl,
        ]);

        if ($request->exp_title && $request->exp_org) {
            $profile->experiences()->create([
                'title' => $request->exp_title,
                'organization' => $request->exp_org,
                'start_date' => now(),
                'type' => $request->exp_type ?? 'OTHER',
                'duration' => $request->exp_duration,
            ]);
        }

        if ($request->cert_title && $request->cert_org) {
            $profile->certifications()->create([
                'title' => $request->cert_title,
                'issuing_organization' => $request->cert_org,
            ]);
        }

        // Notifier les admins si l'utilisateur est Enseignant ou Chercheur (compte PENDING)
        if (in_array($request->role, ['TEACHER', 'RESEARCHER'])) {
            $roleLabel = $request->role === 'TEACHER' ? 'Enseignant' : 'Chercheur';
            $admins = User::where('role', 'ADMIN')->get();
            foreach ($admins as $admin) {
                $admin->notifications()->create([
                    'type'           => 'ACCOUNT_PENDING_VALIDATION',
                    'message'        => "Nouveau compte {$roleLabel} en attente de validation : {$user->first_name} {$user->last_name} ({$user->email})",
                    'reference_id'   => $user->id,
                    'reference_type' => 'USER',
                    'data'           => ['user_id' => $user->id, 'role' => $request->role],
                ]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user->load('profile'),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)
            ->with('profile')
            ->withCount(['projects', 'posts'])
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        if ($user->status === 'PENDING') {
            return response()->json([
                'message' => 'Votre compte est en attente de validation par un administrateur.'
            ], 403);
        }

        if ($user->status === 'DISABLED' || $user->status === 'BLOCKED') {
            return response()->json([
                'message' => 'Votre compte est suspendu ou a été bloqué.'
            ], 403);
        }

        $user->connections_count = \App\Models\Connection::where(function($q) use ($user) {
            $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
        })->where('status', 'ACCEPTED')->count();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile');
        $user->loadCount(['projects', 'posts']);
        $user->connections_count = \App\Models\Connection::where(function($q) use ($user) {
            $q->where('sender_id', $user->id)->orWhere('receiver_id', $user->id);
        })->where('status', 'ACCEPTED')->count();
        
        return response()->json($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }
}
