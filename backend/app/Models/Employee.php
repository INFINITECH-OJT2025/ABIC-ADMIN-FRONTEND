<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    // Use guarded instead of fillable so dynamically-added additional info
    // columns are automatically accepted without needing to update this file.
    protected $guarded = ['id'];

    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted()
    {
        static::creating(function ($employee) {
            if (empty($employee->id)) {
                $year = date('y'); // Get last 2 digits of current year
                $prefix = "{$year}-";

                // Find the last employee ID for the current year
                $lastEmployee = static::where('id', 'like', "{$prefix}%")
                    ->orderBy('id', 'desc')
                    ->first();

                $nextNumber = 1;
                if ($lastEmployee) {
                    $lastNumber = (int) substr($lastEmployee->id, 3);
                    $nextNumber = $lastNumber + 1;
                }

                $employee->id = $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    protected $hidden = [
        'password',
    ];

    public function evaluation()
    {
        return $this->hasOne(Evaluation::class, 'employee_id', 'id');
    }
}
