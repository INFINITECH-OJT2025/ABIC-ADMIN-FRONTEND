<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HiringInterview extends Model
{
    protected $table = 'hiring_interviews';

    protected $fillable = [
        'applicant_name',
        'position',
        'stage',
        'status',
        'interview_date',
        'interview_time',
        'initial_interview_id',
        'passed_at',
    ];

    protected $casts = [
        'interview_date' => 'date:Y-m-d',
        'passed_at' => 'datetime',
    ];

    public function initialInterview()
    {
        return $this->belongsTo(self::class, 'initial_interview_id');
    }
}
