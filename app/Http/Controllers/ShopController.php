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
        $user->increment('gold', 500);
        $user->refresh();

        return response()->json([
            'message' => 'You received 500 gold!',
            'gold' => $user->gold,
            'user' => $user,
        ]);
    }
}
