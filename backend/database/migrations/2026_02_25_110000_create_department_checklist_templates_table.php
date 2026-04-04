<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::dropIfExists('department_checklist_template_tasks');
        Schema::dropIfExists('department_checklist_templates');

        Schema::create('department_checklist_templates', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('department_id');
            $table->string('checklist_type');
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['department_id', 'checklist_type'], 'dept_checklist_unique');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
        });

        Schema::create('department_checklist_template_tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id');
            $table->string('task');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('template_id')->references('id')->on('department_checklist_templates')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_checklist_template_tasks');
        Schema::dropIfExists('department_checklist_templates');
    }
};
