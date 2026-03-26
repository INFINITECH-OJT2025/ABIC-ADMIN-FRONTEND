<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Office::all()
        ]);
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|unique:offices']);
        $office = Office::create($request->all());
        return response()->json(['success' => true, 'data' => $office]);
    }
    public function updateBranding(Request $request, $id)
    {
        $office = Office::findOrFail($id);
        $request->validate([
            'header_logo_image' => 'nullable|string',
            'header_details' => 'nullable|string'
        ]);

        $office->update($request->only(['header_logo_image', 'header_details']));

        return response()->json([
            'success' => true,
            'message' => 'Office branding updated successfully.',
            'data' => $office
        ]);
    }

    public function destroy($id)
    {
        $office = Office::findOrFail($id);

        $departmentCount = Department::query()
            ->where('office_id', $office->id)
            ->count();

        if ($departmentCount > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete office with existing departments. Remove or reassign departments first.',
            ], 422);
        }

        $office->delete();

        return response()->json([
            'success' => true,
            'message' => 'Office deleted successfully.',
        ]);
    }
}
