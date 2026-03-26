<?php

namespace App\Http\Controllers;

use App\Models\DayOff;
use Illuminate\Http\Request;

class DayOffController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $schedules = DayOff::all();
        return response()->json([
            'success' => true,
            'data' => $schedules
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required',
            'employee_id' => 'required',
            'employee_name' => 'required',
            'daily_scheds' => 'nullable|array',
            'day_offs' => 'nullable|array',
        ]);

        $schedule = DayOff::updateOrCreate(
            ['schedule_id' => $request->id],
            [
                'employee_id' => $request->employee_id,
                'employee_name' => $request->employee_name,
                'daily_scheds' => $request->daily_scheds,
                'day_offs' => $request->day_offs,
            ]
        );

        return response()->json([
            'success' => true,
            'data' => $schedule
        ]);
    }

    public function destroy($id)
    {
        // $id here can be the schedule_id string or the primary key
        $schedule = DayOff::where('schedule_id', $id)->orWhere('id', $id)->first();
        
        if ($schedule) {
            $schedule->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Schedule removed'
        ]);
    }
}
