<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('order_id')->unique();          // our internal order id
            $table->integer('quickpay_payment_id')->nullable();
            $table->string('package_id');                  // small / medium / large / mega
            $table->integer('amount_ore');                 // price in Danish øre
            $table->integer('gold_amount');                // gold to credit
            $table->string('status')->default('pending'); // pending / accepted / rejected
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });

        // Seed new translation keys for both locales
        $now = now();
        $keys = [
            'en' => [
                'shop_buy_gold'              => 'Buy Gold',
                'shop_gold_packages'         => 'Gold Packages',
                'shop_gold_packages_desc'    => 'Top up your treasury — fair prices, instant delivery',
                'shop_free_claimed'          => '✓ Already claimed',
                'shop_pkg_bonus'             => 'bonus',
                'shop_payment_processing'    => 'Redirecting to payment…',
                'shop_payment_success'       => '🎉 Payment successful! Gold has been added to your account.',
                'shop_payment_cancel'        => 'Payment was cancelled.',
                'shop_gold_added'            => 'Gold added to your account!',
            ],
            'da' => [
                'shop_buy_gold'              => 'Køb Guld',
                'shop_gold_packages'         => 'Guldpakker',
                'shop_gold_packages_desc'    => 'Fyld statskassen op — fair priser, øjeblikkelig levering',
                'shop_free_claimed'          => '✓ Allerede hentet',
                'shop_pkg_bonus'             => 'bonus',
                'shop_payment_processing'    => 'Viderestiller til betaling…',
                'shop_payment_success'       => '🎉 Betaling gennemført! Guld er tilføjet din konto.',
                'shop_payment_cancel'        => 'Betalingen blev annulleret.',
                'shop_gold_added'            => 'Guld tilføjet til din konto!',
            ],
        ];

        $rows = [];
        foreach ($keys as $locale => $translations) {
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
        DB::table('translations')->insertOrIgnore($rows);

        // Bust translation cache
        foreach (['en', 'da'] as $locale) {
            \Illuminate\Support\Facades\Cache::forget("translations.{$locale}.app");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
