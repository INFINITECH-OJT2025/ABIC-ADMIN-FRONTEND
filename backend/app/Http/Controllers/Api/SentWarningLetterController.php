<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SentWarningLetter;
use Illuminate\Http\Request;

class SentWarningLetterController extends Controller
{
    /**
     * GET /api/sent-warning-letters?employee_id=X&type=late|leave
     * Returns history for a specific employee (optionally filtered by type).
     */
    public function index(Request $request)
    {
        $query = SentWarningLetter::query();

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        if ($request->filled('type')) {
            if ($request->type === 'late') {
                // Backward compatibility for older records that used "tardiness"
                $query->whereIn('type', ['late', 'tardiness']);
            } else {
                $query->where('type', $request->type);
            }
        }

        $letters = $query->orderByDesc('sent_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $letters,
        ]);
    }

    /**
     * POST /api/sent-warning-letters
     * Record a newly sent warning letter.
     */
    public function store(Request $request)
    {
        $incomingType = $request->input('type');
        $normalizedType = $incomingType === 'tardiness' ? 'late' : $incomingType;
        $request->merge(['type' => $normalizedType]);

        $validated = $request->validate([
            'employee_id'    => 'required|string',
            'employee_name'  => 'required|string',
            'type'           => 'required|in:late,leave,tardiness',
            'warning_level'  => 'required|integer|min:0',
            'month'          => 'required|string',
            'year'           => 'required|integer',
            'cutoff'         => 'required|string',
            'recipients'     => 'required|array',
            'forms_included' => 'required|array',
            'form1_body'     => 'nullable|string',
            'form2_body'     => 'nullable|string',
        ]);

        $validated['type'] = $validated['type'] === 'tardiness' ? 'late' : $validated['type'];
        $validated['warning_level'] = max(1, (int) $validated['warning_level']);

        $letter = SentWarningLetter::create($validated);

        return response()->json([
            'success' => true,
            'data'    => $letter,
        ], 201);
    }
}
