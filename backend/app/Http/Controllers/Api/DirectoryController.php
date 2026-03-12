<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\GeneralContact;
use App\Support\Validation\AppLimits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DirectoryController extends Controller
{
    private const DIRECTORY_IMAGE_MAX_BYTES = 20_971_520; // 20MB
    private const DIRECTORY_ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];

    private function directoryFolderForSection(string $sectionCode): string
    {
        $normalized = strtolower(trim($sectionCode));

        return match ($normalized) {
            'sss' => 'sss',
            'philhealth' => 'philhealth',
            'pagibig', 'pag-ibig' => 'pag-ibig',
            'tin', 'bir' => 'bir',
            'general-contacts', 'general_contacts', 'generalcontacts' => 'general-contacts',
            'user_profile', 'user-profile', 'userprofile' => 'user_profile',
            default => $this->slugSectionFolder($normalized),
        };
    }

    private function slugSectionFolder(string $value): string
    {
        $slug = preg_replace('/[^a-z0-9-]+/', '-', strtolower(trim($value)));
        $slug = trim((string) $slug, '-');
        return $slug !== '' ? $slug : 'misc';
    }

    private function directoryFolderForAgencyCode(string $code): string
    {
        return $this->directoryFolderForSection($code);
    }

    private function directoryImagesBasePath(): string
    {
        return storage_path('uploads/images');
    }

    private function normalizeFolderFilter(string $rawFolder): string
    {
        $folder = strtolower(trim(str_replace('\\', '/', $rawFolder), " \t\n\r\0\x0B/"));
        if ($folder === '') {
            return '';
        }

        if (str_starts_with($folder, 'directory/')) {
            $folder = trim(substr($folder, strlen('directory/')), '/');
        }
        if (str_starts_with($folder, 'uploads/images/')) {
            $folder = trim(substr($folder, strlen('uploads/images/')), '/');
        }
        if (str_starts_with($folder, 'storage/uploads/images/')) {
            $folder = trim(substr($folder, strlen('storage/uploads/images/')), '/');
        }

        if ($folder === '') {
            return '';
        }

        $segment = explode('/', $folder)[0] ?? '';
        return $this->directoryFolderForSection($segment);
    }

    private function normalizePublicId(string $rawPublicId): string
    {
        $normalized = trim(str_replace('\\', '/', $rawPublicId), " \t\n\r\0\x0B/");
        if ($normalized === '') {
            throw new \InvalidArgumentException('Image reference is required.');
        }

        if (str_contains($normalized, '..')) {
            throw new \InvalidArgumentException('Image reference is invalid.');
        }

        $segments = explode('/', $normalized);
        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                throw new \InvalidArgumentException('Image reference is invalid.');
            }
            if (!preg_match('/^[A-Za-z0-9._-]+$/', $segment)) {
                throw new \InvalidArgumentException('Image reference contains unsupported characters.');
            }
        }

        return implode('/', $segments);
    }

    private function isAllowedImageExtension(string $extension): bool
    {
        return in_array(strtolower(trim($extension)), self::DIRECTORY_ALLOWED_IMAGE_EXTENSIONS, true);
    }

    private function imagePathFromPublicId(string $publicId): string
    {
        $normalized = $this->normalizePublicId($publicId);
        return $this->directoryImagesBasePath() . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $normalized);
    }

    private function imageUrlFromPublicId(string $publicId, ?Request $request = null): string
    {
        $normalized = $this->normalizePublicId($publicId);
        $segments = array_map('rawurlencode', explode('/', $normalized));
        $encodedPath = implode('/', $segments);
        $relativePath = '/api/directory/images/file/' . $encodedPath;

        if ($request) {
            return rtrim($request->getSchemeAndHttpHost(), '/') . $relativePath;
        }

        return rtrim((string) config('app.url'), '/') . $relativePath;
    }

    private function inferImageDimensions(string $absolutePath): array
    {
        $size = @getimagesize($absolutePath);
        if (!is_array($size)) {
            return ['width' => null, 'height' => null];
        }

        return [
            'width' => isset($size[0]) ? (int) $size[0] : null,
            'height' => isset($size[1]) ? (int) $size[1] : null,
        ];
    }

    public function index()
    {
        $agencies = Agency::with(['contacts', 'processes'])->get();

        $hasLegacyTable = Schema::hasTable('government_contributions_processes');
        $legacyHasAgencyId = $hasLegacyTable && Schema::hasColumn('government_contributions_processes', 'agency_id');

        $rows = $agencies->map(function (Agency $agency) use ($hasLegacyTable, $legacyHasAgencyId) {
            $payload = $agency->toArray();
            $currentProcesses = collect($payload['processes'] ?? []);

            if ($currentProcesses->isNotEmpty() || !$hasLegacyTable) {
                return $payload;
            }

            $legacyQuery = DB::table('government_contributions_processes')
                ->orderBy('step_number')
                ->orderBy('id');

            if ($legacyHasAgencyId) {
                $legacyQuery->where('agency_id', $agency->id);
            } else {
                $code = strtolower((string) $agency->code);
                $legacyLabels = match ($code) {
                    'sss' => ['sss'],
                    'philhealth' => ['philhealth'],
                    'pagibig' => ['pag-ibig', 'pagibig'],
                    'tin' => ['bir (tin)', 'tin (bir)', 'bir'],
                    default => [strtolower((string) $agency->name), strtolower((string) $agency->full_name)],
                };

                $legacyQuery->where(function ($query) use ($legacyLabels) {
                    foreach ($legacyLabels as $label) {
                        $trimmed = trim((string) $label);
                        if ($trimmed === '') {
                            continue;
                        }
                        $query->orWhereRaw('LOWER(government_contribution_type) = ?', [$trimmed]);
                    }
                });
            }

            $legacyRows = $legacyQuery->get([
                'id',
                'process_type',
                'process',
                'step_number',
                'created_at',
                'updated_at',
            ]);

            $payload['processes'] = $legacyRows->map(fn($row) => [
                'id' => (int) $row->id,
                'agency_id' => (int) $agency->id,
                'process_type' => (string) ($row->process_type ?? ''),
                'process' => (string) ($row->process ?? ''),
                'step_number' => (int) ($row->step_number ?? 0),
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ])->values()->all();

            return $payload;
        })->values();

        return response()->json(['data' => $rows]);
    }

    public function update(Request $request, $code)
    {
        $agency = Agency::where('code', $code)->first();
        if (!$agency) {
            return response()->json(['message' => 'Agency record not found.'], 404);
        }

        $forbiddenTextRule = function (string $fieldLabel) {
            return function ($attribute, $value, $fail) use ($fieldLabel): void {
                if (preg_match(AppLimits::FORBIDDEN_TEXT_REGEX, (string) $value)) {
                    $fail($fieldLabel . ' contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').');
                }
            };
        };

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_AGENCY_NAME_APP_MIN,
                'max:' . AppLimits::DIRECTORY_AGENCY_NAME_APP_MAX,
                $forbiddenTextRule('Agency name'),
            ],
            'full_name' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_FULL_NAME_APP_MAX,
                $forbiddenTextRule('Full name'),
            ],
            'summary' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_SUMMARY_APP_MAX,
                $forbiddenTextRule('Summary'),
            ],
            'contacts' => 'nullable|array|max:200',
            'contacts.*.type' => [
                'required',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_TYPE_APP_MAX,
                $forbiddenTextRule('Contact type'),
            ],
            'contacts.*.label' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_LABEL_APP_MAX,
                $forbiddenTextRule('Contact label'),
            ],
            'contacts.*.value' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_CONTACT_VALUE_APP_MIN,
                'max:' . AppLimits::DIRECTORY_CONTACT_VALUE_APP_MAX,
                $forbiddenTextRule('Contact value'),
            ],
            'contacts.*.sort_order' => 'nullable|integer|min:1|max:10000',
            'processes' => 'nullable|array|max:500',
            'processes.*.process_type' => 'required|string|in:Adding,Removing',
            'processes.*.process' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_PROCESS_TEXT_APP_MIN,
                'max:' . AppLimits::DIRECTORY_PROCESS_TEXT_APP_MAX,
                $forbiddenTextRule('Process text'),
            ],
            'processes.*.step_number' => 'nullable|integer|min:1|max:10000',
        ], [
            'name.required' => 'Agency name is required.',
            'name.min' => 'Agency name must be at least ' . AppLimits::DIRECTORY_AGENCY_NAME_APP_MIN . ' characters long.',
            'name.not_regex' => 'Agency name contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'contacts.*.type.required' => 'Each contact row needs a contact type.',
            'contacts.*.value.required' => 'Each contact row needs a contact value.',
            'processes.*.process_type.in' => 'Process type must be either Adding or Removing.',
            'processes.*.process.required' => 'Each process row needs a step description.',
            'contacts.*.type.not_regex' => 'Contact type contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'contacts.*.label.not_regex' => 'Contact label contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'contacts.*.value.not_regex' => 'Contact value contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'processes.*.process.not_regex' => 'Process text contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
        ]);

        $agency->update([
            'name' => $validated['name'],
            'full_name' => $validated['full_name'],
            'summary' => $validated['summary'],
        ]);

        // Sync contacts
        if ($request->has('contacts')) {
            // Delete existing
            $agency->contacts()->delete();
            // Create new
            foreach ($request->contacts as $contact) {
                // Ensure agency_id is not manually set, as we use relationship
                $agency->contacts()->create([
                    'type' => $contact['type'],
                    'label' => $contact['label'] ?? null,
                    'value' => $contact['value'],
                    'sort_order' => $contact['sort_order'] ?? 0,
                ]);
            }
        }

        // Sync processes
        if ($request->has('processes')) {
            $agency->processes()->delete();
            foreach ($request->processes as $process) {
                $agency->processes()->create([
                    'process_type' => $process['process_type'],
                    'process' => $process['process'],
                    'step_number' => $process['step_number'] ?? 0,
                ]);
            }
        }

        return response()->json(['data' => $agency->load(['contacts', 'processes'])]);
    }

    public function uploadImage(Request $request)
    {
        $validated = $request->validate([
            'section_code' => 'required|string|max:64',
            'file' => 'required|file|max:20480|mimes:jpg,jpeg,png,gif,webp,heic,heif',
        ], [
            'section_code.required' => 'section_code is required.',
            'file.required' => 'A file is required.',
            'file.mimes' => 'Only JPG, JPEG, PNG, GIF, WebP, HEIC, and HEIF files are allowed.',
            'file.max' => 'Image size must be 20MB or less.',
        ]);

        $file = $request->file('file');
        if (!$file) {
            return response()->json(['message' => 'A file is required.'], 422);
        }

        try {
            $folder = $this->directoryFolderForSection((string) $validated['section_code']);
            $folderPath = $this->directoryImagesBasePath() . DIRECTORY_SEPARATOR . $folder;
            if (!is_dir($folderPath) && !mkdir($folderPath, 0755, true) && !is_dir($folderPath)) {
                throw new \RuntimeException('Unable to create backend image folder.');
            }

            $extension = strtolower((string) $file->getClientOriginalExtension());
            if ($extension === '') {
                $extension = strtolower((string) $file->extension());
            }
            if (!$this->isAllowedImageExtension($extension)) {
                return response()->json([
                    'message' => 'Only JPG, JPEG, PNG, GIF, WebP, HEIC, and HEIF files are allowed.',
                ], 422);
            }

            $filename = now()->format('YmdHis') . '-' . bin2hex(random_bytes(8)) . '.' . $extension;
            $file->move($folderPath, $filename);

            $publicId = $folder . '/' . $filename;
            $absolutePath = $this->imagePathFromPublicId($publicId);
            $bytes = is_file($absolutePath) ? (int) filesize($absolutePath) : (int) ($file->getSize() ?? 0);
            if ($bytes > self::DIRECTORY_IMAGE_MAX_BYTES) {
                if (is_file($absolutePath)) {
                    @unlink($absolutePath);
                }
                return response()->json(['message' => 'Image size must be 20MB or less.'], 422);
            }

            $dimensions = $this->inferImageDimensions($absolutePath);

            return response()->json([
                'secure_url' => $this->imageUrlFromPublicId($publicId, $request),
                'public_id' => $publicId,
                'format' => $extension,
                'bytes' => $bytes,
                'width' => $dimensions['width'],
                'height' => $dimensions['height'],
                'created_at' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Unable to upload directory image.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateImage(Request $request, $code)
    {
        $agency = Agency::where('code', $code)->first();
        if (!$agency) {
            return response()->json(['message' => 'Agency record not found.'], 404);
        }

        $validated = $request->validate([
            'image_url' => 'required|url|max:2048',
            'image_public_id' => 'nullable|string|max:255',
            'format' => 'nullable|string|in:jpg,jpeg,png,gif,webp,heic,heif',
            'bytes' => 'nullable|integer|min:1|max:' . self::DIRECTORY_IMAGE_MAX_BYTES,
        ], [
            'image_url.required' => 'Image URL is required.',
            'image_url.url' => 'Image URL must be a valid link.',
            'format.in' => 'Only JPG, PNG, GIF, WebP, HEIC, and HEIF images are allowed.',
            'bytes.max' => 'Image size must be 20MB or less.',
        ]);

        $finalImageUrl = $validated['image_url'];
        $finalPublicId = isset($validated['image_public_id']) && trim((string) $validated['image_public_id']) !== ''
            ? trim((string) $validated['image_public_id'])
            : null;

        if ($finalPublicId) {
            try {
                $normalizedPublicId = $this->normalizePublicId($finalPublicId);
                $expectedFolder = $this->directoryFolderForAgencyCode((string) $agency->code);
                if (!str_starts_with($normalizedPublicId, $expectedFolder . '/')) {
                    return response()->json([
                        'message' => "Selected image must be inside the {$expectedFolder} folder.",
                    ], 422);
                }

                $absolutePath = $this->imagePathFromPublicId($normalizedPublicId);
                if (!is_file($absolutePath)) {
                    return response()->json(['message' => 'Selected image does not exist in backend storage.'], 422);
                }

                $finalPublicId = $normalizedPublicId;
                $finalImageUrl = $this->imageUrlFromPublicId($normalizedPublicId, $request);
            } catch (\InvalidArgumentException $e) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
        }

        $agency->update([
            'image_url' => $finalImageUrl,
            'image_public_id' => $finalPublicId,
        ]);

        return response()->json(['data' => $agency->fresh()]);
    }

    public function listGeneralContacts()
    {
        $contacts = GeneralContact::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $contacts]);
    }

    public function updateGeneralContacts(Request $request)
    {
        $forbiddenTextRule = function (string $fieldLabel) {
            return function ($attribute, $value, $fail) use ($fieldLabel): void {
                if (preg_match(AppLimits::FORBIDDEN_TEXT_REGEX, (string) $value)) {
                    $fail($fieldLabel . ' contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').');
                }
            };
        };

        $validated = $request->validate([
            'contacts' => 'required|array|min:1|max:500',
            'contacts.*.id' => 'nullable|integer|exists:general_contacts,id',
            'contacts.*.type' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_TYPE_APP_MAX,
                $forbiddenTextRule('Contact type'),
            ],
            'contacts.*.label' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_LABEL_APP_MAX,
                $forbiddenTextRule('Contact label'),
            ],
            'contacts.*.value' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_GENERAL_VALUE_APP_MIN,
                'max:' . AppLimits::DIRECTORY_GENERAL_VALUE_APP_MAX,
                $forbiddenTextRule('Contact value'),
            ],
            'contacts.*.establishment_name' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_GENERAL_ESTABLISHMENT_APP_MIN,
                'max:' . AppLimits::DIRECTORY_GENERAL_ESTABLISHMENT_APP_MAX,
                $forbiddenTextRule('Establishment name'),
            ],
            'contacts.*.services' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_GENERAL_SERVICES_APP_MAX,
                $forbiddenTextRule('Services'),
            ],
            'contacts.*.contact_person' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_GENERAL_CONTACT_PERSON_APP_MAX,
                $forbiddenTextRule('Contact person'),
            ],
            'contacts.*.sort_order' => 'nullable|integer|min:1|max:10000',
            'contacts.*.avatar_url' => 'nullable|url|max:2048',
            'contacts.*.avatar_public_id' => 'nullable|string|max:255',
        ], [
            'contacts.required' => 'Please provide at least one general contact entry.',
            'contacts.min' => 'Please provide at least one general contact entry.',
            'contacts.*.establishment_name.required' => 'Each row needs an establishment name.',
            'contacts.*.value.required' => 'Each row needs a contact value.',
            'contacts.*.avatar_url.url' => 'Avatar URL must be a valid link.',
        ]);

        $contacts = $validated['contacts'] ?? [];
        try {
            $contacts = array_map(function (array $contact) use ($request): array {
                $avatarPublicId = isset($contact['avatar_public_id']) && trim((string) $contact['avatar_public_id']) !== ''
                    ? trim((string) $contact['avatar_public_id'])
                    : null;

                if ($avatarPublicId === null) {
                    return $contact;
                }

                $normalizedAvatarPublicId = $this->normalizePublicId($avatarPublicId);
                $expectedFolder = $this->directoryFolderForSection('general-contacts');
                if (!str_starts_with($normalizedAvatarPublicId, $expectedFolder . '/')) {
                    throw new \InvalidArgumentException("General contact avatars must be inside the {$expectedFolder} folder.");
                }

                $absolutePath = $this->imagePathFromPublicId($normalizedAvatarPublicId);
                if (!is_file($absolutePath)) {
                    throw new \InvalidArgumentException('Selected avatar image does not exist in backend storage.');
                }

                $contact['avatar_public_id'] = $normalizedAvatarPublicId;
                $contact['avatar_url'] = $this->imageUrlFromPublicId($normalizedAvatarPublicId, $request);

                return $contact;
            }, $contacts);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        DB::transaction(function () use ($contacts): void {
            $incomingIds = collect($contacts)
                ->pluck('id')
                ->filter(fn ($id) => $id !== null)
                ->map(fn ($id) => (int) $id)
                ->values();

            if ($incomingIds->isEmpty()) {
                GeneralContact::query()->delete();
            } else {
                GeneralContact::query()
                    ->whereNotIn('id', $incomingIds)
                    ->delete();
            }

            foreach ($contacts as $index => $contact) {
                $payload = [
                    'type' => trim((string) ($contact['type'] ?? 'phone')) ?: 'phone',
                    'label' => isset($contact['label']) && trim((string) $contact['label']) !== ''
                        ? trim((string) $contact['label'])
                        : null,
                    'establishment_name' => trim((string) ($contact['establishment_name'] ?? '')),
                    'services' => isset($contact['services']) && trim((string) $contact['services']) !== ''
                        ? trim((string) $contact['services'])
                        : null,
                    'contact_person' => isset($contact['contact_person']) && trim((string) $contact['contact_person']) !== ''
                        ? trim((string) $contact['contact_person'])
                        : null,
                    'value' => trim((string) ($contact['value'] ?? '')),
                    'avatar_url' => isset($contact['avatar_url']) && trim((string) $contact['avatar_url']) !== ''
                        ? trim((string) $contact['avatar_url'])
                        : null,
                    'avatar_public_id' => isset($contact['avatar_public_id']) && trim((string) $contact['avatar_public_id']) !== ''
                        ? trim((string) $contact['avatar_public_id'])
                        : null,
                    'sort_order' => isset($contact['sort_order']) ? (int) $contact['sort_order'] : ($index + 1),
                ];

                if (isset($contact['id'])) {
                    $existing = GeneralContact::query()->find((int) $contact['id']);
                    if ($existing) {
                        $existing->update($payload);
                        continue;
                    }
                }

                GeneralContact::query()->create($payload);
            }
        });

        $updated = GeneralContact::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $updated]);
    }

    public function listImages(Request $request)
    {
        $folder = $this->normalizeFolderFilter((string) $request->query('folder', ''));
        $maxResults = (int) $request->query('max_results', 60);
        $maxResults = max(1, min($maxResults, 200));
        $basePath = $this->directoryImagesBasePath();

        if (!is_dir($basePath)) {
            return response()->json(['data' => []]);
        }

        $folders = [];
        if ($folder !== '') {
            $folders[] = $folder;
        } else {
            $entries = scandir($basePath);
            if (is_array($entries)) {
                foreach ($entries as $entry) {
                    if ($entry === '.' || $entry === '..') {
                        continue;
                    }
                    if (is_dir($basePath . DIRECTORY_SEPARATOR . $entry)) {
                        $folders[] = $entry;
                    }
                }
            }
        }

        $assets = [];
        foreach ($folders as $folderName) {
            $safeFolder = $this->directoryFolderForSection($folderName);
            $folderPath = $basePath . DIRECTORY_SEPARATOR . $safeFolder;
            if (!is_dir($folderPath)) {
                continue;
            }

            $entries = scandir($folderPath);
            if (!is_array($entries)) {
                continue;
            }

            foreach ($entries as $entry) {
                if ($entry === '.' || $entry === '..') {
                    continue;
                }

                $absolutePath = $folderPath . DIRECTORY_SEPARATOR . $entry;
                if (!is_file($absolutePath)) {
                    continue;
                }

                $extension = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
                if (!$this->isAllowedImageExtension($extension)) {
                    continue;
                }

                $publicId = $safeFolder . '/' . $entry;
                $dimensions = $this->inferImageDimensions($absolutePath);
                $timestamp = filemtime($absolutePath);
                $createdAtIso = $timestamp !== false ? gmdate('c', (int) $timestamp) : null;

                $assets[] = [
                    'public_id' => $publicId,
                    'secure_url' => $this->imageUrlFromPublicId($publicId, $request),
                    'format' => $extension,
                    'bytes' => (int) filesize($absolutePath),
                    'width' => $dimensions['width'],
                    'height' => $dimensions['height'],
                    'created_at' => $createdAtIso,
                ];
            }
        }

        usort($assets, function (array $left, array $right): int {
            $leftTime = strtotime((string) ($left['created_at'] ?? '')) ?: 0;
            $rightTime = strtotime((string) ($right['created_at'] ?? '')) ?: 0;
            return $rightTime <=> $leftTime;
        });

        if (count($assets) > $maxResults) {
            $assets = array_slice($assets, 0, $maxResults);
        }

        return response()->json(['data' => $assets]);
    }

    public function deleteImage(Request $request)
    {
        $validated = $request->validate([
            'public_id' => 'required|string|max:255',
        ], [
            'public_id.required' => 'Image ID is required for deletion.',
        ]);

        try {
            $publicId = $this->normalizePublicId((string) $validated['public_id']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $absolutePath = $this->imagePathFromPublicId($publicId);
        if (is_file($absolutePath)) {
            @unlink($absolutePath);
        }

        $imageUrl = $this->imageUrlFromPublicId($publicId, $request);
        Agency::query()
            ->where('image_public_id', $publicId)
            ->orWhere('image_url', $imageUrl)
            ->update([
                'image_url' => null,
                'image_public_id' => null,
            ]);

        GeneralContact::query()
            ->where('avatar_public_id', $publicId)
            ->orWhere('avatar_url', $imageUrl)
            ->update([
                'avatar_url' => null,
                'avatar_public_id' => null,
            ]);

        return response()->json(['message' => 'Image deleted successfully']);
    }

    public function showImageFile(string $path)
    {
        try {
            $publicId = $this->normalizePublicId($path);
        } catch (\InvalidArgumentException $e) {
            abort(404);
        }

        $absolutePath = $this->imagePathFromPublicId($publicId);
        if (!is_file($absolutePath)) {
            abort(404);
        }

        $mimeType = mime_content_type($absolutePath) ?: 'application/octet-stream';

        return response()->file($absolutePath, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    // Backward-compatible wrappers for older frontend paths.
    public function listCloudinaryImages(Request $request)
    {
        return $this->listImages($request);
    }

    public function deleteCloudinaryImage(Request $request)
    {
        return $this->deleteImage($request);
    }

}
