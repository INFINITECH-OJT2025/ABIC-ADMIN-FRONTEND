<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['name', 'office_id', 'is_custom', 'color'];
    protected $hidden = [];
    public $timestamps = true;

    public function office()
    {
        return $this->belongsTo(Office::class);
    }

    public function positions()
    {
        return $this->hasMany(Position::class);
    }

    public function hierarchies()
    {
        return $this->hasMany(Hierarchy::class);
    }
}
