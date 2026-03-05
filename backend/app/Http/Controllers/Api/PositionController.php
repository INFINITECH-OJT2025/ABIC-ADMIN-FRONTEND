<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    /**
     * Get all positions with their department info
     */
    public function index()
    {
        try {
            $positions = Position::with('department')
                ->orderBy('is_custom', 'asc')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $positions
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching positions: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error fetching positions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $position = Position::with('department')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $position
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching position: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Position not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|unique:positions,name',
                'department_id' => 'nullable|exists:departments,id',
                'is_custom' => 'boolean'
            ]);

            $position = Position::create($validated);

            return response()->json([
                'success' => true,
                'data' => $position
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error creating position: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error creating position',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bulkCreate(Request $request)
    {
        try {
            $validated = $request->validate([
                'positions' => 'required|array',
                'positions.*.name' => 'required|string',
                'positions.*.department_id' => 'nullable|exists:departments,id',
                'positions.*.is_custom' => 'boolean'
            ]);

            $created = [];
            foreach ($validated['positions'] as $posData) {
                $created[] = Position::create($posData);
            }

            return response()->json([
                'success' => true,
                'data' => $created
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Error bulk creating positions: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error creating positions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
