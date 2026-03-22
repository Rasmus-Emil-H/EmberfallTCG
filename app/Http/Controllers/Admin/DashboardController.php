<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Card;
use App\Models\Game;
use App\Models\Pack;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        return response()->json([
            'total_users'      => User::count(),
            'total_cards'      => Card::count(),
            'total_games'      => Game::count(),
            'active_games'     => Game::where('status', 'active')->count(),
            'total_packs'      => Pack::count(),
            'gold_in_economy'  => (int) User::sum('gold'),
            'recent_users'     => User::with('roles')
                ->latest()->take(5)
                ->get(['id','name','email','gold','rank_points','created_at'])
                ->map(fn($u) => array_merge($u->toArray(), ['roles' => $u->roles->pluck('name')])),
            'recent_games'     => Game::with(['player1:id,name','player2:id,name','winner:id,name'])
                ->latest()->take(5)->get(),
        ]);
    }
}
