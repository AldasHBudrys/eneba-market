<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    /**
     * GET /api/orders: the logged-in user's orders, newest first, with key codes.
     * Querying through $request->user()->orders() means other users' orders are never even fetched.
     * shortcut: no pagination (demo users have a handful of orders); switch get() to paginate() if lists grow.
     */
    public function index(Request $request)
    {
        return OrderResource::collection(
            $request->user()->orders()->with(Order::FOR_RESOURCE)->latest()->orderByDesc('id')->get()
        );
    }
}
