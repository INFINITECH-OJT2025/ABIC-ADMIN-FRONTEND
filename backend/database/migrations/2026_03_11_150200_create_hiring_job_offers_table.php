<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hiring_job_offers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('final_interview_id')->unique();
            $table->string('applicant_name');
            $table->string('position')->nullable();
            $table->decimal('salary', 12, 2)->nullable();
            $table->date('offer_sent')->nullable();
            $table->date('response_date')->nullable();
            $table->enum('status', ['Pending', 'Accepted', 'Declined'])->default('Pending');
            $table->date('start_date')->nullable();
            $table->timestamps();

            $table->foreign('final_interview_id')
                ->references('id')
                ->on('hiring_interviews')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hiring_job_offers');
    }
};
