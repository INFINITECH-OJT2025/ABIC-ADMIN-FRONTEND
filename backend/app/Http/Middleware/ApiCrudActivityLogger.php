<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiCrudActivityLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (!$this->shouldLog($request, $response)) {
            return $response;
        }

        try {
            $path = $request->path();
            $action = $this->resolveAction($request);
            $resource = $this->resolveResourceName($request);
            $activityType = $this->resolveActivityType($request);
            $status = in_array($action, ['deleted', 'terminated'], true) ? 'warning' : 'success';
            [$title, $description] = $this->buildLogCopy($action, $resource, $request);

            ActivityLog::create([
                'activity_type' => $activityType,
                'action' => $action,
                'status' => $status,
                'title' => $title,
                'description' => $description,
                'user_name' => 'API',
                'user_email' => 'api@abic.local',
                'target_type' => $resource,
                'metadata' => [
                    'operation' => strtoupper($request->method()),
                    'path' => $path,
                    'route_name' => $request->route()?->getName(),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Never block business operations if audit logging fails.
        }

        return $response;
    }

    private function shouldLog(Request $request, Response $response): bool
    {
        if (!$request->is('api/*')) {
            return false;
        }

        if (!in_array(strtoupper($request->method()), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return false;
        }

        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            return false;
        }

        $path = ltrim($request->path(), '/');

        if (
            str_starts_with($path, 'api/activity-logs') ||
            str_starts_with($path, 'api/employees') ||
            str_starts_with($path, 'api/departments') ||
            str_starts_with($path, 'api/login') ||
            str_starts_with($path, 'api/logout')
        ) {
            return false;
        }

        return true;
    }

    private function resolveAction(Request $request): string
    {
        $path = strtolower($request->path());

        if (str_contains($path, 'terminate')) {
            return 'terminated';
        }

        if (str_contains($path, 'rehire')) {
            return 'rehired';
        }

        if (str_contains($path, 'onboard')) {
            return 'onboarded';
        }

        return match (strtoupper($request->method())) {
            'POST' => 'inserted',
            'PUT', 'PATCH' => 'updated',
            'DELETE' => 'deleted',
            default => 'updated',
        };
    }

    private function resolveResourceName(Request $request): string
    {
        $module = $this->resolveActivityType($request);

        return ucwords(str_replace('_', ' ', $module));
    }

    private function resolveActivityType(Request $request): string
    {
        $path = strtolower((string) $request->path());

        if (str_contains($path, 'employee')) {
            return 'employee';
        }

        if (str_contains($path, 'admin-head/attendance') || str_contains($path, '/leaves')) {
            return 'attendance';
        }

        if (str_contains($path, 'tard')) {
            return 'tardiness';
        }

        if (str_contains($path, 'directory')) {
            return 'directory';
        }

        if (
            str_contains($path, 'onboarding-checklist') ||
            str_contains($path, 'clearance-checklist') ||
            str_contains($path, 'department-checklist-templates') ||
            str_contains($path, 'warning-letter') ||
            str_contains($path, 'sent-warning-letters') ||
            str_contains($path, 'evaluations')
        ) {
            return 'forms';
        }

        if (str_contains($path, 'hierarch') || str_contains($path, 'department')) {
            return 'hierarchy';
        }

        if (str_contains($path, 'hiring')) {
            return 'hiring';
        }

        if (str_contains($path, 'office-supply') || str_contains($path, 'inventory')) {
            return 'inventory';
        }

        return 'system';
    }

    private function buildLogCopy(string $action, string $resource, Request $request): array
    {
        $recordLabel = $this->extractRecordLabel($request);

        if ($action === 'inserted') {
            return [
                "{$resource} Record Added",
                $recordLabel
                    ? "{$resource} record '{$recordLabel}' was added successfully."
                    : "A {$resource} record was added successfully.",
            ];
        }

        if ($action === 'updated') {
            return [
                "{$resource} Record Updated",
                $recordLabel
                    ? "{$resource} record '{$recordLabel}' was updated successfully."
                    : "A {$resource} record was updated successfully.",
            ];
        }

        if ($action === 'deleted') {
            return [
                "{$resource} Record Deleted",
                $recordLabel
                    ? "{$resource} record '{$recordLabel}' was deleted successfully."
                    : "A {$resource} record was deleted successfully.",
            ];
        }

        if ($action === 'terminated') {
            return [
                "{$resource} Record Terminated",
                $recordLabel
                    ? "{$resource} record '{$recordLabel}' was terminated successfully."
                    : "A {$resource} record was terminated successfully.",
            ];
        }

        if ($action === 'rehired') {
            return [
                "{$resource} Record Rehired",
                $recordLabel
                    ? "{$resource} record '{$recordLabel}' was rehired successfully."
                    : "A {$resource} record was rehired successfully.",
            ];
        }

        if ($action === 'onboarded') {
            return [
                "{$resource} Record Onboarded",
                $recordLabel
                    ? "{$resource} record '{$recordLabel}' was onboarded successfully."
                    : "A {$resource} record was onboarded successfully.",
            ];
        }

        return [
            ucfirst($action) . " {$resource} Record",
            $recordLabel
                ? "{$resource} record '{$recordLabel}' was processed successfully."
                : "A {$resource} record was processed successfully.",
        ];
    }

    private function extractRecordLabel(Request $request): ?string
    {
        $firstName = trim((string) ($request->input('first_name') ?? ''));
        $lastName = trim((string) ($request->input('last_name') ?? ''));
        if ($firstName !== '' || $lastName !== '') {
            return trim("{$firstName} {$lastName}");
        }

        $preferredKeys = [
            'name',
            'title',
            'item_name',
            'itemName',
            'employee_name',
            'employeeName',
            'department_name',
            'position_title',
            'agency_name',
            'email',
            'code',
            'slug',
            'id',
            'employeeId',
            'item_id',
        ];

        foreach ($preferredKeys as $key) {
            $value = $request->input($key);
            if (is_scalar($value)) {
                $label = trim((string) $value);
                if ($label !== '') {
                    return $label;
                }
            }
        }

        $routeId = $request->route('id');
        if (is_scalar($routeId) && trim((string) $routeId) !== '') {
            return (string) $routeId;
        }

        return null;
    }
}
