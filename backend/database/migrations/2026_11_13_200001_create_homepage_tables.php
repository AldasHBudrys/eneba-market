<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Homepage = an ordered list of blocks; each block type reads its own source (banners table, deals table, best sellers query).
return new class extends Migration
{
    public function up(): void
    {
        // Which blocks the homepage shows and in what order. Reorder/remove rows here → homepage changes without a deploy.
        Schema::create('home_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // banners | deals | bestsellers
            $table->string('title')->nullable();
            $table->unsignedSmallInteger('position');
        });

        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('image_url');
            $table->string('link_url'); // frontend route, e.g. /product/elden-ring-steam-global
            $table->unsignedSmallInteger('position');
        });

        // Curated time-limited deals with a countdown (like Eneba's "Ends in" widget).
        Schema::create('deals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamp('ends_at');
            $table->unsignedSmallInteger('position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deals');
        Schema::dropIfExists('banners');
        Schema::dropIfExists('home_blocks');
    }
};
