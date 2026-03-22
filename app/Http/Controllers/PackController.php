<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Pack;
use App\Models\PackOpening;
use App\Models\UserCard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PackController extends Controller
{
    public function index()
    {
        $packs = Pack::all();
        return response()->json($packs);
    }

    public function open(Request $request, Pack $pack)
    {
        $user = $request->user();

        if ($user->gold < $pack->price) {
            return response()->json(['error' => 'Insufficient gold. You need ' . $pack->price . ' gold but only have ' . $user->gold . '.'], 422);
        }

        // Deduct gold
        $user->decrement('gold', $pack->price);
        $user->refresh();

        // Determine rarity weights
        // For Legendary Trove pack, increase epic/legendary chances
        $isLegendaryPack = stripos($pack->name, 'legendary') !== false;

        if ($isLegendaryPack) {
            $rarityWeights = [
                'common' => 40,
                'rare' => 30,
                'epic' => 20,
                'legendary' => 10,
            ];
        } else {
            $rarityWeights = [
                'common' => 70,
                'rare' => 20,
                'epic' => 8,
                'legendary' => 2,
            ];
        }

        $selectedCards = [];
        $hasRare = false;

        // Pick cards based on rarity weights
        for ($i = 0; $i < $pack->card_count; $i++) {
            $rarity = $this->pickRarity($rarityWeights);
            if ($rarity === 'rare' || $rarity === 'epic' || $rarity === 'legendary') {
                $hasRare = true;
            }

            $card = Card::where('rarity', $rarity)->inRandomOrder()->first();
            if (!$card) {
                // fallback to any card
                $card = Card::inRandomOrder()->first();
            }

            $selectedCards[] = $card;
        }

        // Ensure at least 1 rare per pack
        if (!$hasRare) {
            $rareCard = Card::whereIn('rarity', ['rare', 'epic', 'legendary'])->inRandomOrder()->first();
            if ($rareCard) {
                $selectedCards[array_key_last($selectedCards)] = $rareCard;
            }
        }

        // Add cards to user's collection
        $cardIds = [];
        foreach ($selectedCards as $card) {
            $userCard = UserCard::where('user_id', $user->id)->where('card_id', $card->id)->first();
            if ($userCard) {
                $userCard->increment('quantity');
            } else {
                UserCard::create([
                    'user_id' => $user->id,
                    'card_id' => $card->id,
                    'quantity' => 1,
                ]);
            }
            $cardIds[] = $card->id;
        }

        // Record pack opening
        PackOpening::create([
            'user_id' => $user->id,
            'pack_id' => $pack->id,
            'cards_received' => $cardIds,
        ]);

        return response()->json([
            'cards' => $selectedCards,
            'gold_remaining' => $user->gold,
        ]);
    }

    private function pickRarity(array $weights): string
    {
        $total = array_sum($weights);
        $rand = rand(1, $total);
        $cumulative = 0;

        foreach ($weights as $rarity => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $rarity;
            }
        }

        return 'common';
    }
}
