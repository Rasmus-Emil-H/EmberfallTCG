<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        $locale = Session::get('locale', config('app.locale', 'en'));
        // Only allow supported locales
        if (!in_array($locale, ['en', 'da'])) {
            $locale = 'en';
        }
        App::setLocale($locale);
        return $next($request);
    }
}
