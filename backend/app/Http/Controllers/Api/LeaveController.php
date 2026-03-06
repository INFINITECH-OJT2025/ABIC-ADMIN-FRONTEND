<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LeaveEntry;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveEntry::with('employee.evaluation');

        if ($request->has('month') && $request->has('year')) {
            $query->whereMonth('start_date', $request->month)
                  ->whereYear('start_date', $request->year);
        }

        $entries = $query->orderBy('start_date', 'desc')
                         ->orderBy('created_at', 'desc')
                         ->get();

        return response()->json([
            'success' => true,
            'data' => $entries,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_name' => 'required|string',
            'category' => 'required|string',
            'start_date' => 'required|date',
            'leave_end_date' => 'required|date',
            'approved_by' => 'required|string',
            'remarks' => 'required|string',
        ]);

        try {
            $leave = new LeaveEntry();
            $leave->employee_id = $request->employee_id ?? null;
            $leave->employee_name = $request->employee_name;
            $leave->department = $request->department ?? '';
            $leave->category = $request->category;
            $leave->shift = $request->shift ?? null;
            $leave->start_date = $request->start_date;
            $leave->leave_end_date = $request->leave_end_date;
            $leave->number_of_days = $request->number_of_days ?? 0;
            $leave->approved_by = $request->approved_by;
            $leave->remarks = $request->remarks;
            $leave->cite_reason = $request->cite_reason ?? '';
            $leave->status = $request->approved_by;
            $leave->save();

            return response()->json([
                'success' => true,
                'message' => 'Leave entry saved successfully',
                'id' => $leave->id,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save leave entry: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $leave = LeaveEntry::find($id);
            
            if (!$leave) {
                return response()->json([
                    'success' => false,
                    'message' => 'No record found with ID: ' . $id,
                ], 404);
            }

            $leave->employee_id = $request->employee_id ?? $leave->employee_id;
            $leave->employee_name = $request->employee_name ?? $leave->employee_name;
            $leave->department = $request->department ?? $leave->department;
            $leave->category = $request->category ?? $leave->category;
            $leave->shift = $request->shift ?? $leave->shift;
            $leave->start_date = $request->start_date ?? $leave->start_date;
            $leave->leave_end_date = $request->leave_end_date ?? $leave->leave_end_date;
            $leave->number_of_days = $request->number_of_days ?? $leave->number_of_days;
            $leave->approved_by = $request->approved_by ?? $leave->approved_by;
            $leave->remarks = $request->remarks ?? $leave->remarks;
            $leave->cite_reason = $request->cite_reason ?? $leave->cite_reason;
            $leave->status = $request->approved_by ?? $leave->status;
            
            $leave->save();

            return response()->json([
                'success' => true,
                'message' => 'Leave entry updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update leave entry: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $leave = LeaveEntry::find($id);
            
            if (!$leave) {
                return response()->json([
                    'success' => false,
                    'message' => 'Missing record ID or not found',
                ], 400);
            }

            $leave->delete();

            return response()->json([
                'success' => true,
                'message' => 'Leave entry deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete leave entry: ' . $e->getMessage(),
            ], 500);
        }
    }
}
