<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroClass extends Model
{
    protected $fillable = ['key', 'name', 'emoji', 'gradient', 'image', 'description', 'sort_order'];

    protected $casts = ['sort_order' => 'integer'];
}
