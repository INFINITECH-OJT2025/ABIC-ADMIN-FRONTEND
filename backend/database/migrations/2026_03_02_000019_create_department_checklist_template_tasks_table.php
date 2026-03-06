<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('department_checklist_template_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('department_checklist_templates')->onDelete('cascade');
            $table->string('task');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_checklist_template_tasks');
    }
};
