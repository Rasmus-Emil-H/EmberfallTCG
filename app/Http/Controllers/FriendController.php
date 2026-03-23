<?php

namespace App\Http\Controllers;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FriendController extends Controller
{
    /** GET /api/friends — accepted friends with online status */
    public function index(Request $request)
    {
        $user = $request->user();

        $friends = $this->getFriendUsers($user)->map(fn(User $f) => $this->formatUser($f));

        $pending = Friendship::where('addressee_id', $user->id)
            ->where('status', 'pending')
            ->with('requester')
            ->get()
            ->map(fn($fs) => $this->formatUser($fs->requester, ['friendship_id' => $fs->id]));

        return response()->json([
            'friends' => $friends,
            'pending' => $pending,
        ]);
    }

    /** GET /api/friends/search?q=... */
    public function search(Request $request)
    {
        $q    = $request->query('q', '');
        $user = $request->user();

        if (strlen($q) < 2) {
            return response()->json([]);
        }

        // IDs already in any friendship with current user
        $knownIds = Friendship::where(function ($query) use ($user) {
            $query->where('requester_id', $user->id)
                  ->orWhere('addressee_id', $user->id);
        })->get()->flatMap(fn($fs) => [$fs->requester_id, $fs->addressee_id])->unique()->toArray();

        $results = User::where('id', '!=', $user->id)
            ->whereNotIn('id', $knownIds)
            ->where('name', 'like', "%{$q}%")
            ->limit(10)
            ->get(['id', 'name', 'rank_points', 'last_seen_at']);

        return response()->json($results->map(fn($u) => $this->formatUser($u)));
    }

    /** POST /api/friends — send friend request */
    public function store(Request $request)
    {
        $request->validate(['user_id' => 'required|integer|exists:users,id']);
        $user = $request->user();

        if ($request->user_id === $user->id) {
            return response()->json(['error' => 'Cannot add yourself.'], 422);
        }

        // Prevent duplicate
        $existing = Friendship::where(function ($q) use ($user, $request) {
            $q->where('requester_id', $user->id)->where('addressee_id', $request->user_id);
        })->orWhere(function ($q) use ($user, $request) {
            $q->where('requester_id', $request->user_id)->where('addressee_id', $user->id);
        })->first();

        if ($existing) {
            return response()->json(['error' => 'Request already exists.'], 422);
        }

        $fs = Friendship::create([
            'requester_id' => $user->id,
            'addressee_id' => $request->user_id,
            'status'       => 'pending',
        ]);

        return response()->json($fs, 201);
    }

    /** PUT /api/friends/{friendship} — accept or decline */
    public function update(Request $request, Friendship $friendship)
    {
        $request->validate(['status' => 'required|in:accepted,declined']);
        $user = $request->user();

        if ($friendship->addressee_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $friendship->update(['status' => $request->status]);

        return response()->json($friendship);
    }

    /** DELETE /api/friends/{user} — unfriend */
    public function destroy(Request $request, User $friend)
    {
        $user = $request->user();

        Friendship::where(function ($q) use ($user, $friend) {
            $q->where('requester_id', $user->id)->where('addressee_id', $friend->id);
        })->orWhere(function ($q) use ($user, $friend) {
            $q->where('requester_id', $friend->id)->where('addressee_id', $user->id);
        })->delete();

        return response()->json(['deleted' => true]);
    }

    // ── helpers ───────────────────────────────────────────────────

    private function getFriendUsers(User $user)
    {
        $sentIds = Friendship::where('requester_id', $user->id)
            ->where('status', 'accepted')
            ->pluck('addressee_id');

        $receivedIds = Friendship::where('addressee_id', $user->id)
            ->where('status', 'accepted')
            ->pluck('requester_id');

        return User::whereIn('id', $sentIds->merge($receivedIds))
            ->get(['id', 'name', 'rank_points', 'last_seen_at']);
    }

    private function formatUser(User $u, array $extra = []): array
    {
        return array_merge([
            'id'           => $u->id,
            'name'         => $u->name,
            'rank_points'  => $u->rank_points,
            'is_online'    => $u->isOnline(),
            'last_seen'    => $u->lastSeenLabel(),
        ], $extra);
    }
}
