<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'test@test.com'],
            [
                'name' => 'Test Player',
                'email' => 'test@test.com',
                'password' => Hash::make('password'),
                'gold' => 5000,
            ]
        );
    }
}
