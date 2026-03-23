<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Track when users were last active
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->after('free_gold_claimed_at');
        });

        // Friend requests / friendships
        Schema::create('friendships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('addressee_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamps();
            $table->unique(['requester_id', 'addressee_id']);
        });

        // Direct game challenges between friends
        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('challenger_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('challenged_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('game_id')->nullable()->constrained('games')->nullOnDelete();
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending');
            $table->timestamps();
        });

        // Seed translation keys
        $now = now();
        $keys = [
            'en' => [
                'nav_friends'              => 'Friends',
                'friends_title'            => 'Friends',
                'friends_subtitle'         => 'Connect and battle your allies',
                'friends_search_ph'        => 'Search players by name…',
                'friends_add'              => 'Add Friend',
                'friends_pending_sent'     => 'Request Sent',
                'friends_pending_in'       => 'Incoming Requests',
                'friends_none'             => 'No friends yet — search for players above to get started!',
                'friends_online'           => 'Online',
                'friends_challenge'        => '⚔️ Challenge',
                'friends_unfriend'         => 'Remove',
                'friends_accept'           => 'Accept',
                'friends_decline'          => 'Decline',
                'friends_challenge_sent'   => 'Challenge sent! Head to the game to wait.',
                'friends_challenge_in'     => 'Incoming Challenges',
                'friends_vs'              => 'vs',
            ],
            'da' => [
                'nav_friends'              => 'Venner',
                'friends_title'            => 'Venner',
                'friends_subtitle'         => 'Forbind og kæmp mod dine allierede',
                'friends_search_ph'        => 'Søg efter spillere ved navn…',
                'friends_add'              => 'Tilføj Ven',
                'friends_pending_sent'     => 'Anmodning Sendt',
                'friends_pending_in'       => 'Indkommende Anmodninger',
                'friends_none'             => 'Ingen venner endnu — søg efter spillere ovenfor for at komme i gang!',
                'friends_online'           => 'Online',
                'friends_challenge'        => '⚔️ Udfordring',
                'friends_unfriend'         => 'Fjern',
                'friends_accept'           => 'Accepter',
                'friends_decline'          => 'Afvis',
                'friends_challenge_sent'   => 'Udfordring sendt! Gå til spillet for at vente.',
                'friends_challenge_in'     => 'Indkommende Udfordringer',
                'friends_vs'              => 'mod',
            ],
        ];

        $rows = [];
        foreach ($keys as $locale => $translations) {
            foreach ($translations as $key => $value) {
                $rows[] = ['locale' => $locale, 'group' => 'app', 'key' => $key, 'value' => $value, 'created_at' => $now, 'updated_at' => $now];
            }
        }
        DB::table('translations')->insertOrIgnore($rows);

        foreach (['en', 'da'] as $locale) {
            \Illuminate\Support\Facades\Cache::forget("translations.{$locale}.app");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('challenges');
        Schema::dropIfExists('friendships');
        Schema::table('users', fn(Blueprint $t) => $t->dropColumn('last_seen_at'));
    }
};
