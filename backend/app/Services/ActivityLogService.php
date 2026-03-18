<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogService
{
    /**
     * Log an activity
     */
    public function log(array $data, ?Request $request = null)
    {
        $logData = array_merge($data, [
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);

        return ActivityLog::create($logData);
    }

    /**
     * Log employee creation
     */
    public function logEmployeeCreated($employee, $performedBy = null, ?Request $request = null)
    {
        $actorName = $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'System';

        return $this->log([
            'activity_type' => 'employee',
            'action' => 'created',
            'status' => 'success',
            'title' => 'Employee Record Added',
            'description' => "{$employee->first_name} {$employee->last_name} profile was added by {$actorName}",
            'user_id' => $performedBy?->id,
            'user_name' => $actorName,
            'user_email' => $performedBy?->email ?? 'system@abic.com',
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'employee_email' => $employee->email,
                'employee_name' => "{$employee->first_name} {$employee->last_name}",
                'inserted_by' => $actorName,
            ],
        ], $request);
    }

    /**
     * Log employee update
     */
    public function logEmployeeUpdated($employee, $changes = [], $performedBy = null, ?Request $request = null)
    {
        $changedFields = array_keys($changes);
        $fieldsList = implode(', ', $changedFields);
        $employeeName = "{$employee->first_name} {$employee->last_name}";

        return $this->log([
            'activity_type' => 'employee',
            'action' => 'updated',
            'status' => 'success',
            'title' => 'Employee Profile Updated',
            'description' => "{$employeeName} profile was updated",
            'user_id' => $performedBy?->id ?? $employee->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : $employeeName,
            'user_email' => $performedBy?->email ?? $employee->email,
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'changes' => $changes,
                'changed_fields' => $changedFields,
                'changed_fields_text' => $fieldsList,
                'employee_name' => $employeeName,
            ],
        ], $request);
    }

    /**
     * Log employee deletion
     */
    public function logEmployeeDeleted($employee, $performedBy = null, ?Request $request = null)
    {
        $actorName = $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin';

        return $this->log([
            'activity_type' => 'employee',
            'action' => 'deleted',
            'status' => 'error',
            'title' => 'Employee Deleted',
            'description' => "{$employee->first_name} {$employee->last_name} profile was deleted by {$actorName}",
            'user_id' => $performedBy?->id,
            'user_name' => $actorName,
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'employee_email' => $employee->email,
                'employee_name' => "{$employee->first_name} {$employee->last_name}",
                'deleted_by' => $actorName,
            ],
        ], $request);
    }

    /**
     * Log employee onboarding
     */
    public function logEmployeeOnboarded($employee, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'employee',
            'action' => 'onboarded',
            'status' => 'success',
            'title' => 'Employee Onboarded',
            'description' => "{$employee->first_name} {$employee->last_name} has been successfully onboarded",
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'HR Manager',
            'user_email' => $performedBy?->email ?? 'hr@abic.com',
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'position' => $employee->position,
                'department' => $employee->department,
            ],
        ], $request);
    }

    /**
     * Log employee termination
     */
    public function logEmployeeTerminated($employee, $termination, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'employee',
            'action' => 'terminated',
            'status' => 'error',
            'title' => 'Employee Termination',
            'description' => "{$employee->first_name} {$employee->last_name} has been terminated",
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin',
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'termination_date' => $termination->termination_date,
                'reason' => $termination->reason,
            ],
        ], $request);
    }

    /**
     * Log employee resignation
     */
    public function logEmployeeResigned($employee, $resigned, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'employee',
            'action' => 'resigned',
            'status' => 'error',
            'title' => 'Employee Resignation',
            'description' => "{$employee->first_name} {$employee->last_name} has resigned",
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin',
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'resignation_date' => $resigned->resignation_date,
                'reason' => $resigned->reason,
            ],
        ], $request);
    }

    /**
     * Log employee re-hire
     */
    public function logEmployeeRehired($employee, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'employee',
            'action' => 'updated',
            'status' => 'success',
            'title' => 'Employee Re-hired',
            'description' => "{$employee->first_name} {$employee->last_name} has been re-hired/restored to the system",
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin',
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'employee_email' => $employee->email,
                'employee_name' => "{$employee->first_name} {$employee->last_name}",
            ],
        ], $request);
    }

    /**
     * Log login attempt
     */
    public function logLogin($employee, $success = true, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'auth',
            'action' => 'login',
            'status' => $success ? 'success' : 'error',
            'title' => $success ? 'Successful Login' : 'Failed Login Attempt',
            'description' => $success
                ? "{$employee->first_name} {$employee->last_name} logged in successfully"
                : "Failed login attempt for {$employee->email}",
            'user_id' => $employee->id,
            'user_name' => "{$employee->first_name} {$employee->last_name}",
            'user_email' => $employee->email,
            'target_id' => $employee->id,
            'target_type' => 'Employee',
        ], $request);
    }

    /**
     * Log password change
     */
    public function logPasswordChange($employee, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'auth',
            'action' => 'password_changed',
            'status' => 'success',
            'title' => 'Password Changed',
            'description' => "{$employee->first_name} {$employee->last_name} changed their password",
            'user_id' => $performedBy?->id ?? $employee->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : "{$employee->first_name} {$employee->last_name}",
            'user_email' => $performedBy?->email ?? $employee->email,
            'target_id' => $employee->id,
            'target_type' => 'Employee',
        ], $request);
    }

    /**
     * Log department action
     */
    public function logDepartmentAction($action, $department, $performedBy = null, ?Request $request = null)
    {
        $titles = [
            'created' => 'Department Created',
            'updated' => 'Department Updated',
            'deleted' => 'Department Deleted',
        ];

        $statuses = [
            'created' => 'success',
            'updated' => 'info',
            'deleted' => 'error',
        ];

        return $this->log([
            'activity_type' => 'department',
            'action' => $action,
            'status' => $statuses[$action] ?? 'info',
            'title' => $titles[$action] ?? 'Department Action',
            'description' => "Department '{$department->name}' was {$action}",
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin',
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'target_id' => $department->id,
            'target_type' => 'Department',
            'metadata' => [
                'department_name' => $department->name,
            ],
        ], $request);
    }

    /**
     * Log position action
     */
    public function logPositionAction($action, $position, $performedBy = null, ?Request $request = null)
    {
        $titles = [
            'created' => 'Position Created',
            'updated' => 'Position Updated',
            'deleted' => 'Position Deleted',
        ];

        $statuses = [
            'created' => 'success',
            'updated' => 'info',
            'deleted' => 'error',
        ];

        return $this->log([
            'activity_type' => 'position',
            'action' => $action,
            'status' => $statuses[$action] ?? 'info',
            'title' => $titles[$action] ?? 'Position Action',
            'description' => "Position '{$position->title}' was {$action}",
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin',
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'target_id' => $position->id,
            'target_type' => 'Position',
            'metadata' => [
                'position_title' => $position->title,
            ],
        ], $request);
    }

    /**
     * Log attendance action
     */
    public function logAttendanceAction($action, $details, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'attendance',
            'action' => $action,
            'status' => $details['status'] ?? 'info',
            'title' => $details['title'],
            'description' => $details['description'],
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'System',
            'user_email' => $performedBy?->email ?? 'system@abic.com',
            'metadata' => $details['metadata'] ?? [],
        ], $request);
    }

    /**
     * Log system action
     */
    public function logSystemAction($action, $title, $description, $status = 'info', ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'system',
            'action' => $action,
            'status' => $status,
            'title' => $title,
            'description' => $description,
            'user_name' => 'System',
            'user_email' => 'system@abic.com',
        ], $request);
    }

    /**
     * Log employee approval
     */
    public function logEmployeeApproved($employee, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'employee',
            'action' => 'approved',
            'status' => 'success',
            'title' => 'Employee Approved',
            'description' => "{$employee->first_name} {$employee->last_name} has been approved and activated",
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin',
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'target_id' => $employee->id,
            'target_type' => 'Employee',
            'metadata' => [
                'employee_email' => $employee->email,
                'employee_name' => "{$employee->first_name} {$employee->last_name}",
                'position' => $employee->position,
            ],
        ], $request);
    }

    /**
     * Log tardiness action (year added, entry added, etc.)
     */
    public function logTardinessAction($action, $details, $performedBy = null, ?Request $request = null)
    {
        return $this->log([
            'activity_type' => 'attendance',
            'action' => $action,
            'status' => $details['status'] ?? 'success',
            'title' => $details['title'],
            'description' => $details['description'],
            'user_id' => $performedBy?->id,
            'user_name' => $performedBy ? "{$performedBy->first_name} {$performedBy->last_name}" : 'Admin',
            'user_email' => $performedBy?->email ?? 'admin@abic.com',
            'metadata' => $details['metadata'] ?? [],
        ], $request);
    }
}
