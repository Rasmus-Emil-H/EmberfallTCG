<?php

namespace App\Translation;

use Illuminate\Translation\FileLoader;
use App\Models\Translation;
use Illuminate\Support\Facades\Schema;

class DatabaseLoader extends FileLoader
{
    public function load($locale, $group, $namespace = null): array
    {
        // Fall back to file loader for vendor/namespaced groups
        if ($namespace && $namespace !== '*') {
            return parent::load($locale, $group, $namespace);
        }

        // Only intercept our app group
        if (!$this->tableExists()) {
            return parent::load($locale, $group, $namespace);
        }

        return Translation::loadGroup($locale, $group);
    }

    private function tableExists(): bool
    {
        try {
            return Schema::hasTable('translations');
        } catch (\Exception) {
            return false;
        }
    }
}
