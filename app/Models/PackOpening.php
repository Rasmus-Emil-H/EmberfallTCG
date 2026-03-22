<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PackOpening extends Model
{
    protected $fillable = ['user_id', 'pack_id', 'cards_received'];

    protected $casts = [
        'cards_received' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pack()
    {
        return $this->belongsTo(Pack::class);
    }
}
