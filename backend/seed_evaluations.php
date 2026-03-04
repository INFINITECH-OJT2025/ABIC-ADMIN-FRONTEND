<?php

$employees = App\Models\Employee::whereIn('status', ['employed', 'rehired_employee'])->get();
$count = 0;
foreach ($employees as $employee) {
    if (!App\Models\Evaluation::where('employee_id', $employee->id)->exists()) {
        App\Models\Evaluation::create([
            'employee_id' => $employee->id,
            'status' => 'Probee'
        ]);
        $count++;
    }
}
echo "Created evaluation records for {$count} active employees.\n";
