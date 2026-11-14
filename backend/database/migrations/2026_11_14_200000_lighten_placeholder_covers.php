<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Data fix: placeholder covers used the card color (#1f0a4d), so covers blended into the card.
// A migration (not a re-seed) because it also has to update the live database, which runs migrations on deploy.
return new class extends Migration
{
    public function up(): void
    {
        DB::update("update products set image_url = replace(image_url, '/1f0a4d/', '/351183/')");
    }

    public function down(): void
    {
        DB::update("update products set image_url = replace(image_url, '/351183/', '/1f0a4d/')");
    }
};
