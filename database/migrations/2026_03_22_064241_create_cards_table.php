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
        Schema::create('cards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('mana_cost')->default(0);
            $table->integer('attack')->nullable();
            $table->integer('health')->nullable();
            $table->enum('card_type', ['minion', 'spell', 'weapon'])->default('minion');
            $table->enum('rarity', ['common', 'rare', 'epic', 'legendary'])->default('common');
            $table->string('hero_class')->default('neutral');
            $table->text('flavor_text')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
