<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->date('regularization_date')->nullable()->after('status');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('regularization_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->date('regularization_date')->nullable()->after('date_hired');
        });

        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn('regularization_date');
        });
    }
};
