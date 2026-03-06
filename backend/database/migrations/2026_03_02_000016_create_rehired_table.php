<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('rehired', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade')->onUpdate('cascade');
            $table->string('previous_employee_id')->nullable();
            $table->datetime('rehired_at');
            $table->string('source_type')->nullable()->comment('terminated|resigned');
            $table->json('profile_snapshot')->nullable();
            $table->datetime('profile_updated_at')->nullable();
            $table->timestamps();
            $table->index('rehired_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rehired');
    }
};
