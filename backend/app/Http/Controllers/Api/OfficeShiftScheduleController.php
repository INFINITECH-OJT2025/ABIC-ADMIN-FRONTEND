<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OfficeShiftSchedule;
use Illuminate\Http\Request;

class OfficeShiftScheduleController extends Controller
{
    /**
     * Return all shift schedules, optionally filtered by office name or ID.
     */
    public function index(Request $request)
    {
        $query = OfficeShiftSchedule::with('office');

        if ($request->filled('office_id')) {
            $query->where('office_id', $request->input('office_id'));
        } elseif ($request->filled('office_name')) {
            $query->where('office_name', $request->input('office_name'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->orderBy('office_name')->get(),
        ]);
    }

    /**
     * Update or create a shift schedule for an office.
     */
    public function upsert(Request $request)
    {
        $request->validate([
            'office_name' => 'required|string',
            'shift_options' => 'required|array',
        ]);

        $office = \App\Models\Office::where('name', $request->office_name)->first();

        $schedule = OfficeShiftSchedule::updateOrCreate(
            ['office_name' => $request->office_name],
            [
                'office_id' => $office ? $office->id : null,
                'shift_options' => $request->shift_options,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Office shift schedule updated successfully',
            'data' => $schedule,
        ]);
    }
}
