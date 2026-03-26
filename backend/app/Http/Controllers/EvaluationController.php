<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Evaluation;
use App\Models\Office;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

        $template = $this->extractTemplate($request);
        $payload = $this->buildPdfPayload($employee, $evaluation, $viewMode, $template);

        // A4 paper (portrait)
        $pdf = Pdf::loadView('pdf.evaluation', $payload)->setPaper('a4', 'portrait');
        $filename = $this->buildPdfFilename($employee);

        return $pdf->download($filename);
    }

    public function emailPdf(Request $request, string $employeeId)
    {
        try {
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

            $template = $this->extractTemplate($request);
            $payload = $this->buildPdfPayload($employee, $evaluation, $viewMode, $template);
            // A4 paper (portrait)
            $pdf = Pdf::loadView('pdf.evaluation', $payload)->setPaper('a4', 'portrait');
            $pdfBinary = $pdf->output();
            $filename = $this->buildPdfFilename($employee);

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
        } catch (\Throwable $e) {
            Log::error('Failed to send evaluation PDF email', [
                'employee_id' => $employeeId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->isLocal()
                    ? ('Unable to send evaluation email: ' . $e->getMessage())
                    : 'Unable to send evaluation email right now. Please contact support.',
            ], 500);
        }
    }

    private function buildPdfPayload(Employee $employee, Evaluation $evaluation, string $viewMode, ?array $template = null): array
    {
        $defaultTemplate = $this->getDefaultTemplate();
        $template = $this->mergeTemplate($defaultTemplate, $template);
        $office = $this->resolveOffice($employee);

        $officeId = $this->resolveOfficeId($employee);
        $officeLogos = is_array($template['officeLogos'] ?? null) ? $template['officeLogos'] : [];
        $officeNameOverrides = is_array($template['officeNameOverrides'] ?? null) ? $template['officeNameOverrides'] : [];
        if ($officeId && isset($officeLogos[$officeId]) && is_string($officeLogos[$officeId])) {
            $template['evaluationLogoImage'] = $officeLogos[$officeId];
        }

        if ($officeId && isset($officeNameOverrides[$officeId]) && is_string($officeNameOverrides[$officeId])) {
            $customOfficeName = trim($officeNameOverrides[$officeId]);
            if ($customOfficeName !== '') {
                $template['companyName'] = $customOfficeName;
            }
        }

        if (empty($template['companyName'])) {
            $officeName = $this->resolveOfficeName($employee);
            if ($officeName) {
                $template['companyName'] = $officeName;
            }
        }

        if (empty($template['headerDetails']) && !empty($office?->header_details)) {
            $template['headerDetails'] = trim((string) $office->header_details);
        }

        if (empty($template['evaluationLogoImage']) && !empty($office?->header_logo_image)) {
            $template['evaluationLogoImage'] = $office->header_logo_image;
        }

        // DomPDF image decoding depends on GD in this environment.
        // If GD is unavailable, skip logo rendering so PDF export/email still succeeds.
        if (!extension_loaded('gd')) {
            $template['evaluationLogoImage'] = null;
        }

        $criteriaDefaults = $this->getCriteriaDefaults();
        $criteriaOverrides = is_array($template['criteriaOverrides'] ?? null)
            ? $template['criteriaOverrides']
            : [];

        $criteria = [];
        foreach ($criteriaDefaults as $criterion) {
            $override = $criteriaOverrides[$criterion['id']] ?? [];
            $criteria[] = [
                'id' => $criterion['id'],
                'label' => $override['label'] ?? $criterion['label'],
                'desc' => $override['desc'] ?? $criterion['desc'],
            ];
        }

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

        $ratingScaleLines = $this->splitLines($template['ratingScaleLines'] ?? '');
        $interpretationLines = $this->splitLines($template['interpretationLines'] ?? '');

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
            'template' => $template,
            'ratingScaleLines' => $ratingScaleLines,
            'interpretationLines' => $interpretationLines,
            'generatedAt' => now()->format('F d, Y h:i A'),
        ];
    }

    private function extractTemplate(Request $request): ?array
    {
        $template = $request->input('template');
        if (is_array($template)) {
            return $template;
        }

        if (is_string($template) && trim($template) !== '') {
            $decoded = json_decode($template, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function mergeTemplate(array $default, ?array $template): array
    {
        if (!$template) {
            return $default;
        }

        $merged = array_merge($default, $template);
        $merged['criteriaOverrides'] = is_array($template['criteriaOverrides'] ?? null)
            ? $template['criteriaOverrides']
            : $default['criteriaOverrides'];

        return $merged;
    }

    private function getCriteriaDefaults(): array
    {
        return [
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
    }

    private function getDefaultTemplate(): array
    {
        return [
            'evaluationLogoImage' => null,
            'headerDetails' => null,
            'officeLogos' => [],
            'officeNameOverrides' => [],
            'companyName' => 'ABIC REALTY & CONSULTANCY CORPORATION',
            'title' => 'PERFORMANCE APPRAISAL',
            'metaNameLabel' => 'NAME',
            'metaDepartmentLabel' => 'DEPARTMENT/JOB TITLE',
            'metaRatingPeriodLabel' => 'RATING PERIOD',
            'criteriaHeader' => 'CRITERIA',
            'ratingHeader' => 'RATING',
            'criteriaOverrides' => array_reduce($this->getCriteriaDefaults(), function ($carry, $item) {
                $carry[$item['id']] = ['label' => $item['label'], 'desc' => $item['desc']];
                return $carry;
            }, []),
            'agreementText' => 'The above appraisal was discussed with me by my superior and I',
            'ratingScaleTitle' => 'EMPLOYEE SHALL BE RATED AS FOLLOWS:',
            'ratingScaleLines' => "1 - Poor\n2 - Needs Improvement\n3 - Meets Minimum Requirement\n4 - Very Satisfactory\n5 - Outstanding",
            'interpretationTitle' => 'INTERPRETATION OF TOTAL RATING SCORE:',
            'interpretationLines' => "50 - 41 Highly suitable to the position\n40 - 31 Suitable to the position\n30 - 16 Fails to meet minimum requirements of the job\n15 - 0 Employee advise to resign",
            'recommendationLabel' => 'RECOMMENDATION: REGULAR EMPLOYMENT',
            'remarksLabel' => 'COMMENTS / REMARKS:',
            'managerSignaturesTitle' => 'Manager Approval Signatures',
            'ratedByLabel' => 'Rated by:',
            'reviewedByLabel' => 'Reviewed by:',
            'approvedByLabel' => 'Approved by:',
        ];
    }

    private function splitLines(string $value): array
    {
        $lines = array_map('trim', preg_split('/\r\n|\r|\n/', $value));
        return array_values(array_filter($lines, fn($line) => $line !== ''));
    }

    private function resolveOfficeName(Employee $employee): ?string
    {
        $deptValue = (string) ($employee->department ?? '');
        if ($deptValue === '') {
            return null;
        }

        $department = Department::query()
            ->where('id', $deptValue)
            ->orWhere('name', $deptValue)
            ->first();

        if (!$department) {
            return null;
        }

        $office = Office::query()->find($department->office_id);
        return $office?->name ? trim((string) $office->name) : null;
    }

    private function resolveOfficeId(Employee $employee): ?string
    {
        $deptValue = (string) ($employee->department ?? '');
        if ($deptValue === '') {
            return null;
        }

        $department = Department::query()
            ->where('id', $deptValue)
            ->orWhere('name', $deptValue)
            ->first();

        if (!$department || !$department->office_id) {
            return null;
        }

        return (string) $department->office_id;
    }

    private function resolveOffice(Employee $employee): ?Office
    {
        $deptValue = (string) ($employee->department ?? '');
        if ($deptValue === '') {
            return null;
        }

        $department = Department::query()
            ->where('id', $deptValue)
            ->orWhere('name', $deptValue)
            ->first();

        if (!$department || !$department->office_id) {
            return null;
        }

        return Office::query()->find($department->office_id);
    }

    private function buildPdfFilename(Employee $employee): string
    {
        $lastName = trim((string) ($employee->last_name ?? ''));
        $firstName = trim((string) ($employee->first_name ?? ''));
        $idNumber = trim((string) ($employee->id ?? ''));

        $base = trim($lastName . ', ' . $firstName . '_' . $idNumber, ' ,_');
        if ($base === '') {
            $base = 'evaluation';
        }

        $safe = preg_replace('/[\\\\\\/:"*?<>|]+/', '-', $base);
        $safe = preg_replace('/\\s+/', ' ', $safe);
        $safe = trim($safe, ' .');

        return $safe . '.pdf';
    }

    private function normalizeBreakdown($breakdown, ?int $totalScore, array $criteria): array
    {
        $criterionIds = array_map(fn($c) => $c['id'], $criteria);
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
