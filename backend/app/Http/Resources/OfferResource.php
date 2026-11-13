<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, // the cart adds a specific offer, not just a product
            'seller' => ['name' => $this->seller->name, 'rating' => $this->seller->rating],
            'price_cents' => $this->price_cents,
            'stock' => (int) $this->stock,
        ];
    }
}
