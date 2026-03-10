<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use App\Models\OfficeSupplyItem;
use App\Models\OfficeSupplyMonthlyBalance;
use App\Models\OfficeSupplyTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OfficeSupplyInventoryController extends Controller
{
    public function indexItems(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'nullable|integer|exists:departments,id',
            'search' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        $selectedYear = (int) ($validated['year'] ?? now()->year);
        $query = OfficeSupplyItem::query()
            ->with([
                'department:id,name',
            ]);

        if (isset($validated['department_id'])) {
            $query->where('department_id', (int) $validated['department_id']);
        }

        if (isset($validated['category']) && trim((string) $validated['category']) !== '') {
            $query->where('category', 'like', '%' . trim((string) $validated['category']) . '%');
        }

        if (isset($validated['search']) && trim((string) $validated['search']) !== '') {
            $search = trim((string) $validated['search']);
            $query->where(function ($inner) use ($search): void {
                $inner->where('item_code', 'like', '%' . $search . '%')
                    ->orWhere('item_name', 'like', '%' . $search . '%')
                    ->orWhere('category', 'like', '%' . $search . '%');
            });
        }

        $items = $query
            ->orderBy('item_name')
            ->orderBy('item_code')
            ->get();
        $itemIds = $items->pluck('id')->all();

        $monthlyBalances = OfficeSupplyMonthlyBalance::query()
            ->whereYear('month_start', $selectedYear)
            ->whereIn('item_id', $itemIds)
            ->orderBy('month_start')
            ->get()
            ->groupBy('item_id')
            ->map(fn ($rows) => $rows->first());

        $latestTransactions = OfficeSupplyTransaction::query()
            ->with(['requestedBy:id,first_name,last_name,status'])
            ->whereYear('transaction_at', $selectedYear)
            ->whereIn('item_id', $itemIds)
            ->orderByDesc('transaction_at')
            ->orderByDesc('id')
            ->get()
            ->groupBy('item_id')
            ->map(fn ($rows) => $rows->first());

        $data = $items->map(function (OfficeSupplyItem $item) use ($monthlyBalances, $latestTransactions) {
            $monthly = $monthlyBalances->get($item->id);
            $latest = $latestTransactions->get($item->id);
            return $this->transformItem($item, $monthly, $latest);
        })->values();

        return response()->json([
            'success' => true,
            'data' => $data,
            'year' => $selectedYear,
        ]);
    }

    public function indexTransactions(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'nullable|integer|exists:office_supply_items,id',
            'department_id' => 'nullable|integer|exists:departments,id',
            'limit' => 'nullable|integer|min:1|max:500',
            'year' => 'nullable|integer|min:2000|max:2100',
        ]);

        $limit = (int) ($validated['limit'] ?? 120);
        $selectedYear = (int) ($validated['year'] ?? now()->year);
        $query = OfficeSupplyTransaction::query()
            ->with([
                'item:id,item_code,item_name,category',
                'department:id,name',
                'requestedBy:id,first_name,last_name,status',
            ]);

        if (isset($validated['item_id'])) {
            $query->where('item_id', (int) $validated['item_id']);
        }

        if (isset($validated['department_id'])) {
            $query->where('department_id', (int) $validated['department_id']);
        }

        $query->whereYear('transaction_at', $selectedYear);

        $rows = $query->orderByDesc('transaction_at')->orderByDesc('id')->limit($limit)->get();
        $data = $rows->map(fn (OfficeSupplyTransaction $row) => $this->transformTransaction($row))->values();

        return response()->json([
            'success' => true,
            'data' => $data,
            'year' => $selectedYear,
        ]);
    }

    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'item_name' => 'required|string|min:2|max:150',
            'category' => 'required|string|min:2|max:100',
            'department_id' => 'required|integer|exists:departments,id',
            'opening_balance' => 'nullable|integer|min:0|max:1000000',
        ]);

        $openingBalance = (int) ($validated['opening_balance'] ?? 0);
        $itemName = trim((string) $validated['item_name']);
        $itemNameNormalized = strtolower($itemName);

        $duplicateItemNameExists = OfficeSupplyItem::query()
            ->whereRaw('LOWER(item_name) = ?', [$itemNameNormalized])
            ->exists();
        if ($duplicateItemNameExists) {
            throw ValidationException::withMessages([
                'item_name' => ['An inventory item with this name already exists.'],
            ]);
        }

        $adminDepartment = Department::query()
            ->where(function ($query): void {
                $query->whereRaw('LOWER(name) = ?', ['admin department'])
                    ->orWhereRaw('LOWER(name) = ?', ['admin'])
                    ->orWhereRaw('LOWER(name) LIKE ?', ['%admin%']);
            })
            ->orderByRaw("CASE WHEN LOWER(name) = 'admin department' THEN 0 WHEN LOWER(name) = 'admin' THEN 1 ELSE 2 END")
            ->orderBy('id')
            ->first();
        if (!$adminDepartment) {
            throw ValidationException::withMessages([
                'department_id' => ['Admin Department is required before creating inventory items.'],
            ]);
        }

        if ((int) $validated['department_id'] !== (int) $adminDepartment->id) {
            throw ValidationException::withMessages([
                'department_id' => ['Department is fixed to Admin Department for inventory item setup.'],
            ]);
        }

        $created = DB::transaction(function () use ($validated, $openingBalance, $adminDepartment) {
            $nextSequence = ((int) OfficeSupplyItem::query()->lockForUpdate()->max('code_sequence')) + 1;
            $itemCode = $this->formatItemCode($nextSequence);

            $item = OfficeSupplyItem::query()->create([
                'code_sequence' => $nextSequence,
                'item_code' => $itemCode,
                'item_name' => trim((string) $validated['item_name']),
                'category' => trim((string) $validated['category']),
                'department_id' => (int) $adminDepartment->id,
                'current_balance' => $openingBalance,
            ]);

            $monthStart = Carbon::now()->startOfMonth()->toDateString();
            $monthly = OfficeSupplyMonthlyBalance::query()->create([
                'item_id' => $item->id,
                'month_start' => $monthStart,
                'opening_balance' => $openingBalance,
                'closing_balance' => $openingBalance,
            ]);

            $item->load(['department:id,name', 'latestTransaction.requestedBy:id,first_name,last_name,status']);
            return [$item, $monthly];
        });

        /** @var OfficeSupplyItem $item */
        [$item, $monthly] = $created;

        return response()->json([
            'success' => true,
            'message' => 'Inventory item created successfully.',
            'data' => $this->transformItem($item, $monthly, null),
        ], 201);
    }

    public function storeTransaction(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|integer|exists:office_supply_items,id',
            'quantity_in' => 'nullable|integer|min:0|max:1000000',
            'quantity_out' => 'nullable|integer|min:0|max:1000000',
            'issued_log' => 'nullable|string|max:1000',
            'requested_by_employee_id' => 'required|string|exists:employees,id',
            'transaction_at' => 'required|date_format:Y-m-d|before_or_equal:today',
        ], [
            'transaction_at.before_or_equal' => 'Future dates cannot be edited.',
            'transaction_at.required' => 'Please provide a transaction date.',
        ]);

        $quantityIn = (int) ($validated['quantity_in'] ?? 0);
        $quantityOut = (int) ($validated['quantity_out'] ?? 0);
        if ($quantityIn === 0 && $quantityOut === 0) {
            throw ValidationException::withMessages([
                'quantity_in' => ['Either quantity in or quantity out must be greater than zero.'],
            ]);
        }

        $requester = Employee::query()->select('id', 'status', 'department')->find((string) $validated['requested_by_employee_id']);
        if (!$requester || strtolower((string) $requester->status) !== 'employed') {
            throw ValidationException::withMessages([
                'requested_by_employee_id' => ['Requested by must reference an employed employee.'],
            ]);
        }

        $requesterDepartment = trim((string) ($requester->department ?? ''));
        if ($requesterDepartment === '') {
            throw ValidationException::withMessages([
                'requested_by_employee_id' => ['The selected employee has no assigned department.'],
            ]);
        }

        $resolvedDepartment = Department::query()
            ->whereRaw('LOWER(name) = ?', [strtolower($requesterDepartment)])
            ->first();
        if (!$resolvedDepartment) {
            throw ValidationException::withMessages([
                'requested_by_employee_id' => ['The selected employee department is not configured in departments.'],
            ]);
        }

        $saved = DB::transaction(function () use ($validated, $quantityIn, $quantityOut, $resolvedDepartment) {
            $item = OfficeSupplyItem::query()->lockForUpdate()->findOrFail((int) $validated['item_id']);
            $beginningBalance = (int) $item->current_balance;

            if ($quantityOut > $beginningBalance) {
                throw ValidationException::withMessages([
                    'quantity_out' => ['Quantity out cannot exceed current stock balance.'],
                ]);
            }

            $currentBalance = $beginningBalance + $quantityIn - $quantityOut;
            $transactionAt = Carbon::parse((string) $validated['transaction_at']);
            $monthStart = $transactionAt->copy()->startOfMonth()->toDateString();

            $monthly = OfficeSupplyMonthlyBalance::query()->lockForUpdate()->firstOrCreate(
                [
                    'item_id' => $item->id,
                    'month_start' => $monthStart,
                ],
                [
                    'opening_balance' => $beginningBalance,
                    'closing_balance' => $beginningBalance,
                ]
            );

            $transaction = OfficeSupplyTransaction::query()->create([
                'item_id' => $item->id,
                'department_id' => (int) $resolvedDepartment->id,
                'beginning_balance' => $beginningBalance,
                'quantity_in' => $quantityIn,
                'quantity_out' => $quantityOut,
                'current_balance' => $currentBalance,
                'balance_auto' => (int) $monthly->opening_balance,
                'issued_log' => isset($validated['issued_log']) ? trim((string) $validated['issued_log']) : null,
                'requested_by_employee_id' => (string) $validated['requested_by_employee_id'],
                'transaction_at' => $transactionAt,
            ]);

            $item->update(['current_balance' => $currentBalance]);
            $monthly->update(['closing_balance' => $currentBalance]);

            $item->load(['department:id,name', 'latestTransaction.requestedBy:id,first_name,last_name,status']);
            $transaction->load(['item:id,item_code,item_name,category', 'department:id,name', 'requestedBy:id,first_name,last_name,status']);

            return [$item, $monthly, $transaction];
        });

        /** @var OfficeSupplyItem $item */
        /** @var OfficeSupplyMonthlyBalance $monthly */
        /** @var OfficeSupplyTransaction $transaction */
        [$item, $monthly, $transaction] = $saved;

        return response()->json([
            'success' => true,
            'message' => 'Inventory transaction saved successfully.',
            'data' => [
                'item' => $this->transformItem($item, $monthly, $transaction),
                'transaction' => $this->transformTransaction($transaction),
            ],
        ], 201);
    }

    private function transformItem(
        OfficeSupplyItem $item,
        ?OfficeSupplyMonthlyBalance $monthly,
        ?OfficeSupplyTransaction $latest = null
    ): array
    {
        $requester = $latest?->requestedBy;
        $requesterName = $requester ? trim(((string) $requester->first_name . ' ' . (string) $requester->last_name)) : '';
        if ($requesterName === '') {
            $requesterName = (string) ($latest?->requested_by_employee_id ?? '');
        }

        return [
            'id' => $item->id,
            'item_code' => $item->item_code,
            'item_name' => $item->item_name,
            'category' => $item->category,
            'department_id' => $item->department_id,
            'department_name' => $item->department?->name,
            'beginning_balance' => $latest ? (int) $latest->beginning_balance : (int) ($monthly?->opening_balance ?? $item->current_balance),
            'quantity_in' => $latest ? (int) $latest->quantity_in : 0,
            'quantity_out' => $latest ? (int) $latest->quantity_out : 0,
            'current_balance' => $latest ? (int) $latest->current_balance : (int) $item->current_balance,
            'issued_log' => $latest?->issued_log,
            'balance_auto' => (int) ($monthly?->opening_balance ?? $item->current_balance),
            'requested_by_employee_id' => $latest?->requested_by_employee_id,
            'requested_by_name' => $requesterName !== '' ? $requesterName : null,
            'last_updated' => optional($latest?->updated_at ?? $item->updated_at)?->toISOString(),
            'updated_at' => optional($item->updated_at)?->toISOString(),
        ];
    }

    private function transformTransaction(OfficeSupplyTransaction $transaction): array
    {
        $requester = $transaction->requestedBy;
        $requesterName = $requester ? trim(((string) $requester->first_name . ' ' . (string) $requester->last_name)) : '';
        if ($requesterName === '') {
            $requesterName = (string) $transaction->requested_by_employee_id;
        }

        return [
            'id' => $transaction->id,
            'item_id' => $transaction->item_id,
            'item_code' => $transaction->item?->item_code,
            'item_name' => $transaction->item?->item_name,
            'category' => $transaction->item?->category,
            'department_id' => $transaction->department_id,
            'department_name' => $transaction->department?->name,
            'beginning_balance' => (int) $transaction->beginning_balance,
            'quantity_in' => (int) $transaction->quantity_in,
            'quantity_out' => (int) $transaction->quantity_out,
            'current_balance' => (int) $transaction->current_balance,
            'balance_auto' => (int) $transaction->balance_auto,
            'issued_log' => $transaction->issued_log,
            'requested_by_employee_id' => $transaction->requested_by_employee_id,
            'requested_by_name' => $requesterName !== '' ? $requesterName : null,
            'transaction_at' => optional($transaction->transaction_at)?->toISOString(),
            'updated_at' => optional($transaction->updated_at)?->toISOString(),
        ];
    }

    private function formatItemCode(int $sequence): string
    {
        return 'OS-' . str_pad((string) $sequence, 3, '0', STR_PAD_LEFT);
    }
}
