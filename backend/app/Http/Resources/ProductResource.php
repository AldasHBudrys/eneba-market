<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The public JSON shape of a product. List responses get the card fields; the detail page also gets description + offers. */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $price = $this->price_cents === null ? null : (int) $this->price_cents;

        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'image_url' => $this->image_url,
            'platform' => ['slug' => $this->platform->slug, 'name' => $this->platform->name],
            'region' => ['slug' => $this->region->slug, 'name' => $this->region->name],
            'rrp_cents' => $this->rrp_cents,
            'price_cents' => $price, // null = sold out
            'discount_percent' => $price === null ? null : (int) round(100 - $price * 100 / $this->rrp_cents),
            // List cards: the offer behind "From" price, so the card's buttons add exactly that offer. null = sold out.
            'cheapest_offer' => $this->whenLoaded('cheapestOffer', fn () => $this->cheapestOffer ? [
                'id' => $this->cheapestOffer->id,
                'seller' => ['name' => $this->cheapestOffer->seller->name],
                'stock' => (int) $this->cheapestOffer->stock,
            ] : null),
            $this->mergeWhen($this->relationLoaded('offers'), fn () => [
                'description' => $this->description,
                'genre' => $this->genre,
                'release_date' => $this->release_date->toDateString(),
                'offers' => OfferResource::collection($this->offers),
            ]),
        ];
    }
}
