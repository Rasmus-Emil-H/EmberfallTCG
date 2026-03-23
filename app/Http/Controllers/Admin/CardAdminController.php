<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\HeroClass;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CardAdminController extends Controller
{
    public function index()
    {
        return response()->json(Card::orderBy('hero_class')->orderBy('mana_cost')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
            'mana_cost'   => 'required|integer|min:0|max:20',
            'attack'      => 'nullable|integer|min:0',
            'health'      => 'nullable|integer|min:1',
            'card_type'   => 'required|in:minion,spell,weapon',
            'rarity'      => 'required|in:common,rare,epic,legendary',
            'hero_class'  => ['required', Rule::in(HeroClass::pluck('key')->all())],
            'flavor_text' => 'nullable|string',
        ]);

        $card = Card::create($data);
        return response()->json($card, 201);
    }

    public function update(Request $request, Card $card)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'mana_cost'   => 'sometimes|integer|min:0|max:20',
            'attack'      => 'nullable|integer|min:0',
            'health'      => 'nullable|integer|min:1',
            'card_type'   => 'sometimes|in:minion,spell,weapon',
            'rarity'      => 'sometimes|in:common,rare,epic,legendary',
            'hero_class'  => ['sometimes', Rule::in(HeroClass::pluck('key')->all())],
            'flavor_text' => 'nullable|string',
        ]);

        $card->update($data);
        return response()->json($card);
    }

    public function destroy(Card $card)
    {
        $card->delete();
        return response()->json(['message' => 'Card deleted']);
    }
}
