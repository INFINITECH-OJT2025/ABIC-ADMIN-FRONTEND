<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function index()
    {
        $evaluations = Evaluation::all();
        return response()->json([
            'success' => true,
            'data' => $evaluations
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|string',
            'score_1' => 'nullable|integer',
            'remarks_1' => 'nullable|string',
            'score_2' => 'nullable|integer',
            'remarks_2' => 'nullable|string',
            'status' => 'nullable|string',
            'regularization_date' => 'nullable|date',
        ]);

        // Calculate overall status if not provided (Prefer "Regularized" or "Probee" as per user request)
        if (!isset($validated['status'])) {
            $isScore2Passed = isset($validated['score_2']) && $validated['score_2'] >= 31;

            if ($isScore2Passed) {
                $validated['status'] = 'Regular';
            } else {
                $validated['status'] = 'Probee';
            }
        }

        $evaluation = Evaluation::updateOrCreate(
            ['employee_id' => $validated['employee_id']],
            $validated
        );

        // Update employee status if set to Regular
        if (isset($validated['status']) && $validated['status'] === 'Regular') {
            $employee = \App\Models\Employee::find($validated['employee_id']);
            if ($employee) {
                $employee->status = 'employed'; // Or 'regularized' if you prefer
                $employee->save();
            }
        }

        return response()->json([
            'success' => true,
            'data' => $evaluation,
            'message' => 'Evaluation updated and employee milestones adjusted'
        ]);
    }
}
