<?php
use App\Http\Controllers\PageController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Session;

Route::post('/language/{locale}', function (string $locale) {
    if (in_array($locale, ['en', 'da'])) {
        Session::put('locale', $locale);
    }
    return back();
})->name('language.switch');

Route::get('/{any?}', [PageController::class, 'index'])
    ->where('any', '^(?!api).*$');
