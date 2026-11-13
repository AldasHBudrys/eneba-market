<?php

use App\Http\Controllers\FilterController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Health check: used by the frontend hello-world and by Render to know the app is up.
Route::get('/health', function () {
    DB::select('select 1'); // throws (→ 500) if the database is unreachable
    return ['status' => 'ok', 'db' => 'connected'];
});

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/filters', FilterController::class);
