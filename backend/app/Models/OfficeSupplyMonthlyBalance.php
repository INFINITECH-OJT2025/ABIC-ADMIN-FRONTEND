<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfficeSupplyMonthlyBalance extends Model
{
    protected $fillable = [
        'item_id',
        'month_start',
        'opening_balance',
        'closing_balance',
    ];

    protected $casts = [
        'item_id' => 'integer',
        'month_start' => 'date:Y-m-d',
        'opening_balance' => 'integer',
        'closing_balance' => 'integer',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(OfficeSupplyItem::class, 'item_id');
    }
}
