<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\DeckController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\PackController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\StatsController;
use Illuminate\Support\Facades\Route;

// Auth routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Stats
    Route::get('/stats', [StatsController::class, 'index']);

    // Cards
    Route::get('/cards', [CardController::class, 'index']);
    Route::get('/cards/mine', [CardController::class, 'userCards']);

    // Packs
    Route::get('/packs', [PackController::class, 'index']);
    Route::post('/packs/{pack}/open', [PackController::class, 'open']);

    // Shop
    Route::get('/shop', [ShopController::class, 'index']);
    Route::post('/shop/gold', [ShopController::class, 'buyGold']);

    // Decks
    Route::get('/decks', [DeckController::class, 'index']);
    Route::post('/decks', [DeckController::class, 'store']);
    Route::get('/decks/{deck}', [DeckController::class, 'show']);
    Route::put('/decks/{deck}', [DeckController::class, 'update']);
    Route::delete('/decks/{deck}', [DeckController::class, 'destroy']);

    // Game
    Route::post('/game/queue', [GameController::class, 'joinQueue']);
    Route::get('/game/{game}', [GameController::class, 'getGame']);
    Route::post('/game/{game}/play-card', [GameController::class, 'playCard']);
    Route::post('/game/{game}/attack', [GameController::class, 'attack']);
    Route::post('/game/{game}/end-turn', [GameController::class, 'endTurn']);
    Route::post('/game/{game}/surrender', [GameController::class, 'surrender']);
});
