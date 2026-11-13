<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// The catalog: what is for sale (products), who sells it (sellers + offers), and the stock (game keys).
return new class extends Migration
{
    public function up(): void
    {
        // Typo-tolerant search (Day 2) compares trigrams: "wichter" and "witcher" share most 3-letter chunks.
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        Schema::create('platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
        });

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
        });

        // One row per sellable edition, like Eneba: "Witcher 3 / Steam / Global" and "Witcher 3 / Xbox / Europe" are separate products.
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('image_url');
            $table->foreignId('platform_id')->index()->constrained();
            $table->foreignId('region_id')->index()->constrained();
            $table->string('genre');
            $table->date('release_date');
            $table->unsignedInteger('rrp_cents'); // recommended retail price: the strikethrough "From €49.99"
            $table->unsignedInteger('popularity')->default(0); // drives "Most popular" sort and best sellers
            $table->timestamps();
        });
        DB::statement('CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops)');

        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('rating', 4, 2); // 0.00–10.00, shown as "9.91 Superb"
        });

        // A seller's price for a product. Stock is not a column: it's the count of unsold game_keys, so it can't drift.
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained();
            $table->unsignedInteger('price_cents');
            $table->timestamps();
            $table->unique(['product_id', 'seller_id']);
        });

        // The digital keys a seller has uploaded. Day 3 adds order_item_id: NULL = unsold.
        Schema::create('game_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->index()->constrained()->cascadeOnDelete();
            $table->string('code')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_keys');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('sellers');
        Schema::dropIfExists('products');
        Schema::dropIfExists('regions');
        Schema::dropIfExists('platforms');
    }
};
