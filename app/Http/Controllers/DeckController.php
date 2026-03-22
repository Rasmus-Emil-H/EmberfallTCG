<?php

namespace App\Http\Controllers;

use App\Models\Deck;
use App\Models\DeckCard;
use Illuminate\Http\Request;

class DeckController extends Controller
{
    public function index(Request $request)
    {
        $decks = Deck::where('user_id', $request->user()->id)
            ->with(['cards' => function ($q) {
                $q->withPivot('quantity');
            }])
            ->get();

        return response()->json($decks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'hero_class' => 'required|string',
            'cards' => 'sometimes|array',
            'cards.*.card_id' => 'required_with:cards|integer|exists:cards,id',
            'cards.*.quantity' => 'required_with:cards|integer|min:1|max:2',
        ]);

        $deck = Deck::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'hero_class' => $request->hero_class,
        ]);

        if ($request->has('cards')) {
            foreach ($request->cards as $cardData) {
                DeckCard::create([
                    'deck_id' => $deck->id,
                    'card_id' => $cardData['card_id'],
                    'quantity' => $cardData['quantity'] ?? 1,
                ]);
            }
        }

        $deck->load(['cards' => function ($q) {
            $q->withPivot('quantity');
        }]);

        return response()->json($deck, 201);
    }

    public function show(Request $request, Deck $deck)
    {
        if ($deck->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $deck->load(['cards' => function ($q) {
            $q->withPivot('quantity');
        }]);

        return response()->json($deck);
    }

    public function update(Request $request, Deck $deck)
    {
        if ($deck->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'hero_class' => 'sometimes|string',
            'cards' => 'sometimes|array',
            'cards.*.card_id' => 'required_with:cards|integer|exists:cards,id',
            'cards.*.quantity' => 'required_with:cards|integer|min:1|max:2',
        ]);

        $deck->update($request->only(['name', 'hero_class']));

        if ($request->has('cards')) {
            // Replace all cards
            DeckCard::where('deck_id', $deck->id)->delete();

            foreach ($request->cards as $cardData) {
                DeckCard::create([
                    'deck_id' => $deck->id,
                    'card_id' => $cardData['card_id'],
                    'quantity' => $cardData['quantity'] ?? 1,
                ]);
            }
        }

        $deck->load(['cards' => function ($q) {
            $q->withPivot('quantity');
        }]);

        return response()->json($deck);
    }

    public function destroy(Request $request, Deck $deck)
    {
        if ($deck->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $deck->delete();

        return response()->json(['message' => 'Deck deleted successfully']);
    }
}
