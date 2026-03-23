<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('hero_classes', function (Blueprint $table) {
            $table->string('image')->nullable()->after('gradient');
        });
    }

    public function down(): void
    {
        Schema::table('hero_classes', function (Blueprint $table) {
            $table->dropColumn('image');
        });
    }
};
