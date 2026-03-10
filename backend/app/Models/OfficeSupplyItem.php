<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class OfficeSupplyItem extends Model
{
    protected $fillable = [
        'code_sequence',
        'item_code',
        'item_name',
        'category',
        'department_id',
        'current_balance',
    ];

    protected $casts = [
        'code_sequence' => 'integer',
        'department_id' => 'integer',
        'current_balance' => 'integer',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(OfficeSupplyTransaction::class, 'item_id');
    }

    public function latestTransaction(): HasOne
    {
        return $this->hasOne(OfficeSupplyTransaction::class, 'item_id')->latestOfMany('id');
    }

    public function monthlyBalances(): HasMany
    {
        return $this->hasMany(OfficeSupplyMonthlyBalance::class, 'item_id');
    }
}
