<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
});

require __DIR__.'/settings.php';
