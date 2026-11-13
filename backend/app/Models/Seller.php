<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Seller extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['rating' => 'float']; // Postgres decimal arrives as a string "9.91"
    }
}
