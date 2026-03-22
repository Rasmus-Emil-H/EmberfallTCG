<?php

namespace Database\Seeders;

use App\Models\Pack;
use Illuminate\Database\Seeder;

class PackSeeder extends Seeder
{
    public function run(): void
    {
        $packs = [
            [
                'name' => 'Realm Wars Starter Pack',
                'price' => 100,
                'card_count' => 5,
                'set_name' => 'realm_wars_core',
            ],
            [
                'name' => 'Arcane Collection',
                'price' => 200,
                'card_count' => 5,
                'set_name' => 'arcane_collection',
            ],
            [
                'name' => 'Legendary Trove',
                'price' => 400,
                'card_count' => 5,
                'set_name' => 'legendary_trove',
            ],
        ];

        foreach ($packs as $packData) {
            Pack::updateOrCreate(['name' => $packData['name']], $packData);
        }
    }
}
