<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    /** Minimum pg_trgm word_similarity for a typo match. Measured: "wichter"→Witcher = 0.30, unrelated names ≤ 0.25. */
    public const SEARCH_THRESHOLD = 0.3;

    protected function casts(): array
    {
        return ['release_date' => 'date'];
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    /** Partial ("witch") or typo ("wichter") name match. word_similarity scores the term against the best-matching part of the name. */
    public function scopeSearch(Builder $query, string $term): void
    {
        $like = '%'.addcslashes($term, '%_\\').'%'; // escape LIKE wildcards typed by the user
        $query->where(fn (Builder $q) => $q
            ->where('name', 'ilike', $like)
            ->orWhereRaw('word_similarity(?, name) >= ?', [$term, self::SEARCH_THRESHOLD]));
    }

    /** Adds price_cents = cheapest offer that can actually be bought (has stock); null when sold out. */
    public function scopeWithLowestPrice(Builder $query): void
    {
        $query->withMin(['offers as price_cents' => fn (Builder $offer) => $offer->inStock()], 'price_cents');
    }
}
