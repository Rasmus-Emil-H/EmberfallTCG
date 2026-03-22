<?php

namespace App\Http\Controllers;

use App\Models\CardStat;
use App\Models\Game;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $games = Game::where(function ($q) use ($user) {
            $q->where('player1_id', $user->id)->orWhere('player2_id', $user->id);
        })->where('status', 'finished')->get();

        $gamesPlayed = $games->count();
        $wins        = $games->where('winner_id', $user->id)->count();
        $losses      = $gamesPlayed - $wins;
        $winRate     = $gamesPlayed > 0 ? round(($wins / $gamesPlayed) * 100) : 0;
        $avgTurns    = $gamesPlayed > 0 ? round($games->avg('current_turn')) : 0;

        // Current streak
        $recentGames = Game::where(function ($q) use ($user) {
            $q->where('player1_id', $user->id)->orWhere('player2_id', $user->id);
        })->where('status', 'finished')->orderByDesc('updated_at')->take(20)->get();

        $streak     = 0;
        $streakType = null;
        foreach ($recentGames as $g) {
            $won = $g->winner_id === $user->id;
            if ($streakType === null) {
                $streakType = $won ? 'win' : 'loss';
                $streak     = 1;
            } elseif (($streakType === 'win') === $won) {
                $streak++;
            } else {
                break;
            }
        }

        $totalCardsPlayed = (int) CardStat::where('user_id', $user->id)->sum('play_count');

        $topCards = CardStat::where('card_stats.user_id', $user->id)
            ->join('cards', 'cards.id', '=', 'card_stats.card_id')
            ->select('cards.name', 'cards.hero_class', 'cards.rarity', 'cards.card_type', 'card_stats.play_count')
            ->orderByDesc('card_stats.play_count')
            ->take(5)
            ->get();

        $classBreakdown = CardStat::where('card_stats.user_id', $user->id)
            ->join('cards', 'cards.id', '=', 'card_stats.card_id')
            ->selectRaw('cards.hero_class, SUM(card_stats.play_count) as total')
            ->groupBy('cards.hero_class')
            ->orderByDesc('total')
            ->get();

        $recentGamesFull = Game::where(function ($q) use ($user) {
            $q->where('player1_id', $user->id)->orWhere('player2_id', $user->id);
        })
            ->where('status', 'finished')
            ->with(['player1:id,name', 'player2:id,name'])
            ->orderByDesc('updated_at')
            ->take(10)
            ->get()
            ->map(function ($g) use ($user) {
                $opponent = $g->player1_id === $user->id ? $g->player2 : $g->player1;
                return [
                    'id'        => $g->id,
                    'won'       => $g->winner_id === $user->id,
                    'opponent'  => $opponent?->name ?? 'Unknown',
                    'turns'     => $g->current_turn,
                    'played_at' => $g->updated_at,
                ];
            });

        return response()->json([
            'games_played'       => $gamesPlayed,
            'wins'               => $wins,
            'losses'             => $losses,
            'win_rate'           => $winRate,
            'avg_turns'          => $avgTurns,
            'streak'             => $streak,
            'streak_type'        => $streakType,
            'total_cards_played' => $totalCardsPlayed,
            'top_cards'          => $topCards,
            'class_breakdown'    => $classBreakdown,
            'recent_games'       => $recentGamesFull,
        ]);
    }
}
