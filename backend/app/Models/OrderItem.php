<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** One bought key: which offer, at what price, and (via key) the code. */
class OrderItem extends Model
{
    protected $fillable = ['order_id', 'offer_id', 'price_cents'];

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function key(): HasOne
    {
        return $this->hasOne(GameKey::class);
    }
}
