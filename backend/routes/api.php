<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// Health check: used by the frontend hello-world and by Render to know the app is up.
Route::get('/health', function () {
    DB::select('select 1'); // throws (→ 500) if the database is unreachable
    return ['status' => 'ok', 'db' => 'connected'];
});
