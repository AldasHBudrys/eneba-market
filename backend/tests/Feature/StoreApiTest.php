<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class StoreApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Three products built to hit the edge cases:
     * - Witcher (Steam): cheap offer has NO keys, so its "From" price must be the 1500 offer, not 900.
     * - Hollow Knight (Nintendo): buyable offers at 700 and 1200, so its "From" price is 700.
     * - Stardew (Steam): only offer is sold out → price null, listed last.
     */
    protected function setUp(): void
    {
        parent::setUp();

        $steam = DB::table('platforms')->insertGetId(['name' => 'Steam', 'slug' => 'steam']);
        $nintendo = DB::table('platforms')->insertGetId(['name' => 'Nintendo', 'slug' => 'nintendo']);
        $global = DB::table('regions')->insertGetId(['name' => 'Global', 'slug' => 'global']);
        $europe = DB::table('regions')->insertGetId(['name' => 'Europe', 'slug' => 'europe']);
        $a = DB::table('sellers')->insertGetId(['name' => 'Seller A', 'rating' => 9.5]);
        $b = DB::table('sellers')->insertGetId(['name' => 'Seller B', 'rating' => 8.9]);

        $this->product('The Witcher 3: Wild Hunt', 'witcher', $steam, $global, 2999, [[$a, 1500, 2], [$b, 900, 0]], popularity: 10);
        $this->product('Hollow Knight', 'hollow', $nintendo, $europe, 1499, [[$a, 700, 1], [$b, 1200, 1]], popularity: 30);
        $this->product('Stardew Valley', 'stardew', $steam, $europe, 1399, [[$a, 500, 0]], popularity: 20);
    }

    public function test_price_is_cheapest_buyable_offer_and_sold_out_sorts_last(): void
    {
        $this->getJson('/api/products?sort=price_asc')
            ->assertOk()
            ->assertJsonPath('data.*.slug', ['hollow', 'witcher', 'stardew'])
            ->assertJsonPath('data.1.price_cents', 1500) // not 900: that offer has no keys
            ->assertJsonPath('data.1.discount_percent', 50)
            ->assertJsonPath('data.2.price_cents', null);
    }

    public function test_cards_get_the_offer_behind_the_from_price(): void
    {
        $offerAt = fn (int $price) => DB::table('offers')->where('price_cents', $price)->value('id');

        $response = $this->getJson('/api/products?sort=price_asc')
            ->assertJsonPath('data.1.slug', 'witcher')
            ->assertJsonPath('data.1.cheapest_offer', ['id' => $offerAt(1500), 'seller' => ['name' => 'Seller A'], 'stock' => 2]) // not the keyless 900 offer
            ->assertJsonPath('data.0.cheapest_offer.id', $offerAt(700)); // Hollow: 700 beats 1200

        // Stardew is sold out: the key must be present AND null (assertJsonPath alone also passes when the key is missing).
        $this->assertArrayHasKey('cheapest_offer', $response->json('data.2'));
        $this->assertNull($response->json('data.2.cheapest_offer'));
    }

    public function test_default_sort_is_most_popular(): void
    {
        $this->getJson('/api/products')->assertJsonPath('data.*.slug', ['hollow', 'stardew', 'witcher']);
    }

    public function test_filters_by_platform_region_and_buyable_price_range(): void
    {
        $this->getJson('/api/products?platform=steam&sort=name_asc')->assertJsonPath('data.*.slug', ['stardew', 'witcher']);
        $this->getJson('/api/products?platform=steam,nintendo&region=europe&sort=name_asc')->assertJsonPath('data.*.slug', ['hollow', 'stardew']);
        // Filters on the "From" price the card shows. 800–1600: Witcher's is 1500 (its 900 offer has no keys);
        // Hollow is out even though its 1200 offer is in range, because its card says "From €7.00".
        $this->getJson('/api/products?min_price=800&max_price=1600')->assertJsonPath('data.*.slug', ['witcher']);
        $this->getJson('/api/products?max_price=800')->assertJsonPath('data.*.slug', ['hollow']);
        $this->getJson('/api/products?min_price=1600')->assertJsonPath('meta.total', 0); // sold-out Stardew never matches
    }

    public function test_search_handles_typos_and_partial_names(): void
    {
        $this->getJson('/api/products?q=wichter')->assertJsonPath('data.*.slug', ['witcher']);
        $this->getJson('/api/products?q=hollow')->assertJsonPath('data.*.slug', ['hollow']);
        $this->getJson('/api/products?q=zzzz')->assertJsonPath('meta.total', 0);
    }

    public function test_search_treats_sql_wildcards_as_plain_text(): void
    {
        // % and _ mean "anything" in SQL LIKE. Unescaped, q=% would match every product.
        $this->getJson('/api/products?q=%25')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/products?q=_')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_health_check_reports_database_connected(): void
    {
        // Render polls this to decide whether the app is up.
        $this->getJson('/api/health')->assertOk()->assertExactJson(['status' => 'ok', 'db' => 'connected']);
    }

    public function test_product_page_lists_buyable_offers_first_and_hides_key_codes(): void
    {
        $response = $this->getJson('/api/products/witcher')
            ->assertOk()
            ->assertJsonPath('data.offers.*.price_cents', [1500, 900])
            ->assertJsonPath('data.offers.*.stock', [2, 0])
            ->assertJsonPath('data.offers.0.seller.name', 'Seller A');

        $this->assertStringNotContainsString('"code"', $response->getContent());
        $this->getJson('/api/products/nope')->assertNotFound();
    }

    public function test_rejects_invalid_input(): void
    {
        $this->getJson('/api/products?sort=banana')->assertUnprocessable()->assertJsonValidationErrors('sort');
        $this->getJson('/api/products?min_price=-1')->assertUnprocessable()->assertJsonValidationErrors('min_price');
    }

    public function test_filters_endpoint_lists_options_from_the_database(): void
    {
        $this->getJson('/api/filters')
            ->assertOk()
            ->assertJsonPath('platforms.*.slug', ['nintendo', 'steam'])
            ->assertJsonPath('price', ['min_cents' => 700, 'max_cents' => 1500]); // in-stock offers only
    }

    /** @param  array<array{int, int, int}>  $offers  [seller id, price in cents, number of keys] */
    private function product(string $name, string $slug, int $platform, int $region, int $rrp, array $offers, int $popularity): void
    {
        $id = DB::table('products')->insertGetId([
            'name' => $name, 'slug' => $slug, 'description' => '', 'image_url' => 'x', 'platform_id' => $platform,
            'region_id' => $region, 'genre' => 'RPG', 'release_date' => '2020-01-01', 'rrp_cents' => $rrp, 'popularity' => $popularity,
        ]);
        foreach ($offers as [$seller, $price, $keys]) {
            $offer = DB::table('offers')->insertGetId(['product_id' => $id, 'seller_id' => $seller, 'price_cents' => $price]);
            for ($k = 0; $k < $keys; $k++) {
                DB::table('game_keys')->insert(['offer_id' => $offer, 'code' => "$slug-$offer-$k"]);
            }
        }
    }
}
