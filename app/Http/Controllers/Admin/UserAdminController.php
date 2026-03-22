<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\RankService;
use Illuminate\Http\Request;

class UserAdminController extends Controller
{
    public function index()
    {
        $rankService = new RankService();
        $users = User::with('roles')->latest()->get()
            ->map(fn($u) => array_merge($u->makeVisible('email')->toArray(), [
                'roles'    => $u->roles->pluck('name'),
                'is_admin' => $u->hasRole('admin'),
                'rank'     => $rankService->getRankDisplay($u->rank_points ?? 0),
            ]));

        return response()->json($users);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'email'       => 'sometimes|email|unique:users,email,' . $user->id,
            'gold'        => 'sometimes|integer|min:0',
            'rank_points' => 'sometimes|integer|min:0',
            'roles'       => 'sometimes|array',
            'roles.*'     => 'string|exists:roles,name',
        ]);

        if (isset($data['roles'])) {
            $roleIds = Role::whereIn('name', $data['roles'])->pluck('id');
            $user->roles()->sync($roleIds);
            unset($data['roles']);
        }

        $user->update($data);
        $user->load('roles');

        return response()->json(array_merge($user->toArray(), [
            'roles'    => $user->roles->pluck('name'),
            'is_admin' => $user->hasRole('admin'),
        ]));
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['error' => 'Cannot delete your own account'], 422);
        }
        $user->delete();
        return response()->json(['message' => 'User deleted']);
    }
}
