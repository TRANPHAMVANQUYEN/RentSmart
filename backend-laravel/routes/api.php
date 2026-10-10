<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\PageViewController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RoomInteractionController;
use App\Http\Controllers\Api\LandlordController;
use App\Http\Controllers\RoomController;
use Illuminate\Support\Facades\Route;

Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/{roomId}', [RoomController::class, 'show'])->whereNumber('roomId');
Route::get('/rooms/{roomId}/contact', [RoomController::class, 'contact'])->whereNumber('roomId');
Route::get('/districts', [RoomController::class, 'districts']);
Route::get('/amenities', [RoomController::class, 'amenities']);
Route::post('/page-views', [PageViewController::class, 'store']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/password', [ProfileController::class, 'updatePassword']);
    Route::get('/saved-rooms', [RoomInteractionController::class, 'savedRooms']);
    Route::post('/saved-rooms/{roomId}/toggle', [RoomInteractionController::class, 'toggleSavedRoom'])->whereNumber('roomId');
    Route::post('/rooms/{roomId}/reports', [RoomInteractionController::class, 'report'])->whereNumber('roomId');
    Route::post('/rooms/{roomId}/messages', [RoomInteractionController::class, 'message'])->whereNumber('roomId');
});

Route::middleware(['auth:sanctum', 'role:landlord'])->prefix('landlord')->group(function (): void {
    Route::get('/rooms', [LandlordController::class, 'rooms']);
    Route::post('/rooms', [LandlordController::class, 'saveRoom']);
    Route::put('/rooms/{roomId}', [LandlordController::class, 'saveRoom'])->whereNumber('roomId');
    Route::patch('/rooms/{roomId}/status', [LandlordController::class, 'updateStatus'])->whereNumber('roomId');
    Route::delete('/rooms/{roomId}', [LandlordController::class, 'deleteRoom'])->whereNumber('roomId');
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function (): void {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/traffic', [PageViewController::class, 'traffic']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::post('/users', [AdminController::class, 'saveUser']);
    Route::put('/users/{userId}', [AdminController::class, 'saveUser'])->whereNumber('userId');
    Route::patch('/users/{userId}/status', [AdminController::class, 'updateUserStatus'])->whereNumber('userId');
    Route::delete('/users/{userId}', [AdminController::class, 'deleteUser'])->whereNumber('userId');
    Route::get('/rooms', [AdminController::class, 'rooms']);
    Route::post('/rooms', [AdminController::class, 'saveRoom']);
    Route::put('/rooms/{roomId}', [AdminController::class, 'saveRoom'])->whereNumber('roomId');
    Route::patch('/rooms/{roomId}', [AdminController::class, 'updateRoom'])->whereNumber('roomId');
    Route::delete('/rooms/{roomId}', [AdminController::class, 'deleteRoom'])->whereNumber('roomId');
    Route::get('/reports', [AdminController::class, 'reports']);
    Route::post('/reports/{reportId}/resolve', [AdminController::class, 'resolveReport'])->whereNumber('reportId');
    Route::get('/activity-logs', [AdminController::class, 'activityLogs']);
});
