<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Offer;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    private const PER_PAGE = 24;

    private const SORTS = ['popular', 'price_asc', 'price_desc', 'newest', 'oldest', 'name_asc', 'name_desc'];

    /** GET /api/products?q=&platform=steam,gog&region=global&min_price=&max_price=&sort=&page= (prices in cents) */
    public function index(Request $request)
    {
        $input = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'platform' => ['nullable', 'string', 'max:200'],
            'region' => ['nullable', 'string', 'max:200'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => ['nullable', 'integer', 'min:0'],
            'sort' => ['nullable', Rule::in(self::SORTS)],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);
        $term = trim($input['q'] ?? '');
        $min = $input['min_price'] ?? null;
        $max = $input['max_price'] ?? null;

        $query = Product::query()
            ->forCard()
            ->when($term !== '', fn (Builder $q) => $q->search($term))
            ->when($input['platform'] ?? null, fn (Builder $q, $slugs) => $q->whereHas('platform', fn ($p) => $p->whereIn('slug', explode(',', $slugs))))
            ->when($input['region'] ?? null, fn (Builder $q, $slugs) => $q->whereHas('region', fn ($r) => $r->whereIn('slug', explode(',', $slugs))))
            // Match the "From" price the card shows (cheapest buyable offer): it must be in [min, max].
            // = a buyable offer exists at <= max, and no buyable offer is cheaper than min.
            ->when($max !== null, fn (Builder $q) => $q->whereHas('offers', fn (Builder $o) => $o->inStock()->where('price_cents', '<=', $max)))
            ->when($min !== null, fn (Builder $q) => $q
                ->whereHas('offers', fn (Builder $o) => $o->inStock())
                ->whereDoesntHave('offers', fn (Builder $o) => $o->inStock()->where('price_cents', '<', $min)));

        $sort = $input['sort'] ?? null;
        if ($sort === null && $term !== '') {
            $query->orderByRaw('word_similarity(?, name) desc', [$term]); // searching without a sort: best match first
        }
        match ($sort ?? ($term !== '' ? null : 'popular')) {
            'popular' => $query->orderByDesc('popularity'),
            'price_asc' => $query->orderByRaw('price_cents asc nulls last'), // sold-out (null price) always last
            'price_desc' => $query->orderByRaw('price_cents desc nulls last'),
            'newest' => $query->orderByDesc('release_date'),
            'oldest' => $query->orderBy('release_date'),
            'name_asc' => $query->orderBy('name'),
            'name_desc' => $query->orderByDesc('name'),
            null => null,
        };
        $query->orderBy('id'); // tie-breaker: without it equal rows can swap between pages

        return ProductResource::collection($query->paginate(self::PER_PAGE)->withQueryString());
    }

    /** GET /api/products/{slug}: details + every seller's offer, buyable ones first, cheapest first. */
    public function show(string $slug)
    {
        $product = Product::query()
            ->with(['platform', 'region', 'offers' => fn ($o) => $o->withStock()->with('seller')])
            ->withLowestPrice()
            ->where('slug', $slug)
            ->firstOrFail();

        $product->setRelation('offers', $product->offers->sortBy(fn (Offer $o) => [$o->stock === 0, $o->price_cents])->values());

        return new ProductResource($product);
    }
}
