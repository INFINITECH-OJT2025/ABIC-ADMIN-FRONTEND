<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfficeSupplyTransaction extends Model
{
    protected $fillable = [
        'item_id',
        'department_id',
        'beginning_balance',
        'quantity_in',
        'quantity_out',
        'current_balance',
        'balance_auto',
        'issued_log',
        'requested_by_employee_id',
        'transaction_at',
    ];

    protected $casts = [
        'item_id' => 'integer',
        'department_id' => 'integer',
        'beginning_balance' => 'integer',
        'quantity_in' => 'integer',
        'quantity_out' => 'integer',
        'current_balance' => 'integer',
        'balance_auto' => 'integer',
        'transaction_at' => 'datetime',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(OfficeSupplyItem::class, 'item_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'requested_by_employee_id', 'id');
    }
}
