<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE hiring_interviews MODIFY COLUMN status ENUM('PENDING','CONFIRMED','PASSED','FAILED') NOT NULL DEFAULT 'PENDING'"
        );
    }

    public function down(): void
    {
        DB::statement("UPDATE hiring_interviews SET status = 'PENDING' WHERE status = 'CONFIRMED'");
        DB::statement(
            "ALTER TABLE hiring_interviews MODIFY COLUMN status ENUM('PENDING','PASSED','FAILED') NOT NULL DEFAULT 'PENDING'"
        );
    }
};
