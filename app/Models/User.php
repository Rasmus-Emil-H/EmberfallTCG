<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password', 'gold', 'rank_points', 'win_streak', 'free_gold_claimed_at'];

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles')->withPivot('assigned_at');
    }

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'free_gold_claimed_at' => 'datetime',
            'password'             => 'hashed',
        ];
    }

    public function userCards()
    {
        return $this->hasMany(UserCard::class);
    }

    public function decks()
    {
        return $this->hasMany(Deck::class);
    }

    public function cards()
    {
        return $this->belongsToMany(Card::class, 'user_cards')->withPivot('quantity')->withTimestamps();
    }

    public function packOpenings()
    {
        return $this->hasMany(PackOpening::class);
    }
}
