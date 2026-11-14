<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\FilterController;
use App\Http\Controllers\HomepageController;
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

// 6 attempts per minute per IP, against password guessing.
Route::middleware('throttle:6,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/checkout', CheckoutController::class);
});

Route::get('/homepage', [HomepageController::class, 'layout']);
Route::get('/blocks/banners', [HomepageController::class, 'banners']);
Route::get('/blocks/deals', [HomepageController::class, 'deals']);
Route::get('/blocks/bestsellers', [HomepageController::class, 'bestsellers']);
