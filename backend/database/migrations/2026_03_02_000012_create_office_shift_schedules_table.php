<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('office_shift_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('office_name');
            $table->json('shift_options');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_shift_schedules');
    }
};
