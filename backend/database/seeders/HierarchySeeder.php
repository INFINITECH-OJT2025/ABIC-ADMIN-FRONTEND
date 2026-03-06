<?php

namespace Database\Seeders;

use App\Models\Office;
use App\Models\Department;
use App\Models\Hierarchy;
use Illuminate\Database\Seeder;

class HierarchySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Offices
        $offices = [
            ['name' => 'ABIC'],
            ['name' => 'INFINITECH'],
            ['name' => 'G-LIMIT'],
        ];

        foreach ($offices as $office) {
            Office::updateOrCreate(['name' => $office['name']], $office);
        }

        $abic = Office::where('name', 'ABIC')->first();
        $infinitech = Office::where('name', 'INFINITECH')->first();
        $glimit = Office::where('name', 'G-LIMIT')->first();

        // 2. Create Departments
        $departments = [
            ['name' => 'Accounting', 'office_id' => $abic->id, 'color' => '#E8F5E9'],
            ['name' => 'Human Resources', 'office_id' => $abic->id, 'color' => '#FFF3E0'],
            ['name' => 'Admin', 'office_id' => $abic->id, 'color' => '#E3F2FD'],
            ['name' => 'Maintenance', 'office_id' => $abic->id, 'color' => '#F3E5F5'],
            ['name' => 'Production', 'office_id' => $infinitech->id, 'color' => '#FBE9E7'],
            ['name' => 'Quality Control', 'office_id' => $infinitech->id, 'color' => '#E0F2F1'],
            ['name' => 'Logistics', 'office_id' => $glimit->id, 'color' => '#FFFDE7'],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(['name' => $dept['name']], $dept);
        }

        // 3. Create Hierarchies (Positions/Roles)
        // Root elements
        $executive = Hierarchy::updateOrCreate(
            ['name' => 'Executive Officer'],
            ['department_id' => null, 'parent_id' => null, 'is_custom' => false]
        );

        $adminHead = Hierarchy::updateOrCreate(
            ['name' => 'Admin Head'],
            ['department_id' => null, 'parent_id' => $executive->id, 'is_custom' => false]
        );

        // Accounting Dept Positions
        $accountingDept = Department::where('name', 'Accounting')->first();
        $accountingHead = Hierarchy::updateOrCreate(
            ['name' => 'Accounting Supervisor'],
            ['department_id' => $accountingDept->id, 'parent_id' => $adminHead->id]
        );

        Hierarchy::updateOrCreate(
            ['name' => 'Accounting Staff'],
            ['department_id' => $accountingDept->id, 'parent_id' => $accountingHead->id]
        );

        // HR Dept Positions
        $hrDept = Department::where('name', 'Human Resources')->first();
        $hrHead = Hierarchy::updateOrCreate(
            ['name' => 'HR Manager'],
            ['department_id' => $hrDept->id, 'parent_id' => $adminHead->id]
        );

        Hierarchy::updateOrCreate(
            ['name' => 'HR Assistant'],
            ['department_id' => $hrDept->id, 'parent_id' => $hrHead->id]
        );
        
        // Admin Dept Positions
        $adminDept = Department::where('name', 'Admin')->first();
        $adminSupervisor = Hierarchy::updateOrCreate(
            ['name' => 'Admin Supervisor'],
            ['department_id' => $adminDept->id, 'parent_id' => $adminHead->id]
        );

        Hierarchy::updateOrCreate(
            ['name' => 'Admin Assistant'],
            ['department_id' => $adminDept->id, 'parent_id' => $adminSupervisor->id]
        );
    }
}
