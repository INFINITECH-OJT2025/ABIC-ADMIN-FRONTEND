<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hiring_interviews', function (Blueprint $table) {
            $table->id();
            $table->string('applicant_name');
            $table->string('position')->nullable();
            $table->enum('stage', ['initial', 'final']);
            $table->enum('status', ['PENDING', 'PASSED', 'FAILED'])->default('PENDING');
            $table->date('interview_date')->nullable();
            $table->time('interview_time')->nullable();
            $table->unsignedBigInteger('initial_interview_id')->nullable();
            $table->foreign('initial_interview_id')
                ->references('id')
                ->on('hiring_interviews')
                ->nullOnDelete();
            $table->timestamp('passed_at')->nullable();
            $table->timestamps();

            $table->index(['stage', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hiring_interviews');
    }
};
