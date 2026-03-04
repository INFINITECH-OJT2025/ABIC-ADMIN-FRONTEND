<?php

namespace Tests\Feature;

use App\Models\Department;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentChecklistTemplateControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_upserts_department_checklist_template_with_tasks(): void
    {
        $department = Department::create([
            'name' => 'Finance',
            'is_custom' => true,
        ]);

        $payload = [
            'department_id' => $department->id,
            'checklist_type' => 'ONBOARDING',
            'tasks' => [
                ['task' => 'Prepare workstation', 'sort_order' => 1, 'is_active' => true],
                ['task' => 'Issue ID card', 'sort_order' => 2, 'is_active' => true],
            ],
        ];

        $response = $this->putJson('/api/department-checklist-templates', $payload);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.department_id', $department->id)
            ->assertJsonPath('data.checklist_type', 'ONBOARDING')
            ->assertJsonCount(2, 'data.tasks');

        $this->assertDatabaseHas('department_checklist_templates', [
            'department_id' => $department->id,
            'checklist_type' => 'ONBOARDING',
        ]);

        $this->assertDatabaseHas('department_checklist_template_tasks', [
            'task' => 'Prepare workstation',
            'sort_order' => 1,
        ]);
        $this->assertDatabaseHas('department_checklist_template_tasks', [
            'task' => 'Issue ID card',
            'sort_order' => 2,
        ]);
    }

    public function test_it_rejects_duplicate_tasks_case_insensitively(): void
    {
        $department = Department::create([
            'name' => 'HR',
            'is_custom' => true,
        ]);

        $payload = [
            'department_id' => $department->id,
            'checklist_type' => 'CLEARANCE',
            'tasks' => [
                ['task' => 'Return ID', 'sort_order' => 1, 'is_active' => true],
                ['task' => 'return id', 'sort_order' => 2, 'is_active' => true],
            ],
        ];

        $response = $this->putJson('/api/department-checklist-templates', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Some tasks are duplicated. Please keep each task name unique.');
    }

    public function test_it_validates_checklist_type_values(): void
    {
        $department = Department::create([
            'name' => 'Operations',
            'is_custom' => true,
        ]);

        $payload = [
            'department_id' => $department->id,
            'checklist_type' => 'INVALID',
            'tasks' => [
                ['task' => 'Task one', 'sort_order' => 1, 'is_active' => true],
            ],
        ];

        $response = $this->putJson('/api/department-checklist-templates', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['checklist_type']);
    }
}
