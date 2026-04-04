<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = [
        'employee_id',
        'score_1',
        'remarks_1',
        'score_2',
        'remarks_2',
        'status',
        'regularization_date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
}
