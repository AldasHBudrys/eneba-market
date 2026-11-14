<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/** A known account for graders (credentials are in the README). Safe to run on every deploy: updates instead of duplicating. */
class DemoUserSeeder extends Seeder
{
    public const EMAIL = 'demo@eneba-market.test';

    public const PASSWORD = 'demo12345'; // demo-only account, never a real password

    public function run(): void
    {
        User::updateOrCreate(['email' => self::EMAIL], ['name' => 'Demo Buyer', 'password' => self::PASSWORD]);
    }
}
