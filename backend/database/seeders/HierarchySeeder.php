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
            ['id' => 1, 'name' => 'ABIC REALTY & CONSULTANCY CORPORATION'],
            ['id' => 2, 'name' => 'INFINITECH ADVERTISING CORPORATION'],
            ['id' => 3, 'name' => 'G-LIMIT Studio'],
        ];

        foreach ($offices as $office) {
            Office::updateOrCreate(['id' => $office['id']], $office);
        }

        // 2. Create Departments
        $departments = [
            ['id' => 15, 'office_id' => 1, 'name' => 'ACCOUNTING DEPARTMENT', 'is_custom' => 1, 'color' => '#59D2DE'],
            ['id' => 17, 'office_id' => 2, 'name' => 'IT DEPARTMENT', 'is_custom' => 1, 'color' => '#59D2DE'],
            ['id' => 18, 'office_id' => 1, 'name' => 'SALES DEPARTMENT', 'is_custom' => 1, 'color' => '#59D2DE'],
            ['id' => 20, 'office_id' => 3, 'name' => 'STUDIO DEPARTMENT', 'is_custom' => 1, 'color' => '#59D2DE'],
            ['id' => 21, 'office_id' => 3, 'name' => 'MULTIMEDIA DEPARTMENT', 'is_custom' => 1, 'color' => '#59D2DE'],
            ['id' => 22, 'office_id' => 1, 'name' => 'ADMIN DEPARTMENT', 'is_custom' => 1, 'color' => '#59D2DE'],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(['id' => $dept['id']], $dept);
        }

        // 3. Create Hierarchies
        $hierarchies = [
            ['id' => 63, 'name' => 'CEO', 'is_custom' => 1, 'department_id' => null, 'parent_id' => null],
            ['id' => 64, 'name' => 'Executive Assistant', 'is_custom' => 1, 'department_id' => null, 'parent_id' => null],
            ['id' => 65, 'name' => 'Admin Supervisor/HR', 'is_custom' => 1, 'department_id' => null, 'parent_id' => 64],
            ['id' => 68, 'name' => 'Junior IT Manager', 'is_custom' => 1, 'department_id' => 17, 'parent_id' => null],
            ['id' => 69, 'name' => 'IT Supervisor', 'is_custom' => 1, 'department_id' => 17, 'parent_id' => 68],
            ['id' => 70, 'name' => 'Senior Web Developer', 'is_custom' => 1, 'department_id' => 17, 'parent_id' => 69],
            ['id' => 71, 'name' => 'Junior Web Developer', 'is_custom' => 1, 'department_id' => 17, 'parent_id' => 70],
            ['id' => 72, 'name' => 'IT Marketing Staff', 'is_custom' => 1, 'department_id' => 17, 'parent_id' => 71],
            ['id' => 73, 'name' => 'Sales Director', 'is_custom' => 1, 'department_id' => 18, 'parent_id' => null],
            ['id' => 87, 'name' => 'Sales Supervisor', 'is_custom' => 1, 'department_id' => 18, 'parent_id' => 73],
            ['id' => 75, 'name' => 'Senior Property Specialist', 'is_custom' => 1, 'department_id' => 18, 'parent_id' => 87],
            ['id' => 76, 'name' => 'Property Specialist', 'is_custom' => 1, 'department_id' => 18, 'parent_id' => 75],
            ['id' => 77, 'name' => 'Studio Manager', 'is_custom' => 1, 'department_id' => 20, 'parent_id' => null],
            ['id' => 78, 'name' => 'Assistant Studio Manager', 'is_custom' => 1, 'department_id' => 20, 'parent_id' => 77],
            ['id' => 79, 'name' => 'Studio Marketing Staff', 'is_custom' => 1, 'department_id' => 20, 'parent_id' => 78],
            ['id' => 80, 'name' => 'Multimedia Manager', 'is_custom' => 1, 'department_id' => 21, 'parent_id' => null],
            ['id' => 81, 'name' => 'Multimedia Editor', 'is_custom' => 1, 'department_id' => 21, 'parent_id' => 80],
            ['id' => 82, 'name' => 'Accounting Supervisor', 'is_custom' => 1, 'department_id' => 15, 'parent_id' => null],
            ['id' => 83, 'name' => 'Accounting Assistant', 'is_custom' => 1, 'department_id' => 15, 'parent_id' => 82],
            ['id' => 88, 'name' => 'Admin Assistant', 'is_custom' => 1, 'department_id' => 22, 'parent_id' => null],
            ['id' => 89, 'name' => 'Driver/Liaison staff', 'is_custom' => 1, 'department_id' => 22, 'parent_id' => 88],
        ];

        foreach ($hierarchies as $hierarchy) {
            Hierarchy::updateOrCreate(['id' => $hierarchy['id']], $hierarchy);
        }
    }
}
