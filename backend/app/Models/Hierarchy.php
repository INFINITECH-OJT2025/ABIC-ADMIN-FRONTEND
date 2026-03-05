<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hierarchy extends Model
{
    protected $table = 'hierarchies';
    
    protected $fillable = ['name', 'is_custom', 'department_id', 'parent_id'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function parent()
    {
        return $this->belongsTo(Hierarchy::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Hierarchy::class, 'parent_id');
    }
}
