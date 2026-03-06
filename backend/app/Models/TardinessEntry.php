<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TardinessEntry extends Model
{
    protected $table = 'tardiness_entries';

    protected $fillable = [
        'employee_id',
        'employee_name',
        'date',
        'actual_in',
        'minutes_late',
        'warning_level',
        'cutoff_period',
        'month',
        'year',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
