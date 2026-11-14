<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

// Fills platforms, regions, products, sellers, offers and game keys.
// No Faker: production installs without dev packages, and a fixed random seed keeps the data the same on every run.
class CatalogSeeder extends Seeder
{
    private const PLATFORMS = ['steam' => 'Steam', 'gog' => 'GOG.com', 'playstation' => 'PlayStation', 'xbox' => 'Xbox', 'nintendo' => 'Nintendo'];

    private const REGIONS = ['global' => 'Global', 'europe' => 'Europe', 'united-states' => 'United States'];

    private const SELLERS = [['PixelVault', 9.91], ['KeyForge', 9.84], ['GameNest', 9.63], ['LootLane', 9.12], ['CodeCrate', 8.74], ['NordicKeys', 9.47]];

    // [title, genre, release date, RRP in cents, platforms it's sold on]
    private const GAMES = [
        ['The Witcher 3: Wild Hunt', 'RPG', '2015-05-19', 2999, ['steam', 'gog', 'xbox', 'playstation']],
        ['Cyberpunk 2077', 'RPG', '2020-12-10', 5999, ['steam', 'gog', 'playstation', 'xbox']],
        ['Elden Ring', 'RPG', '2022-02-25', 5999, ['steam', 'playstation', 'xbox']],
        ["Baldur's Gate 3", 'RPG', '2023-08-03', 5999, ['steam', 'gog', 'playstation']],
        ['Red Dead Redemption 2', 'Action', '2018-10-26', 5999, ['steam', 'playstation', 'xbox']],
        ['Grand Theft Auto V', 'Action', '2013-09-17', 2999, ['steam', 'playstation', 'xbox']],
        ['Hogwarts Legacy', 'Adventure', '2023-02-10', 5999, ['steam', 'playstation', 'xbox', 'nintendo']],
        ['Minecraft', 'Sandbox', '2011-11-18', 2999, ['xbox', 'nintendo', 'playstation']],
        ['Terraria', 'Sandbox', '2011-05-16', 999, ['steam', 'gog']],
        ['Stardew Valley', 'Simulation', '2016-02-26', 1399, ['steam', 'gog', 'nintendo']],
        ['Hades', 'Action', '2020-09-17', 2499, ['steam', 'nintendo']],
        ['Hollow Knight', 'Platformer', '2017-02-24', 1499, ['steam', 'gog', 'nintendo']],
        ['Celeste', 'Platformer', '2018-01-25', 1999, ['steam', 'nintendo']],
        ['Farming Simulator 25', 'Simulation', '2024-11-12', 4999, ['steam', 'playstation', 'xbox']],
        ['EA SPORTS FC 26', 'Sports', '2025-09-26', 6999, ['playstation', 'xbox']],
        ['Football Manager 26', 'Sports', '2025-11-04', 5499, ['steam']],
        ['Forza Horizon 5', 'Racing', '2021-11-09', 5999, ['steam', 'xbox']],
        ["Assassin's Creed Valhalla", 'Action', '2020-11-10', 5999, ['playstation', 'xbox']],
        ['Starfield', 'RPG', '2023-09-06', 6999, ['steam', 'xbox']],
        ['It Takes Two', 'Adventure', '2021-03-26', 3999, ['steam', 'playstation', 'xbox']],
        ['Sea of Thieves', 'Adventure', '2018-03-20', 3999, ['steam', 'xbox']],
        ['Mortal Kombat 1', 'Fighting', '2023-09-19', 6999, ['steam', 'playstation', 'xbox']],
        ['Resident Evil 4', 'Horror', '2023-03-24', 3999, ['steam', 'playstation']],
        ['Lies of P', 'Action', '2023-09-19', 5999, ['steam', 'playstation']],
        ['The Legend of Zelda: Tears of the Kingdom', 'Adventure', '2023-05-12', 6999, ['nintendo']],
        ['Mario Kart 8 Deluxe', 'Racing', '2017-04-28', 5999, ['nintendo']],
        ['Ghost of Tsushima', 'Action', '2020-07-17', 5999, ['steam', 'playstation']],
        ['Hitman World of Assassination', 'Action', '2023-01-26', 6999, ['steam', 'playstation', 'xbox']],
    ];

    public function run(): void
    {
        mt_srand(2027);
        $now = now();

        $platformIds = $this->insertLookup('platforms', self::PLATFORMS);
        $regionIds = $this->insertLookup('regions', self::REGIONS);
        $sellerIds = array_map(
            fn ($s) => DB::table('sellers')->insertGetId(['name' => $s[0], 'rating' => $s[1]]),
            self::SELLERS,
        );

        foreach (self::GAMES as $g => [$title, $genre, $released, $rrp, $platforms]) {
            foreach ($platforms as $p => $platform) {
                // PC stores sell mostly global keys; console keys are usually region-locked.
                $region = in_array($platform, ['steam', 'gog']) ? (($g + $p) % 4 ? 'global' : 'europe') : (($g + $p) % 2 ? 'europe' : 'united-states');

                $productId = DB::table('products')->insertGetId([
                    'name' => $title,
                    'slug' => Str::slug("$title $platform $region"),
                    'description' => "$title for ".self::PLATFORMS[$platform].'. Redeem the key on '.self::PLATFORMS[$platform]
                        .' and the game is added to your library instantly. Region: '.self::REGIONS[$region].'.',
                    // shortcut: generated placeholder covers instead of real game art (copyright); swap for licensed images if this went live.
                    'image_url' => 'https://placehold.co/460x600/351183/fad318/png?font=montserrat&text='.rawurlencode($title),
                    'platform_id' => $platformIds[$platform],
                    'region_id' => $regionIds[$region],
                    'genre' => $genre,
                    'release_date' => $released,
                    'rrp_cents' => $rrp,
                    'popularity' => mt_rand(0, 1000),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $this->seedOffers($productId, $rrp, $sellerIds, $now);
            }
        }
    }

    /** Inserts slug => name rows and returns [slug => id]. */
    private function insertLookup(string $table, array $rows): array
    {
        $ids = [];
        foreach ($rows as $slug => $name) {
            $ids[$slug] = DB::table($table)->insertGetId(['name' => $name, 'slug' => $slug]);
        }

        return $ids;
    }

    /** 2–5 sellers per product, each 30–90% of RRP, each with 0–6 keys (0 = out of stock, to test that path). */
    private function seedOffers(int $productId, int $rrp, array $sellerIds, $now): void
    {
        $sellers = $sellerIds;
        shuffle($sellers); // uses the mt_srand seed, so the result is repeatable
        $keys = [];

        foreach (array_slice($sellers, 0, mt_rand(2, 5)) as $sellerId) {
            $offerId = DB::table('offers')->insertGetId([
                'product_id' => $productId,
                'seller_id' => $sellerId,
                'price_cents' => intdiv($rrp * mt_rand(30, 90), 1000) * 10 + 9, // round down to 10 cents, end in 9: €17.29
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            for ($k = mt_rand(0, 6); $k > 0; $k--) {
                $keys[] = ['offer_id' => $offerId, 'code' => implode('-', str_split(strtoupper(Str::random(15)), 5)), 'created_at' => $now, 'updated_at' => $now];
            }
        }

        DB::table('game_keys')->insert($keys); // one query for all keys of this product
    }
}
