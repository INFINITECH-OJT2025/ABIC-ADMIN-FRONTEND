<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('activity_type')->comment('Type: employee, department, position, attendance, system, auth');
            $table->string('action')->comment('Action: created, updated, deleted, onboarded, terminated, login, etc.');
            $table->string('status')->comment('Status: success, warning, error, info');
            $table->string('title');
            $table->text('description');
            $table->string('user_id')->nullable();
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            $table->string('target_id')->nullable();
            $table->string('target_type')->nullable()->comment('Employee, Department, Position, etc.');
            $table->json('metadata')->nullable()->comment('Additional data like old/new values');
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
