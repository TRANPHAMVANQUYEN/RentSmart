<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\FrontendPasswordReset;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'phone',
        'password_hash',
        'full_name',
        'avatar',
        'role',
        'status',
        'lock_reason',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public const UPDATED_AT = null;

    public function getAuthPasswordName(): string
    {
        return 'password_hash';
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new FrontendPasswordReset($token));
    }

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
        ];
    }
}
