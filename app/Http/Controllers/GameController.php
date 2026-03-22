<?php

namespace App\Http\Controllers;

use App\Models\CardStat;
use App\Models\Game;
use App\Services\GameService;
use Illuminate\Http\Request;

class GameController extends Controller
{
    protected GameService $gameService;

    public function __construct(GameService $gameService)
    {
        $this->gameService = $gameService;
    }

    public function joinQueue(Request $request)
    {
        $user = $request->user();

        // Check if user is already in an active/waiting game
        $existingGame = Game::where(function ($q) use ($user) {
            $q->where('player1_id', $user->id)->orWhere('player2_id', $user->id);
        })->whereIn('status', ['waiting', 'active'])->first();

        if ($existingGame) {
            return response()->json([
                'game' => $existingGame,
                'status' => $existingGame->status,
            ]);
        }

        // Look for a waiting game to join
        $waitingGame = Game::where('status', 'waiting')
            ->where('player1_id', '!=', $user->id)
            ->whereNull('player2_id')
            ->first();

        if ($waitingGame) {
            $waitingGame->player2_id = $user->id;
            $waitingGame->status = 'active';

            // Initialize game state
            $gameState = $this->gameService->initializeGame($waitingGame);
            $waitingGame->game_state = $gameState;
            $waitingGame->save();

            return response()->json([
                'game' => $waitingGame,
                'status' => 'active',
                'message' => 'Match found! Game starting.',
            ]);
        }

        // Create a new waiting game
        $game = Game::create([
            'player1_id' => $user->id,
            'player2_id' => null,
            'status' => 'waiting',
            'game_state' => null,
            'current_turn' => 1,
        ]);

        return response()->json([
            'game' => $game,
            'status' => 'waiting',
            'message' => 'Waiting for opponent...',
        ]);
    }

    public function getGame(Request $request, Game $game)
    {
        $user = $request->user();

        // Verify user is part of this game
        if ($game->player1_id !== $user->id && $game->player2_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $game->load(['player1:id,name', 'player2:id,name', 'winner:id,name']);

        return response()->json($game);
    }

    public function playCard(Request $request, Game $game)
    {
        $user = $request->user();
        $request->validate([
            'card_id' => 'required|integer',
            'position' => 'sometimes|integer|min:0',
        ]);

        if ($game->player1_id !== $user->id && $game->player2_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($game->status !== 'active') {
            return response()->json(['error' => 'Game is not active'], 422);
        }

        $state = $game->game_state;

        if ($state['active_player'] !== $user->id) {
            return response()->json(['error' => 'It is not your turn'], 422);
        }

        $position = $request->input('position', count($state['players'][(string)$user->id]['board']));
        $state = $this->gameService->playMinion($state, $user->id, $request->card_id, $position);

        // Check game over
        $winnerId = $this->gameService->checkGameOver($state);
        if ($winnerId) {
            $game->status = 'finished';
            $game->winner_id = $winnerId;
        }

        $game->game_state = $state;
        $game->save();

        // Track card usage
        $stat = CardStat::firstOrCreate(
            ['user_id' => $user->id, 'card_id' => $request->card_id],
            ['play_count' => 0]
        );
        $stat->increment('play_count');
        $stat->update(['last_played_at' => now()]);

        return response()->json(['game' => $game]);
    }

    public function attack(Request $request, Game $game)
    {
        $user = $request->user();
        $request->validate([
            'attacker_id' => 'required|integer',
            'target_id' => 'required|integer',
            'target_type' => 'sometimes|in:minion,hero',
        ]);

        if ($game->player1_id !== $user->id && $game->player2_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($game->status !== 'active') {
            return response()->json(['error' => 'Game is not active'], 422);
        }

        $state = $game->game_state;

        if ($state['active_player'] !== $user->id) {
            return response()->json(['error' => 'It is not your turn'], 422);
        }

        $targetType = $request->input('target_type', 'minion');

        if ($targetType === 'hero') {
            $state = $this->gameService->attackHero($state, $user->id, $request->attacker_id);
        } else {
            $state = $this->gameService->attackMinion($state, $user->id, $request->attacker_id, $request->target_id);
        }

        // Check game over
        $winnerId = $this->gameService->checkGameOver($state);
        if ($winnerId) {
            $game->status = 'finished';
            $game->winner_id = $winnerId;
        }

        $game->game_state = $state;
        $game->save();

        return response()->json(['game' => $game]);
    }

    public function endTurn(Request $request, Game $game)
    {
        $user = $request->user();

        if ($game->player1_id !== $user->id && $game->player2_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($game->status !== 'active') {
            return response()->json(['error' => 'Game is not active'], 422);
        }

        $state = $game->game_state;

        if ($state['active_player'] !== $user->id) {
            return response()->json(['error' => 'It is not your turn'], 422);
        }

        $state = $this->gameService->endTurn($state);

        $game->current_turn = $state['turn'];
        $game->game_state = $state;
        $game->save();

        return response()->json(['game' => $game]);
    }

    public function surrender(Request $request, Game $game)
    {
        $user = $request->user();

        if ($game->player1_id !== $user->id && $game->player2_id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($game->status !== 'active') {
            return response()->json(['error' => 'Game is not active'], 422);
        }

        // Winner is the other player
        $winnerId = $game->player1_id === $user->id ? $game->player2_id : $game->player1_id;

        $game->status = 'finished';
        $game->winner_id = $winnerId;
        $game->save();

        return response()->json([
            'message' => 'You surrendered. Better luck next time!',
            'game' => $game,
        ]);
    }
}
