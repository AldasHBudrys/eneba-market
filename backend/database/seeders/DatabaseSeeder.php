<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    // Runs on every deploy (Dockerfile), so every part must be safe to repeat.
    public function run(): void
    {
        $this->call(DemoUserSeeder::class); // update-or-create: never duplicates

        // The catalog only seeds an empty database, so it never duplicates or overwrites real orders.
        if (DB::table('products')->exists()) {
            $this->command?->info('Products already exist, skipping catalog seed.');

            return;
        }

        DB::transaction(function () {
            $this->call([CatalogSeeder::class, HomepageSeeder::class]);
        });
    }
}
