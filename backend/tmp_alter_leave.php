<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
Illuminate\Support\Facades\DB::statement("ALTER TABLE leave_entries MODIFY employee_id VARCHAR(255) NULL");
echo "employee_id altered to varchar\n";
