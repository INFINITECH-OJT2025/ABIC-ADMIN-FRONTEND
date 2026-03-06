<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaveEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'employee_name',
        'department',
        'category',
        'shift',
        'start_date',
        'leave_end_date',
        'number_of_days',
        'approved_by',
        'remarks',
        'cite_reason',
        'status',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
}
