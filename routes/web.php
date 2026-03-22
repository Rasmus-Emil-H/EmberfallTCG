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

// QuickPay redirects back to the SPA with a hash so JS can show a toast
Route::get('/payment/success', fn() => redirect('/#shop?payment=success'));
Route::get('/payment/cancel',  fn() => redirect('/#shop?payment=cancel'));

Route::get('/{any?}', [PageController::class, 'index'])
    ->where('any', '^(?!api).*$');
