<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'user_id', 'order_id', 'quickpay_payment_id',
        'package_id', 'amount_ore', 'gold_amount', 'status', 'accepted_at',
    ];

    protected $casts = ['accepted_at' => 'datetime'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
