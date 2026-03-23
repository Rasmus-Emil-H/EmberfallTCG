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

    protected $fillable = ['name', 'email', 'password', 'gold', 'rank_points', 'win_streak', 'free_gold_claimed_at', 'last_seen_at'];

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
            'last_seen_at'         => 'datetime',
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

    /** Friendships where this user is the requester */
    public function sentFriendships()
    {
        return $this->hasMany(Friendship::class, 'requester_id');
    }

    /** Friendships where this user is the addressee */
    public function receivedFriendships()
    {
        return $this->hasMany(Friendship::class, 'addressee_id');
    }

    public function isOnline(): bool
    {
        return $this->last_seen_at && $this->last_seen_at->diffInMinutes(now()) < 2;
    }

    public function lastSeenLabel(): string
    {
        if (!$this->last_seen_at) return 'Never';
        if ($this->isOnline()) return 'Online';
        $diff = $this->last_seen_at->diffForHumans();
        return $diff;
    }
}
