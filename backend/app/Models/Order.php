<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** Everything OrderResource reads, eager-loaded in one go (no N+1). Shared by checkout and order history. */
    public const FOR_RESOURCE = ['items.offer.seller', 'items.offer.product.platform', 'items.offer.product.region', 'items.key'];

    protected $fillable = ['user_id', 'total_cents'];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
