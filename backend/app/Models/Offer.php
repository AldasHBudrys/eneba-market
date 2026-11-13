<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One seller's price for one product. Stock = number of unsold keys (see GameKey::scopeUnsold). */
class Offer extends Model
{
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function keys(): HasMany
    {
        return $this->hasMany(GameKey::class);
    }

    public function scopeInStock(Builder $query): void
    {
        $query->whereHas('keys', fn (Builder $key) => $key->unsold());
    }

    /** Adds a `stock` column: count of unsold keys. */
    public function scopeWithStock(Builder $query): void
    {
        $query->withCount(['keys as stock' => fn (Builder $key) => $key->unsold()]);
    }
}
