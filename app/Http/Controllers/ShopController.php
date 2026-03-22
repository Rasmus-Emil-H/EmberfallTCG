<?php

namespace App\Http\Controllers;

use App\Models\Pack;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index()
    {
        $packs = Pack::all();
        return response()->json($packs);
    }

    public function buyGold(Request $request)
    {
        $user = $request->user();

        if ($user->free_gold_claimed_at !== null) {
            return response()->json(['error' => 'Free gold already claimed.'], 422);
        }

        $user->update([
            'gold'               => $user->gold + 500,
            'free_gold_claimed_at' => now(),
        ]);

        return response()->json([
            'message' => 'You received 500 gold!',
            'gold'    => $user->gold,
        ]);
    }

}
