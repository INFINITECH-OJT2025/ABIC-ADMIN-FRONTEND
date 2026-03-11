<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\HiringInterview;
use App\Models\HiringJobOffer;
use App\Models\HiringRequirementSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HiringController extends Controller
{
    public function interviews(Request $request)
    {
        try {
            $query = HiringInterview::query();

            if ($request->filled('stage')) {
                $query->where('stage', $request->query('stage'));

                // Final interview rows should only come from currently passed initial interviews.
                if ($request->query('stage') === 'final') {
                    $query->where(function ($subQuery) {
                        $subQuery
                            ->whereNull('initial_interview_id')
                            ->orWhereHas('initialInterview', function ($initialQuery) {
                                $initialQuery->where('status', 'PASSED');
                            });
                    });
                }
            }

            $items = $query
                ->orderBy('interview_date')
                ->orderBy('interview_time')
                ->orderByDesc('created_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $items->map(fn (HiringInterview $item) => $this->formatInterview($item)),
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@interviews failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch interviews.',
            ], 500);
        }
    }

    public function storeInterview(Request $request)
    {
        try {
            $validated = $request->validate([
                'stage' => 'required|in:initial,final',
                'applicant_name' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
                'interview_date' => 'nullable|date',
                'interview_time' => 'nullable|date_format:H:i',
                'status' => 'nullable|in:PENDING,CONFIRMED,PASSED,FAILED',
                'initial_interview_id' => 'nullable|integer|exists:hiring_interviews,id',
            ]);

            $stage = $validated['stage'];
            $status = $validated['status'] ?? 'PENDING';

            if ($stage === 'initial') {
                if (empty($validated['applicant_name'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Applicant name is required for initial interview.',
                    ], 422);
                }

                $duplicateResponse = $this->validateInitialApplicantNameUniqueness((string) $validated['applicant_name']);
                if ($duplicateResponse) {
                    return $duplicateResponse;
                }

                $slotResponse = $this->validateInitialPositionHasAvailableSlots((string) ($validated['position'] ?? ''));
                if ($slotResponse) {
                    return $slotResponse;
                }
            }

            if ($stage === 'final') {
                $initialId = $validated['initial_interview_id'] ?? null;
                if (!$initialId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Initial interview selection is required for final interview.',
                    ], 422);
                }

                $initial = HiringInterview::where('id', $initialId)
                    ->where('stage', 'initial')
                    ->where('status', 'PASSED')
                    ->first();

                if (!$initial) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Only passed initial interviews can be moved to final interview.',
                    ], 422);
                }

                $existingFinal = HiringInterview::where('stage', 'final')
                    ->where('initial_interview_id', $initialId)
                    ->exists();

                if ($existingFinal) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Selected applicant already has a final interview row.',
                    ], 422);
                }

                $validated['applicant_name'] = $initial->applicant_name;
                $validated['position'] = $initial->position;
            }

            $item = HiringInterview::create([
                'applicant_name' => $validated['applicant_name'] ?? '',
                'position' => $validated['position'] ?? null,
                'stage' => $stage,
                'status' => $status,
                'interview_date' => $validated['interview_date'] ?? null,
                'interview_time' => $validated['interview_time'] ?? null,
                'initial_interview_id' => $validated['initial_interview_id'] ?? null,
                'passed_at' => $status === 'PASSED' ? now() : null,
            ]);

            if ($item->stage === 'initial') {
                $this->syncFinalInterviewFromInitial($item);
            }

            if ($item->stage === 'final') {
                $this->syncJobOfferFromFinal($item);
            }

            return response()->json([
                'success' => true,
                'message' => 'Interview row saved.',
                'data' => $this->formatInterview($item),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('HiringController@storeInterview failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save interview row.',
            ], 500);
        }
    }

    public function updateInterview(Request $request, int $id)
    {
        try {
            $item = HiringInterview::find($id);
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Interview row not found.',
                ], 404);
            }

            $validated = $request->validate([
                'applicant_name' => 'nullable|string|max:255',
                'position' => 'nullable|string|max:255',
                'interview_date' => 'nullable|date',
                'interview_time' => 'nullable|date_format:H:i',
                'status' => 'nullable|in:PENDING,CONFIRMED,PASSED,FAILED',
                'initial_interview_id' => 'nullable|integer|exists:hiring_interviews,id',
            ]);

            if ($item->stage === 'final') {
                if (array_key_exists('initial_interview_id', $validated)) {
                    $initialId = $validated['initial_interview_id'];
                    if (!$initialId) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Initial interview selection is required for final interview.',
                        ], 422);
                    }

                    $initial = HiringInterview::where('id', $initialId)
                        ->where('stage', 'initial')
                        ->where('status', 'PASSED')
                        ->first();

                    if (!$initial) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Only passed initial interviews can be moved to final interview.',
                        ], 422);
                    }

                    $existingFinal = HiringInterview::where('stage', 'final')
                        ->where('initial_interview_id', $initialId)
                        ->where('id', '!=', $item->id)
                        ->exists();

                    if ($existingFinal) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Selected applicant already has a final interview row.',
                        ], 422);
                    }

                    $item->initial_interview_id = $initialId;
                    $item->applicant_name = $initial->applicant_name;
                    $item->position = $initial->position;
                }
            } else {
                if (array_key_exists('applicant_name', $validated)) {
                    $duplicateResponse = $this->validateInitialApplicantNameUniqueness(
                        (string) ($validated['applicant_name'] ?? ''),
                        $item->id
                    );
                    if ($duplicateResponse) {
                        return $duplicateResponse;
                    }

                    $item->applicant_name = $validated['applicant_name'] ?? '';
                }
                if (array_key_exists('position', $validated)) {
                    $nextPosition = (string) ($validated['position'] ?? '');
                    $currentPosition = (string) ($item->position ?? '');

                    if (strtolower(trim($nextPosition)) !== strtolower(trim($currentPosition))) {
                        $slotResponse = $this->validateInitialPositionHasAvailableSlots($nextPosition);
                        if ($slotResponse) {
                            return $slotResponse;
                        }
                    }

                    $item->position = $validated['position'];
                }
            }

            if (array_key_exists('interview_date', $validated)) {
                $item->interview_date = $validated['interview_date'];
            }
            if (array_key_exists('interview_time', $validated)) {
                $item->interview_time = $validated['interview_time'];
            }
            if (array_key_exists('status', $validated)) {
                $item->status = $validated['status'];
                $item->passed_at = $validated['status'] === 'PASSED' ? now() : null;
            }

            $item->save();

            if ($item->stage === 'initial') {
                $this->syncFinalInterviewFromInitial($item);
            }

            if ($item->stage === 'final') {
                $this->syncJobOfferFromFinal($item);
            }

            if ($item->stage === 'final' && $item->status !== 'PASSED') {
                // A non-passed final interview cannot keep an attached job offer.
                HiringJobOffer::where('final_interview_id', $item->id)->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Interview row updated.',
                'data' => $this->formatInterview($item),
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@updateInterview failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update interview row.',
            ], 500);
        }
    }

    public function finalCandidates()
    {
        try {
            $items = HiringInterview::where('stage', 'initial')
                ->where('status', 'PASSED')
                ->orderBy('applicant_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $items->map(fn (HiringInterview $item) => [
                    'id' => $item->id,
                    'applicant_name' => $item->applicant_name,
                    'position' => $item->position,
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@finalCandidates failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch final interview candidates.',
            ], 500);
        }
    }

    public function summaries()
    {
        try {
            $items = HiringRequirementSummary::orderBy('position')->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@summaries failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch hiring summary rows.',
            ], 500);
        }
    }

    public function storeSummary(Request $request)
    {
        try {
            $validated = $request->validate([
                'position' => 'required|string|max:255',
                'required_headcount' => 'required|integer|min:0',
                'hired' => 'required|integer|min:0',
                'last_update' => 'nullable|date',
            ]);

            $required = (int)$validated['required_headcount'];
            $hired = (int)$validated['hired'];

            $item = HiringRequirementSummary::create([
                'position' => $validated['position'],
                'required_headcount' => $required,
                'hired' => $hired,
                'remaining' => max($required - $hired, 0),
                'last_update' => $validated['last_update'] ?? now()->toDateString(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Hiring summary row saved.',
                'data' => $item,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('HiringController@storeSummary failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save hiring summary row.',
            ], 500);
        }
    }

    public function updateSummary(Request $request, int $id)
    {
        try {
            $item = HiringRequirementSummary::find($id);
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hiring summary row not found.',
                ], 404);
            }

            $validated = $request->validate([
                'position' => 'nullable|string|max:255',
                'required_headcount' => 'nullable|integer|min:0',
                'hired' => 'nullable|integer|min:0',
                'last_update' => 'nullable|date',
            ]);

            if (array_key_exists('position', $validated)) {
                $item->position = $validated['position'] ?? $item->position;
            }
            if (array_key_exists('required_headcount', $validated)) {
                $item->required_headcount = (int)$validated['required_headcount'];
            }
            if (array_key_exists('hired', $validated)) {
                $item->hired = (int)$validated['hired'];
            }
            if (array_key_exists('last_update', $validated)) {
                $item->last_update = $validated['last_update'];
            }

            $item->remaining = max(((int)$item->required_headcount) - ((int)$item->hired), 0);
            if (!$item->last_update) {
                $item->last_update = now()->toDateString();
            }

            $item->save();

            return response()->json([
                'success' => true,
                'message' => 'Hiring summary row updated.',
                'data' => $item,
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@updateSummary failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update hiring summary row.',
            ], 500);
        }
    }

    public function jobOffers()
    {
        try {
            $items = HiringJobOffer::orderByDesc('created_at')->get();

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@jobOffers failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch job offers.',
            ], 500);
        }
    }

    public function jobOfferCandidates()
    {
        try {
            $offeredFinalIds = HiringJobOffer::pluck('final_interview_id')->all();

            $items = HiringInterview::where('stage', 'final')
                ->where('status', 'PASSED')
                ->when(!empty($offeredFinalIds), function ($query) use ($offeredFinalIds) {
                    $query->whereNotIn('id', $offeredFinalIds);
                })
                ->orderBy('applicant_name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $items->map(fn (HiringInterview $item) => [
                    'final_interview_id' => $item->id,
                    'applicant_name' => $item->applicant_name,
                    'position' => $item->position,
                ]),
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@jobOfferCandidates failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch job offer candidates.',
            ], 500);
        }
    }

    public function onboarded()
    {
        try {
            $rows = DB::table('onboarded_applicants as oa')
                ->leftJoin('employees as e', 'e.id', '=', 'oa.employee_id')
                ->leftJoin('hiring_job_offers as hjo', 'hjo.id', '=', 'oa.hiring_job_offer_id')
                ->select([
                    'oa.id',
                    'oa.applicant_name',
                    'oa.position',
                    'oa.salary',
                    'oa.start_date',
                    'e.first_name',
                    'e.last_name',
                    'hjo.applicant_name as offer_applicant_name',
                    'hjo.position as offer_position',
                    'hjo.salary as offer_salary',
                    'hjo.start_date as offer_start_date',
                ])
                ->orderByDesc('oa.start_date')
                ->orderByDesc('oa.onboarded_at')
                ->get();

            $items = $rows->map(function ($row) {
                $employeeName = trim(($row->first_name ?? '') . ' ' . ($row->last_name ?? ''));
                return [
                    'id' => $row->id,
                    'name' => trim((string) ($row->applicant_name ?: $row->offer_applicant_name ?: $employeeName)),
                    'position' => $row->position ?: $row->offer_position,
                    'salary' => $row->salary ?? $row->offer_salary,
                    'startDate' => $row->start_date ?: $row->offer_start_date,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $items,
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@onboarded failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch onboarded list.',
            ], 500);
        }
    }

    public function storeJobOffer(Request $request)
    {
        try {
            $validated = $request->validate([
                'final_interview_id' => 'required|integer|exists:hiring_interviews,id',
                'salary' => 'nullable|numeric|min:0|max:9999999999.99',
                'offer_sent' => 'nullable|date',
                'response_date' => 'nullable|date',
                'status' => 'nullable|in:Pending,Accepted,Declined',
                'start_date' => 'nullable|date',
            ]);

            $finalInterview = HiringInterview::where('id', $validated['final_interview_id'])
                ->where('stage', 'final')
                ->where('status', 'PASSED')
                ->first();

            if (!$finalInterview) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job offer can only be created from passed final interview.',
                ], 422);
            }

            $exists = HiringJobOffer::where('final_interview_id', $finalInterview->id)->exists();
            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job offer already exists for selected applicant.',
                ], 422);
            }

            $item = HiringJobOffer::create([
                'final_interview_id' => $finalInterview->id,
                'applicant_name' => $finalInterview->applicant_name,
                'position' => $finalInterview->position,
                'salary' => $validated['salary'] ?? null,
                'offer_sent' => $validated['offer_sent'] ?? null,
                'response_date' => $validated['response_date'] ?? null,
                'status' => $validated['status'] ?? 'Pending',
                'start_date' => $validated['start_date'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Job offer saved.',
                'data' => $item,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('HiringController@storeJobOffer failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save job offer.',
            ], 500);
        }
    }

    public function updateJobOffer(Request $request, int $id)
    {
        try {
            $item = HiringJobOffer::find($id);
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job offer not found.',
                ], 404);
            }

            $validated = $request->validate([
                'salary' => 'nullable|numeric|min:0|max:9999999999.99',
                'offer_sent' => 'nullable|date',
                'response_date' => 'nullable|date',
                'status' => 'nullable|in:Pending,Accepted,Declined',
                'start_date' => 'nullable|date',
            ]);

            if (array_key_exists('salary', $validated)) {
                $item->salary = $validated['salary'];
            }
            if (array_key_exists('offer_sent', $validated)) {
                $item->offer_sent = $validated['offer_sent'];
            }
            if (array_key_exists('response_date', $validated)) {
                $item->response_date = $validated['response_date'];
            }
            if (array_key_exists('status', $validated)) {
                $item->status = $validated['status'];
            }
            if (array_key_exists('start_date', $validated)) {
                $item->start_date = $validated['start_date'];
            }

            $item->save();

            return response()->json([
                'success' => true,
                'message' => 'Job offer updated.',
                'data' => $item,
            ]);
        } catch (\Throwable $e) {
            Log::error('HiringController@updateJobOffer failed', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update job offer.',
            ], 500);
        }
    }

    private function formatInterview(HiringInterview $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->applicant_name,
            'position' => $item->position,
            'date' => $item->interview_date ? date('Y-m-d', strtotime((string)$item->interview_date)) : null,
            'time' => $item->interview_time ? substr((string)$item->interview_time, 0, 5) : null,
            'status' => $item->status,
            'stage' => $item->stage,
            'initialInterviewId' => $item->initial_interview_id,
        ];
    }

    private function syncFinalInterviewFromInitial(HiringInterview $initial): void
    {
        if ($initial->stage !== 'initial') {
            return;
        }

        $linkedFinal = HiringInterview::where('stage', 'final')
            ->where('initial_interview_id', $initial->id)
            ->first();

        if ($initial->status === 'PASSED') {
            if ($linkedFinal) {
                // Keep final interview applicant fields in sync with initial interview source.
                $linkedFinal->applicant_name = $initial->applicant_name;
                $linkedFinal->position = $initial->position;
                $linkedFinal->save();
            } else {
                HiringInterview::create([
                    'applicant_name' => $initial->applicant_name,
                    'position' => $initial->position,
                    'stage' => 'final',
                    'status' => 'PENDING',
                    'interview_date' => null,
                    'interview_time' => null,
                    'initial_interview_id' => $initial->id,
                    'passed_at' => null,
                ]);
            }

            return;
        }

        if ($linkedFinal) {
            // If initial is no longer passed, remove linked final interview and downstream job offer.
            $linkedFinal->delete();
        }
    }

    private function syncJobOfferFromFinal(HiringInterview $final): void
    {
        if ($final->stage !== 'final') {
            return;
        }

        $existingJobOffer = HiringJobOffer::where('final_interview_id', $final->id)->first();

        if ($final->status === 'PASSED') {
            if ($existingJobOffer) {
                // Keep display fields synchronized with interview source.
                $existingJobOffer->applicant_name = $final->applicant_name;
                $existingJobOffer->position = $final->position;
                $existingJobOffer->save();
            } else {
                HiringJobOffer::create([
                    'final_interview_id' => $final->id,
                    'applicant_name' => $final->applicant_name,
                    'position' => $final->position,
                    'salary' => null,
                    'offer_sent' => null,
                    'response_date' => null,
                    'status' => 'Pending',
                    'start_date' => null,
                ]);
            }

            return;
        }

        if ($existingJobOffer) {
            $existingJobOffer->delete();
        }
    }

    private function validateInitialApplicantNameUniqueness(string $name, ?int $excludeInterviewId = null): ?JsonResponse
    {
        $normalizedName = strtolower(trim($name));

        if ($normalizedName === '') {
            return response()->json([
                'success' => false,
                'message' => 'Applicant name is required for initial interview.',
            ], 422);
        }

        $existsInInterviews = HiringInterview::query()
            ->when($excludeInterviewId, fn ($query) => $query->where('id', '!=', $excludeInterviewId))
            ->whereRaw('LOWER(TRIM(applicant_name)) = ?', [$normalizedName])
            ->exists();

        if ($existsInInterviews) {
            return response()->json([
                'success' => false,
                'message' => 'Applicant name already exists in interviews.',
            ], 422);
        }

        $existsInEmployees = Employee::query()
            ->whereRaw("LOWER(TRIM(CONCAT_WS(' ', NULLIF(TRIM(first_name), ''), NULLIF(TRIM(last_name), '')))) = ?", [$normalizedName])
            ->exists();

        if ($existsInEmployees) {
            return response()->json([
                'success' => false,
                'message' => 'Applicant name already exists in employee records.',
            ], 422);
        }

        return null;
    }

    private function validateInitialPositionHasAvailableSlots(string $position): ?JsonResponse
    {
        $normalizedPosition = strtolower(trim($position));

        if ($normalizedPosition === '') {
            return null;
        }

        $summary = HiringRequirementSummary::query()
            ->whereRaw('LOWER(TRIM(position)) = ?', [$normalizedPosition])
            ->first();

        if (!$summary) {
            return response()->json([
                'success' => false,
                'message' => 'Selected position is not in hiring requirement summary.',
            ], 422);
        }

        $requiredHeadcount = (int) $summary->required_headcount;
        $onboardedCount = (int) DB::table('onboarded_applicants')
            ->whereRaw('LOWER(TRIM(position)) = ?', [$normalizedPosition])
            ->count();

        if (($requiredHeadcount - $onboardedCount) <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'No slots left for the selected position.',
            ], 422);
        }

        return null;
    }
}
