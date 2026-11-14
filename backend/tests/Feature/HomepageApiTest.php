<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HomepageApiTest extends TestCase
{
    use RefreshDatabase;

    private int $popular;   // in stock, popularity 50

    private int $soldOut;   // most popular but no keys

    private int $quiet;     // in stock, popularity 10

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-11-20 12:00:00');

        $platform = DB::table('platforms')->insertGetId(['name' => 'Steam', 'slug' => 'steam']);
        $region = DB::table('regions')->insertGetId(['name' => 'Global', 'slug' => 'global']);
        $seller = DB::table('sellers')->insertGetId(['name' => 'Seller', 'rating' => 9.5]);
        $product = function (string $slug, int $popularity, int $keys) use ($platform, $region, $seller) {
            $id = DB::table('products')->insertGetId(['name' => $slug, 'slug' => $slug, 'description' => '', 'image_url' => 'x',
                'platform_id' => $platform, 'region_id' => $region, 'genre' => 'RPG', 'release_date' => '2020-01-01',
                'rrp_cents' => 2000, 'popularity' => $popularity]);
            $offer = DB::table('offers')->insertGetId(['product_id' => $id, 'seller_id' => $seller, 'price_cents' => 1000]);
            for ($k = 0; $k < $keys; $k++) {
                DB::table('game_keys')->insert(['offer_id' => $offer, 'code' => "$slug-$k"]);
            }

            return $id;
        };
        $this->popular = $product('popular', 50, 2);
        $this->soldOut = $product('sold-out', 99, 0);
        $this->quiet = $product('quiet', 10, 1);
    }

    public function test_layout_follows_position_and_points_each_block_to_its_endpoint(): void
    {
        DB::table('home_blocks')->insert([
            ['type' => 'bestsellers', 'title' => 'Best sellers', 'position' => 2],
            ['type' => 'banners', 'title' => null, 'position' => 1],
        ]);

        $this->getJson('/api/homepage')->assertOk()->assertExactJson(['data' => [
            ['type' => 'banners', 'title' => null, 'endpoint' => '/api/blocks/banners'],
            ['type' => 'bestsellers', 'title' => 'Best sellers', 'endpoint' => '/api/blocks/bestsellers'],
        ]]);
    }

    public function test_banners_come_in_position_order(): void
    {
        DB::table('banners')->insert([
            ['title' => 'Second', 'subtitle' => null, 'image_url' => 'b', 'link_url' => '/store', 'position' => 2],
            ['title' => 'First', 'subtitle' => 'Hi', 'image_url' => 'a', 'link_url' => '/store?platform=steam', 'position' => 1],
        ]);

        $this->getJson('/api/blocks/banners')->assertJsonPath('data.*.title', ['First', 'Second'])
            ->assertJsonPath('data.0.link_url', '/store?platform=steam');
    }

    public function test_deals_keep_future_end_and_roll_past_ends_forward_by_whole_weeks(): void
    {
        DB::table('deals')->insert([
            ['product_id' => $this->popular, 'ends_at' => '2026-11-22 12:00:00', 'position' => 1], // in 2 days: unchanged
            ['product_id' => $this->quiet, 'ends_at' => '2026-11-20 11:00:00', 'position' => 2],   // 1 hour ago: +1 week
            ['product_id' => $this->soldOut, 'ends_at' => '2026-11-10 12:00:00', 'position' => 3], // 10 days ago: +2 weeks
        ]);

        $this->getJson('/api/blocks/deals')
            ->assertJsonPath('data.*.product.slug', ['popular', 'quiet', 'sold-out'])
            ->assertJsonPath('data.0.ends_at', '2026-11-22T12:00:00+00:00')
            ->assertJsonPath('data.1.ends_at', '2026-11-27T11:00:00+00:00')
            ->assertJsonPath('data.2.ends_at', '2026-11-24T12:00:00+00:00')
            ->assertJsonPath('data.0.product.price_cents', 1000);
    }

    public function test_bestsellers_are_most_popular_first_and_skip_sold_out(): void
    {
        $this->getJson('/api/blocks/bestsellers')->assertJsonPath('data.*.slug', ['popular', 'quiet']);
    }
}
