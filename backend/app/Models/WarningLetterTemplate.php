<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarningLetterTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'subject',
        'header_logo',
        'body',
        'footer',
        'signatory_name'
    ];
}
