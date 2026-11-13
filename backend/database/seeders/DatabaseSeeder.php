<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Safe to run on every deploy: seeds only an empty database, never duplicates or overwrites real orders.
        if (DB::table('products')->exists()) {
            $this->command?->info('Products already exist, skipping seed.');

            return;
        }

        DB::transaction(function () {
            $this->call([CatalogSeeder::class, HomepageSeeder::class]);
        });
    }
}
