<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HiringRequirementSummary extends Model
{
    protected $table = 'hiring_requirement_summaries';

    protected $fillable = [
        'position',
        'required_headcount',
        'hired',
        'remaining',
        'last_update',
    ];

    protected $casts = [
        'required_headcount' => 'integer',
        'hired' => 'integer',
        'remaining' => 'integer',
        'last_update' => 'date:Y-m-d',
    ];
}
