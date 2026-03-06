<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('terminations', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade')->onUpdate('cascade');
            $table->datetime('termination_date');
            $table->datetime('rehired_at')->nullable();
            $table->text('reason')->comment('Reason for termination');
            $table->string('recommended_by')->nullable();
            $table->string('notice_mode')->nullable();
            $table->datetime('notice_date')->nullable();
            $table->string('reviewed_by')->nullable();
            $table->string('approved_by')->nullable();
            $table->datetime('approval_date')->nullable();
            $table->string('status')->default('completed')->comment('Status of termination: pending, completed, cancelled');
            $table->text('notes')->nullable()->comment('Additional notes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terminations');
    }
};
