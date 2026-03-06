<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Starting targeted fresh migration...\n";

// 1. Disable Foreign Key Checks
DB::statement('SET FOREIGN_KEY_CHECKS=0;');

// 2. Drop specific tables
$tables = ['offices', 'departments', 'office_shift_schedules'];
foreach ($tables as $table) {
    echo "Dropping table: $table\n";
    Schema::dropIfExists($table);
}

// 3. Clear migration records for these files
$migrations = [
    '2026_03_02_000001_create_offices_table',
    '2026_03_02_000002_create_departments_table',
    '2026_03_02_000012_create_office_shift_schedules_table',
    '2026_03_02_145436_add_office_id_to_office_shift_schedules_table'
];

foreach ($migrations as $migration) {
    echo "Clearing migration record: $migration\n";
    DB::table('migrations')->where('migration', $migration)->delete();
}

// 4. Re-enable Foreign Key Checks
DB::statement('SET FOREIGN_KEY_CHECKS=1;');

echo "Reset complete. Now running targeted migrations...\n";

// Execute migrations for specific paths
$paths = [
    'database/migrations/2026_03_02_000001_create_offices_table.php',
    'database/migrations/2026_03_02_000002_create_departments_table.php',
    'database/migrations/2026_03_02_000012_create_office_shift_schedules_table.php',
    'database/migrations/2026_03_02_145436_add_office_id_to_office_shift_schedules_table.php'
];

foreach ($paths as $path) {
    echo "Migrating: $path\n";
    $exitCode = Artisan::call('migrate', [
        '--path' => $path,
        '--force' => true
    ]);
    echo Artisan::output();
}

echo "Done!\n";
