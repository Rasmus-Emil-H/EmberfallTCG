<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    protected $fillable = [
        'name', 'description', 'mana_cost', 'attack', 'health',
        'card_type', 'rarity', 'hero_class', 'flavor_text'
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_cards')->withPivot('quantity')->withTimestamps();
    }

    public function decks()
    {
        return $this->belongsToMany(Deck::class, 'deck_cards')->withPivot('quantity')->withTimestamps();
    }
}
