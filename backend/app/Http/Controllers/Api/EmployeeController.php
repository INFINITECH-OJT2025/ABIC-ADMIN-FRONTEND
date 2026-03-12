<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\TerminationNotice;
use App\Models\Employee;
use App\Models\Rehired;
use App\Models\Resigned;
use App\Models\Termination;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    protected $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    private function syncLatestRehireProfile(Employee $employee): void
    {
        $latestRehire = Rehired::where('employee_id', $employee->id)
            ->latest('rehired_at')
            ->first();

        if (!$latestRehire) {
            return;
        }

        $latestRehire->update([
            'profile_snapshot' => $employee->fresh()->toArray(),
            'profile_updated_at' => now(),
        ]);
    }

    private function saveRehireProfileOnly(Employee $employee, array $changes): Rehired
    {
        $latestRehire = Rehired::where('employee_id', $employee->id)
            ->latest('rehired_at')
            ->first();

        if (!$latestRehire) {
            $latestRehire = Rehired::create([
                'employee_id' => $employee->id,
                'previous_employee_id' => null,
                'rehired_at' => now(),
                'source_type' => null,
                'profile_snapshot' => $employee->fresh()->toArray(),
                'profile_updated_at' => now(),
            ]);
        }

        $snapshot = $latestRehire->profile_snapshot;
        if (!is_array($snapshot)) {
            $snapshot = $employee->fresh()->toArray();
        }

        foreach ($changes as $key => $value) {
            $snapshot[$key] = $value;
        }

        $latestRehire->update([
            'profile_snapshot' => $snapshot,
            'profile_updated_at' => now(),
        ]);

        return $latestRehire;
    }
    /**
     * Display a listing of all employees.
     */
    public function index(Request $request)
    {
        $query = Employee::query();
        if ($request->has('status')) {
            $statuses = explode(',', $request->query('status'));
            $query->whereIn('status', $statuses);
        }
        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }

    /**
     * Check if email exists
     */
    public function checkEmail(Request $request)
    {
        $email = $request->query('email');

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Email parameter is required'
            ], 400);
        }

        $exists = Employee::where('email', $email)->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists
        ]);
    }

    /**
     * Check if name combination exists
     */
    public function checkName(Request $request)
    {
        $firstName = $request->query('first_name');
        $lastName = $request->query('last_name');

        if (!$firstName || !$lastName) {
            return response()->json([
                'success' => false,
                'message' => 'Both first_name and last_name are required'
            ], 400);
        }

        $exists = Employee::where('first_name', 'like', $firstName)
            ->where('last_name', 'like', $lastName)
            ->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists
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
                'mobile_number' => 'required|string|max:20',
            ]);

            $employee = Employee::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'mobile_number' => $validated['mobile_number'],
                'status' => 'pending', // Default status
            ]);

            // Log activity
            $this->activityLogService->logEmployeeCreated($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully.',
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
                'first_name' => 'sometimes|nullable|string|max:255',
                'last_name' => 'sometimes|nullable|string|max:255',
                'email' => 'sometimes|nullable|string|email|max:255|unique:employees,email,' . $employee->id,
                'position' => 'sometimes|nullable|string|max:255',
                'department' => 'sometimes|nullable|string|max:255',
                'date_hired' => 'sometimes|nullable|date',
                'middle_name' => 'sometimes|nullable|string|max:255',
                'suffix' => 'sometimes|nullable|string|max:255',
                'birthday' => 'sometimes|nullable|date',
                'birthplace' => 'sometimes|nullable|string|max:255',
                'civil_status' => 'sometimes|nullable|string|max:255',
                'gender' => 'sometimes|nullable|string|max:255',
                'sss_number' => 'sometimes|nullable|string|max:255',
                'philhealth_number' => 'sometimes|nullable|string|max:255',
                'pagibig_number' => 'sometimes|nullable|string|max:255',
                'tin_number' => 'sometimes|nullable|string|max:255',
                'mlast_name' => 'sometimes|nullable|string|max:255',
                'mfirst_name' => 'sometimes|nullable|string|max:255',
                'mmiddle_name' => 'sometimes|nullable|string|max:255',
                'msuffix' => 'sometimes|nullable|string|max:255',
                'flast_name' => 'sometimes|nullable|string|max:255',
                'ffirst_name' => 'sometimes|nullable|string|max:255',
                'fmiddle_name' => 'sometimes|nullable|string|max:255',
                'fsuffix' => 'sometimes|nullable|string|max:255',
                'mobile_number' => 'sometimes|nullable|string|max:255',
                'house_number' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
                'village' => 'sometimes|nullable|string|max:255',
                'subdivision' => 'sometimes|nullable|string|max:255',
                'barangay' => 'sometimes|nullable|string|max:255',
                'region' => 'sometimes|nullable|string|max:255',
                'province' => 'sometimes|nullable|string|max:255',
                'city_municipality' => 'sometimes|nullable|string|max:255',
                'zip_code' => 'sometimes|nullable|string|max:255',
                'perm_house_number' => 'sometimes|nullable|string|max:255',
                'perm_street' => 'sometimes|nullable|string|max:255',
                'perm_village' => 'sometimes|nullable|string|max:255',
                'perm_subdivision' => 'sometimes|nullable|string|max:255',
                'perm_barangay' => 'sometimes|nullable|string|max:255',
                'perm_city_municipality' => 'sometimes|nullable|string|max:255',
                'perm_province' => 'sometimes|nullable|string|max:255',
                'perm_region' => 'sometimes|nullable|string|max:255',
                'perm_zip_code' => 'sometimes|nullable|string|max:255',
                'user_profile' => 'sometimes|nullable|string|max:255',

                'password' => 'sometimes|nullable|string|min:6',
                'status' => 'sometimes|in:pending,employed,terminated,resigned,rehire_pending,rehired_employee,resignation_pending,termination_pending',
                'rehire_process' => 'sometimes|boolean',
                'onboarding_completed' => 'sometimes|boolean',
                'current_onboarding_batch' => 'sometimes|integer',
                'same_as_permanent' => 'sometimes|boolean',
            ]);

            $isRehireProcess = $request->boolean('rehire_process');
            unset($validated['rehire_process']);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            // Track changes for activity log
            $changes = array_diff_key($validated, array_flip(['password']));

            if ($isRehireProcess) {
                $rehireLiveUpdates = [];
                if (array_key_exists('status', $validated)) {
                    $rehireLiveUpdates['status'] = $validated['status'];
                }
                if (array_key_exists('current_onboarding_batch', $validated)) {
                    $rehireLiveUpdates['current_onboarding_batch'] = $validated['current_onboarding_batch'];
                }
                if (array_key_exists('user_profile', $validated)) {
                    $rehireLiveUpdates['user_profile'] = $validated['user_profile'];
                }
                if (!empty($rehireLiveUpdates)) {
                    $employee->update($rehireLiveUpdates);
                }
                $rehiredRecord = $this->saveRehireProfileOnly($employee, $validated);

                return response()->json([
                    'success' => true,
                    'message' => 'Rehire profile updated successfully',
                    'data' => $rehiredRecord,
                ]);
            }

            $employee->update($validated);
            $this->syncLatestRehireProfile($employee);

            // Automatically create a 'Probee' evaluation record if the employee becomes employed or rehired
            if (in_array($employee->status, ['employed', 'rehired_employee'])) {
                \App\Models\Evaluation::firstOrCreate(
                    ['employee_id' => $employee->id],
                    ['status' => 'Probee']
                );
            }

            // Log activity
            $this->activityLogService->logEmployeeUpdated($employee, $changes, null, $request);

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
    public function destroy(Request $request, Employee $employee)
    {
        // Log activity before deletion
        $this->activityLogService->logEmployeeDeleted($employee, null, $request);

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ]);
    }


    /**
     * Onboard employee with additional details
     */
    public function onboard(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'position' => 'required|string|max:255',
                'department' => 'required|string|max:255',
                'onboarding_date' => 'required|date',
                'job_offer_id' => 'sometimes|nullable|integer|exists:hiring_job_offers,id',
                'email_assigned' => 'sometimes|nullable|string|email|max:255',
                'access_level' => 'sometimes|nullable|string|max:255',
                'equipment_issued' => 'sometimes|nullable|string',
                'training_completed' => 'sometimes|boolean',
                'onboarding_notes' => 'sometimes|nullable|string',
                'rehire_process' => 'sometimes|boolean',
            ]);

            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            $isRehireProcess = $request->boolean('rehire_process');
            unset($validated['rehire_process']);
            $jobOfferId = $validated['job_offer_id'] ?? null;
            unset($validated['job_offer_id']);
            $jobOffer = null;

            if ($isRehireProcess) {
                $rehiredRecord = $this->saveRehireProfileOnly($employee, $validated);

                return response()->json([
                    'success' => true,
                    'message' => 'Rehire onboarding information saved successfully',
                    'data' => $rehiredRecord,
                ]);
            }

            if ($jobOfferId !== null) {
                $jobOffer = DB::table('hiring_job_offers')
                    ->where('id', $jobOfferId)
                    ->first();

                if (!$jobOffer || $jobOffer->status !== 'Accepted') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only accepted job offers can be marked as onboarded.',
                    ], 422);
                }
            }

            $employee->update($validated);
            $this->syncLatestRehireProfile($employee);

            if ($jobOffer !== null) {
                DB::table('onboarded_applicants')->updateOrInsert(
                    ['hiring_job_offer_id' => $jobOffer->id],
                    [
                        'employee_id' => $employee->id,
                        'final_interview_id' => $jobOffer->final_interview_id,
                        'applicant_name' => $jobOffer->applicant_name,
                        'position' => $validated['position'] ?? $jobOffer->position,
                        'department' => $validated['department'] ?? null,
                        'salary' => $jobOffer->salary,
                        'start_date' => $validated['onboarding_date'] ?? $jobOffer->start_date,
                        'onboarded_at' => now(),
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }

            // Automatically create a 'Probee' evaluation record upon successful onboarding
            if (in_array($employee->status, ['employed', 'rehired_employee'])) {
                \App\Models\Evaluation::firstOrCreate(
                    ['employee_id' => $employee->id],
                    ['status' => 'Probee']
                );
            }

            // Log activity
            $this->activityLogService->logEmployeeOnboarded($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee onboarded successfully',
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
     * Terminate employee with reason
     */
    public function terminate(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'termination_date' => 'required|date',
                'reason' => 'required|string|min:10|max:1000',
                'notes' => 'sometimes|nullable|string|max:1000',
                'status' => 'sometimes|in:pending,completed,cancelled,resigned',
                'exit_type' => 'sometimes|in:terminate,resigned',
                'recommended_by' => 'sometimes|nullable|string|max:255',
                'notice_mode' => 'sometimes|nullable|string|max:255',
                'notice_date' => 'sometimes|nullable|date',
                'reviewed_by' => 'sometimes|nullable|string|max:255',
                'approved_by' => 'sometimes|nullable|string|max:255',
                'approval_date' => 'sometimes|nullable|date',
            ]);

            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            $exitType = $validated['exit_type'] ?? 'terminate';

            if ($exitType === 'resigned') {
                $resigned = Resigned::create([
                    'employee_id' => $employee->id,
                    'resignation_date' => $validated['termination_date'],
                    'reason' => $validated['reason'],
                    'notes' => $validated['notes'] ?? null,
                    'status' => 'completed',
                ]);

                // Set employee status to pending until clearance is done.
                $employee->update(['status' => 'resignation_pending']);
                $this->activityLogService->logEmployeeResigned($employee, $resigned, null, $request);

                return response()->json([
                    'success' => true,
                    'message' => 'Employee resigned successfully',
                    'data' => $resigned
                ]);
            }

            // Create termination record
            $termination = Termination::create([
                'employee_id' => $employee->id,
                'termination_date' => $validated['termination_date'],
                'reason' => $validated['reason'],
                'recommended_by' => $validated['recommended_by'] ?? null,
                'notice_mode' => $validated['notice_mode'] ?? null,
                'notice_date' => $validated['notice_date'] ?? null,
                'reviewed_by' => $validated['reviewed_by'] ?? null,
                'approved_by' => $validated['approved_by'] ?? null,
                'approval_date' => $validated['approval_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'status' => $validated['status'] ?? 'completed',
            ]);

            $noticeMode = strtolower((string) ($validated['notice_mode'] ?? ''));
            $shouldSendEmailNotice = $noticeMode === 'both'
                || str_contains($noticeMode, 'email');
            $emailNoticeStatus = 'not_applicable';
            $emailNoticeError = null;

            if ($shouldSendEmailNotice && !empty($employee->email)) {
                $emailNoticeStatus = 'queued';

                // Send mail after API response to avoid blocking UI loading state.
                dispatch(function () use ($employee, $termination) {
                    try {
                        Mail::to($employee->email)->send(new TerminationNotice($employee, $termination));
                    } catch (\Throwable $mailError) {
                        Log::error('Failed to send termination notice email', [
                            'employee_id' => $employee->id,
                            'employee_email' => $employee->email,
                            'error' => $mailError->getMessage(),
                        ]);
                    }
                })->afterResponse();
            }

            // Update employee status to termination_pending until clearance is complete
            $employee->update(['status' => 'termination_pending']);

            // Log activity
            $this->activityLogService->logEmployeeTerminated($employee, $termination, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee terminated successfully',
                'data' => $termination,
                'email_notice_status' => $emailNoticeStatus,
                'email_notice_error' => $emailNoticeError,
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
     * Get all terminations
     */
    public function getTerminations()
    {
        try {
            $terminations = Termination::with('employee')->orderByDesc('created_at')->get();

            return response()->json([
                'success' => true,
                'data' => $terminations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch terminations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all resigned records
     */
    public function getResigned()
    {
        try {
            $resigned = Resigned::with('employee')->orderByDesc('created_at')->get();

            return response()->json([
                'success' => true,
                'data' => $resigned
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch resigned records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Re-hire / Restore terminated employee
     */
    public function rehire(Request $request, $id)
    {
        try {
            $employee = Employee::find($id);
            $sourceType = $employee?->status;

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            if (!in_array($employee->status, ['terminated', 'resigned'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee is not terminated or resigned'
                ], 400);
            }

            // Put employee in re-hire setup pending status first.
            // Reset onboarding_completed and current_onboarding_batch so they must complete the process again
            $rehiredAt = $request->input('rehired_at') ? Carbon::parse($request->input('rehired_at')) : now();
            $employee->update([
                'status' => 'rehire_pending',
                'onboarding_completed' => false,
                'current_onboarding_batch' => 1,
                'rehired_at' => $rehiredAt
            ]);

            $currentId = $employee->id;
            $rehireYear = $rehiredAt->format('y');
            $idParts = explode('-', $currentId);

            if (count($idParts) === 2) {
                $idYear = $idParts[0];
                $idSequence = $idParts[1];

                if ($idYear !== $rehireYear) {
                    $newId = "{$rehireYear}-{$idSequence}";

                    // Update the ID using raw DB to bypass Eloquent PK issues
                    DB::table('employees')->where('id', $currentId)->update(['id' => $newId]);

                    // Refresh the employee model with the new ID
                    $employee = Employee::find($newId);
                }
            }

            // Update the termination records for this employee to 'cancelled' and set rehired_at
            Termination::where('employee_id', $employee->id)
                ->where('status', 'completed')
                ->latest()
                ->first()
                    ?->update([
                    'status' => 'cancelled',
                    'rehired_at' => $rehiredAt
                ]);

            Resigned::where('employee_id', $employee->id)
                ->where('status', 'completed')
                ->latest()
                ->first()
                    ?->update([
                    'status' => 'cancelled',
                    'rehired_at' => $rehiredAt
                ]);

            $rehiredRecord = Rehired::create([
                'employee_id' => $employee->id,
                'previous_employee_id' => $currentId !== $employee->id ? $currentId : null,
                'rehired_at' => $rehiredAt,
                'source_type' => in_array($sourceType, ['terminated', 'resigned'], true) ? $sourceType : null,
                'profile_snapshot' => $employee->fresh()->toArray(),
                'profile_updated_at' => now(),
            ]);

            // Log activity
            $this->activityLogService->logEmployeeRehired($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee re-hired successfully',
                'data' => $employee,
                'rehired' => $rehiredRecord,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to re-hire employee',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all rehired records
     */
    public function getRehired()
    {
        try {
            $rehired = Rehired::with('employee')->orderByDesc('rehired_at')->get();

            return response()->json([
                'success' => true,
                'data' => $rehired,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch rehired records',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
