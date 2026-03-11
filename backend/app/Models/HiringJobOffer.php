<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HiringJobOffer extends Model
{
    protected $table = 'hiring_job_offers';

    protected $fillable = [
        'final_interview_id',
        'applicant_name',
        'position',
        'salary',
        'offer_sent',
        'response_date',
        'status',
        'start_date',
    ];

    protected $casts = [
        'salary' => 'decimal:2',
        'offer_sent' => 'date:Y-m-d',
        'response_date' => 'date:Y-m-d',
        'start_date' => 'date:Y-m-d',
    ];

    public function finalInterview()
    {
        return $this->belongsTo(HiringInterview::class, 'final_interview_id');
    }
}
