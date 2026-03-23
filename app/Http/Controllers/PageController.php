<?php
namespace App\Http\Controllers;
use App\Models\Card;
use App\Models\HeroClass;
use App\Models\Pack;
use App\Services\RankService;

class PageController extends Controller
{
    public function index()
    {
        $packs = Pack::orderBy('price')->get();

        $heroClasses = HeroClass::orderBy('sort_order')->orderBy('name')
            ->get(['key', 'name', 'emoji', 'gradient', 'image'])
            ->map(fn($c) => [
                'key'      => $c->key,
                'name'     => $c->name,
                'emoji'    => $c->emoji,
                'gradient' => $c->gradient,
                'image'    => $c->image ? \Illuminate\Support\Facades\Storage::url($c->image) : null,
            ]);

        $rarityOrder = ['common'=>0,'rare'=>1,'epic'=>2,'legendary'=>3];
        $rarities = Card::distinct()->pluck('rarity')
            ->sortBy(fn($r) => $rarityOrder[$r] ?? 99)->values();

        $rankTiers = collect(RankService::TIERS)->reverse()->values();

        $locale = app()->getLocale();

        return view('app', compact('packs', 'heroClasses', 'rarities', 'rankTiers', 'locale'));
    }
}
