<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clearance_checklists', function (Blueprint $table) {
            $table->id();
            $table->string('employee_name');
            $table->string('position');
            $table->string('department');
            $table->date('start_date');
            $table->date('resignation_date');
            $table->date('last_day');
            $table->json('tasks')->nullable();
            $table->string('status')->default('PENDING');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clearance_checklists');
    }
};
