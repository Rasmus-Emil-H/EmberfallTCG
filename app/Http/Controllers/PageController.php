<?php
namespace App\Http\Controllers;
use App\Models\Card;
use App\Models\Pack;
use App\Services\RankService;

class PageController extends Controller
{
    public function index()
    {
        $packs = Pack::orderBy('price')->get();

        $emojiMap = ['warrior'=>'⚔️','mage'=>'🔮','ranger'=>'🏹','paladin'=>'🛡️','druid'=>'🌿','neutral'=>'⭐'];
        $heroClasses = Card::distinct()->pluck('hero_class')
            ->sort()->values()
            ->map(fn($k) => ['key' => $k, 'emoji' => $emojiMap[$k] ?? '⭐']);

        $rarityOrder = ['common'=>0,'rare'=>1,'epic'=>2,'legendary'=>3];
        $rarities = Card::distinct()->pluck('rarity')
            ->sortBy(fn($r) => $rarityOrder[$r] ?? 99)->values();

        $rankTiers = collect(RankService::TIERS)->reverse()->values();

        return view('app', compact('packs', 'heroClasses', 'rarities', 'rankTiers'));
    }
}
