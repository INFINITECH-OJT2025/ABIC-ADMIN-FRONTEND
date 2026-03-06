<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = ['name', 'office_id', 'is_custom', 'color'];
    protected $hidden = [];
    public $timestamps = true;

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function hierarchies()
    {
        return $this->hasMany(Hierarchy::class);
    }
}
