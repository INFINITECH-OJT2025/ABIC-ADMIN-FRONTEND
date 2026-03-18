<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * Get paginated activity logs with filtering
     */
    public function index(Request $request)
    {
        try {
            $query = ActivityLog::query();

            // Filter by activity type
            if ($request->has('type') && $request->type !== 'all') {
                $query->ofType($request->type);
            }

            // Filter by action
            if ($request->has('action')) {
                $query->ofAction($request->action);
            }

            // Filter by status
            if ($request->has('status')) {
                $query->ofStatus($request->status);
            }

            // Search in title and description
            if ($request->has('search') && $request->search) {
                $query->search($request->search);
            }

            // Filter by date range
            if ($request->has('start_date') && $request->has('end_date')) {
                $query->dateRange($request->start_date, $request->end_date);
            }

            // Order by most recent first
            $query->orderBy('created_at', 'desc');

            // Paginate results
            $perPage = $request->get('per_page', 20);
            $activities = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $activities->items(),
                'pagination' => [
                    'current_page' => $activities->currentPage(),
                    'last_page' => $activities->lastPage(),
                    'per_page' => $activities->perPage(),
                    'total' => $activities->total(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activity logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get activity statistics
     */
    public function stats()
    {
        try {
            $totalActivities = ActivityLog::count();
            $employeeActivities = ActivityLog::ofType('employee')->count();
            $departmentActivities = ActivityLog::ofType('department')->count();
            $positionActivities = ActivityLog::ofType('position')->count();
            $attendanceActivities = ActivityLog::ofType('attendance')->count();
            $authActivities = ActivityLog::ofType('auth')->count();
            $systemActivities = ActivityLog::ofType('system')->count();

            $pendingItems = ActivityLog::ofStatus('warning')->count();
            $todayActivities = ActivityLog::today()->count();

            $successCount = ActivityLog::ofStatus('success')->count();
            $warningCount = ActivityLog::ofStatus('warning')->count();
            $errorCount = ActivityLog::ofStatus('error')->count();
            $infoCount = ActivityLog::ofStatus('info')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_activities' => $totalActivities,
                    'by_type' => [
                        'employee' => $employeeActivities,
                        'department' => $departmentActivities,
                        'position' => $positionActivities,
                        'attendance' => $attendanceActivities,
                        'auth' => $authActivities,
                        'system' => $systemActivities,
                    ],
                    'by_status' => [
                        'success' => $successCount,
                        'warning' => $warningCount,
                        'error' => $errorCount,
                        'info' => $infoCount,
                    ],
                    'pending_items' => $pendingItems,
                    'today_activities' => $todayActivities,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single activity log
     */
    public function show($id)
    {
        try {
            $activity = ActivityLog::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $activity,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Activity log not found',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Mark a single activity log as read
     */
    public function markRead($id)
    {
        try {
            $activity = ActivityLog::findOrFail($id);

            if (!$activity->read_at) {
                $activity->read_at = now();
                $activity->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Activity log marked as read',
                'data' => $activity,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark activity log as read',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get unread activity log count
     */
    public function unreadCount()
    {
        try {
            $count = ActivityLog::whereNull('read_at')->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'count' => $count,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch unread count',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mark all activity logs as read
     */
    public function markAllRead()
    {
        try {
            $updated = ActivityLog::whereNull('read_at')->update([
                'read_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'All activity logs marked as read',
                'data' => [
                    'updated_count' => $updated,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark activity logs as read',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete all activity logs
     */
    public function deleteAll()
    {
        try {
            $deleted = ActivityLog::query()->delete();

            return response()->json([
                'success' => true,
                'message' => 'All activity logs deleted',
                'data' => [
                    'deleted_count' => $deleted,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete activity logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
