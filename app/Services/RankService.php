<?php

namespace App\Services;

use App\Models\User;

class RankService
{
    const TIERS = [
        ['name' => 'Bronze',   'floor' => 0,   'emoji' => '🥉', 'color' => '#cd7f32', 'star_loss' => false],
        ['name' => 'Silver',   'floor' => 30,  'emoji' => '🥈', 'color' => '#c0c0c0', 'star_loss' => false],
        ['name' => 'Gold',     'floor' => 60,  'emoji' => '🥇', 'color' => '#ffd700', 'star_loss' => true],
        ['name' => 'Platinum', 'floor' => 90,  'emoji' => '💠', 'color' => '#40e0d0', 'star_loss' => true],
        ['name' => 'Diamond',  'floor' => 120, 'emoji' => '💎', 'color' => '#b9f2ff', 'star_loss' => true],
        ['name' => 'Legend',   'floor' => 150, 'emoji' => '👑', 'color' => '#ff8c00', 'star_loss' => false],
    ];

    /**
     * Return a display-ready rank array for a given points value.
     */
    public function getRankDisplay(int $points): array
    {
        if ($points >= 150) {
            return [
                'tier'        => 'Legend',
                'rank'        => null,
                'stars'       => null,
                'stars_total' => 3,
                'emoji'       => '👑',
                'color'       => '#ff8c00',
                'label'       => 'Legend',
                'points'      => $points,
            ];
        }

        $tierData  = self::TIERS[0];
        $tierIndex = 0;
        foreach (self::TIERS as $i => $t) {
            if ($points >= $t['floor']) {
                $tierData  = $t;
                $tierIndex = $i;
            }
        }

        $local   = $points - $tierData['floor'];   // 0–29
        $rankNum = 10 - intdiv($local, 3);          // 10 → 1
        $stars   = $local % 3;                      // 0, 1, 2

        return [
            'tier'        => $tierData['name'],
            'rank'        => $rankNum,
            'stars'       => $stars,
            'stars_total' => 3,
            'emoji'       => $tierData['emoji'],
            'color'       => $tierData['color'],
            'label'       => $tierData['name'] . ' ' . $rankNum,
            'points'      => $points,
        ];
    }

    /**
     * Award rank changes after a game. Call with winner + loser User models.
     */
    public function awardGame(User $winner, User $loser): void
    {
        // --- Winner ---
        $winner->win_streak = ($winner->win_streak ?? 0) + 1;
        $starsGained        = $winner->win_streak >= 3 ? 2 : 1;  // streak bonus
        $winner->rank_points = ($winner->rank_points ?? 0) + $starsGained;
        $winner->save();

        // --- Loser ---
        $loser->win_streak = 0;
        $loserPoints       = $loser->rank_points ?? 0;

        // Star loss only at Gold and above, never demotes below tier floor
        $tierFloor = $this->tierFloor($loserPoints);
        if ($tierFloor >= 60 && $loserPoints > $tierFloor) {
            $loser->rank_points = $loserPoints - 1;
        }
        $loser->save();
    }

    private function tierFloor(int $points): int
    {
        $floor = 0;
        foreach (self::TIERS as $t) {
            if ($points >= $t['floor']) {
                $floor = $t['floor'];
            }
        }
        return $floor;
    }
}
