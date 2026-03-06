<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DepartmentChecklistTemplate;
use App\Models\DepartmentChecklistTemplateTask;

// Delete templates other than ID 1 and 2
$deleted = DepartmentChecklistTemplate::whereNotIn('id', [1, 2])->delete();

echo "Deleted {$deleted} extra templates.\n";
echo "Database cleaned up. Only ID 1 and 2 remain.\n";
