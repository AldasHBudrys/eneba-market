<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Orders. Payment is a single step, so only paid orders ever exist (no status column).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index()->constrained();
            $table->unsignedInteger('total_cents');
            $table->timestamps();
        });

        // One row per key bought: 2× the same offer = 2 rows. price_cents is the price at purchase time.
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->index()->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->constrained();
            $table->unsignedInteger('price_cents');
            $table->timestamps();
        });

        // NULL = unsold. Unique: a key can belong to at most one order item, so it can never be sold twice.
        Schema::table('game_keys', function (Blueprint $table) {
            $table->foreignId('order_item_id')->nullable()->unique()->constrained();
        });
    }

    public function down(): void
    {
        Schema::table('game_keys', fn (Blueprint $table) => $table->dropConstrainedForeignId('order_item_id'));
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
