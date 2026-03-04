<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    protected $fillable = [
        'employee_id',
        'score_1',
        'score_1_breakdown',
        'agreement_1',
        'comment_1',
        'signature_1',
        'remarks_1',
        'rated_by',
        'reviewed_by',
        'approved_by',
        'score_2',
        'score_2_breakdown',
        'agreement_2',
        'comment_2',
        'signature_2',
        'remarks_2',
        'rated_by_2',
        'reviewed_by_2',
        'approved_by_2',
        'status',
        'regularization_date',
    ];

    protected $casts = [
        'score_1_breakdown' => 'array',
        'score_2_breakdown' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }
}
