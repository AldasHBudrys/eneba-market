<?php

namespace App\Http\Controllers;

use App\Models\Offer;
use App\Models\Platform;
use App\Models\Region;

/** GET /api/filters: the store sidebar's options come from the database, not from frontend code. */
class FilterController extends Controller
{
    public function __invoke()
    {
        $prices = Offer::inStock()->selectRaw('min(price_cents) as min, max(price_cents) as max')->first();

        return [
            'platforms' => Platform::orderBy('name')->get(['slug', 'name']),
            'regions' => Region::orderBy('name')->get(['slug', 'name']),
            'price' => ['min_cents' => (int) $prices->min, 'max_cents' => (int) $prices->max],
        ];
    }
}
