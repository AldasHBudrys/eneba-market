<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Banner;
use App\Models\Deal;
use App\Models\HomeBlock;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

/**
 * The homepage is data: /api/homepage lists the blocks in order, and each block type has its own endpoint
 * reading its own source. The frontend renders whatever comes back; nothing about the homepage is hardcoded there.
 */
class HomepageController extends Controller
{
    private const BESTSELLERS = 12;

    /** GET /api/homepage */
    public function layout()
    {
        return ['data' => HomeBlock::orderBy('position')->get()->map(fn (HomeBlock $b) => [
            'type' => $b->type,
            'title' => $b->title,
            'endpoint' => "/api/blocks/{$b->type}",
        ])];
    }

    /** GET /api/blocks/banners */
    public function banners()
    {
        return ['data' => Banner::orderBy('position')->get(['title', 'subtitle', 'image_url', 'link_url'])];
    }

    /** GET /api/blocks/deals */
    public function deals()
    {
        $deals = Deal::with(['product' => fn ($p) => $p->with(['platform', 'region'])->withLowestPrice()])
            ->orderBy('position')
            ->get();

        return ['data' => $deals->map(fn (Deal $d) => [
            'ends_at' => $d->currentEnd()->toIso8601String(),
            'product' => new ProductResource($d->product),
        ])];
    }

    /** GET /api/blocks/bestsellers: most popular products you can actually buy. */
    public function bestsellers()
    {
        return ProductResource::collection(Product::query()
            ->with(['platform', 'region'])
            ->withLowestPrice()
            ->whereHas('offers', fn (Builder $o) => $o->inStock())
            ->orderByDesc('popularity')
            ->orderBy('id')
            ->limit(self::BESTSELLERS)
            ->get());
    }
}
