<?php

use App\Http\Controllers\Admin\CardAdminController;
use App\Http\Controllers\Admin\HeroClassAdminController;
use App\Http\Controllers\ChallengeController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\QuickPayController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PackAdminController;
use App\Http\Controllers\Admin\TranslationAdminController;
use App\Http\Controllers\Admin\UserAdminController;
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

// QuickPay webhook (no auth — called by QuickPay servers)
Route::post('/quickpay/callback', [QuickPayController::class, 'callback']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Stats
    Route::get('/stats', [StatsController::class, 'index']);

    // Friends
    Route::get('/friends',                     [FriendController::class, 'index']);
    Route::get('/friends/search',              [FriendController::class, 'search']);
    Route::post('/friends',                    [FriendController::class, 'store']);
    Route::put('/friends/{friendship}',        [FriendController::class, 'update']);
    Route::delete('/friends/{friend}',         [FriendController::class, 'destroy']);

    // Challenges
    Route::get('/challenges',                          [ChallengeController::class, 'index']);
    Route::post('/challenges',                         [ChallengeController::class, 'store']);
    Route::post('/challenges/{challenge}/accept',      [ChallengeController::class, 'accept']);
    Route::post('/challenges/{challenge}/decline',     [ChallengeController::class, 'decline']);

    // Cards
    Route::get('/cards', [CardController::class, 'index']);
    Route::get('/cards/mine', [CardController::class, 'userCards']);

    // Packs
    Route::get('/packs', [PackController::class, 'index']);
    Route::post('/packs/{pack}/open', [PackController::class, 'open']);

    // Shop
    Route::get('/shop', [ShopController::class, 'index']);
    Route::post('/shop/gold', [ShopController::class, 'buyGold']);
    Route::post('/shop/purchase', [QuickPayController::class, 'createPayment']);

    // Decks
    Route::get('/decks', [DeckController::class, 'index']);
    Route::post('/decks', [DeckController::class, 'store']);
    Route::get('/decks/{deck}', [DeckController::class, 'show']);
    Route::put('/decks/{deck}', [DeckController::class, 'update']);
    Route::delete('/decks/{deck}', [DeckController::class, 'destroy']);

    // Admin
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard',      [DashboardController::class,  'index']);
        Route::get('/cards',          [CardAdminController::class,  'index']);
        Route::post('/cards',         [CardAdminController::class,  'store']);
        Route::put('/cards/{card}',   [CardAdminController::class,  'update']);
        Route::delete('/cards/{card}',[CardAdminController::class,  'destroy']);
        Route::get('/users',          [UserAdminController::class,  'index']);
        Route::put('/users/{user}',   [UserAdminController::class,  'update']);
        Route::delete('/users/{user}',[UserAdminController::class,  'destroy']);
        Route::get('/packs',          [PackAdminController::class,  'index']);
        Route::post('/packs',         [PackAdminController::class,  'store']);
        Route::put('/packs/{pack}',   [PackAdminController::class,  'update']);
        Route::delete('/packs/{pack}',[PackAdminController::class,  'destroy']);

        Route::get('/classes',                          [HeroClassAdminController::class, 'index']);
        Route::post('/classes',                         [HeroClassAdminController::class, 'store']);
        Route::put('/classes/{heroClass}',              [HeroClassAdminController::class, 'update']);
        Route::delete('/classes/{heroClass}',           [HeroClassAdminController::class, 'destroy']);
        Route::post('/classes/{heroClass}/image',       [HeroClassAdminController::class, 'uploadImage']);

        Route::get('/translations/locales',               [TranslationAdminController::class, 'locales']);
        Route::get('/translations',                       [TranslationAdminController::class, 'index']);
        Route::post('/translations',                      [TranslationAdminController::class, 'store']);
        Route::put('/translations/{translation}',         [TranslationAdminController::class, 'update']);
        Route::delete('/translations/{translation}',      [TranslationAdminController::class, 'destroy']);
    });

    // Game
    Route::post('/game/queue', [GameController::class, 'joinQueue']);
    Route::get('/game/{game}', [GameController::class, 'getGame']);
    Route::post('/game/{game}/play-card', [GameController::class, 'playCard']);
    Route::post('/game/{game}/attack', [GameController::class, 'attack']);
    Route::post('/game/{game}/end-turn', [GameController::class, 'endTurn']);
    Route::post('/game/{game}/surrender', [GameController::class, 'surrender']);
});
