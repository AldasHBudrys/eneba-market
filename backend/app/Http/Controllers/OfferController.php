<?php

namespace App\Http\Controllers;

use App\Http\Resources\OfferResource;
use App\Models\Offer;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    /**
     * GET /api/offers?ids=1,2,3: current price + stock of the offers in a cart, so the cart can catch
     * sold-out lines and price changes before checkout. Unknown ids are left out (offer removed).
     */
    public function index(Request $request)
    {
        $request->validate(['ids' => ['required', 'string', 'regex:/^\d+(,\d+){0,19}$/']]); // 1–20 numeric ids (the cart's line limit)

        return OfferResource::collection(
            Offer::withStock()->with('seller')->whereIn('id', explode(',', $request->query('ids')))->orderBy('id')->get()
        );
    }
}
