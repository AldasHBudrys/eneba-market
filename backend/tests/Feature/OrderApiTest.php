<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    private User $alice;

    private User $bob;

    protected function setUp(): void
    {
        parent::setUp();

        $this->alice = User::create(['name' => 'Alice', 'email' => 'alice@example.test', 'password' => 'secret123']);
        $this->bob = User::create(['name' => 'Bob', 'email' => 'bob@example.test', 'password' => 'secret123']);
        $platform = DB::table('platforms')->insertGetId(['name' => 'Steam', 'slug' => 'steam']);
        $region = DB::table('regions')->insertGetId(['name' => 'Global', 'slug' => 'global']);
        $seller = DB::table('sellers')->insertGetId(['name' => 'Seller', 'rating' => 9.5]);
        $product = DB::table('products')->insertGetId(['name' => 'Hades', 'slug' => 'hades', 'description' => '', 'image_url' => 'x',
            'platform_id' => $platform, 'region_id' => $region, 'genre' => 'Action', 'release_date' => '2020-01-01', 'rrp_cents' => 2500]);
        $offer = DB::table('offers')->insertGetId(['product_id' => $product, 'seller_id' => $seller, 'price_cents' => 1500]);
        foreach (['ALICE-OLD', 'ALICE-NEW', 'BOB-KEY'] as $code) {
            DB::table('game_keys')->insert(['offer_id' => $offer, 'code' => $code]);
        }

        // Buy through the real checkout so the test data has exactly the shape real orders have.
        $this->actingAs($this->alice)->postJson('/api/checkout', ['items' => [['offer_id' => $offer, 'quantity' => 1]], 'card_last4' => '4242'])->assertCreated();
        $this->actingAs($this->alice)->postJson('/api/checkout', ['items' => [['offer_id' => $offer, 'quantity' => 1]], 'card_last4' => '4242'])->assertCreated();
        $this->actingAs($this->bob)->postJson('/api/checkout', ['items' => [['offer_id' => $offer, 'quantity' => 1]], 'card_last4' => '4242'])->assertCreated();
    }

    public function test_lists_only_my_orders_newest_first_with_codes(): void
    {
        $this->actingAs($this->alice)->getJson('/api/orders')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.*.items.0.code', ['ALICE-NEW', 'ALICE-OLD']) // newest first
            ->assertJsonPath('data.0.items.0.product.name', 'Hades')
            ->assertJsonPath('data.0.total_cents', 1500);

        $bobs = $this->actingAs($this->bob)->getJson('/api/orders')->assertJsonCount(1, 'data');
        $this->assertStringNotContainsString('ALICE', $bobs->getContent()); // never another user's keys
    }

    public function test_requires_login(): void
    {
        $this->app['auth']->forgetGuards(); // setUp logged users in; the test client remembers that between requests
        $this->getJson('/api/orders')->assertUnauthorized();
    }
}
