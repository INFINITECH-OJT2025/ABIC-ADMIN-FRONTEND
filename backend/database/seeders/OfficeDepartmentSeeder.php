<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Office;
use App\Models\Department;

class OfficeDepartmentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure Offices exist
        $abic = Office::firstOrCreate(['name' => 'ABIC']);
        $infinitech = Office::firstOrCreate(['name' => 'INFINITECH']);
        $glimit = Office::firstOrCreate(['name' => 'G-LIMIT']);

        // 2. Assign Departments to G-LIMIT as requested
        $glimitDepts = ['MULTIMEDIA DEPARTMENT', 'MARKETING DEPARTMENT', 'STUDIO DEPARTMENT'];
        foreach ($glimitDepts as $name) {
            Department::where('name', $name)->update(['office_id' => $glimit->id]);
        }

        // 3. Assign others to ABIC by default
        Department::whereNull('office_id')->update(['office_id' => $abic->id]);
    }
}
