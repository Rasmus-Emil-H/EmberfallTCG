<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deck extends Model
{
    protected $fillable = ['user_id', 'name', 'hero_class'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function cards()
    {
        return $this->belongsToMany(Card::class, 'deck_cards')->withPivot('quantity')->withTimestamps();
    }

    public function deckCards()
    {
        return $this->hasMany(DeckCard::class);
    }
}
