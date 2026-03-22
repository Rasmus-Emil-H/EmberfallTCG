<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\RankService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'gold' => 1000,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user  = $request->user()->load('roles');
        $rank  = (new RankService())->getRankDisplay($user->rank_points ?? 0);
        $roles = $user->roles->pluck('name')->toArray();
        return response()->json(array_merge($user->toArray(), [
            'rank'              => $rank,
            'roles'             => $roles,
            'is_admin'          => in_array('admin', $roles),
            'free_gold_claimed' => $user->free_gold_claimed_at !== null,
        ]));
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'email'            => 'sometimes|email|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password'         => 'sometimes|string|min:6|confirmed',
        ]);

        if (isset($data['password'])) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['error' => 'Current password is incorrect'], 422);
            }
            $data['password'] = Hash::make($data['password']);
        }

        unset($data['current_password']);
        $user->update($data);

        return response()->json($user);
    }
}
