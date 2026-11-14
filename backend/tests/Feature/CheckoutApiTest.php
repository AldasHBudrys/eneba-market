<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CheckoutApiTest extends TestCase
{
    use RefreshDatabase;

    private User $buyer;

    private int $offer;      // 1500 cents, 2 keys

    private int $otherOffer; // 800 cents, 1 key

    private int $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->buyer = User::create(['name' => 'Buyer', 'email' => 'buyer@example.test', 'password' => 'secret123']);
        $platform = DB::table('platforms')->insertGetId(['name' => 'Steam', 'slug' => 'steam']);
        $region = DB::table('regions')->insertGetId(['name' => 'Global', 'slug' => 'global']);
        $seller = DB::table('sellers')->insertGetId(['name' => 'Seller A', 'rating' => 9.5]);
        $seller2 = DB::table('sellers')->insertGetId(['name' => 'Seller B', 'rating' => 9.0]);
        $this->product = DB::table('products')->insertGetId(['name' => 'Hades', 'slug' => 'hades', 'description' => '', 'image_url' => 'x',
            'platform_id' => $platform, 'region_id' => $region, 'genre' => 'Action', 'release_date' => '2020-01-01', 'rrp_cents' => 2500, 'popularity' => 5]);
        $this->offer = DB::table('offers')->insertGetId(['product_id' => $this->product, 'seller_id' => $seller, 'price_cents' => 1500]);
        $this->otherOffer = DB::table('offers')->insertGetId(['product_id' => $this->product, 'seller_id' => $seller2, 'price_cents' => 800]);
        DB::table('game_keys')->insert([
            ['offer_id' => $this->offer, 'code' => 'AAAAA-11111'],
            ['offer_id' => $this->offer, 'code' => 'BBBBB-22222'],
            ['offer_id' => $this->otherOffer, 'code' => 'CCCCC-33333'],
        ]);
    }

    private function checkout(array $items, string $last4 = '4242')
    {
        return $this->actingAs($this->buyer)->postJson('/api/checkout', ['items' => $items, 'card_last4' => $last4]);
    }

    public function test_checkout_assigns_keys_charges_server_prices_and_updates_stock(): void
    {
        $this->checkout([['offer_id' => $this->offer, 'quantity' => 2], ['offer_id' => $this->otherOffer, 'quantity' => 1]])
            ->assertCreated()
            ->assertJsonPath('data.total_cents', 1500 * 2 + 800) // database prices; the browser sends none
            ->assertJsonCount(3, 'data.items')
            ->assertJsonPath('data.items.*.code', ['AAAAA-11111', 'BBBBB-22222', 'CCCCC-33333']);

        $this->assertSame(0, DB::table('game_keys')->whereNull('order_item_id')->count()); // all sold
        $this->assertSame(8, DB::table('products')->where('id', $this->product)->value('popularity')); // 5 + 3 bought
        $this->getJson('/api/products/hades')
            ->assertJsonPath('data.offers.*.stock', [0, 0])
            ->assertJson(['data' => ['price_cents' => null]]); // sold out → no "From" price (assertJson fails if the key is missing)
    }

    public function test_two_checkouts_never_get_the_same_key(): void
    {
        $first = $this->checkout([['offer_id' => $this->offer, 'quantity' => 1]])->assertCreated()->json('data.items.0.code');
        $second = $this->checkout([['offer_id' => $this->offer, 'quantity' => 1]])->assertCreated()->json('data.items.0.code');

        $this->assertNotSame($first, $second);
        $this->checkout([['offer_id' => $this->offer, 'quantity' => 1]])->assertUnprocessable()->assertJsonValidationErrors('items'); // sold out
    }

    public function test_more_than_stock_fails_and_changes_nothing(): void
    {
        // The first line could succeed on its own; the second can't, so the whole order must be undone.
        $this->checkout([['offer_id' => $this->otherOffer, 'quantity' => 1], ['offer_id' => $this->offer, 'quantity' => 3]])
            ->assertUnprocessable()
            ->assertJsonPath('errors.items.0', 'Only 2 left for Hades.');

        $this->assertNothingChanged();
    }

    public function test_declined_card_rolls_everything_back(): void
    {
        $this->checkout([['offer_id' => $this->offer, 'quantity' => 2]], last4: '0002')
            ->assertStatus(402)
            ->assertJsonPath('message', 'Card declined. You were not charged.');

        $this->assertNothingChanged();
    }

    public function test_requires_login_and_valid_input(): void
    {
        $this->postJson('/api/checkout', ['items' => [['offer_id' => $this->offer, 'quantity' => 1]], 'card_last4' => '4242'])->assertUnauthorized();

        $this->checkout([['offer_id' => $this->offer, 'quantity' => 0]])->assertJsonValidationErrors('items.0.quantity');
        $this->checkout([['offer_id' => 999999, 'quantity' => 1]])->assertJsonValidationErrors('items.0.offer_id');
        $this->checkout([['offer_id' => $this->offer, 'quantity' => 1], ['offer_id' => $this->offer, 'quantity' => 1]])->assertJsonValidationErrors('items.0.offer_id');
        $this->checkout([['offer_id' => $this->offer, 'quantity' => 1]], last4: '4242 4242 4242 4242')->assertJsonValidationErrors('card_last4');
        $this->assertNothingChanged();
    }

    private function assertNothingChanged(): void
    {
        $this->assertSame(0, DB::table('orders')->count());
        $this->assertSame(0, DB::table('order_items')->count());
        $this->assertSame(3, DB::table('game_keys')->whereNull('order_item_id')->count());
        $this->assertSame(5, DB::table('products')->where('id', $this->product)->value('popularity'));
    }
}
