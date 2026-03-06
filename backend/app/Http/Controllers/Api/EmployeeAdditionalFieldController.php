<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeAdditionalField;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Validation\ValidationException;

class EmployeeAdditionalFieldController extends Controller
{
    // Supported field types and the DB column type they map to
    private const FIELD_TYPES = ['text', 'number', 'date', 'textarea', 'time', 'email', 'url'];

    /**
     * List all additional fields.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => EmployeeAdditionalField::all(),
        ]);
    }

    /**
     * Create a new additional field — adds a column to the employees table.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'field_label' => 'required|string|max:255',
                'field_type' => 'required|string|in:' . implode(',', self::FIELD_TYPES),
                'field_unit' => 'nullable|string|max:50',
            ]);

            // Auto-generate a snake_case key from the label
            $fieldKey = Str::snake(Str::lower($validated['field_label']));

            // Ensure uniqueness of key
            $base = $fieldKey;
            $counter = 1;
            while (
                EmployeeAdditionalField::where('field_key', $fieldKey)->exists() ||
                Schema::hasColumn('employees', $fieldKey)
            ) {
                $fieldKey = $base . '_' . $counter++;
            }

            // Add column to employees table (always as nullable string — we handle types on the frontend)
            Schema::table('employees', function (Blueprint $table) use ($fieldKey, $validated) {
                if ($validated['field_type'] === 'date') {
                    $table->date($fieldKey)->nullable()->after('email');
                } else {
                    $table->text($fieldKey)->nullable()->after('email');
                }
            });

            // Record the field in our tracking table
            $field = EmployeeAdditionalField::create([
                'field_label' => $validated['field_label'],
                'field_key' => $fieldKey,
                'field_type' => $validated['field_type'],
                'field_unit' => $validated['field_unit'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Field created successfully',
                'data' => $field,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create field: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an additional field — removes the column from the employees table.
     */
    public function destroy($id)
    {
        try {
            $field = EmployeeAdditionalField::find($id);

            if (!$field) {
                return response()->json([
                    'success' => false,
                    'message' => 'Field not found',
                ], 404);
            }

            $fieldKey = $field->field_key;

            // Remove column from employees table if it exists
            if (Schema::hasColumn('employees', $fieldKey)) {
                Schema::table('employees', function (Blueprint $table) use ($fieldKey) {
                    $table->dropColumn($fieldKey);
                });
            }

            // Remove tracking record
            $field->delete();

            return response()->json([
                'success' => true,
                'message' => 'Field deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete field: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all additional field values for a specific employee.
     */
    public function getEmployeeValues($employeeId)
    {
        $employee = Employee::find($employeeId);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found',
            ], 404);
        }

        $fields = EmployeeAdditionalField::all();

        $result = $fields->map(function ($field) use ($employee) {
            return [
                'field_id' => $field->id,
                'field_label' => $field->field_label,
                'field_key' => $field->field_key,
                'field_type' => $field->field_type,
                'field_unit' => $field->field_unit,
                'value' => $employee->{$field->field_key} ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $result->values(),
        ]);
    }

    /**
     * Save additional field values for a specific employee directly on the employees table.
     */
    public function saveEmployeeValues(Request $request, $employeeId)
    {
        try {
            $employee = Employee::find($employeeId);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found',
                ], 404);
            }

            $validated = $request->validate([
                'values' => 'required|array',
                'values.*.field_key' => 'required|string',
                'values.*.value' => 'nullable|string|max:5000',
            ]);

            // Get valid field keys from our tracking table
            $validKeys = EmployeeAdditionalField::pluck('field_key')->toArray();

            $updates = [];
            foreach ($validated['values'] as $item) {
                $key = $item['field_key'];
                if (in_array($key, $validKeys) && Schema::hasColumn('employees', $key)) {
                    $updates[$key] = $item['value'] ?? null;
                }
            }

            if (!empty($updates)) {
                $employee->update($updates);
            }

            return response()->json([
                'success' => true,
                'message' => 'Additional information saved successfully',
                'data' => $employee->fresh(),
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save: ' . $e->getMessage(),
            ], 500);
        }
    }
}
