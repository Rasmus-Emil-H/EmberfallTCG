<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\Friendship;
use App\Models\Game;
use App\Services\GameService;
use Illuminate\Http\Request;

class ChallengeController extends Controller
{
    public function __construct(private GameService $gameService) {}

    /** GET /api/challenges — incoming pending challenges */
    public function index(Request $request)
    {
        $user = $request->user();

        $incoming = Challenge::where('challenged_id', $user->id)
            ->where('status', 'pending')
            ->with('challenger:id,name,rank_points,last_seen_at')
            ->get()
            ->filter(fn($c) => !$c->isExpired())
            ->map(fn($c) => [
                'id'         => $c->id,
                'challenger' => ['id' => $c->challenger->id, 'name' => $c->challenger->name],
                'created_at' => $c->created_at,
            ])->values();

        return response()->json($incoming);
    }

    /** POST /api/challenges — send a challenge to a friend */
    public function store(Request $request)
    {
        $request->validate(['user_id' => 'required|integer|exists:users,id']);
        $user = $request->user();

        if ($request->user_id === $user->id) {
            return response()->json(['error' => 'Cannot challenge yourself.'], 422);
        }

        // Must be friends
        $areFriends = Friendship::where('status', 'accepted')
            ->where(function ($q) use ($user, $request) {
                $q->where('requester_id', $user->id)->where('addressee_id', $request->user_id);
            })->orWhere(function ($q) use ($user, $request) {
                $q->where('requester_id', $request->user_id)->where('addressee_id', $user->id);
            })->exists();

        if (!$areFriends) {
            return response()->json(['error' => 'You can only challenge friends.'], 422);
        }

        // Expire any old pending challenges between these two
        Challenge::where('challenger_id', $user->id)
            ->where('challenged_id', $request->user_id)
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        // Create a waiting game (challenger is player1)
        $game = Game::create([
            'player1_id'  => $user->id,
            'player2_id'  => null,
            'status'      => 'waiting',
            'game_state'  => null,
            'current_turn'=> 1,
        ]);

        $challenge = Challenge::create([
            'challenger_id' => $user->id,
            'challenged_id' => $request->user_id,
            'game_id'       => $game->id,
            'status'        => 'pending',
        ]);

        return response()->json(['challenge_id' => $challenge->id, 'game_id' => $game->id], 201);
    }

    /** POST /api/challenges/{challenge}/accept */
    public function accept(Request $request, Challenge $challenge)
    {
        $user = $request->user();

        if ($challenge->challenged_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        if ($challenge->status !== 'pending' || $challenge->isExpired()) {
            return response()->json(['error' => 'Challenge is no longer valid.'], 422);
        }

        $game = $challenge->game;
        if (!$game || $game->status !== 'waiting') {
            return response()->json(['error' => 'Game is no longer available.'], 422);
        }

        // Start the game
        $game->player2_id = $user->id;
        $game->status     = 'active';
        $game->game_state = $this->gameService->initializeGame($game);
        $game->save();

        $challenge->update(['status' => 'accepted']);

        return response()->json(['game_id' => $game->id]);
    }

    /** POST /api/challenges/{challenge}/decline */
    public function decline(Request $request, Challenge $challenge)
    {
        $user = $request->user();

        if ($challenge->challenged_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $challenge->update(['status' => 'declined']);

        // Clean up the waiting game
        $challenge->game?->delete();

        return response()->json(['declined' => true]);
    }
}
