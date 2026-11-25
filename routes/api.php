<?php

use App\Http\Controllers\Api\V1\MessagingApiController;
use App\Http\Middleware\AuthenticateApiKey;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware([AuthenticateApiKey::class, 'throttle:120,1'])
    ->group(function () {
        Route::get('me', [MessagingApiController::class, 'me']);
        Route::get('channels', [MessagingApiController::class, 'channels']);
        Route::get('templates', [MessagingApiController::class, 'templates']);
        Route::post('messages/send', [MessagingApiController::class, 'send']);
        Route::get('messages/{id}', [MessagingApiController::class, 'status']);
    });
