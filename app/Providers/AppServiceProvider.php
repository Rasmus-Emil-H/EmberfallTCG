<?php

namespace App\Providers;

use App\Translation\DatabaseLoader;
use Illuminate\Support\ServiceProvider;
use Illuminate\Translation\FileLoader;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->extend('translation.loader', function (FileLoader $original, $app) {
            return new DatabaseLoader($app['files'], $app['path.lang']);
        });
    }

    public function boot(): void
    {
        //
    }
}
