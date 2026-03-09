<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OnboardingChecklist extends Model
{
    protected $fillable = [
        'employee_id',
        'employee_name',
        'position',
        'department',
        'type',
        'tenure_id',
        'start_date',
        'tasks',
        'status',
    ];

    protected $casts = [
        'tasks' => 'array',
    ];
}
