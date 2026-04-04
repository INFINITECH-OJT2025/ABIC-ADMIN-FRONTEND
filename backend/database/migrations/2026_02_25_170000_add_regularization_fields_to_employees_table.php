<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->date('regularization_date')->nullable()->after('date_hired');
        });

        DB::statement(
            "ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned', 'rehire_pending', 'rehired_employee', 'regularized') NOT NULL DEFAULT 'pending'"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement(
            "ALTER TABLE employees MODIFY COLUMN status ENUM('pending', 'employed', 'terminated', 'resigned', 'rehire_pending', 'rehired_employee') NOT NULL DEFAULT 'pending'"
        );

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('regularization_date');
        });
    }
};
