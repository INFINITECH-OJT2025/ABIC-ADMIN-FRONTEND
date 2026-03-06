<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('tardiness_entries', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade')->onUpdate('cascade');
            $table->string('employee_name');
            $table->date('date');
            $table->time('actual_in');
            $table->integer('minutes_late');
            $table->integer('warning_level')->default(0);
            $table->enum('cutoff_period', ['cutoff1', 'cutoff2']);
            $table->string('month');
            $table->integer('year');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tardiness_entries');
    }
};
