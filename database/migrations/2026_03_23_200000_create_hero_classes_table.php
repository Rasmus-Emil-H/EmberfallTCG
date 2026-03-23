<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_classes', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->string('emoji')->default('⭐');
            $table->string('gradient')->default('linear-gradient(160deg,#1f2937,#374151)');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        DB::table('hero_classes')->insert([
            ['key'=>'warrior',     'name'=>'Warrior',     'emoji'=>'⚔️',  'gradient'=>'linear-gradient(160deg,#7f1d1d,#b45309)', 'description'=>'Masters of steel and fury, warriors charge headfirst into battle.',        'sort_order'=>1],
            ['key'=>'mage',        'name'=>'Mage',        'emoji'=>'🔮',  'gradient'=>'linear-gradient(160deg,#1e3a5f,#4c1d95)', 'description'=>'Wielders of arcane power who bend reality with spells and illusions.',      'sort_order'=>2],
            ['key'=>'ranger',      'name'=>'Ranger',      'emoji'=>'🏹',  'gradient'=>'linear-gradient(160deg,#14532d,#065f46)', 'description'=>'Swift hunters of the wild who command beasts and strike from the shadows.',  'sort_order'=>3],
            ['key'=>'paladin',     'name'=>'Paladin',     'emoji'=>'🛡️', 'gradient'=>'linear-gradient(160deg,#78350f,#92400e)', 'description'=>'Holy warriors whose faith manifests as divine shields and radiant light.',  'sort_order'=>4],
            ['key'=>'druid',       'name'=>'Druid',       'emoji'=>'🌿',  'gradient'=>'linear-gradient(160deg,#14532d,#1a2e05)', 'description'=>'Guardians of nature who command the ancient forest and its creatures.',     'sort_order'=>5],
            ['key'=>'necromancer', 'name'=>'Necromancer', 'emoji'=>'💀',  'gradient'=>'linear-gradient(160deg,#1a0533,#0f0f1a)', 'description'=>'Dark masters who raise the fallen and turn death into an endless resource.', 'sort_order'=>6],
            ['key'=>'shaman',      'name'=>'Shaman',      'emoji'=>'⚡',  'gradient'=>'linear-gradient(160deg,#0c2a4a,#0d4a3a)', 'description'=>'Spiritual conduits who channel the raw power of the elements.',             'sort_order'=>7],
            ['key'=>'rogue',       'name'=>'Rogue',       'emoji'=>'🗡️', 'gradient'=>'linear-gradient(160deg,#111827,#1c2a1c)', 'description'=>'Deadly assassins who strike from the shadows with precision and cunning.',   'sort_order'=>8],
            ['key'=>'priest',      'name'=>'Priest',      'emoji'=>'✨',  'gradient'=>'linear-gradient(160deg,#3b2a6e,#7c5c14)', 'description'=>'Servants of the light who heal allies and smite enemies with holy power.',  'sort_order'=>9],
            ['key'=>'warlock',     'name'=>'Warlock',     'emoji'=>'🔥',  'gradient'=>'linear-gradient(160deg,#450a0a,#4c0519)', 'description'=>'Pact-makers who trade their own wellbeing for immense demonic power.',      'sort_order'=>10],
            ['key'=>'neutral',     'name'=>'Neutral',     'emoji'=>'⭐',  'gradient'=>'linear-gradient(160deg,#1f2937,#374151)', 'description'=>'Cards usable by any class — mercenaries, monsters, and wanderers.',        'sort_order'=>11],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_classes');
    }
};
