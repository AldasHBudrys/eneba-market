<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameKey extends Model
{
    protected $fillable = ['order_item_id'];

    /** The code is what the buyer pays for: never include it in JSON by accident (OrderResource adds it for the owner). */
    protected $hidden = ['code'];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    /** The single definition of "unsold" that stock, prices and checkout all use. */
    public function scopeUnsold(Builder $query): void
    {
        $query->whereNull('order_item_id');
    }
}
