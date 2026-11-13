<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameKey extends Model
{
    /** The code is what the buyer pays for: never include it in JSON by accident. */
    protected $hidden = ['code'];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    /** The single definition of "unsold" that stock, prices and checkout all use. */
    public function scopeUnsold(Builder $query): void
    {
        // shortcut: no orders exist yet, so every key is unsold; Day 3 checkout changes this to whereNull('order_item_id').
    }
}
