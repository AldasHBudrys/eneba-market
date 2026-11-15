<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

// Homepage layout and the content of its curated blocks. Best sellers need no table: they come from products.popularity.
class HomepageSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('home_blocks')->insert([
            ['type' => 'banners', 'title' => null, 'position' => 1],
            ['type' => 'deals', 'title' => 'Deals of the week', 'position' => 2],
            ['type' => 'bestsellers', 'title' => 'Best sellers', 'position' => 3],
        ]);

        // Steam's wide hero art (no logo text on it); same URLs as the use_banner_art migration, which updates existing DBs.
        $banner = fn (int $steamAppId) => "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/$steamAppId/library_hero.jpg";
        DB::table('banners')->insert([
            ['title' => 'Elden Ring', 'subtitle' => 'Rise, Tarnished — now up to 60% off', 'image_url' => $banner(1245620), 'link_url' => '/store?q=elden+ring', 'position' => 1],
            ['title' => 'Steam games', 'subtitle' => 'Thousands of keys, delivered instantly', 'image_url' => $banner(1091500), 'link_url' => '/store?platform=steam', 'position' => 2],
            ['title' => 'Nintendo eShop', 'subtitle' => 'Switch hits for less', 'image_url' => $banner(367520), 'link_url' => '/store?platform=nintendo', 'position' => 3],
        ]);

        // One edition (the first seeded) of six well-known games, each deal ending a different number of days from now.
        $products = DB::table('products')
            ->whereIn('name', ['Cyberpunk 2077', 'Elden Ring', 'Hogwarts Legacy', 'Hades', 'It Takes Two', 'Stardew Valley'])
            ->orderBy('id')->get()->unique('name')->values();

        DB::table('deals')->insert($products->map(fn ($product, $i) => [
            'product_id' => $product->id,
            'ends_at' => now()->addDays($i + 1)->startOfHour(),
            'position' => $i + 1,
        ])->all());
    }
}
