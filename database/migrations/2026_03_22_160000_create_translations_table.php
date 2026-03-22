<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 10);
            $table->string('group', 100)->default('app');
            $table->string('key', 200);
            $table->text('value');
            $table->timestamps();
            $table->unique(['locale', 'group', 'key']);
        });

        // Seed from existing lang files
        $locales = ['en', 'da'];
        $rows = [];
        $now = now();

        foreach ($locales as $locale) {
            $file = base_path("lang/{$locale}/app.php");
            if (!file_exists($file)) continue;
            $translations = require $file;
            foreach ($translations as $key => $value) {
                $rows[] = [
                    'locale'     => $locale,
                    'group'      => 'app',
                    'key'        => $key,
                    'value'      => $value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($rows) {
            DB::table('translations')->insert($rows);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('translations');
    }
};
