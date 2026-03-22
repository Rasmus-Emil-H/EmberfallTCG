<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pack extends Model
{
    protected $fillable = ['name', 'price', 'card_count', 'set_name'];

    public function packOpenings()
    {
        return $this->hasMany(PackOpening::class);
    }
}
