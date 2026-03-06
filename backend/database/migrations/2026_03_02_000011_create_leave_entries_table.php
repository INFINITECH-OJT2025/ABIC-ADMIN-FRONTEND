<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_entries', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id')->nullable();
            $table->string('employee_name');
            $table->string('department')->default('');
            $table->string('category');
            $table->string('shift')->nullable();
            $table->date('start_date');
            $table->date('leave_end_date');
            $table->decimal('number_of_days', 5, 1)->default(0.0);
            $table->string('approved_by');
            $table->string('remarks');
            $table->text('cite_reason')->nullable();
            $table->string('status')->default('Pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_entries');
    }
};
