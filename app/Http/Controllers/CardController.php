<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\UserCard;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function index()
    {
        $cards = Card::orderBy('hero_class')->orderBy('mana_cost')->get();
        return response()->json($cards);
    }

    public function userCards(Request $request)
    {
        $userCards = UserCard::with('card')
            ->where('user_id', $request->user()->id)
            ->get()
            ->map(function ($userCard) {
                $card = $userCard->card->toArray();
                $card['quantity'] = $userCard->quantity;
                return $card;
            });

        return response()->json($userCards);
    }
}
