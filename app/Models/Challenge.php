<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Challenge extends Model
{
    protected $fillable = ['challenger_id', 'challenged_id', 'game_id', 'status'];

    public function challenger(): BelongsTo { return $this->belongsTo(User::class, 'challenger_id'); }
    public function challenged(): BelongsTo { return $this->belongsTo(User::class, 'challenged_id'); }
    public function game(): BelongsTo       { return $this->belongsTo(Game::class); }

    public function isExpired(): bool
    {
        return $this->created_at->diffInMinutes(now()) > 10;
    }
}
