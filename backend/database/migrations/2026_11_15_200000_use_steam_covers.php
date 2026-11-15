<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Data change: real game covers instead of title placeholders. A migration (not a re-seed) so the live
// database updates itself on deploy. Every app id below was checked to return the right game's 600x900 JPEG.
// Games without a Steam portrait cover (Zelda, Mario Kart, Minecraft, FC 26, FM 26) keep their placeholder.
return new class extends Migration
{
    private const STEAM_APP_IDS = [
        'The Witcher 3: Wild Hunt' => 292030,
        'Cyberpunk 2077' => 1091500,
        'Elden Ring' => 1245620,
        "Baldur's Gate 3" => 1086940,
        'Red Dead Redemption 2' => 1174180,
        'Grand Theft Auto V' => 3240220,
        'Hogwarts Legacy' => 990080,
        'Terraria' => 105600,
        'Stardew Valley' => 413150,
        'Hades' => 1145360,
        'Hollow Knight' => 367520,
        'Celeste' => 504230,
        'Farming Simulator 25' => 2300320,
        'Forza Horizon 5' => 1551360,
        "Assassin's Creed Valhalla" => 2208920,
        'Starfield' => 1716740,
        'It Takes Two' => 1426210,
        'Sea of Thieves' => 1172620,
        'Mortal Kombat 1' => 1971870,
        'Resident Evil 4' => 2050650,
        'Lies of P' => 1627720,
        'Ghost of Tsushima' => 2215430,
        'Hitman World of Assassination' => 1659040,
    ];

    public function up(): void
    {
        foreach (self::STEAM_APP_IDS as $name => $appId) {
            DB::table('products')->where('name', $name)->update([
                'image_url' => "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/$appId/library_600x900.jpg",
            ]);
        }
    }

    public function down(): void
    {
        foreach (array_keys(self::STEAM_APP_IDS) as $name) {
            DB::table('products')->where('name', $name)->update([
                'image_url' => 'https://placehold.co/460x600/351183/fad318/png?font=montserrat&text='.rawurlencode($name),
            ]);
        }
    }
};
