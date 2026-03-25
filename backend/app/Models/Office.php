<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Office extends Model
{
    protected $fillable = ['name', 'header_logo_image', 'header_details'];

    public function departments()
    {
        return $this->hasMany(Department::class);
    }
}
