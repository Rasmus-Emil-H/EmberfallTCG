<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\HeroClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HeroClassAdminController extends Controller
{
    public function index()
    {
        $classes = HeroClass::orderBy('sort_order')->orderBy('name')->get();

        $counts = Card::groupBy('hero_class')
            ->selectRaw('hero_class, count(*) as card_count')
            ->pluck('card_count', 'hero_class');

        return response()->json($classes->map(fn($c) => array_merge(
            $c->toArray(),
            [
                'card_count' => $counts[$c->key] ?? 0,
                'image_url'  => $c->image ? Storage::url($c->image) : null,
            ]
        )));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'key'         => 'required|string|max:50|unique:hero_classes,key|regex:/^[a-z0-9_]+$/',
            'name'        => 'required|string|max:100',
            'emoji'       => 'required|string|max:10',
            'gradient'    => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $class = HeroClass::create($data);
        return response()->json(array_merge($class->toArray(), ['image_url' => null]), 201);
    }

    public function update(Request $request, HeroClass $heroClass)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'emoji'       => 'sometimes|string|max:10',
            'gradient'    => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'nullable|integer|min:0',
        ]);

        $heroClass->update($data);
        $heroClass->refresh();
        return response()->json(array_merge(
            $heroClass->toArray(),
            ['image_url' => $heroClass->image ? Storage::url($heroClass->image) : null]
        ));
    }

    public function uploadImage(Request $request, HeroClass $heroClass)
    {
        $request->validate(['image' => 'required|image|max:2048']);

        // Delete old image if exists
        if ($heroClass->image) {
            Storage::disk('public')->delete($heroClass->image);
        }

        $path = $request->file('image')->store("classes", 'public');
        $heroClass->update(['image' => $path]);

        return response()->json(['image_url' => Storage::url($path)]);
    }

    public function destroy(HeroClass $heroClass)
    {
        $cardCount = Card::where('hero_class', $heroClass->key)->count();
        if ($cardCount > 0) {
            return response()->json([
                'error' => "Cannot delete: {$cardCount} card(s) still use this class.",
            ], 422);
        }

        if ($heroClass->image) {
            Storage::disk('public')->delete($heroClass->image);
        }

        $heroClass->delete();
        return response()->json(['message' => 'Class deleted']);
    }
}
