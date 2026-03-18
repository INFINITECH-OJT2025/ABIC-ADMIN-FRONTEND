<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $sqlPath = database_path('sql/admin_head.sql');

        if (!file_exists($sqlPath)) {
            throw new RuntimeException("SQL file not found: {$sqlPath}");
        }

        $sql = file_get_contents($sqlPath);

        if ($sql === false || trim($sql) === '') {
            throw new RuntimeException("SQL file is empty or unreadable: {$sqlPath}");
        }

        DB::unprepared($sql);
    }

    public function down(): void
    {
        $sqlPath = database_path('sql/admin_head.sql');

        if (!file_exists($sqlPath)) {
            return;
        }

        $sql = file_get_contents($sqlPath);

        if ($sql === false || trim($sql) === '') {
            return;
        }

        preg_match_all('/CREATE\s+TABLE\s+`([^`]+)`/i', $sql, $matches);
        $tables = array_reverse(array_unique($matches[1] ?? []));

        if (empty($tables)) {
            return;
        }

        Schema::disableForeignKeyConstraints();

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }

        Schema::enableForeignKeyConstraints();
    }
};
