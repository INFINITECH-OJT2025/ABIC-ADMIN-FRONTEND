"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'
import { ensureOkResponse } from '@/lib/api/error-message'
import { PageErrorState } from '@/components/state/page-feedback'
import { toast } from 'sonner'
import { Boxes, Loader2, RefreshCw, Plus, ArrowDownUp, Search, AlertTriangle, PackageCheck, ChevronsUpDown, Check } from 'lucide-react'

type DepartmentRow = {
  id: number
  name: string
}

type EmployeeRow = {
  id: string
  first_name: string | null
  last_name: string | null
  department: string | null
  position: string | null
  status: string
}

type InventoryRow = {
  id: number
  item_code: string
  item_name: string
  category: string
  department_id: number
  department_name: string | null
  beginning_balance: number
  quantity_in: number
  quantity_out: number
  current_balance: number
  issued_log: string | null
  balance_auto: number
  requested_by_employee_id: string | null
  requested_by_name: string | null
  last_updated: string | null
  updated_at?: string | null
}

type TransactionRow = {
  id: number
  item_code: string | null
  item_name: string | null
  category: string | null
  department_name: string | null
  beginning_balance: number
  quantity_in: number
  quantity_out: number
  current_balance: number
  balance_auto: number
  issued_log: string | null
  requested_by_name: string | null
  transaction_at: string | null
  updated_at: string | null
}

type ItemDraft = {
  item_name: string
  category: string
  department_id: string
  opening_balance: string
}

type TransactionDraft = {
  item_id: string
  quantity_in: string
  quantity_out: string
  transaction_date: string
  issued_log: string
  requested_by_employee_id: string
}
type CreateItemConfirmDraft = {
  item_name: string
  category: string
  opening_balance: number
}
type MovementType = 'in' | 'out'
type TransactionDateMode = 'date' | 'month' | 'year'
type VisualizationTopLimit = '5' | '8' | '10'

const initialItemDraft: ItemDraft = {
  item_name: '',
  category: '',
  department_id: '',
  opening_balance: '0',
}

const initialTransactionDraft: TransactionDraft = {
  item_id: '',
  quantity_in: '0',
  quantity_out: '0',
  transaction_date: '',
  issued_log: '',
  requested_by_employee_id: '',
}
const INVENTORY_PAGE_SIZE = 10
const TRANSACTIONS_PAGE_SIZE = 10
const MONTH_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const toLocalIsoDate = (value: Date): string => {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getCurrentIsoDate = (): string => toLocalIsoDate(new Date())

const formatDate = (value: string | null | undefined) => {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatDateMmDdYyyy = (value: string | null | undefined): string => {
  const raw = String(value || '').trim()
  if (!raw) return '-'
  const isoDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch
    return `${month}/${day}/${year}`
  }
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return '-'
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const year = parsed.getFullYear()
  return `${month}/${day}/${year}`
}

const getEmployeeDisplayName = (employee: EmployeeRow): string => {
  const first = String(employee.first_name || '').trim()
  const last = String(employee.last_name || '').trim()
  const full = `${first} ${last}`.trim()
  return full || employee.id
}

const getStockBadgeTone = (stock: number): string => {
  if (stock <= 0) return 'bg-red-100 text-red-700 border-red-200'
  if (stock <= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

const sanitizeIntegerInput = (value: string): string => value.replace(/[^\d]/g, '')

const blockNonIntegerKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
  if (['e', 'E', '+', '-', '.', ','].includes(event.key)) {
    event.preventDefault()
  }
}

const useCountUp = (
  target: number,
  enabled: boolean,
  triggerKey: number,
  duration = 900,
  delay = 0
): number => {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setDisplayValue(target)
      return
    }

    let rafId = 0
    let startTime: number | null = null
    setDisplayValue(0)

    const step = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(1, elapsed / duration)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(target * easedProgress)
      setDisplayValue(nextValue)
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step)
      } else {
        setDisplayValue(target)
      }
    }

    const timer = window.setTimeout(() => {
      rafId = window.requestAnimationFrame(step)
    }, delay)

    return () => {
      window.clearTimeout(timer)
      window.cancelAnimationFrame(rafId)
    }
  }, [delay, duration, enabled, target, triggerKey])

  return displayValue
}

