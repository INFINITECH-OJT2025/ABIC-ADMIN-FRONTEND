<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Hierarchy;

class HierarchyController extends Controller
{
    public function index()
    {
        $hierarchies = Hierarchy::with(['department'])->get();
        return response()->json($hierarchies);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'parent_id' => 'nullable|exists:hierarchies,id',
            'is_custom' => 'boolean'
        ]);

        $hierarchy = Hierarchy::create([
            'name' => $validated['name'],
            'is_custom' => $validated['is_custom'] ?? true,
            'department_id' => $validated['department_id'],
            'parent_id' => $validated['parent_id']
        ]);

        return response()->json($hierarchy->load(['department']), 201);
    }

    public function update(Request $request, $id)
    {
        $hierarchy = Hierarchy::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'parent_id' => 'nullable|exists:hierarchies,id'
        ]);

        $hierarchy->update($validated);

        return response()->json($hierarchy->load(['department']));
    }

    public function destroy($id)
    {
        $hierarchy = Hierarchy::findOrFail($id);
        
        // When deleting a hierarchy node, move its children to its parent
        Hierarchy::where('parent_id', $hierarchy->id)
            ->update(['parent_id' => $hierarchy->parent_id]);

        $hierarchy->delete();
        return response()->json(null, 204);
    }
}
