<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Data change: homepage banners get Steam's wide "hero" art (no logo text on it) instead of text placeholders.
// A migration so the live database updates on deploy; every URL was checked to return a JPEG.
return new class extends Migration
{
    // banner title => [Steam app id, text the old placeholder showed]
    private const BANNERS = [
        'Elden Ring' => [1245620, 'Elden Ring'],
        'Steam games' => [1091500, 'Steam games'],      // Cyberpunk 2077 as the face of the Steam banner
        'Nintendo eShop' => [367520, 'Nintendo'],       // Hollow Knight, which we also sell on Nintendo
    ];

    public function up(): void
    {
        foreach (self::BANNERS as $title => [$appId]) {
            DB::table('banners')->where('title', $title)
                ->update(['image_url' => "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/$appId/library_hero.jpg"]);
        }
    }

    public function down(): void
    {
        foreach (self::BANNERS as $title => [, $text]) {
            DB::table('banners')->where('title', $title)
                ->update(['image_url' => 'https://placehold.co/1200x400/4618ac/fad318/png?font=montserrat&text='.rawurlencode($text)]);
        }
    }
};