export default function InventoryPage() {
  const currentYear = new Date().getFullYear()
  const todayIsoDate = getCurrentIsoDate()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [items, setItems] = useState<InventoryRow[]>([])
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [departments, setDepartments] = useState<DepartmentRow[]>([])
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [itemDraft, setItemDraft] = useState<ItemDraft>(initialItemDraft)
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>({
    ...initialTransactionDraft,
    transaction_date: getCurrentIsoDate(),
  })
  const [movementType, setMovementType] = useState<MovementType | ''>('in')
  const [loading, setLoading] = useState(true)
  const [refreshingData, setRefreshingData] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [createItemConfirmOpen, setCreateItemConfirmOpen] = useState(false)
  const [createItemConfirmDraft, setCreateItemConfirmDraft] = useState<CreateItemConfirmDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'no-stock' | 'low-stock' | 'high-stock'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [transactionDateFilter, setTransactionDateFilter] = useState('')
  const [transactionMonthFilter, setTransactionMonthFilter] = useState('all')
  const [transactionYearFilter, setTransactionYearFilter] = useState<number>(currentYear)
  const [transactionDateMode, setTransactionDateMode] = useState<TransactionDateMode>('year')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'in' | 'out'>('all')
  const [transactionDepartmentFilter, setTransactionDepartmentFilter] = useState('all')
  const [inventoryPage, setInventoryPage] = useState(1)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [itemPickerOpen, setItemPickerOpen] = useState(false)
  const [employeePickerOpen, setEmployeePickerOpen] = useState(false)
  const [visualizationAnimated, setVisualizationAnimated] = useState(false)
  const [visualizationTopLimit, setVisualizationTopLimit] = useState<VisualizationTopLimit>('5')
  const [itemStatsAnimationKey, setItemStatsAnimationKey] = useState(0)
  const [outStatsAnimationKey, setOutStatsAnimationKey] = useState(0)
  const [statsVisualsAnimated, setStatsVisualsAnimated] = useState(false)
  const [hoveredTopItemKey, setHoveredTopItemKey] = useState<string | null>(null)
  const [hoveredDepartmentLabel, setHoveredDepartmentLabel] = useState<string | null>(null)

  const adminHeadEmployee = useMemo(() => {
    return employees.find((employee) => String(employee.position || '').trim().toLowerCase() === 'admin head') ?? null
  }, [employees])

  const effectiveRequestedByEmployeeId = movementType === 'in'
    ? (adminHeadEmployee?.id ?? '')
    : transactionDraft.requested_by_employee_id

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === transactionDraft.item_id) ?? null,
    [items, transactionDraft.item_id]
  )
  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === effectiveRequestedByEmployeeId) ?? null,
    [employees, effectiveRequestedByEmployeeId]
  )
  const duplicateItemNameMatch = useMemo(() => {
    const normalizedDraftName = String(itemDraft.item_name || '').trim().toLowerCase()
    if (!normalizedDraftName) return null
    return items.find((item) => String(item.item_name || '').trim().toLowerCase() === normalizedDraftName) ?? null
  }, [items, itemDraft.item_name])
  const isDuplicateItemName = duplicateItemNameMatch !== null
  const nextItemCodePreview = useMemo(() => {
    const maxSequence = items.reduce((max, item) => {
      const match = String(item.item_code || '').match(/(\d+)$/)
      if (!match) return max
      const sequence = Number(match[1])
      if (Number.isNaN(sequence)) return max
      return Math.max(max, sequence)
    }, 0)
    return `OS-${String(maxSequence + 1).padStart(3, '0')}`
  }, [items])
  const normalizedItemNamePreview = useMemo(
    () => String(itemDraft.item_name || '').trim().replace(/\s+/g, ' '),
    [itemDraft.item_name]
  )
  const normalizedCategoryPreview = useMemo(
    () => String(itemDraft.category || '').trim().replace(/\s+/g, ' '),
    [itemDraft.category]
  )
  const exceedsSelectedStock = useMemo(() => {
    if (movementType !== 'out') return false
    if (!selectedItem) return false
    const requestedOut = Number(transactionDraft.quantity_out || 0)
    const currentStock = Number(selectedItem.current_balance || 0)
    return requestedOut > currentStock
  }, [movementType, selectedItem, transactionDraft.quantity_out])

  const categoryOptions = useMemo(() => {
    return [...new Set(items.map((item) => String(item.category || '').trim()).filter((value) => value.length > 0))]
      .sort((a, b) => a.localeCompare(b))
  }, [items])

  const groupedItemsByCategory = useMemo(() => {
    const grouped = new Map<string, InventoryRow[]>()
    const sortedItems = [...items].sort((a, b) => {
      const categoryA = String(a.category || '').trim().toLowerCase()
      const categoryB = String(b.category || '').trim().toLowerCase()
      const byCategory = categoryA.localeCompare(categoryB)
      if (byCategory !== 0) return byCategory
      const nameA = String(a.item_name || '').trim().toLowerCase()
      const nameB = String(b.item_name || '').trim().toLowerCase()
      const byName = nameA.localeCompare(nameB)
      if (byName !== 0) return byName
      return String(a.item_code || '').localeCompare(String(b.item_code || ''))
    })
    sortedItems.forEach((item) => {
      const category = String(item.category || '').trim() || 'Uncategorized'
      const bucket = grouped.get(category) ?? []
      bucket.push(item)
      grouped.set(category, bucket)
    })
    return Array.from(grouped.entries()).map(([category, rows]) => ({ category, rows }))
  }, [items])

  const groupedEmployeesByDepartment = useMemo(() => {
    const grouped = new Map<string, EmployeeRow[]>()
    const sortedEmployees = [...employees].sort((a, b) => {
      const departmentA = String(a.department || '').trim().toLowerCase() || 'unassigned'
      const departmentB = String(b.department || '').trim().toLowerCase() || 'unassigned'
      const byDepartment = departmentA.localeCompare(departmentB)
      if (byDepartment !== 0) return byDepartment
      return getEmployeeDisplayName(a).toLowerCase().localeCompare(getEmployeeDisplayName(b).toLowerCase())
    })
    sortedEmployees.forEach((employee) => {
      const department = String(employee.department || '').trim() || 'Unassigned'
      const bucket = grouped.get(department) ?? []
      bucket.push(employee)
      grouped.set(department, bucket)
    })
    return Array.from(grouped.entries()).map(([department, rows]) => ({ department, rows }))
  }, [employees])

  const transactionYearOptions = useMemo(() => {
    const years = new Set<number>()
    for (let year = currentYear; year >= currentYear - 10; year -= 1) {
      years.add(year)
    }
    transactions.forEach((row) => {
      const rawDate = String(row.transaction_at || '').trim()
      if (!rawDate) return
      const parsed = new Date(rawDate)
      if (Number.isNaN(parsed.getTime())) return
      const parsedYear = parsed.getFullYear()
      if (parsedYear <= currentYear) years.add(parsedYear)
    })
    if (transactionYearFilter <= currentYear) years.add(transactionYearFilter)
    return Array.from(years).sort((a, b) => b - a)
  }, [currentYear, transactionYearFilter, transactions])

  const adminDepartment = useMemo(() => {
    const normalized = departments.map((department) => ({
      row: department,
      normalizedName: String(department.name || '').trim().toLowerCase(),
    }))
    const exact = normalized.find((entry) => entry.normalizedName === 'admin department' || entry.normalizedName === 'admin')
    if (exact) return exact.row
    return normalized.find((entry) => entry.normalizedName.includes('admin'))?.row ?? null
  }, [departments])

  const isPastOrPresentYear = selectedYear <= currentYear
  const canEditItemSetup = isPastOrPresentYear
  const canEditTransactions = selectedYear === currentYear

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = items.filter((item) => {
      const currentStock = Number(item.current_balance || 0)
      const matchesStock =
        stockFilter === 'all'
          ? true
          : stockFilter === 'no-stock'
            ? currentStock === 0
            : stockFilter === 'low-stock'
              ? currentStock > 0 && currentStock <= 10
              : currentStock > 10
      const matchesCategory = categoryFilter === 'all' || String(item.category || '').trim().toLowerCase() === categoryFilter.toLowerCase()
      if (!matchesStock || !matchesCategory) return false
      if (!term) return true
      const code = String(item.item_code || '').toLowerCase()
      const name = String(item.item_name || '').toLowerCase()
      const category = String(item.category || '').toLowerCase()
      const department = String(item.department_name || '').toLowerCase()
      return code.includes(term) || name.includes(term) || category.includes(term) || department.includes(term)
    })
    return [...filtered].sort((a, b) => {
      const left = String(a.item_name || '').trim().toLowerCase()
      const right = String(b.item_name || '').trim().toLowerCase()
      const byName = left.localeCompare(right)
      if (byName !== 0) return byName
      return String(a.item_code || '').localeCompare(String(b.item_code || ''))
    })
  }, [items, searchTerm, stockFilter, categoryFilter])

  const inventoryTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / INVENTORY_PAGE_SIZE)),
    [filteredItems.length]
  )

  const paginatedFilteredItems = useMemo(() => {
    const start = (inventoryPage - 1) * INVENTORY_PAGE_SIZE
    return filteredItems.slice(start, start + INVENTORY_PAGE_SIZE)
  }, [filteredItems, inventoryPage])

  const transactionDepartmentOptions = useMemo(() => {
    return [...new Set(
      transactions
        .map((row) => String(row.department_name || '').trim())
        .filter((name) => name.length > 0)
    )].sort((a, b) => a.localeCompare(b))
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((row) => {
      const rawDate = String(row.transaction_at || '').trim()
      if (!rawDate) return false
      const parsed = new Date(rawDate)
      if (Number.isNaN(parsed.getTime())) return false

      const localDate = toLocalIsoDate(parsed)
      const [yearValue, monthValue] = localDate.split('-')

      const matchesDateMode = (() => {
        if (transactionDateMode === 'date') {
          return transactionDateFilter ? localDate === transactionDateFilter : true
        }
        if (transactionDateMode === 'month') {
          const matchesMonth = transactionMonthFilter === 'all' ? true : monthValue === transactionMonthFilter
          const matchesYear = Number(yearValue) === transactionYearFilter
          return matchesMonth && matchesYear
        }
        return Number(yearValue) === transactionYearFilter
      })()
      const matchesType = transactionTypeFilter === 'all'
        ? true
        : transactionTypeFilter === 'in'
          ? Number(row.quantity_in || 0) > 0
          : Number(row.quantity_out || 0) > 0
      const matchesDepartment = transactionDepartmentFilter === 'all'
        ? true
        : String(row.department_name || '').trim().toLowerCase() === transactionDepartmentFilter.toLowerCase()

      return matchesDateMode && matchesType && matchesDepartment
    })
  }, [
    transactions,
    transactionDateMode,
    transactionYearFilter,
    transactionDateFilter,
    transactionMonthFilter,
    transactionTypeFilter,
    transactionDepartmentFilter,
  ])

  const visualizationTopCount = Number(visualizationTopLimit)

  const topItemsByQuantityOut = useMemo(() => {
    const totals = new Map<string, { key: string; label: string; quantityOut: number }>()
    filteredTransactions.forEach((row) => {
      const itemCode = String(row.item_code || '').trim()
      const itemName = String(row.item_name || '').trim()
      const key = `${itemCode}::${itemName}`.trim()
      if (!key) return
      const current = totals.get(key) ?? {
        key,
        label: itemCode && itemName ? `${itemCode} - ${itemName}` : itemCode || itemName || 'Unknown Item',
        quantityOut: 0,
      }
      current.quantityOut += Number(row.quantity_out || 0)
      totals.set(key, current)
    })
    return Array.from(totals.values())
      .filter((row) => row.quantityOut > 0)
      .sort((a, b) => b.quantityOut - a.quantityOut)
      .slice(0, visualizationTopCount)
  }, [filteredTransactions, visualizationTopCount])

  const topItemsByQuantityOutMax = useMemo(
    () => Math.max(1, ...topItemsByQuantityOut.map((row) => row.quantityOut)),
    [topItemsByQuantityOut]
  )

  const topItemDepartmentBreakdown = useMemo(() => {
    const breakdownByItem = new Map<string, Map<string, number>>()
    filteredTransactions.forEach((row) => {
      const itemCode = String(row.item_code || '').trim()
      const itemName = String(row.item_name || '').trim()
      const itemKey = `${itemCode}::${itemName}`.trim()
      const quantityOut = Number(row.quantity_out || 0)
      if (!itemKey || quantityOut <= 0) return

      const departmentLabel = String(row.department_name || '').trim() || 'Unassigned'
      const itemBreakdown = breakdownByItem.get(itemKey) ?? new Map<string, number>()
      itemBreakdown.set(departmentLabel, (itemBreakdown.get(departmentLabel) ?? 0) + quantityOut)
      breakdownByItem.set(itemKey, itemBreakdown)
    })

    return topItemsByQuantityOut.reduce((acc, row) => {
      const entries = Array.from((breakdownByItem.get(row.key) ?? new Map<string, number>()).entries())
        .map(([department, quantityOut]) => ({ department, quantityOut }))
        .sort((a, b) => b.quantityOut - a.quantityOut)
      acc[row.key] = entries
      return acc
    }, {} as Record<string, Array<{ department: string; quantityOut: number }>>)
  }, [filteredTransactions, topItemsByQuantityOut])

  const departmentOutData = useMemo(() => {
    const totals = new Map<string, { label: string; quantityOut: number }>()
    filteredTransactions.forEach((row) => {
      const label = String(row.department_name || '').trim() || 'Unassigned'
      const current = totals.get(label) ?? { label, quantityOut: 0 }
      current.quantityOut += Number(row.quantity_out || 0)
      totals.set(label, current)
    })
    return Array.from(totals.values())
      .filter((row) => row.quantityOut > 0)
      .sort((a, b) => b.quantityOut - a.quantityOut)
      .slice(0, visualizationTopCount)
  }, [filteredTransactions, visualizationTopCount])

  const departmentOutMax = useMemo(
    () => Math.max(1, ...departmentOutData.map((row) => row.quantityOut)),
    [departmentOutData]
  )

  const departmentItemBreakdown = useMemo(() => {
    const breakdownByDepartment = new Map<string, Map<string, number>>()
    filteredTransactions.forEach((row) => {
      const departmentLabel = String(row.department_name || '').trim() || 'Unassigned'
      const itemCode = String(row.item_code || '').trim()
      const itemName = String(row.item_name || '').trim()
      const itemLabel = itemCode && itemName ? `${itemCode} - ${itemName}` : itemCode || itemName || 'Unknown Item'
      const quantityOut = Number(row.quantity_out || 0)
      if (quantityOut <= 0) return

      const departmentBreakdown = breakdownByDepartment.get(departmentLabel) ?? new Map<string, number>()
      departmentBreakdown.set(itemLabel, (departmentBreakdown.get(itemLabel) ?? 0) + quantityOut)
      breakdownByDepartment.set(departmentLabel, departmentBreakdown)
    })

    return departmentOutData.reduce((acc, row) => {
      const entries = Array.from((breakdownByDepartment.get(row.label) ?? new Map<string, number>()).entries())
        .map(([itemLabel, quantityOut]) => ({ itemLabel, quantityOut }))
        .sort((a, b) => b.quantityOut - a.quantityOut)
      acc[row.label] = entries
      return acc
    }, {} as Record<string, Array<{ itemLabel: string; quantityOut: number }>>)
  }, [filteredTransactions, departmentOutData])

  const visualizationAnimationKey = useMemo(() => {
    return [
      transactionDateMode,
      transactionDateFilter || 'all-dates',
      transactionMonthFilter,
      String(transactionYearFilter),
      transactionTypeFilter,
      transactionDepartmentFilter,
      visualizationTopLimit,
      topItemsByQuantityOut.map((row) => `${row.key}:${row.quantityOut}`).join('|'),
      departmentOutData.map((row) => `${row.label}:${row.quantityOut}`).join('|'),
    ].join('::')
  }, [
    transactionDateMode,
    transactionDateFilter,
    transactionMonthFilter,
    transactionYearFilter,
    transactionTypeFilter,
    transactionDepartmentFilter,
    visualizationTopLimit,
    topItemsByQuantityOut,
    departmentOutData,
  ])

  const transactionsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTransactions.length / TRANSACTIONS_PAGE_SIZE)),
    [filteredTransactions.length]
  )

  const paginatedTransactions = useMemo(() => {
    const start = (transactionsPage - 1) * TRANSACTIONS_PAGE_SIZE
    return filteredTransactions.slice(start, start + TRANSACTIONS_PAGE_SIZE)
  }, [filteredTransactions, transactionsPage])

  const stats = useMemo(() => {
    const totalItems = items.length
    const lowStock = items.filter((item) => {
      const stock = Number(item.current_balance || 0)
      return stock >= 1 && stock <= 10
    }).length
    return { totalItems, lowStock }
  }, [items])

  const currentMonthValue = useMemo(() => todayIsoDate.split('-')[1] || '01', [todayIsoDate])
  const currentMonthYearLabel = useMemo(() => {
    const monthIndex = Math.max(0, Number(currentMonthValue) - 1)
    const parsed = new Date(transactionYearFilter, monthIndex, 1)
    if (Number.isNaN(parsed.getTime())) return `${transactionYearFilter}`
    return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [currentMonthValue, transactionYearFilter])

  const outThisMonth = useMemo(() => {
    const selectedYear = String(transactionYearFilter)
    return transactions.reduce((sum, row) => {
      const rawDate = String(row.transaction_at || '').trim()
      if (!rawDate) return sum
      const parsed = new Date(rawDate)
      if (Number.isNaN(parsed.getTime())) return sum
      const [yearValue, monthValue] = toLocalIsoDate(parsed).split('-')
      if (yearValue !== selectedYear || monthValue !== currentMonthValue) return sum
      return sum + Number(row.quantity_out || 0)
    }, 0)
  }, [currentMonthValue, transactionYearFilter, transactions])

  const noStockItemsCount = useMemo(
    () => items.filter((item) => Number(item.current_balance || 0) === 0).length,
    [items]
  )
  const noStockPercentage = useMemo(
    () => (stats.totalItems > 0 ? (noStockItemsCount / stats.totalItems) * 100 : 0),
    [noStockItemsCount, stats.totalItems]
  )
  const lowStockPercentage = useMemo(
    () => (stats.totalItems > 0 ? (stats.lowStock / stats.totalItems) * 100 : 0),
    [stats.lowStock, stats.totalItems]
  )
  const animatedTotalItems = useCountUp(stats.totalItems, !loadingItems, itemStatsAnimationKey, 900, 0)
  const animatedNoStockItems = useCountUp(noStockItemsCount, !loadingItems, itemStatsAnimationKey, 900, 80)
  const animatedLowStock = useCountUp(stats.lowStock, !loadingItems, itemStatsAnimationKey, 900, 160)
  const animatedOutThisMonth = useCountUp(outThisMonth, !loadingTransactions, outStatsAnimationKey, 1000, 120)

  const loadItems = async (year: number) => {
    try {
      setLoadingItems(true)
      const params = new URLSearchParams({ year: String(year) })
      const response = await fetch(`${getApiUrl()}/api/office-supply/items?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })
      await ensureOkResponse(response, 'Unable to load office supply inventory.')
      const result = await response.json()
      setItems(Array.isArray(result?.data) ? result.data : [])
    } finally {
      setLoadingItems(false)
    }
  }

  const loadTransactions = async (year: number, itemId?: string) => {
    try {
      setLoadingTransactions(true)
      const params = new URLSearchParams({
        year: String(year),
        limit: '200',
      })
      if (itemId) params.set('item_id', itemId)
      const response = await fetch(`${getApiUrl()}/api/office-supply/transactions?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })
      await ensureOkResponse(response, 'Unable to load inventory transaction logs.')
      const result = await response.json()
      setTransactions(Array.isArray(result?.data) ? result.data : [])
    } finally {
      setLoadingTransactions(false)
    }
  }

  const loadReferences = async () => {
    const [departmentResponse, employeeResponse] = await Promise.all([
      fetch(`${getApiUrl()}/api/departments`, { headers: { Accept: 'application/json' } }),
      fetch(`${getApiUrl()}/api/employees?status=employed`, { headers: { Accept: 'application/json' } }),
    ])

    await ensureOkResponse(departmentResponse, 'Unable to load departments.')
    await ensureOkResponse(employeeResponse, 'Unable to load employed employees.')

    const departmentResult = await departmentResponse.json()
    const employeeResult = await employeeResponse.json()

    const departmentRows = Array.isArray(departmentResult?.data) ? departmentResult.data : []
    const employeeRows = Array.isArray(employeeResult?.data) ? employeeResult.data : []

    setDepartments(departmentRows)
    setEmployees(employeeRows)
  }

  const loadAll = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    try {
      if (silent) {
        setRefreshingData(true)
      } else {
        setLoading(true)
      }
      setError(null)
      await Promise.all([loadReferences(), loadItems(selectedYear)])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load inventory data.'
      setError(message)
    } finally {
      if (silent) {
        setRefreshingData(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadAll()
  }, [selectedYear])

  useEffect(() => {
    void loadTransactions(transactionYearFilter, transactionDraft.item_id || undefined)
  }, [transactionYearFilter, transactionDraft.item_id])

  useEffect(() => {
    setTransactionDraft((prev) => {
      return {
        ...prev,
        transaction_date: getCurrentIsoDate(),
      }
    })
  }, [selectedYear])

  useEffect(() => {
    setInventoryPage(1)
  }, [selectedYear, searchTerm, stockFilter, categoryFilter])

  useEffect(() => {
    setInventoryPage((prev) => Math.min(prev, inventoryTotalPages))
  }, [inventoryTotalPages])

  useEffect(() => {
    setTransactionsPage(1)
  }, [
    transactions.length,
    selectedYear,
    transactionDateMode,
    transactionDraft.item_id,
    transactionDateFilter,
    transactionMonthFilter,
    transactionYearFilter,
    transactionTypeFilter,
    transactionDepartmentFilter,
  ])

  useEffect(() => {
    if (transactionDateMode === 'date') {
      setTransactionMonthFilter('all')
      return
    }
    if (transactionDateMode === 'month') {
      setTransactionDateFilter('')
      return
    }
    setTransactionDateFilter('')
    setTransactionMonthFilter('all')
  }, [transactionDateMode])

  useEffect(() => {
    if (transactionYearFilter <= currentYear) return
    setTransactionYearFilter(currentYear)
  }, [currentYear, transactionYearFilter])

  useEffect(() => {
    if (!transactionDateFilter) return
    if (transactionDateFilter <= todayIsoDate) return
    setTransactionDateFilter('')
  }, [todayIsoDate, transactionDateFilter])

  useEffect(() => {
    setTransactionsPage((prev) => Math.min(prev, transactionsTotalPages))
  }, [transactionsTotalPages])

  useEffect(() => {
    if (loadingItems) return
    setItemStatsAnimationKey((prev) => prev + 1)
  }, [loadingItems, noStockItemsCount, stats.lowStock, stats.totalItems])

  useEffect(() => {
    if (loadingTransactions) return
    setOutStatsAnimationKey((prev) => prev + 1)
  }, [loadingTransactions, outThisMonth])

  useEffect(() => {
    setStatsVisualsAnimated(false)
    const timer = window.setTimeout(() => {
      setStatsVisualsAnimated(true)
    }, 40)
    return () => window.clearTimeout(timer)
  }, [itemStatsAnimationKey, outStatsAnimationKey])

  useEffect(() => {
    setVisualizationAnimated(false)
    setHoveredTopItemKey(null)
    setHoveredDepartmentLabel(null)
    const timer = window.setTimeout(() => {
      setVisualizationAnimated(true)
    }, 60)
    return () => window.clearTimeout(timer)
  }, [visualizationAnimationKey])

  useEffect(() => {
    if (!adminDepartment) return
    const adminDepartmentId = String(adminDepartment.id)
    setItemDraft((prev) => (
      prev.department_id === adminDepartmentId
        ? prev
        : { ...prev, department_id: adminDepartmentId }
    ))
  }, [adminDepartment])

  useEffect(() => {
    if (movementType !== 'in') return
    setTransactionDraft((prev) => {
      const nextId = adminHeadEmployee?.id ?? ''
      if (prev.requested_by_employee_id === nextId) return prev
      return { ...prev, requested_by_employee_id: nextId }
    })
  }, [movementType, adminHeadEmployee?.id])

  const handleMovementTypeChange = (nextType: MovementType) => {
    setMovementType(nextType)
    setTransactionDraft((prev) => ({
      ...prev,
      quantity_in: nextType === 'in' ? prev.quantity_in : '0',
      quantity_out: nextType === 'out' ? prev.quantity_out : '0',
      requested_by_employee_id: nextType === 'in' ? (adminHeadEmployee?.id ?? '') : '',
    }))
  }

  const executeCreateItem = async () => {
    if (!createItemConfirmDraft) return
    try {
      setSavingItem(true)
      if (!adminDepartment) {
        toast.error('Admin Department Missing', {
          description: 'No Admin Department was found in departments. Please create it first.',
        })
        return
      }
      const payload = {
        item_name: createItemConfirmDraft.item_name,
        category: createItemConfirmDraft.category,
        department_id: Number(adminDepartment.id),
        opening_balance: createItemConfirmDraft.opening_balance,
      }

      const response = await fetch(`${getApiUrl()}/api/office-supply/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      await ensureOkResponse(response, 'Unable to create inventory item.')
      toast.success('Inventory item created successfully.')
      setItemDraft({
        ...initialItemDraft,
        department_id: String(adminDepartment.id),
      })
      setCreateItemConfirmOpen(false)
      setCreateItemConfirmDraft(null)
      await loadItems(selectedYear)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create inventory item.'
      toast.error('Create Item Failed', { description: message })
    } finally {
      setSavingItem(false)
    }
  }

  const createItem = async () => {
    if (!canEditItemSetup) {
      toast.warning('Edit Restricted', {
        description: 'Item setup can only be edited for past or present years.',
      })
      return
    }

    if (isDuplicateItemName) {
      toast.warning('Duplicate Item', {
        description: 'An inventory item with the same name already exists.',
      })
      return
    }

    const itemName = itemDraft.item_name.trim()
    const category = itemDraft.category.trim()
    const openingBalance = Number(itemDraft.opening_balance || 0)

    if (!itemName || !category) {
      toast.warning('Missing Item Details', {
        description: 'Please provide both Item Name and Category before creating the item.',
      })
      return
    }

    setCreateItemConfirmDraft({
      item_name: itemName,
      category,
      opening_balance: openingBalance,
    })
    setCreateItemConfirmOpen(true)
  }

  const createTransaction = async () => {
    if (!canEditTransactions) {
      toast.warning('Edit Restricted', {
        description: 'Transactions are recorded only for the current year.',
      })
      return
    }
    if (!movementType) {
      toast.warning('Select Movement Type', {
        description: 'Choose Quantity In or Quantity Out first.',
      })
      return
    }

    try {
      setSavingTransaction(true)
      const requesterId = movementType === 'in'
        ? (adminHeadEmployee?.id ?? '')
        : transactionDraft.requested_by_employee_id
      const quantityInValue = movementType === 'in' ? Number(transactionDraft.quantity_in || 0) : 0
      const quantityOutValue = movementType === 'out' ? Number(transactionDraft.quantity_out || 0) : 0
      if ((movementType === 'in' && quantityInValue <= 0) || (movementType === 'out' && quantityOutValue <= 0)) {
        toast.warning('Invalid Quantity', {
          description: `Enter a Quantity ${movementType === 'in' ? 'In' : 'Out'} greater than zero.`,
        })
        return
      }
      if (movementType === 'in' && !requesterId) {
        toast.warning('Admin Head Missing', {
          description: 'No employed employee with position "Admin Head" was found.',
        })
        return
      }
      if (movementType === 'out' && !requesterId) {
        toast.warning('Requested By Required', {
          description: 'Please select an employee for Quantity Out.',
        })
        return
      }
      if (movementType === 'out' && selectedItem && quantityOutValue > Number(selectedItem.current_balance || 0)) {
        toast.warning('Insufficient Stock', {
          description: 'Quantity Out cannot exceed the selected item current stock balance.',
        })
        return
      }
      const payload = {
        item_id: Number(transactionDraft.item_id),
        quantity_in: quantityInValue,
        quantity_out: quantityOutValue,
        transaction_at: getCurrentIsoDate(),
        issued_log: transactionDraft.issued_log.trim() || null,
        requested_by_employee_id: requesterId,
      }

      const response = await fetch(`${getApiUrl()}/api/office-supply/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      await ensureOkResponse(response, 'Unable to save inventory transaction.')
      toast.success('Inventory transaction saved successfully.')
      setTransactionDraft({
        ...initialTransactionDraft,
        item_id: transactionDraft.item_id,
        transaction_date: getCurrentIsoDate(),
      })
      setMovementType('in')
      await Promise.all([loadItems(selectedYear), loadTransactions(transactionYearFilter, transactionDraft.item_id)])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save inventory transaction.'
      toast.error('Save Transaction Failed', { description: message })
    } finally {
      setSavingTransaction(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] p-6 md:p-8 space-y-6">
        <Skeleton className="h-36 w-full rounded-sm" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={`inventory-stat-skeleton-${idx}`} className="h-24 w-full rounded-sm" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-[420px] w-full rounded-sm" />
          <Skeleton className="h-[420px] w-full rounded-sm" />
        </div>
        <Skeleton className="h-[420px] w-full rounded-sm" />
      </div>
    )
  }

  if (error) {
    return (
      <PageErrorState
        title="Inventory Load Failed"
        description={error}
        onRetry={() => void loadAll()}
      />
    )
  }

  const isRefreshingAny = refreshingData || loadingItems || loadingTransactions

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-sans flex flex-col">
      <header className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="w-full px-4 md:px-8 py-7 md:py-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                <Boxes className="w-8 h-8 opacity-90" />
                Office Supplies Inventory
              </h1>
              <p className="text-sm font-semibold tracking-wide opacity-80 mt-1">
                ABIC Realty & Consultancy - Office Supplies Inventory
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  void Promise.all([
                    loadAll({ silent: true }),
                    loadTransactions(transactionYearFilter, transactionDraft.item_id || undefined),
                  ])
                }}
                className="bg-white text-[#A4163A] hover:bg-rose-50 font-black rounded-lg"
                disabled={isRefreshingAny}
              >
                {isRefreshingAny ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1700px] mx-auto px-4 md:px-8 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card
            className={cn(
              'border border-slate-200 rounded-sm p-4 shadow-sm bg-white transition-all duration-500',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '0ms' }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Inventory Items</p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <Boxes className="h-4 w-4" />
              </span>
            </div>
            {loadingItems ? (
              <Skeleton className="h-9 w-20 mt-2" />
            ) : (
              <>
                <p className="text-3xl font-black text-slate-900 mt-1 tabular-nums">{animatedTotalItems}</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">Tracked office supply items</p>
              </>
            )}
          </Card>
          <Card
            className={cn(
              'border border-rose-200 rounded-sm p-4 shadow-sm bg-rose-50/50 transition-all duration-500',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '60ms' }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-rose-700">No Stock Items</p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </span>
            </div>
            {loadingItems ? (
              <Skeleton className="h-9 w-20 mt-2" />
            ) : (
              <>
                <p className="text-3xl font-black text-rose-700 mt-1 tabular-nums">{animatedNoStockItems}</p>
                <p className="text-xs font-semibold text-rose-700/90 mt-1">Items with current balance of 0</p>
                <div className="mt-2 h-1.5 rounded-full bg-rose-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-[width] duration-700"
                    style={{ width: statsVisualsAnimated ? `${Math.min(noStockPercentage, 100)}%` : '0%' }}
                  />
                </div>
              </>
            )}
          </Card>
          <Card
            className={cn(
              'border border-amber-200 rounded-sm p-4 shadow-sm bg-amber-50/50 transition-all duration-500',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '120ms' }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-700">Low Stock (1-10)</p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <PackageCheck className="h-4 w-4" />
              </span>
            </div>
            {loadingItems ? (
              <Skeleton className="h-9 w-20 mt-2" />
            ) : (
              <>
                <p className={cn('text-3xl font-black mt-1 tabular-nums', stats.lowStock > 0 ? 'text-amber-700' : 'text-emerald-700')}>{animatedLowStock}</p>
                <p className="text-xs font-semibold text-amber-700/90 mt-1">Items with balance from 1 to 10</p>
                <div className="mt-2 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-[width] duration-700"
                    style={{ width: statsVisualsAnimated ? `${Math.min(lowStockPercentage, 100)}%` : '0%' }}
                  />
                </div>
              </>
            )}
          </Card>
          <Card
            className={cn(
              'border border-sky-200 rounded-sm p-4 shadow-sm bg-sky-50/50 transition-all duration-500',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '180ms' }}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-wider text-sky-700">Out This Month</p>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <ArrowDownUp className="h-4 w-4" />
              </span>
            </div>
            {loadingTransactions ? (
              <Skeleton className="h-9 w-20 mt-2" />
            ) : (
              <>
                <p className="text-3xl font-black text-sky-700 mt-1 tabular-nums">{animatedOutThisMonth}</p>
                <p className="text-xs font-semibold text-sky-700/90 mt-1 inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                  Quantity out for {currentMonthYearLabel}
                </p>
              </>
            )}
          </Card>
        </div>

        <div
          className={cn(
            'grid grid-cols-1 xl:grid-cols-2 gap-6 transition-all duration-500',
            statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
          style={{ transitionDelay: '220ms' }}
        >
        <Card
          className={cn(
            'border border-slate-200 rounded-sm shadow-sm overflow-hidden h-full flex flex-col transition-all duration-500',
            statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
          style={{ transitionDelay: '260ms' }}
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-rose-50/40">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A4163A]">Item Setup</p>
            <h2 className="text-lg font-black text-slate-900 mt-1">Create New Inventory Item</h2>
          </div>
          <div className="p-5 h-full flex flex-col gap-4">
            <div className="space-y-4 flex-1">
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Item Name</Label>
                <Input
                  value={itemDraft.item_name}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, item_name: e.target.value }))}
                  placeholder="Bond Paper A4"
                  className={cn('rounded-sm h-10', isDuplicateItemName ? 'border-rose-400 focus-visible:ring-rose-500' : '')}
                  disabled={!canEditItemSetup}
                />
                {isDuplicateItemName ? (
                  <p className="text-[11px] font-semibold text-rose-700 inline-flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Duplicate item name. Existing item: {duplicateItemNameMatch?.item_code} - {duplicateItemNameMatch?.item_name}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Category</Label>
                <Input value={itemDraft.category} onChange={(e) => setItemDraft((prev) => ({ ...prev, category: e.target.value }))} placeholder="Stationery" className="rounded-sm h-10" disabled={!canEditItemSetup} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Category Quick Picks</Label>
                {categoryOptions.length === 0 ? (
                  <p className="text-xs text-slate-500">No saved categories yet. Create your first category above.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.slice(0, 12).map((category) => {
                      const isSelected = normalizedCategoryPreview.toLowerCase() === category.toLowerCase()
                      return (
                        <Button
                          key={`quick-category-${category}`}
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!canEditItemSetup}
                          onClick={() => setItemDraft((prev) => ({ ...prev, category }))}
                          className={cn(
                            'h-7 rounded-full px-3 text-[11px] font-bold',
                            isSelected ? 'border-[#A4163A]/40 bg-rose-50 text-[#A4163A]' : 'border-slate-200 text-slate-600'
                          )}
                        >
                          {category}
                        </Button>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Beginning Balance</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={itemDraft.opening_balance}
                  onKeyDown={blockNonIntegerKey}
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, opening_balance: sanitizeIntegerInput(e.target.value) }))}
                  className="rounded-sm h-10"
                  disabled={!canEditItemSetup}
                />
              </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">Naming + Code Preview</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Next Code</p>
                    <p className="text-sm font-bold text-slate-700">{nextItemCodePreview}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Name Preview</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{normalizedItemNamePreview || '-'}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category Preview</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{normalizedCategoryPreview || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={() => void createItem()} disabled={savingItem || !canEditItemSetup || isDuplicateItemName || !adminDepartment} className="w-full bg-[#A4163A] hover:bg-[#8D1332] text-white font-black rounded-lg mt-auto">
              {savingItem ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Item
            </Button>
          </div>
        </Card>

        <Card
          className={cn(
            'border border-slate-200 rounded-sm shadow-sm overflow-hidden h-full flex flex-col transition-all duration-500',
            statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
          style={{ transitionDelay: '320ms' }}
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-white to-rose-50/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#A4163A]">Stock Movement</p>
                <h2 className="text-lg font-black text-slate-900 mt-1">Record Quantity In/Out</h2>
              </div>
              <div className="inline-flex flex-col gap-1">
                <div className="relative inline-flex h-10 w-[230px] rounded-full border border-[#A4163A]/25 bg-rose-50 p-1">
                  <span
                    className={cn(
                      'pointer-events-none absolute top-1 h-8 w-[111px] rounded-full bg-[#A4163A] transition-all duration-300',
                      movementType === 'out'
                        ? 'translate-x-[111px] opacity-100'
                        : movementType === 'in'
                          ? 'translate-x-0 opacity-100'
                          : 'opacity-0'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => handleMovementTypeChange('in')}
                    disabled={!canEditTransactions}
                    className={cn(
                      'relative z-10 h-8 flex-1 rounded-full text-xs font-black transition-colors',
                      movementType === 'in' ? 'text-white' : 'text-[#A4163A] hover:text-[#8D1332]'
                    )}
                  >
                    Quantity In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovementTypeChange('out')}
                    disabled={!canEditTransactions}
                    className={cn(
                      'relative z-10 h-8 flex-1 rounded-full text-xs font-black transition-colors',
                      movementType === 'out' ? 'text-white' : 'text-[#A4163A] hover:text-[#8D1332]'
                    )}
                  >
                    Quantity Out
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-5 h-full flex flex-col gap-4">
            <div className="space-y-4 flex-1">
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Item & Quantity</p>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Item</Label>
                <Popover open={itemPickerOpen} onOpenChange={setItemPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={itemPickerOpen}
                      className="h-10 w-full justify-between rounded-sm font-normal"
                      disabled={!canEditTransactions}
                    >
                      {selectedItem ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate">{selectedItem.item_code} - {selectedItem.item_name}</span>
                          <Badge className={cn('rounded-sm border shrink-0', getStockBadgeTone(Number(selectedItem.current_balance || 0)))}>
                            {selectedItem.current_balance} in stock
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-slate-500">Search and select item</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                <PopoverContent className="w-[440px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search item code, name, category..." />
                    <CommandList>
                      <CommandEmpty>No matching item found.</CommandEmpty>
                      {groupedItemsByCategory.map((group) => (
                        <CommandGroup key={`item-category-${group.category}`} heading={group.category}>
                          {group.rows.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.item_code} ${item.item_name} ${item.category} ${item.department_name || ''}`}
                              onSelect={() => {
                                const value = String(item.id)
                                setTransactionDraft((prev) => ({
                                  ...prev,
                                  item_id: value,
                                }))
                                setItemPickerOpen(false)
                                void loadTransactions(transactionYearFilter, value)
                              }}
                              className="py-2.5"
                            >
                              <div className="flex w-full items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-800">{item.item_code} - {item.item_name}</p>
                                  <p className="truncate text-[11px] text-slate-500">{item.category} - {item.department_name || '-'}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge className={cn('rounded-sm border', getStockBadgeTone(Number(item.current_balance || 0)))}>
                                    {item.current_balance}
                                  </Badge>
                                  <Check className={cn('h-4 w-4', transactionDraft.item_id === String(item.id) ? 'opacity-100 text-emerald-600' : 'opacity-0')} />
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {selectedItem ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center justify-between gap-3">
                  <span className="font-semibold truncate">
                    Selected: {selectedItem.item_code} - {selectedItem.item_name}
                  </span>
                  <Badge className={cn('rounded-sm border', getStockBadgeTone(Number(selectedItem.current_balance || 0)))}>
                    Balance {selectedItem.current_balance}
                  </Badge>
                </div>
              ) : null}
              <div
                key={`quantity-field-${movementType || 'none'}`}
                className="space-y-1.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
              >
                <Label className="text-xs font-black uppercase tracking-wider text-slate-500">
                  {movementType === 'out' ? 'Quantity Out' : movementType === 'in' ? 'Quantity In' : 'Quantity'}
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={movementType === 'out' ? transactionDraft.quantity_out : transactionDraft.quantity_in}
                  onKeyDown={blockNonIntegerKey}
                  onChange={(e) => {
                    const nextValue = sanitizeIntegerInput(e.target.value)
                    setTransactionDraft((prev) => ({
                      ...prev,
                      quantity_in: movementType === 'in' ? nextValue : '0',
                      quantity_out: movementType === 'out' ? nextValue : '0',
                    }))
                  }}
                  className={cn('rounded-sm h-10', exceedsSelectedStock ? 'border-rose-400 focus-visible:ring-rose-500' : '')}
                  disabled={!canEditTransactions || !movementType}
                  placeholder={movementType ? 'Enter quantity' : 'Select movement type first'}
                />
                {exceedsSelectedStock ? (
                  <p className="text-[11px] font-semibold text-rose-700 inline-flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Quantity Out exceeds current stock ({selectedItem?.current_balance ?? 0}).
                  </p>
                ) : null}
              </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Request Details</p>
                <div
                  aria-hidden={movementType !== 'out'}
                  className={cn(
                    'grid overflow-hidden transition-all duration-300 ease-out',
                    movementType === 'out' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className={cn('min-h-0 space-y-4 pb-1', movementType === 'out' ? '' : 'pointer-events-none')}>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Requested By</Label>
                      <Popover open={employeePickerOpen} onOpenChange={setEmployeePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeePickerOpen}
                            className="h-10 w-full justify-between rounded-sm font-normal"
                            disabled={!canEditTransactions}
                          >
                            {selectedEmployee ? (
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{getEmployeeDisplayName(selectedEmployee)}</span>
                                <Badge className="rounded-sm border bg-slate-100 text-slate-700 border-slate-200">
                                  {selectedEmployee.department || 'Unassigned'}
                                </Badge>
                              </span>
                            ) : (
                              <span className="text-slate-500">Search employed employee</span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[440px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search employee ID, name, department..." />
                            <CommandList>
                              <CommandEmpty>No employed employee found.</CommandEmpty>
                              {groupedEmployeesByDepartment.map((group) => (
                                <CommandGroup key={`employee-department-${group.department}`} heading={group.department}>
                                  {group.rows.map((employee) => (
                                    <CommandItem
                                      key={employee.id}
                                      value={`${employee.id} ${getEmployeeDisplayName(employee)} ${employee.department || ''}`}
                                      onSelect={() => {
                                        setTransactionDraft((prev) => ({
                                          ...prev,
                                          requested_by_employee_id: employee.id,
                                        }))
                                        setEmployeePickerOpen(false)
                                      }}
                                      className="py-2.5"
                                    >
                                      <div className="flex w-full items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate font-semibold text-slate-800">{getEmployeeDisplayName(employee)}</p>
                                          <p className="truncate text-[11px] text-slate-500">{employee.id}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <Badge className="rounded-sm border bg-slate-100 text-slate-700 border-slate-200">
                                            {employee.department || 'Unassigned'}
                                          </Badge>
                                          <Check className={cn('h-4 w-4', transactionDraft.requested_by_employee_id === employee.id ? 'opacity-100 text-emerald-600' : 'opacity-0')} />
                                        </div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Department (Auto)</Label>
                      <div className="h-10 rounded-sm border border-slate-200 bg-slate-50 px-3 flex items-center">
                        {selectedEmployee?.department ? (
                          <Badge className="rounded-sm border bg-slate-100 text-slate-700 border-slate-200">
                            {selectedEmployee.department}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate-500">Auto-filled from selected employee</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Transaction Date</Label>
                  <Input type="text" value={formatDateMmDdYyyy(transactionDraft.transaction_date)} className="rounded-sm h-10 bg-slate-50" readOnly disabled />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Issued (Log)</Label>
                  <Textarea value={transactionDraft.issued_log} onChange={(e) => setTransactionDraft((prev) => ({ ...prev, issued_log: e.target.value }))} placeholder="Purpose for stock movement..." rows={3} className="rounded-sm" disabled={!canEditTransactions} />
                </div>
              </div>
            </div>

            <Button onClick={() => void createTransaction()} disabled={savingTransaction || !canEditTransactions || !movementType || exceedsSelectedStock} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg mt-auto">
              {savingTransaction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownUp className="h-4 w-4 mr-2" />}
              Save Transaction
            </Button>
          </div>
        </Card>
      </div>

        <Card
          className={cn(
            'border border-slate-200 rounded-sm shadow-sm overflow-hidden transition-all duration-500',
            statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
          style={{ transitionDelay: '380ms' }}
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A4163A]">Inventory Register</p>
              <h3 className="text-base font-black text-slate-900 mt-1">Inventory Table</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative w-full sm:w-[260px]">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search code, item, category..."
                  className="pl-9 h-9 rounded-sm"
                />
              </div>
              <Select value={stockFilter} onValueChange={(value) => setStockFilter(value as 'all' | 'no-stock' | 'low-stock' | 'high-stock')}>
                <SelectTrigger className="h-9 rounded-sm sm:w-[220px]">
                  <SelectValue placeholder="All stock levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stock levels</SelectItem>
                  <SelectItem value="no-stock">No stocks (0)</SelectItem>
                  <SelectItem value="low-stock">Low stocks (1-10)</SelectItem>
                  <SelectItem value="high-stock">High stocks (&gt;10)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 rounded-sm sm:w-[220px]">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-rose-50/50 border-b border-rose-100">
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Item Code</TableHead>
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Item Name</TableHead>
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Category</TableHead>
                  <TableHead className="text-right font-black text-[#800020] uppercase tracking-wider text-[11px]">Current</TableHead>
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingItems ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`inventory-loading-row-${idx}`} className="border-b border-slate-100">
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-36 text-center text-slate-500">
                      {items.length === 0 ? 'No inventory items yet.' : 'No items match your filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFilteredItems.map((item) => {
                    const currentStock = Number(item.current_balance || 0)
                    const rowToneClass = currentStock === 0
                      ? 'bg-rose-50/60 border-rose-100 hover:bg-rose-100/60'
                      : currentStock >= 1 && currentStock <= 10
                        ? 'bg-amber-50/70 border-amber-100 hover:bg-amber-100/70'
                        : 'border-slate-100 hover:bg-slate-50/60'

                    return (
                      <TableRow
                        key={item.id}
                        className={cn('border-b animate-in fade-in slide-in-from-bottom-1 duration-300', rowToneClass)}
                      >
                        <TableCell className="font-black text-slate-700">{item.item_code}</TableCell>
                        <TableCell className="font-semibold text-slate-700">{item.item_name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn('rounded-sm border', getStockBadgeTone(currentStock))}>
                            {item.current_balance}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.last_updated)}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {filteredItems.length > 0 ? (
            <div className="px-5 py-4 border-t border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Showing {(inventoryPage - 1) * INVENTORY_PAGE_SIZE + 1}-
                {(inventoryPage - 1) * INVENTORY_PAGE_SIZE + paginatedFilteredItems.length} of {filteredItems.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={inventoryPage <= 1}
                  onClick={() => setInventoryPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-600 px-2">
                  Page {inventoryPage} of {inventoryTotalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={inventoryPage >= inventoryTotalPages}
                  onClick={() => setInventoryPage((prev) => Math.min(inventoryTotalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        <Card
          className={cn(
            'border border-slate-200 rounded-sm shadow-sm overflow-hidden transition-all duration-500',
            statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
          style={{ transitionDelay: '440ms' }}
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A4163A]">Movement Log</p>
                <h3 className="text-base font-black text-slate-900 mt-1">Recent Transactions</h3>
              </div>
              {loadingTransactions ? (
                <span className="inline-flex items-center text-xs font-semibold text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex h-9 rounded-md border border-slate-200 bg-white p-1">
                {([
                  { key: 'date', label: 'Date' },
                  { key: 'month', label: 'Month' },
                  { key: 'year', label: 'Year' },
                ] as Array<{ key: TransactionDateMode; label: string }>).map((mode) => (
                  <button
                    key={`tx-mode-${mode.key}`}
                    type="button"
                    onClick={() => setTransactionDateMode(mode.key)}
                    className={cn(
                      'h-7 rounded-sm px-3 text-[11px] font-black transition-colors',
                      transactionDateMode === mode.key
                        ? 'bg-[#A4163A] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {transactionDateMode === 'date' ? (
                <Input
                  type="date"
                  value={transactionDateFilter}
                  max={todayIsoDate}
                  onChange={(e) => {
                    const nextDate = e.target.value
                    if (nextDate && nextDate > todayIsoDate) return
                    setTransactionDateFilter(nextDate)
                    if (!nextDate) return
                    const parsedYear = Number(nextDate.split('-')[0] || 0)
                    if (!Number.isNaN(parsedYear) && parsedYear > 0) {
                      setTransactionYearFilter(Math.min(parsedYear, currentYear))
                    }
                  }}
                  className="h-9 rounded-sm w-full sm:w-[180px]"
                />
              ) : null}

              {transactionDateMode === 'month' ? (
                <Select value={transactionMonthFilter} onValueChange={setTransactionMonthFilter}>
                  <SelectTrigger className="h-9 rounded-sm w-full sm:w-[170px]">
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {MONTH_OPTIONS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {transactionDateMode !== 'date' ? (
                <Select
                  value={String(transactionYearFilter)}
                  onValueChange={(value) => setTransactionYearFilter(Math.min(Number(value), currentYear))}
                >
                  <SelectTrigger className="h-9 rounded-sm w-full sm:w-[120px]">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionYearOptions.map((year) => (
                      <SelectItem key={`tx-year-${year}`} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              <Select value={transactionTypeFilter} onValueChange={(value) => setTransactionTypeFilter(value as 'all' | 'in' | 'out')}>
                <SelectTrigger className="h-9 rounded-sm w-full sm:w-[140px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="in">Quantity In</SelectItem>
                  <SelectItem value="out">Quantity Out</SelectItem>
                </SelectContent>
              </Select>
              <Select value={transactionDepartmentFilter} onValueChange={setTransactionDepartmentFilter}>
                <SelectTrigger className="h-9 rounded-sm w-full sm:w-[190px]">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {transactionDepartmentOptions.map((department) => (
                    <SelectItem key={`tx-department-${department}`} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              key={visualizationAnimationKey}
              className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
            >
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">Top Items by Quantity Out</p>
                  <Select value={visualizationTopLimit} onValueChange={(value) => setVisualizationTopLimit(value as VisualizationTopLimit)}>
                    <SelectTrigger className="h-8 w-[88px] rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="8">Top 8</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {topItemsByQuantityOut.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">No outgoing item movement yet.</p>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {topItemsByQuantityOut.map((row, index) => (
                        <div
                          key={`top-item-out-${row.key}`}
                          className={cn(
                            'w-full rounded-md px-2 py-1.5 text-left space-y-1 transition-colors',
                            hoveredTopItemKey === row.key ? 'bg-rose-50/70' : 'hover:bg-slate-50'
                          )}
                          onMouseEnter={() => setHoveredTopItemKey(row.key)}
                          onMouseLeave={() => setHoveredTopItemKey((prev) => (prev === row.key ? null : prev))}
                        >
                          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                            <span className="truncate text-slate-700">{row.label}</span>
                            <span className="text-rose-700">{row.quantityOut}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-rose-500 transition-[width] duration-700 ease-out"
                              style={{
                                width: visualizationAnimated ? `${(row.quantityOut / topItemsByQuantityOutMax) * 100}%` : '0%',
                                transitionDelay: `${Math.min(index * 50, 250)}ms`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      key={`top-item-breakdown-${hoveredTopItemKey || 'none'}`}
                      className="rounded-md border border-slate-200 bg-slate-50/70 p-3 min-h-[112px] animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                    >
                      {hoveredTopItemKey ? (
                        <div key={`top-item-hover-content-${hoveredTopItemKey}`} className="animate-in fade-in-0 zoom-in-95 duration-200">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                            {topItemsByQuantityOut.find((row) => row.key === hoveredTopItemKey)?.label || 'Item'} by Department
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {(topItemDepartmentBreakdown[hoveredTopItemKey] ?? []).length === 0 ? (
                              <p className="text-xs font-semibold text-slate-500 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">No department breakdown available.</p>
                            ) : (
                              (topItemDepartmentBreakdown[hoveredTopItemKey] ?? []).map((entry, entryIndex) => (
                                <div
                                  key={`top-item-dept-${hoveredTopItemKey}-${entry.department}`}
                                  className="flex items-center justify-between gap-2 text-xs animate-in fade-in-0 slide-in-from-left-2 duration-300"
                                  style={{ animationDelay: `${Math.min(entryIndex * 45, 220)}ms` }}
                                >
                                  <span className="truncate text-slate-600">{entry.department}</span>
                                  <span className="font-semibold text-rose-700">{entry.quantityOut}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-500 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">Hover an item bar to see which departments contributed to its quantity out.</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">Department Usage (Quantity Out)</p>
                </div>
                {departmentOutData.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">No outgoing department movement yet.</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {departmentOutData.map((row, index) => {
                        const outWidth = (row.quantityOut / departmentOutMax) * 100
                        return (
                          <div
                            key={`department-usage-row-${row.label}`}
                            className={cn(
                              'w-full text-left space-y-1.5 rounded-md px-2 py-1 transition-colors',
                              hoveredDepartmentLabel === row.label ? 'bg-rose-50/70' : 'hover:bg-slate-50'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[11px] font-semibold text-slate-700 truncate">{row.label}</p>
                              <span className="text-[11px] font-semibold text-rose-700">{row.quantityOut}</span>
                            </div>
                            <div
                              className="h-2 rounded-full bg-slate-100 overflow-hidden"
                              onMouseEnter={() => setHoveredDepartmentLabel(row.label)}
                              onMouseLeave={() => setHoveredDepartmentLabel((prev) => (prev === row.label ? null : prev))}
                            >
                              <div
                                className="h-full rounded-full bg-rose-500 transition-[width] duration-700 ease-out"
                                style={{
                                  width: visualizationAnimated ? `${outWidth}%` : '0%',
                                  transitionDelay: `${Math.min(index * 50 + 80, 360)}ms`,
                                }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div
                      key={`department-breakdown-${hoveredDepartmentLabel || 'none'}`}
                      className="rounded-md border border-slate-200 bg-slate-50/70 p-3 min-h-[112px] animate-in fade-in-0 slide-in-from-bottom-1 duration-200"
                    >
                      {hoveredDepartmentLabel ? (
                        <div key={`department-hover-content-${hoveredDepartmentLabel}`} className="animate-in fade-in-0 zoom-in-95 duration-200">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-600 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                            {hoveredDepartmentLabel} Top Items (Out)
                          </p>
                          <div className="mt-2 space-y-1.5">
                            {(departmentItemBreakdown[hoveredDepartmentLabel] ?? []).length === 0 ? (
                              <p className="text-xs font-semibold text-slate-500 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">No item breakdown available.</p>
                            ) : (
                              (departmentItemBreakdown[hoveredDepartmentLabel] ?? []).map((entry, entryIndex) => (
                                <div
                                  key={`department-item-out-${hoveredDepartmentLabel}-${entry.itemLabel}`}
                                  className="flex items-center justify-between gap-2 text-xs animate-in fade-in-0 slide-in-from-left-2 duration-300"
                                  style={{ animationDelay: `${Math.min(entryIndex * 45, 220)}ms` }}
                                >
                                  <span className="truncate text-slate-600">{entry.itemLabel}</span>
                                  <span className="font-semibold text-rose-700">{entry.quantityOut}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-500 animate-in fade-in-0 slide-in-from-bottom-1 duration-200">Hover a department out bar to see which items drove its quantity out.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-100">
                  <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-600">Item Code</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-600">Item Name</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-600">Category</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-600">Department</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-wider text-[11px] text-slate-600">Beginning Balance</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-wider text-[11px] text-slate-600">Quantity In</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-wider text-[11px] text-slate-600">Quantity Out</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-wider text-[11px] text-slate-600">Current Balance</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-600">Issued (Log)</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-wider text-[11px] text-slate-600">Balance (Auto)</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-600">Requested By</TableHead>
                  <TableHead className="font-black uppercase tracking-wider text-[11px] text-slate-600">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTransactions ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`transaction-loading-row-${idx}`} className="border-b border-slate-100">
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-52" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-14 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="h-32 text-center text-slate-500">
                      {transactions.length === 0 ? 'No transaction records yet.' : 'No transactions match your filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((row) => (
                    <TableRow key={row.id} className="border-b border-slate-100 hover:bg-slate-50/60 animate-in fade-in slide-in-from-bottom-1 duration-300">
                      <TableCell className="font-semibold text-slate-700">{row.item_code || '-'}</TableCell>
                      <TableCell className="font-semibold text-slate-700">{row.item_name || '-'}</TableCell>
                      <TableCell>{row.category || '-'}</TableCell>
                      <TableCell>{row.department_name || '-'}</TableCell>
                      <TableCell className="text-right">{row.beginning_balance}</TableCell>
                      <TableCell className="text-right text-emerald-700 font-semibold">{row.quantity_in}</TableCell>
                      <TableCell className="text-right text-rose-700 font-semibold">{row.quantity_out}</TableCell>
                      <TableCell className="text-right font-black text-slate-700">{row.current_balance}</TableCell>
                      <TableCell className="max-w-[320px]">
                        <p className="truncate text-slate-600">{row.issued_log || '-'}</p>
                      </TableCell>
                      <TableCell className="text-right">{row.balance_auto}</TableCell>
                      <TableCell>{row.requested_by_name || '-'}</TableCell>
                      <TableCell>{formatDate(row.updated_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {filteredTransactions.length > 0 ? (
            <div className="px-5 py-4 border-t border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs font-semibold text-slate-500">
                Showing {(transactionsPage - 1) * TRANSACTIONS_PAGE_SIZE + 1}-
                {(transactionsPage - 1) * TRANSACTIONS_PAGE_SIZE + paginatedTransactions.length} of {filteredTransactions.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={transactionsPage <= 1}
                  onClick={() => setTransactionsPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-600 px-2">
                  Page {transactionsPage} of {transactionsTotalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  disabled={transactionsPage >= transactionsTotalPages}
                  onClick={() => setTransactionsPage((prev) => Math.min(transactionsTotalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </Card>

        {stats.lowStock > 0 ? (
          <Card
            className={cn(
              'border border-rose-200 bg-rose-50/70 rounded-sm px-4 py-3 transition-all duration-500',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '520ms' }}
          >
            <p className="text-[12px] font-bold text-rose-700 inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {stats.lowStock} item{stats.lowStock > 1 ? 's are' : ' is'} in low stock (1 to 10). Consider restocking soon.
            </p>
          </Card>
        ) : (
          <Card
            className={cn(
              'border border-emerald-200 bg-emerald-50/70 rounded-sm px-4 py-3 transition-all duration-500',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '520ms' }}
          >
            <p className="text-[12px] font-bold text-emerald-700 inline-flex items-center gap-2">
              <PackageCheck className="h-4 w-4" />
              All tracked inventory items are above low-stock threshold.
            </p>
          </Card>
        )}

        <Dialog
          open={createItemConfirmOpen}
          onOpenChange={(open) => {
            if (savingItem) return
            setCreateItemConfirmOpen(open)
            if (!open) setCreateItemConfirmDraft(null)
          }}
        >
          <DialogContent className="bg-white border-2 border-[#FFE5EC] rounded-2xl sm:max-w-md p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-2">
              <DialogHeader className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-rose-50 rounded-full border border-rose-100">
                  <Plus className="w-7 h-7 text-[#A4163A]" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold text-[#4A081A]">Confirm Add Item</DialogTitle>
                  <DialogDescription className="text-stone-500 font-medium">
                    Review the details below before adding this inventory item.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-2 text-left">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Item</span>
                  <span className="text-sm font-bold text-slate-800">{createItemConfirmDraft?.item_name || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Category</span>
                  <span className="text-sm font-bold text-slate-800">{createItemConfirmDraft?.category || '-'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Beginning Balance</span>
                  <span className="text-sm font-bold text-[#A4163A]">{createItemConfirmDraft?.opening_balance ?? 0}</span>
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-6 flex flex-col sm:flex-row gap-3 mt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateItemConfirmOpen(false)
                  setCreateItemConfirmDraft(null)
                }}
                disabled={savingItem}
                className="flex-1 border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void executeCreateItem()}
                disabled={savingItem || !createItemConfirmDraft}
                className="flex-1 bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-95"
              >
                {savingItem ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Confirm Add'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}


