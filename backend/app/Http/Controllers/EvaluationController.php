<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Evaluation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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
            'score_1_breakdown' => 'nullable|array',
            'agreement_1' => 'nullable|in:agree,disagree',
            'comment_1' => 'nullable|string',
            'signature_1' => 'nullable|string',
            'remarks_1' => 'nullable|string',
            'rated_by' => 'nullable|string',
            'reviewed_by' => 'nullable|string',
            'approved_by' => 'nullable|string',
            'score_2' => 'nullable|integer',
            'score_2_breakdown' => 'nullable|array',
            'agreement_2' => 'nullable|in:agree,disagree',
            'comment_2' => 'nullable|string',
            'signature_2' => 'nullable|string',
            'remarks_2' => 'nullable|string',
            'rated_by_2' => 'nullable|string',
            'reviewed_by_2' => 'nullable|string',
            'approved_by_2' => 'nullable|string',
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

    public function downloadPdf(Request $request, string $employeeId)
    {
        $employee = Employee::findOrFail($employeeId);
        $evaluation = Evaluation::where('employee_id', $employeeId)->firstOrFail();

        $viewMode = (string) $request->query('view', 'current');
        if (!in_array($viewMode, ['first', 'second', 'both', 'current'], true)) {
            $viewMode = 'current';
        }

        $payload = $this->buildPdfPayload($employee, $evaluation, $viewMode);

        // Long bond paper: 8.5in x 13in (portrait)
        $pdf = Pdf::loadView('pdf.evaluation', $payload)->setPaper([0, 0, 612, 936], 'portrait');
        $filename = 'evaluation_' . $employee->id . '_' . now()->format('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }

    public function emailPdf(Request $request, string $employeeId)
    {
        $employee = Employee::findOrFail($employeeId);
        $evaluation = Evaluation::where('employee_id', $employeeId)->firstOrFail();

        $recipient = trim((string) ($employee->email_address ?: $employee->email));
        if ($recipient === '') {
            return response()->json([
                'success' => false,
                'message' => 'Employee has no email address.',
            ], 422);
        }

        $viewMode = (string) $request->input('view', 'current');
        if (!in_array($viewMode, ['first', 'second', 'both', 'current'], true)) {
            $viewMode = 'current';
        }

        $payload = $this->buildPdfPayload($employee, $evaluation, $viewMode);
        // Long bond paper: 8.5in x 13in (portrait)
        $pdf = Pdf::loadView('pdf.evaluation', $payload)->setPaper([0, 0, 612, 936], 'portrait');
        $pdfBinary = $pdf->output();
        $filename = 'evaluation_' . $employee->id . '.pdf';

        Mail::send([], [], function ($message) use ($recipient, $employee, $pdfBinary, $filename) {
            $fullName = trim((string) ($employee->first_name . ' ' . $employee->last_name));
            $message
                ->to($recipient)
                ->subject('Performance Appraisal PDF - ' . ($fullName !== '' ? $fullName : $employee->id))
                ->text("Hello,\n\nAttached is your performance appraisal PDF.\n\nRegards,\nABIC Realty")
                ->attachData($pdfBinary, $filename, ['mime' => 'application/pdf']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Evaluation PDF sent to employee email.',
        ]);
    }

    private function buildPdfPayload(Employee $employee, Evaluation $evaluation, string $viewMode): array
    {
        $criteria = [
            ['id' => 'work_attitude', 'label' => '1. WORK ATTITUDE', 'desc' => 'How does an employee feel about his/her job? Is he/she interested in his/her work? Does the employee work hard? Is he alert and resourceful?'],
            ['id' => 'job_knowledge', 'label' => '2. KNOWLEDGE OF THE JOB', 'desc' => 'Does he know the requirements of the job he is working on?'],
            ['id' => 'quality_of_work', 'label' => '3. QUALITY OF WORK', 'desc' => 'Is he accurate, thorough and neat? Consider working habits. Extent to which decision and action are based on facts and sound reasoning and weighing of outcome?'],
            ['id' => 'handle_workload', 'label' => '4. ABILITY TO HANDLE ASSIGNED WORKLOAD', 'desc' => 'Consider working habits. Is work completed on time? Do you have to follow up?'],
            ['id' => 'work_with_supervisor', 'label' => '5. ABILITY TO WORK WITH SUPERVISOR', 'desc' => 'Consider working relationship / Interaction with superior?'],
            ['id' => 'work_with_coemployees', 'label' => '6. ABILITY TO WORK WITH CO-EMPLOYEE', 'desc' => 'Can he work harmoniously with others?'],
            ['id' => 'attendance', 'label' => '7. ATTENDANCE (ABSENCES/TARDINESS/UNDERTIME)', 'desc' => 'Is he regular and punctual in his attendance? What is his attitude towards time lost?'],
            ['id' => 'compliance', 'label' => '8. COMPLIANCE WITH COMPANY RULES AND REGULATIONS', 'desc' => 'Does the employee follow the company\'s rules and regulations at all times?'],
            ['id' => 'grooming', 'label' => '9. GROOMING AND APPEARANCE', 'desc' => 'Does he wear his uniform completely and neatly? Is he clean and neat?'],
            ['id' => 'communication', 'label' => '10. COMMUNICATION SKILLS', 'desc' => 'How successful is he in expressing himself orally, verbally and in written form?'],
        ];

        $firstBreakdown = $this->normalizeBreakdown($evaluation->score_1_breakdown, $evaluation->score_1, $criteria);
        $secondBreakdown = $this->normalizeBreakdown($evaluation->score_2_breakdown, $evaluation->score_2, $criteria);

        $showFirst = $viewMode === 'both' || $viewMode === 'first' || $viewMode === 'current';
        $showSecond = $viewMode === 'both' || $viewMode === 'second' || ($viewMode === 'current' && $evaluation->score_1 !== null && (int) $evaluation->score_1 <= 30);

        if ($viewMode === 'first') {
            $showSecond = false;
        }
        if ($viewMode === 'second') {
            $showFirst = false;
            $showSecond = true;
        }

        $hiredDate = $employee->date_hired ? \Carbon\Carbon::parse($employee->date_hired) : null;
        $firstEvalDate = $hiredDate ? $hiredDate->copy()->addMonths(3)->format('F d, Y (l)') : 'N/A';
        $secondEvalDate = $hiredDate ? $hiredDate->copy()->addMonths(5)->format('F d, Y (l)') : 'N/A';

        return [
            'employee' => $employee,
            'evaluation' => $evaluation,
            'criteria' => $criteria,
            'firstBreakdown' => $firstBreakdown,
            'secondBreakdown' => $secondBreakdown,
            'showFirst' => $showFirst,
            'showSecond' => $showSecond,
            'firstEvalDate' => $firstEvalDate,
            'secondEvalDate' => $secondEvalDate,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];
    }

    private function normalizeBreakdown($breakdown, ?int $totalScore, array $criteria): array
    {
        $criterionIds = array_map(fn ($c) => $c['id'], $criteria);
        $valid = is_array($breakdown) && count(array_intersect(array_keys($breakdown), $criterionIds)) > 0;
        if ($valid) {
            $result = [];
            foreach ($criterionIds as $id) {
                $value = isset($breakdown[$id]) ? (int) $breakdown[$id] : 0;
                $result[$id] = max(0, min(5, $value));
            }
            return $result;
        }

        $count = count($criterionIds);
        if ($totalScore === null) {
            return array_fill_keys($criterionIds, 0);
        }
        if ($totalScore <= 0) {
            return array_fill_keys($criterionIds, 0);
        }

        $values = array_fill(0, $count, 1);
        $remaining = max(0, min(40, $totalScore - $count));
        $index = 0;
        while ($remaining > 0) {
            if ($values[$index] < 5) {
                $values[$index] += 1;
                $remaining -= 1;
            }
            $index = ($index + 1) % $count;
        }

        $result = [];
        foreach ($criterionIds as $i => $id) {
            $result[$id] = $values[$i];
        }
        return $result;
    }
}
