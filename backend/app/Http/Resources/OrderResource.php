<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** An order as its owner sees it, including the key codes. Only ever returned for the logged-in buyer's own orders. */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'total_cents' => $this->total_cents,
            'created_at' => $this->created_at->toIso8601String(),
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'price_cents' => $item->price_cents,
                'seller' => $item->offer->seller->name,
                'product' => [
                    'slug' => $item->offer->product->slug,
                    'name' => $item->offer->product->name,
                    'platform' => $item->offer->product->platform->name,
                    'region' => $item->offer->product->region->name,
                ],
                'code' => $item->key->code, // GameKey hides `code` by default; the buyer is allowed to see their own
            ]),
        ];
    }
}
