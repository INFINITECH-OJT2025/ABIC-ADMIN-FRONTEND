<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('onboarding_checklists', function (Blueprint $table) {
            $table->string('type')->default('onboard')->after('department');
            $table->unsignedBigInteger('tenure_id')->nullable()->after('type');
            $table->string('employee_id')->nullable()->after('tenure_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboarding_checklists', function (Blueprint $table) {
            $table->dropColumn(['type', 'tenure_id', 'employee_id']);
        });
    }
};
