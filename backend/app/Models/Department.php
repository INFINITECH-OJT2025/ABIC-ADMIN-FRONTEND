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

    public function officeSupplyItems(): HasMany
    {
        return $this->hasMany(OfficeSupplyItem::class, 'department_id');
    }

    public function officeSupplyTransactions(): HasMany
    {
        return $this->hasMany(OfficeSupplyTransaction::class, 'department_id');
    }
}
