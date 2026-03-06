<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Mail\EmployeeWelcome;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    /**
     * Display a listing of all employees.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Employee::all()
        ]);
    }

    /**
     * Store a newly created employee in database.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:employees',
            ]);

            // Generate a random password
            $password = Str::random(12);
            $hashedPassword = Hash::make($password);

            $employee = Employee::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => $hashedPassword,
            ]);

            // Send welcome email with password
            try {
                Mail::to($employee->email)->send(new EmployeeWelcome($employee, $password));
            } catch (\Exception $e) {
                // Log email error but don't fail the creation
                \Log::error('Failed to send welcome email: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully. Welcome email sent to ' . $employee->email,
                'data' => $employee
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
     * Display the specified employee.
     */
    public function show(Employee $employee)
    {
        return response()->json([
            'success' => true,
            'data' => $employee
        ]);
    }

    /**
     * Update the specified employee in database.
     */
    public function update(Request $request, Employee $employee)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:employees,email,' . $employee->id,
                'position' => 'sometimes|string|max:255',
                'date_hired' => 'sometimes|date',
                'middle_name' => 'sometimes|string|max:255',
                'suffix' => 'sometimes|string|max:255',
                'birthday' => 'sometimes|date',
                'birthplace' => 'sometimes|string|max:255',
                'civil_status' => 'sometimes|string|max:255',
                'gender' => 'sometimes|string|max:255',
                'sss_number' => 'sometimes|string|max:255',
                'philhealth_number' => 'sometimes|string|max:255',
                'pagibig_number' => 'sometimes|string|max:255',
                'tin_number' => 'sometimes|string|max:255',
                'mothers_maiden_name' => 'sometimes|string|max:255',
                'mlast_name' => 'sometimes|string|max:255',
                'mfirst_name' => 'sometimes|string|max:255',
                'mmiddle_name' => 'sometimes|string|max:255',
                'msuffix' => 'sometimes|string|max:255',
                'fathers_name' => 'sometimes|string|max:255',
                'flast_name' => 'sometimes|string|max:255',
                'ffirst_name' => 'sometimes|string|max:255',
                'fmiddle_name' => 'sometimes|string|max:255',
                'fsuffix' => 'sometimes|string|max:255',
                'mobile_number' => 'sometimes|string|max:255',
                'house_number' => 'sometimes|string|max:255',
                'street' => 'sometimes|string|max:255',
                'village' => 'sometimes|string|max:255',
                'subdivision' => 'sometimes|string|max:255',
                'barangay' => 'sometimes|string|max:255',
                'region' => 'sometimes|string|max:255',
                'province' => 'sometimes|string|max:255',
                'city_municipality' => 'sometimes|string|max:255',
                'zip_code' => 'sometimes|string|max:255',
                'password' => 'sometimes|string|min:6',
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            $employee->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully',
                'data' => $employee
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
     * Remove the specified employee from database.
     */
    public function destroy(Employee $employee)
    {
        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ]);
    }

    /**
     * Employee login
     */
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            $employee = Employee::where('email', $validated['email'])->first();

            if (!$employee || !Hash::check($validated['password'], $employee->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password'
                ], 401);
            }

            // Generate a token (simple session token)
            $token = Str::random(80);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'employee' => $employee,
                    'token' => $token
                ]
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
     * Change password
     */
    public function changePassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
                'old_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'new_password_confirmation' => 'required|string|same:new_password',
            ]);

            $employee = Employee::where('email', $validated['email'])->first();

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            if (!Hash::check($validated['old_password'], $employee->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 401);
            }

            $employee->update([
                'password' => Hash::make($validated['new_password'])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully',
                'data' => $employee
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
     * Get employee profile
     */
    public function getProfile(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
            ]);

            $employee = Employee::where('email', $validated['email'])->first();

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $employee
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }
}
