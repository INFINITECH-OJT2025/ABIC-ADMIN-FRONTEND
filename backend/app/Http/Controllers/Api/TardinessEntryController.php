<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TardinessEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TardinessEntryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $month = $request->query('month');
            $year = $request->query('year');

            if (!$month || !$year) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Month and Year are required'
                ], 400);
            }

            $results = TardinessEntry::with('employee.evaluation')
                ->where('month', $month)
                ->where('year', (int)$year)
                ->orderBy('date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true, 
                'data' => $results
            ]);
        } catch (\Exception $e) {
            Log::error('API Error in TardinessEntryController@index:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false, 
                'message' => 'Failed to fetch tardiness entries'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'employeeId' => 'required',
                'employeeName' => 'required|string',
                'date' => 'required|date',
                'actualIn' => 'required|string',
                'minutesLate' => 'required|integer',
                'warningLevel' => 'sometimes|integer',
                'cutoffPeriod' => 'required|in:cutoff1,cutoff2',
                'month' => 'required|string',
                'year' => 'required|integer',
            ]);

            $entry = TardinessEntry::create([
                'employee_id' => $validated['employeeId'],
                'employee_name' => $validated['employeeName'],
                'date' => $validated['date'],
                'actual_in' => $validated['actualIn'],
                'minutes_late' => $validated['minutesLate'],
                'warning_level' => $validated['warningLevel'] ?? 0,
                'cutoff_period' => $validated['cutoffPeriod'],
                'month' => $validated['month'],
                'year' => $validated['year'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tardiness entry saved successfully',
                'data' => $entry
            ], 201);
        } catch (\Exception $e) {
            Log::error('API Error in TardinessEntryController@store:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false, 
                'message' => 'Failed to save tardiness entry'
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            $entry = TardinessEntry::find($id);
            if (!$entry) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Entry not found'
                ], 404);
            }

            $validated = $request->validate([
                'actualIn' => 'sometimes|string',
                'minutesLate' => 'sometimes|integer',
                'warningLevel' => 'sometimes|integer',
            ]);

            if (isset($validated['actualIn'])) {
                $entry->actual_in = $validated['actualIn'];
            }
            if (isset($validated['minutesLate'])) {
                $entry->minutes_late = $validated['minutesLate'];
            }
            if (isset($validated['warningLevel'])) {
                $entry->warning_level = $validated['warningLevel'];
            }

            $entry->save();

            return response()->json([
                'success' => true,
                'message' => 'Tardiness entry updated successfully',
                'data' => $entry
            ]);
        } catch (\Exception $e) {
            Log::error('API Error in TardinessEntryController@update:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false, 
                'message' => 'Failed to update tardiness entry'
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            $entry = TardinessEntry::find($id);
            if (!$entry) {
                return response()->json([
                    'success' => false, 
                    'message' => 'Entry not found'
                ], 404);
            }

            $entry->delete();

            return response()->json([
                'success' => true,
                'message' => 'Tardiness entry deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('API Error in TardinessEntryController@destroy:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false, 
                'message' => 'Failed to delete tardiness entry'
            ], 500);
        }
    }

    /**
     * Get unique years from tardiness entries.
     */
    public function years()
    {
        try {
            $years = TardinessEntry::distinct()->pluck('year')->toArray();
            if (empty($years)) {
                $years = [(int)date('Y')];
            }
            sort($years);
            return response()->json([
                'success' => true,
                'data' => $years
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false, 
                'message' => 'Failed to fetch years'
            ], 500);
        }
    }
}
