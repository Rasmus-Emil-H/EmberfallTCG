<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Translation extends Model
{
    protected $fillable = ['locale', 'group', 'key', 'value'];

    public static function clearCache(string $locale, string $group = 'app'): void
    {
        Cache::forget("translations.{$locale}.{$group}");
    }

    public static function loadGroup(string $locale, string $group = 'app'): array
    {
        return Cache::rememberForever("translations.{$locale}.{$group}", function () use ($locale, $group) {
            return static::where('locale', $locale)
                ->where('group', $group)
                ->pluck('value', 'key')
                ->all();
        });
    }
}
