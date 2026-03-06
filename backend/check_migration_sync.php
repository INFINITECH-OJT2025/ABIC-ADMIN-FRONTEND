<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$pendingMigrations = DB::table('migrations')->pluck('migration')->toArray();
$allFiles = glob(database_path('migrations/*.php'));
$pendingFiles = [];

foreach ($allFiles as $file) {
    $name = basename($file, '.php');
    if (!in_array($name, $pendingMigrations)) {
        $pendingFiles[] = $name;
    }
}

echo "Checking the first few pending migrations...\n";
foreach (array_slice($pendingFiles, 0, 10) as $migration) {
    // Guess table name from migration name (simplified)
    if (preg_match('/create_(.*)_table/', $migration, $matches)) {
        $table = $matches[1];
        if (Schema::hasTable($table)) {
            echo "ISSUE: Migration '$migration' is Pending but table '$table' EXISTS.\n";
        } else {
            echo "OK: Table '$table' is Missing.\n";
        }
    } else {
        echo "Check manually: $migration\n";
    }
}
