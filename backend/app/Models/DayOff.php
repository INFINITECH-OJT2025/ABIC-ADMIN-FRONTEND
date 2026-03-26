<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DayOff extends Model
{
    protected $fillable = [
        'schedule_id',
        'employee_id',
        'employee_name',
        'daily_scheds',
        'day_offs',
    ];

    protected $casts = [
        'daily_scheds' => 'array',
        'day_offs' => 'array',
    ];
}
