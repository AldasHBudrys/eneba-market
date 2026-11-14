<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\GameKey;
use App\Models\Offer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutController extends Controller
{
    /** Simulated payment: a card ending in these digits is declined (shows the rollback path). */
    public const DECLINED_LAST4 = '0002';

    /**
     * POST /api/checkout {items: [{offer_id, quantity}], card_last4}
     * Reserve keys, create the order and "charge" in ONE transaction: any failure undoes everything.
     */
    public function __invoke(Request $request)
    {
        $input = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:20'],
            'items.*.offer_id' => ['required', 'integer', 'distinct', 'exists:offers,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'card_last4' => ['required', 'digits:4'], // the browser never sends the full card number
        ]);

        $order = DB::transaction(function () use ($input, $request) {
            $offers = Offer::with('product')->findMany(array_column($input['items'], 'offer_id'))->keyBy('id');
            $order = Order::create(['user_id' => $request->user()->id, 'total_cents' => 0]);
            $total = 0;

            foreach ($input['items'] as $line) {
                $offer = $offers[$line['offer_id']];

                // Lock the exact key rows we take. A parallel checkout skips locked rows and takes other keys,
                // so two buyers can never get the same key (and nobody waits on someone else's lock).
                $keys = GameKey::where('offer_id', $offer->id)->unsold()
                    ->orderBy('id')->limit($line['quantity'])
                    ->lock('for update skip locked')
                    ->get();

                if ($keys->count() < $line['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => "Only {$keys->count()} left for {$offer->product->name}.", // rolls back the transaction
                    ]);
                }

                foreach ($keys as $key) {
                    // Price comes from the database, never from the browser.
                    $item = OrderItem::create(['order_id' => $order->id, 'offer_id' => $offer->id, 'price_cents' => $offer->price_cents]);
                    $key->update(['order_item_id' => $item->id]);
                    $total += $offer->price_cents;
                }
                Product::whereKey($offer->product_id)->increment('popularity', $line['quantity']); // feeds best sellers
            }

            if ($input['card_last4'] === self::DECLINED_LAST4) {
                abort(402, 'Card declined. You were not charged.'); // throwing inside the transaction rolls it back
            }

            $order->update(['total_cents' => $total]);

            return $order;
        });

        $order->load(Order::FOR_RESOURCE);

        return (new OrderResource($order))->response()->setStatusCode(201);
    }
}
