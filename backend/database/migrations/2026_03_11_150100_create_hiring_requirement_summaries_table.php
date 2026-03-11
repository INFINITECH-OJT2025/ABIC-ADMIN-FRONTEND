<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hiring_requirement_summaries', function (Blueprint $table) {
            $table->id();
            $table->string('position');
            $table->unsignedInteger('required_headcount')->default(0);
            $table->unsignedInteger('hired')->default(0);
            $table->unsignedInteger('remaining')->default(0);
            $table->date('last_update')->nullable();
            $table->timestamps();

            $table->index('position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hiring_requirement_summaries');
    }
};
