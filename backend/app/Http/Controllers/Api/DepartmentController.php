<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DepartmentController extends Controller
{
    protected $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }
    /**
     * Display a listing of all departments.
     */
    public function index()
    {
        $departments = Department::orderBy('is_custom', 'asc')->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $departments
        ]);
    }

    /**
     * Store a newly created department in database.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:departments',
                'color' => 'nullable|string|max:50',
                'office_id' => 'required|exists:offices,id',
            ]);

            $department = Department::create([
                'name' => $validated['name'],
                'office_id' => $validated['office_id'],
                'is_custom' => true,
                'color' => $validated['color'] ?? '#59D2DE',
            ]);

            // Log activity
            $this->activityLogService->logDepartmentAction('created', $department, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Department created successfully',
                'data' => $department
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Display the specified department.
     */
    public function show(Department $department)
    {
        return response()->json([
            'success' => true,
            'data' => $department
        ]);
    }

    /**
     * Update the specified department in database.
     */
    public function update(Request $request, Department $department)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255|unique:departments,name,' . $department->id,
            ]);

            $department->update($validated);

            // Log activity
            $this->activityLogService->logDepartmentAction('updated', $department, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Department updated successfully',
                'data' => $department
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Remove the specified department from database.
     */
    public function destroy(Request $request, Department $department)
    {
        // Only allow deletion of custom departments
        if ($department->is_custom) {
            // Log activity before deletion
            $this->activityLogService->logDepartmentAction('deleted', $department, null, $request);

            $department->delete();

            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Cannot delete default departments'
        ], 403);
    }

    /**
     * Bulk create departments
     */
    public function bulkCreate(Request $request)
    {
        try {
            $validated = $request->validate([
                'departments' => 'required|array',
                'departments.*' => 'required|string|max:255'
            ]);

            $created = [];
            foreach ($validated['departments'] as $departmentName) {
                $department = Department::firstOrCreate(
                    ['name' => $departmentName],
                    ['is_custom' => true]
                );
                $created[] = $department;

                // Log activity for each created department
                if ($department->wasRecentlyCreated) {
                    $this->activityLogService->logDepartmentAction('created', $department, null, $request);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Departments created successfully',
                'data' => $created
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }
}
