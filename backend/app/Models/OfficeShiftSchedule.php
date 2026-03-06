<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficeShiftSchedule extends Model
{
    protected $table = 'office_shift_schedules';

    protected $fillable = [
        'office_name',
        'office_id',
        'shift_options',
    ];

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    protected $casts = [
        'shift_options' => 'array',
    ];
}
