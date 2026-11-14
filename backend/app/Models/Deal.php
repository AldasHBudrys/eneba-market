<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Deal extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['ends_at' => 'datetime'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * The end time the countdown shows. A deal whose end has passed rolls forward by whole weeks, same weekday and hour.
     * shortcut: keeps the seeded demo deals running forever; real deals would be created/expired by an admin tool.
     */
    public function currentEnd(): CarbonInterface
    {
        $end = $this->ends_at->copy();
        if ($end->isPast()) {
            $end->addWeeks((int) floor($end->diffInDays(now(), true) / 7) + 1);
        }

        return $end;
    }
}
