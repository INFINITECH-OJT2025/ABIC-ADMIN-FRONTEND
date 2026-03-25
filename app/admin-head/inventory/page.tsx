"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { useUserRole } from '@/lib/hooks/useUserRole'
import { PageErrorState } from '@/components/state/page-feedback'
import { toast } from 'sonner'
import { Boxes, Loader2, RefreshCw, Plus, ArrowDownUp, Search, AlertTriangle, PackageCheck, ChevronsUpDown, Check, Pencil, Trash2, Save, X, Eye } from 'lucide-react'

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
  requested_by_position?: string | null
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
type CreateItemFxStage = 'idle' | 'storing' | 'success' | 'error'
type QuantityFxMode = 'in' | 'out'
type TransactionFxStage = 'idle' | 'storing' | 'success' | 'error'
type QuantityChangeFxState = {
  active: boolean
  mode: QuantityFxMode
  amount: number
  key: number
  zeroHit: boolean
}
type InventoryItemEditDraft = {
  item_name: string
  category: string
}
type MovementType = 'in' | 'out'
type TransactionDateMode = 'date' | 'month' | 'year'
type VisualizationTopLimit = '5' | '8' | '10'
type DepartmentColorTone = {
  badge: string
  swatch: string
}

const NO_DEPARTMENT_ASSIGNED_LABEL = 'NO DEPARTMENT ASSIGNED'
const CREATE_ITEM_SUCCESS_FEEDBACK_MS = 850
const QUANTITY_FX_VISIBLE_MS = 950
const TRANSACTION_SUCCESS_FEEDBACK_MS = 800
const DEFAULT_DEPARTMENT_COLOR_TONE: DepartmentColorTone = {
  badge: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 group-data-[selected=true]:bg-slate-100 group-data-[selected=true]:text-slate-700 group-data-[selected=true]:border-slate-300',
  swatch: 'bg-slate-300 border-slate-400',
}
const DEPARTMENT_COLOR_TONES: DepartmentColorTone[] = [
  {
    badge: 'bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-100 hover:text-violet-800 hover:border-violet-300 group-data-[selected=true]:bg-violet-100 group-data-[selected=true]:text-violet-800 group-data-[selected=true]:border-violet-300',
    swatch: 'bg-violet-400 border-violet-500',
  },
  {
    badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 hover:bg-fuchsia-100 hover:text-fuchsia-800 hover:border-fuchsia-300 group-data-[selected=true]:bg-fuchsia-100 group-data-[selected=true]:text-fuchsia-800 group-data-[selected=true]:border-fuchsia-300',
    swatch: 'bg-fuchsia-400 border-fuchsia-500',
  },
  {
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-100 hover:text-indigo-800 hover:border-indigo-300 group-data-[selected=true]:bg-indigo-100 group-data-[selected=true]:text-indigo-800 group-data-[selected=true]:border-indigo-300',
    swatch: 'bg-indigo-400 border-indigo-500',
  },
  {
    badge: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 group-data-[selected=true]:bg-blue-100 group-data-[selected=true]:text-blue-800 group-data-[selected=true]:border-blue-300',
    swatch: 'bg-blue-400 border-blue-500',
  },
  {
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 hover:bg-cyan-100 hover:text-cyan-800 hover:border-cyan-300 group-data-[selected=true]:bg-cyan-100 group-data-[selected=true]:text-cyan-800 group-data-[selected=true]:border-cyan-300',
    swatch: 'bg-cyan-400 border-cyan-500',
  },
  {
    badge: 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-100 hover:text-teal-800 hover:border-teal-300 group-data-[selected=true]:bg-teal-100 group-data-[selected=true]:text-teal-800 group-data-[selected=true]:border-teal-300',
    swatch: 'bg-teal-400 border-teal-500',
  },
  {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 group-data-[selected=true]:bg-emerald-100 group-data-[selected=true]:text-emerald-800 group-data-[selected=true]:border-emerald-300',
    swatch: 'bg-emerald-400 border-emerald-500',
  },
  {
    badge: 'bg-lime-100 text-lime-800 border-lime-300 hover:bg-lime-100 hover:text-lime-800 hover:border-lime-300 group-data-[selected=true]:bg-lime-100 group-data-[selected=true]:text-lime-800 group-data-[selected=true]:border-lime-300',
    swatch: 'bg-lime-400 border-lime-500',
  },
  {
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100 hover:text-yellow-800 hover:border-yellow-300 group-data-[selected=true]:bg-yellow-100 group-data-[selected=true]:text-yellow-800 group-data-[selected=true]:border-yellow-300',
    swatch: 'bg-yellow-400 border-yellow-500',
  },
  {
    badge: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 group-data-[selected=true]:bg-amber-100 group-data-[selected=true]:text-amber-800 group-data-[selected=true]:border-amber-300',
    swatch: 'bg-amber-400 border-amber-500',
  },
  {
    badge: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100 hover:text-orange-800 hover:border-orange-300 group-data-[selected=true]:bg-orange-100 group-data-[selected=true]:text-orange-800 group-data-[selected=true]:border-orange-300',
    swatch: 'bg-orange-400 border-orange-500',
  },
  {
    badge: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-100 hover:text-rose-800 hover:border-rose-300 group-data-[selected=true]:bg-rose-100 group-data-[selected=true]:text-rose-800 group-data-[selected=true]:border-rose-300',
    swatch: 'bg-rose-400 border-rose-500',
  },
]

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
  issued_log: 'RESTOCK',
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

const normalizePosition = (value: string | null | undefined): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')

const getEmployeeDepartmentLabel = (employee: Pick<EmployeeRow, 'department' | 'position'> | null | undefined): string => {
  const department = String(employee?.department || '').trim()
  if (department) return department
  const position = String(employee?.position || '').trim()
  return position ? `${NO_DEPARTMENT_ASSIGNED_LABEL} (${position})` : NO_DEPARTMENT_ASSIGNED_LABEL
}

const getTransactionDepartmentLabel = (row: Pick<TransactionRow, 'department_name' | 'requested_by_position'>): string => {
  const department = String(row.department_name || '').trim()
  const isNoDepartmentAssigned = department.toLowerCase() === NO_DEPARTMENT_ASSIGNED_LABEL.toLowerCase()
  if (department && !isNoDepartmentAssigned) return department

  const position = String(row.requested_by_position || '').trim()
  if (position) return `${NO_DEPARTMENT_ASSIGNED_LABEL} (${position})`

  return department || NO_DEPARTMENT_ASSIGNED_LABEL
}
const normalizeDepartmentKey = (value: string | null | undefined): string => String(value || '').trim().toLowerCase()

const getStockBadgeTone = (stock: number): string => {
  if (stock <= 0) return 'bg-red-100 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-700 hover:border-red-200 group-data-[selected=true]:bg-red-100 group-data-[selected=true]:text-red-700 group-data-[selected=true]:border-red-200'
  if (stock <= 10) return 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-700 hover:border-yellow-200 group-data-[selected=true]:bg-yellow-100 group-data-[selected=true]:text-yellow-700 group-data-[selected=true]:border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-700 hover:border-green-200 group-data-[selected=true]:bg-green-100 group-data-[selected=true]:text-green-700 group-data-[selected=true]:border-green-200'
}

const sanitizeIntegerInput = (value: string): string => value.replace(/[^\d]/g, '')
const normalizeUppercaseInventoryText = (value: string): string => value.toUpperCase()

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
  const { isViewOnly } = useUserRole()
  const viewOnlyDescription = 'Create, update, and delete actions are disabled in view only mode.'
  const notifyViewOnly = () => {
    toast.warning('View Only Mode', {
      description: viewOnlyDescription,
    })
  }
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
  const [createItemFxStage, setCreateItemFxStage] = useState<CreateItemFxStage>('idle')
  const [createItemFxError, setCreateItemFxError] = useState<string | null>(null)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [transactionFxOpen, setTransactionFxOpen] = useState(false)
  const [transactionFxStage, setTransactionFxStage] = useState<TransactionFxStage>('idle')
  const [transactionFxError, setTransactionFxError] = useState<string | null>(null)
  const [transactionFxPayload, setTransactionFxPayload] = useState<{ mode: QuantityFxMode; amount: number } | null>(null)
  const [quantityChangeFx, setQuantityChangeFx] = useState<QuantityChangeFxState>({
    active: false,
    mode: 'in',
    amount: 0,
    key: 0,
    zeroHit: false,
  })
  const [savingItemEdit, setSavingItemEdit] = useState(false)
  const [deletingItems, setDeletingItems] = useState(false)
  const [createItemConfirmOpen, setCreateItemConfirmOpen] = useState(false)
  const [createItemConfirmDraft, setCreateItemConfirmDraft] = useState<CreateItemConfirmDraft | null>(null)
  const [itemEditMode, setItemEditMode] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [itemEditDraft, setItemEditDraft] = useState<InventoryItemEditDraft | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])
  const [itemIdsToDelete, setItemIdsToDelete] = useState<number[]>([])
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
  const inventoryTableRef = useRef<HTMLDivElement | null>(null)
  const transactionsSectionRef = useRef<HTMLDivElement | null>(null)
  const isCreateItemFxVisible = createItemFxStage !== 'idle'
  const isCreateItemStoring = createItemFxStage === 'storing'
  const isCreateItemSuccess = createItemFxStage === 'success'
  const isCreateItemError = createItemFxStage === 'error'
  const isTransactionFxStoring = transactionFxStage === 'storing'
  const isTransactionFxSuccess = transactionFxStage === 'success'
  const isTransactionFxError = transactionFxStage === 'error'
  const quantityFxTimeoutRef = useRef<number | null>(null)

  const adminSupervisorHrEmployee = useMemo(() => {
    return employees.find((employee) => normalizePosition(employee.position) === 'admin supervisor/hr') ?? null
  }, [employees])

  const effectiveRequestedByEmployeeId = movementType === 'in'
    ? (adminSupervisorHrEmployee?.id ?? '')
    : transactionDraft.requested_by_employee_id

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === transactionDraft.item_id) ?? null,
    [items, transactionDraft.item_id]
  )
  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === effectiveRequestedByEmployeeId) ?? null,
    [employees, effectiveRequestedByEmployeeId]
  )
  const normalizeForDuplicateCheck = (name: string) => {
    return String(name || '').trim().toLowerCase().split(/\s+/).sort().join(' ')
  }

  const duplicateItemNameMatch = useMemo(() => {
    const draftNameRaw = normalizeForDuplicateCheck(itemDraft.item_name)
    if (!draftNameRaw) return null
    return items.find((item) => normalizeForDuplicateCheck(item.item_name) === draftNameRaw) ?? null
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
      const departmentA = getEmployeeDepartmentLabel(a).toLowerCase()
      const departmentB = getEmployeeDepartmentLabel(b).toLowerCase()
      const byDepartment = departmentA.localeCompare(departmentB)
      if (byDepartment !== 0) return byDepartment
      return getEmployeeDisplayName(a).toLowerCase().localeCompare(getEmployeeDisplayName(b).toLowerCase())
    })
    sortedEmployees.forEach((employee) => {
      const department = getEmployeeDepartmentLabel(employee)
      const bucket = grouped.get(department) ?? []
      bucket.push(employee)
      grouped.set(department, bucket)
    })
    return Array.from(grouped.entries()).map(([department, rows]) => ({ department, rows }))
  }, [employees])
  const departmentLegendEntries = useMemo(() => {
    let paletteIndex = 0
    return groupedEmployeesByDepartment.map((group) => {
      const normalized = normalizeDepartmentKey(group.department)
      if (!normalized || normalized.startsWith(normalizeDepartmentKey(NO_DEPARTMENT_ASSIGNED_LABEL))) {
        return {
          ...group,
          normalized,
          tone: DEFAULT_DEPARTMENT_COLOR_TONE,
        }
      }
      const tone = DEPARTMENT_COLOR_TONES[paletteIndex % DEPARTMENT_COLOR_TONES.length]
      paletteIndex += 1
      return {
        ...group,
        normalized,
        tone,
      }
    })
  }, [groupedEmployeesByDepartment])
  const departmentToneByKey = useMemo(() => {
    const map = new Map<string, DepartmentColorTone>()
    departmentLegendEntries.forEach((entry) => {
      map.set(entry.normalized, entry.tone)
    })
    return map
  }, [departmentLegendEntries])
  const getDepartmentTone = (departmentLabel: string | null | undefined): DepartmentColorTone => {
    const key = normalizeDepartmentKey(departmentLabel)
    return departmentToneByKey.get(key) ?? DEFAULT_DEPARTMENT_COLOR_TONE
  }

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
  const canEditItemSetup = isPastOrPresentYear && !isViewOnly
  const canEditTransactions = selectedYear === currentYear && !isViewOnly

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

  const selectedItemIdSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds])
  const filteredItemIds = useMemo(() => filteredItems.map((item) => item.id), [filteredItems])
  const allFilteredItemsSelected = filteredItems.length > 0 && selectedItemIds.length === filteredItems.length

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
        .map((row) => getTransactionDepartmentLabel(row))
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
        : getTransactionDepartmentLabel(row).toLowerCase() === transactionDepartmentFilter.toLowerCase()

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

      const departmentLabel = getTransactionDepartmentLabel(row)
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
      const label = getTransactionDepartmentLabel(row)
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
      const departmentLabel = getTransactionDepartmentLabel(row)
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

  const scrollToSection = (targetRef: React.RefObject<HTMLDivElement | null>) => {
    targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const triggerCardActionOnKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    callback: () => void
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    callback()
  }

  const handleInventoryItemsCardClick = () => {
    setStockFilter('all')
    setCategoryFilter('all')
    setInventoryPage(1)
    scrollToSection(inventoryTableRef)
  }

  const handleNoStockCardClick = () => {
    setStockFilter('no-stock')
    setCategoryFilter('all')
    setInventoryPage(1)
    scrollToSection(inventoryTableRef)
  }

  const handleLowStockCardClick = () => {
    setStockFilter('low-stock')
    setCategoryFilter('all')
    setInventoryPage(1)
    scrollToSection(inventoryTableRef)
  }

  const handleOutThisMonthCardClick = () => {
    setTransactionDateMode('month')
    setTransactionDateFilter('')
    setTransactionMonthFilter(currentMonthValue)
    setTransactionYearFilter(currentYear)
    setTransactionTypeFilter('out')
    setTransactionDepartmentFilter('all')
    setTransactionDraft((prev) => ({ ...prev, item_id: '' }))
    setItemPickerOpen(false)
    setTransactionsPage(1)
    scrollToSection(transactionsSectionRef)
  }

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

  const loadTransactions = async (year: number) => {
    try {
      setLoadingTransactions(true)
      const params = new URLSearchParams({
        year: String(year),
        limit: '200',
      })
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
    void loadTransactions(transactionYearFilter)
  }, [transactionYearFilter])

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
    const validIds = new Set(items.map((item) => item.id))
    setSelectedItemIds((prev) => prev.filter((id) => validIds.has(id)))
    setItemIdsToDelete((prev) => prev.filter((id) => validIds.has(id)))

    if (editingItemId !== null && !validIds.has(editingItemId)) {
      setEditingItemId(null)
      setItemEditDraft(null)
    }
  }, [items, editingItemId])

  useEffect(() => {
    const visibleIds = new Set(filteredItemIds)
    setSelectedItemIds((prev) => prev.filter((id) => visibleIds.has(id)))
    setItemIdsToDelete((prev) => prev.filter((id) => visibleIds.has(id)))
  }, [filteredItemIds])

  useEffect(() => {
    if (itemEditMode) return
    setEditingItemId(null)
    setItemEditDraft(null)
    setSelectedItemIds([])
    setItemIdsToDelete([])
  }, [itemEditMode])

  useEffect(() => {
    setTransactionsPage(1)
  }, [
    transactions.length,
    selectedYear,
    transactionDateMode,
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
      const nextId = adminSupervisorHrEmployee?.id ?? ''
      if (prev.requested_by_employee_id === nextId) return prev
      return { ...prev, requested_by_employee_id: nextId }
    })
  }, [movementType, adminSupervisorHrEmployee?.id])

  useEffect(() => {
    return () => {
      if (quantityFxTimeoutRef.current !== null) {
        window.clearTimeout(quantityFxTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setQuantityChangeFx((prev) => (prev.active ? { ...prev, active: false, amount: 0, zeroHit: false } : prev))
  }, [transactionDraft.item_id])

  const handleMovementTypeChange = (nextType: MovementType) => {
    if (isViewOnly) return
    setMovementType(nextType)
    setTransactionDraft((prev) => ({
      ...prev,
      quantity_in: nextType === 'in' ? prev.quantity_in : '0',
      quantity_out: nextType === 'out' ? prev.quantity_out : '0',
      issued_log: nextType === 'in' ? 'RESTOCK' : (prev.issued_log === 'RESTOCK' ? '' : prev.issued_log),
      requested_by_employee_id: nextType === 'in' ? (adminSupervisorHrEmployee?.id ?? '') : '',
    }))
  }

  const triggerQuantityChangeFx = (mode: QuantityFxMode, amount: number, zeroHit = false) => {
    if (amount <= 0) return
    setQuantityChangeFx((prev) => {
      const mergeWithActive = prev.active && prev.mode === mode
      return {
        active: true,
        mode,
        amount: mergeWithActive ? prev.amount + amount : amount,
        key: prev.key + 1,
        zeroHit: mergeWithActive ? (prev.zeroHit || zeroHit) : zeroHit,
      }
    })
    if (quantityFxTimeoutRef.current !== null) {
      window.clearTimeout(quantityFxTimeoutRef.current)
    }
    quantityFxTimeoutRef.current = window.setTimeout(() => {
      setQuantityChangeFx((prev) => ({ ...prev, active: false, amount: 0, zeroHit: false }))
      quantityFxTimeoutRef.current = null
    }, QUANTITY_FX_VISIBLE_MS)
  }

  const executeCreateItem = async () => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
    if (!createItemConfirmDraft) return
    try {
      setCreateItemFxError(null)
      setCreateItemFxStage('storing')
      setSavingItem(true)
      if (!adminDepartment) {
        const message = 'No Admin Department was found in departments. Please create it first.'
        setCreateItemFxError(message)
        setCreateItemFxStage('error')
        toast.error('Admin Department Missing', {
          description: message,
        })
        return
      }
      const payload = {
        item_name: normalizeUppercaseInventoryText(createItemConfirmDraft.item_name).trim(),
        category: normalizeUppercaseInventoryText(createItemConfirmDraft.category).trim(),
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
      setCreateItemFxStage('success')
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, CREATE_ITEM_SUCCESS_FEEDBACK_MS)
      })
      setCreateItemConfirmOpen(false)
      setCreateItemConfirmDraft(null)
      setCreateItemFxStage('idle')
      setCreateItemFxError(null)
      await loadItems(selectedYear)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create inventory item.'
      setCreateItemFxError(message)
      setCreateItemFxStage('error')
      toast.error('Create Item Failed', { description: message })
    } finally {
      setSavingItem(false)
    }
  }

  const createItem = async () => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
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

    const itemName = normalizeUppercaseInventoryText(itemDraft.item_name).trim()
    const category = normalizeUppercaseInventoryText(itemDraft.category).trim()
    const openingBalance = Number(itemDraft.opening_balance || 0)

    if (!itemName || !category) {
      toast.warning('Missing Item Details', {
        description: 'Please provide both Item Name and Category before creating the item.',
      })
      return
    }

    setCreateItemFxStage('idle')
    setCreateItemFxError(null)
    setCreateItemConfirmDraft({
      item_name: itemName,
      category,
      opening_balance: openingBalance,
    })
    setCreateItemConfirmOpen(true)
  }

  const handleItemEditModeToggle = () => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
    if (!canEditItemSetup) {
      toast.warning('Edit Restricted', {
        description: 'Item setup can only be edited for past or present years.',
      })
      return
    }
    setItemEditMode((prev) => !prev)
  }

  const toggleSelectAllItems = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(filteredItemIds)
      return
    }
    setSelectedItemIds([])
  }

  const toggleItemSelection = (itemId: number, checked: boolean) => {
    setSelectedItemIds((prev) => {
      if (checked) return prev.includes(itemId) ? prev : [...prev, itemId]
      return prev.filter((id) => id !== itemId)
    })
  }

  const beginEditItem = (item: InventoryRow) => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
    setEditingItemId(item.id)
    setItemEditDraft({
      item_name: normalizeUppercaseInventoryText(String(item.item_name || '')),
      category: normalizeUppercaseInventoryText(String(item.category || '')),
    })
  }

  const cancelEditItem = () => {
    setEditingItemId(null)
    setItemEditDraft(null)
  }

  const saveEditedItem = async (itemId: number) => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
    if (!canEditItemSetup) {
      toast.warning('Edit Restricted', {
        description: 'Item setup can only be edited for past or present years.',
      })
      return
    }
    if (!itemEditDraft) return

    const itemName = normalizeUppercaseInventoryText(String(itemEditDraft.item_name || '')).trim()
    const category = normalizeUppercaseInventoryText(String(itemEditDraft.category || '')).trim()

    if (!itemName || !category) {
      toast.warning('Missing Item Details', {
        description: 'Please provide both Item Name and Category before saving.',
      })
      return
    }

    const duplicateExists = items.some((item) =>
      item.id !== itemId && normalizeForDuplicateCheck(item.item_name) === normalizeForDuplicateCheck(itemName)
    )
    if (duplicateExists) {
      toast.warning('Duplicate Item', {
        description: 'An inventory item with the same name already exists.',
      })
      return
    }

    try {
      setSavingItemEdit(true)
      const response = await fetch(`${getApiUrl()}/api/office-supply/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          item_name: itemName,
          category,
        }),
      })

      await ensureOkResponse(response, 'Unable to update inventory item.')
      toast.success('Inventory item updated successfully.')
      setEditingItemId(null)
      setItemEditDraft(null)
      await Promise.all([
        loadItems(selectedYear),
        loadTransactions(transactionYearFilter),
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update inventory item.'
      toast.error('Update Item Failed', { description: message })
    } finally {
      setSavingItemEdit(false)
    }
  }

  const queueItemDeletion = (itemIds: number[]) => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
    const uniqueIds = [...new Set(itemIds.filter((id) => Number.isFinite(id) && id > 0))]
    if (uniqueIds.length === 0) return
    setItemIdsToDelete(uniqueIds)
  }

  const removeSelectedItems = async () => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
    if (!canEditItemSetup) {
      toast.warning('Edit Restricted', {
        description: 'Item setup can only be edited for past or present years.',
      })
      return
    }
    if (itemIdsToDelete.length === 0) return

    const idsToDelete = [...new Set(itemIdsToDelete)]
    const isSingleDelete = idsToDelete.length === 1
    const selectedTxItemId = Number(transactionDraft.item_id || 0)
    const shouldClearSelectedTxItem = selectedTxItemId > 0 && idsToDelete.includes(selectedTxItemId)
    try {
      setDeletingItems(true)
      const endpoint = isSingleDelete
        ? `${getApiUrl()}/api/office-supply/items/${idsToDelete[0]}`
        : `${getApiUrl()}/api/office-supply/items/batch`
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: isSingleDelete ? undefined : JSON.stringify({ item_ids: idsToDelete }),
      })

      await ensureOkResponse(response, 'Unable to delete inventory item(s).')

      setSelectedItemIds((prev) => prev.filter((id) => !idsToDelete.includes(id)))
      setItemIdsToDelete([])
      if (editingItemId !== null && idsToDelete.includes(editingItemId)) {
        setEditingItemId(null)
        setItemEditDraft(null)
      }
      if (shouldClearSelectedTxItem) {
        setTransactionDraft((prev) => ({ ...prev, item_id: '' }))
        setItemPickerOpen(false)
      }

      toast.success(
        isSingleDelete
          ? 'Inventory item deleted successfully.'
          : `${idsToDelete.length} inventory items deleted successfully.`
      )

      await Promise.all([
        loadItems(selectedYear),
        loadTransactions(transactionYearFilter),
      ])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete inventory item(s).'
      toast.error('Delete Failed', { description: message })
    } finally {
      setDeletingItems(false)
    }
  }

  const createTransaction = async () => {
    if (isViewOnly) {
      notifyViewOnly()
      return
    }
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
        ? (adminSupervisorHrEmployee?.id ?? '')
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
        toast.warning('Admin Supervisor/HR Missing', {
          description: 'No employed employee with position "Admin Supervisor/HR" was found.',
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
      setTransactionFxError(null)
      setTransactionFxPayload({
        mode: movementType,
        amount: movementType === 'in' ? quantityInValue : quantityOutValue,
      })
      setTransactionFxStage('storing')
      setTransactionFxOpen(true)
      const payload = {
        item_id: Number(transactionDraft.item_id),
        quantity_in: quantityInValue,
        quantity_out: quantityOutValue,
        transaction_at: getCurrentIsoDate(),
        issued_log: movementType === 'in' ? 'RESTOCK' : (transactionDraft.issued_log.trim() || null),
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
      setTransactionFxStage('success')
      toast.success('Inventory transaction saved successfully.')
      triggerQuantityChangeFx(
        movementType,
        movementType === 'in' ? quantityInValue : quantityOutValue,
        movementType === 'out' && selectedItem
          ? (Number(selectedItem.current_balance || 0) - quantityOutValue <= 0)
          : false
      )
      setTransactionDraft({
        ...initialTransactionDraft,
        item_id: transactionDraft.item_id,
        transaction_date: getCurrentIsoDate(),
      })
      setMovementType('in')
      await Promise.all([loadItems(selectedYear), loadTransactions(transactionYearFilter)])
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, TRANSACTION_SUCCESS_FEEDBACK_MS)
      })
      setTransactionFxOpen(false)
      setTransactionFxStage('idle')
      setTransactionFxError(null)
      setTransactionFxPayload(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save inventory transaction.'
      setTransactionFxError(message)
      setTransactionFxStage('error')
      setTransactionFxOpen(true)
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
  const inventoryColumnCount = itemEditMode ? 7 : 5

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
              {isViewOnly && (
                <p className="text-yellow-200 text-xs md:text-sm font-semibold mt-2 flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  VIEW ONLY MODE - Editing and modifications are disabled
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  void Promise.all([
                    loadAll({ silent: true }),
                    loadTransactions(transactionYearFilter),
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
              'border border-slate-200 rounded-sm p-4 shadow-sm bg-white transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01]',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '0ms' }}
            onClick={handleInventoryItemsCardClick}
            onKeyDown={(event) => triggerCardActionOnKeyDown(event, handleInventoryItemsCardClick)}
            role="button"
            tabIndex={0}
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
              'border border-rose-200 rounded-sm p-4 shadow-sm bg-rose-50/50 transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01]',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '60ms' }}
            onClick={handleNoStockCardClick}
            onKeyDown={(event) => triggerCardActionOnKeyDown(event, handleNoStockCardClick)}
            role="button"
            tabIndex={0}
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
              'border border-amber-200 rounded-sm p-4 shadow-sm bg-amber-50/50 transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01]',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '120ms' }}
            onClick={handleLowStockCardClick}
            onKeyDown={(event) => triggerCardActionOnKeyDown(event, handleLowStockCardClick)}
            role="button"
            tabIndex={0}
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
              'border border-sky-200 rounded-sm p-4 shadow-sm bg-sky-50/50 transition-all duration-500 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:scale-[1.01]',
              statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{ transitionDelay: '180ms' }}
            onClick={handleOutThisMonthCardClick}
            onKeyDown={(event) => triggerCardActionOnKeyDown(event, handleOutThisMonthCardClick)}
            role="button"
            tabIndex={0}
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
                  onChange={(e) => setItemDraft((prev) => ({ ...prev, item_name: normalizeUppercaseInventoryText(e.target.value) }))}
                  placeholder="e.g. BOND PAPER A4, BALLPEN BLACK, STAPLER etc."
                  className={cn('rounded-sm h-10 uppercase', isDuplicateItemName ? 'border-rose-400 focus-visible:ring-rose-500' : '')}
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
                <Input value={itemDraft.category} onChange={(e) => setItemDraft((prev) => ({ ...prev, category: normalizeUppercaseInventoryText(e.target.value) }))} placeholder="e.g. STATIONERY, DESK / FASTENING TOOLS etc." className="rounded-sm h-10 uppercase" disabled={!canEditItemSetup} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-slate-500">Category Quick Picks</Label>
                {categoryOptions.length === 0 ? (
                  <p className="text-xs text-slate-500">No saved categories yet. Create your first category above.</p>
                ) : (
                  <div className="flex overflow-x-auto gap-2 pb-3 custom-horizontal-scrollbar">
                    {categoryOptions.map((category) => {
                      const isSelected = normalizedCategoryPreview.toLowerCase() === category.toLowerCase()
                      return (
                        <Button
                          key={`quick-category-${category}`}
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!canEditItemSetup}
                          onClick={() => setItemDraft((prev) => ({ ...prev, category: normalizeUppercaseInventoryText(category) }))}
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
                        <CommandGroup key={`item-category-${group.category}`} heading={
                          <div className="flex items-center justify-between w-full pr-2 pt-1 pb-0.5">
                            <span className="text-xs font-medium text-slate-500 truncate min-w-0 mr-2">{group.category}</span>
                            <span className="text-[10px] font-bold tracking-widest text-[#A4163A]/80 uppercase shrink-0">STOCK</span>
                          </div>
                        }>
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
                              }}
                              className="group py-2.5"
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
                <div
                  className={cn(
                    'quantity-slot rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center justify-between gap-3',
                    quantityChangeFx.active ? 'is-active' : '',
                    quantityChangeFx.active && quantityChangeFx.mode === 'in' ? 'is-in' : '',
                    quantityChangeFx.active && quantityChangeFx.mode === 'out' ? 'is-out' : '',
                    quantityChangeFx.active && quantityChangeFx.zeroHit ? 'is-zero-hit' : ''
                  )}
                >
                  <span className="font-semibold truncate relative z-[1]">
                    Selected: {selectedItem.item_code} - {selectedItem.item_name}
                  </span>
                  <Badge
                    className={cn(
                      'quantity-value-chip rounded-sm border relative z-[1]',
                      getStockBadgeTone(Number(selectedItem.current_balance || 0))
                    )}
                  >
                    Balance {selectedItem.current_balance}
                  </Badge>
                  {quantityChangeFx.active ? (
                    <span
                      key={`quantity-delta-${quantityChangeFx.key}`}
                      className={cn(
                        'quantity-delta-float',
                        quantityChangeFx.mode === 'in' ? 'is-in' : 'is-out'
                      )}
                    >
                      {quantityChangeFx.mode === 'in' ? '+' : '-'}{quantityChangeFx.amount}
                    </span>
                  ) : null}
                  <span aria-hidden className="quantity-slot-hollow-flash" />
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
                                <Badge className={cn('rounded-sm border', getDepartmentTone(getEmployeeDepartmentLabel(selectedEmployee)).badge)}>
                                  {getEmployeeDepartmentLabel(selectedEmployee)}
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
                                  {group.rows.map((employee) => {
                                    const employeeDepartmentLabel = getEmployeeDepartmentLabel(employee)
                                    const employeeDepartmentTone = getDepartmentTone(employeeDepartmentLabel)
                                    return (
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
                                      className="group py-2.5"
                                    >
                                      <div className="flex w-full items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate font-semibold text-slate-800">{getEmployeeDisplayName(employee)}</p>
                                          <p className="truncate text-[11px] text-slate-500">{employee.id}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          <Badge className={cn('rounded-sm border', employeeDepartmentTone.badge)}>
                                            {employeeDepartmentLabel}
                                          </Badge>
                                          <Check className={cn('h-4 w-4', transactionDraft.requested_by_employee_id === employee.id ? 'opacity-100 text-emerald-600' : 'opacity-0')} />
                                        </div>
                                      </div>
                                    </CommandItem>
                                    )
                                  })}
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
                        {selectedEmployee ? (
                          <Badge className={cn('rounded-sm border', getDepartmentTone(getEmployeeDepartmentLabel(selectedEmployee)).badge)}>
                            {getEmployeeDepartmentLabel(selectedEmployee)}
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
                  <Textarea value={transactionDraft.issued_log} onChange={(e) => setTransactionDraft((prev) => ({ ...prev, issued_log: e.target.value }))} placeholder="Purpose for stock movement..." rows={3} className="rounded-sm" disabled={!canEditTransactions || movementType === 'in'} />
                </div>
              </div>
            </div>

            <Button onClick={() => void createTransaction()} disabled={savingTransaction || !canEditTransactions || !movementType || exceedsSelectedStock} className="w-full bg-[#A4163A] hover:bg-[#8D1332] text-white font-black rounded-lg mt-auto">
              {savingTransaction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowDownUp className="h-4 w-4 mr-2" />}
              Save Transaction
            </Button>
          </div>
        </Card>
      </div>

        <Card
          ref={inventoryTableRef}
          className={cn(
            'border border-slate-200 rounded-sm shadow-sm overflow-hidden transition-all duration-500',
            statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
          style={{ transitionDelay: '380ms' }}
        >
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A4163A]">Inventory Register</p>
                <h3 className="text-base font-black text-slate-900 mt-1">Inventory Table</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={itemEditMode ? 'default' : 'outline'}
                  onClick={handleItemEditModeToggle}
                  disabled={savingItemEdit || deletingItems || !canEditItemSetup}
                  className={cn(
                    'h-9 rounded-sm font-black text-xs uppercase tracking-wider',
                    itemEditMode ? 'bg-[#A4163A] hover:bg-[#800020] text-white' : 'border-[#FFE5EC] text-[#A4163A] hover:bg-rose-50'
                  )}
                >
                  {itemEditMode ? <X className="w-3.5 h-3.5 mr-2" /> : <Pencil className="w-3.5 h-3.5 mr-2" />}
                  {itemEditMode ? 'Close Edit' : 'Edit Items'}
                </Button>
                {itemEditMode ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => queueItemDeletion(selectedItemIds)}
                    disabled={selectedItemIds.length === 0 || deletingItems || savingItemEdit || !canEditItemSetup}
                    className="h-9 rounded-sm border-rose-200 text-rose-700 hover:bg-rose-50 font-black text-xs uppercase tracking-wider"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete Selected ({selectedItemIds.length})
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
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
                  {itemEditMode ? (
                    <TableHead className="w-[54px] text-center">
                      <Checkbox
                        checked={allFilteredItemsSelected ? true : selectedItemIds.length > 0 ? 'indeterminate' : false}
                        onCheckedChange={(checked) => toggleSelectAllItems(checked === true)}
                        disabled={filteredItems.length === 0 || deletingItems || savingItemEdit || !canEditItemSetup}
                        aria-label="Select all inventory items"
                        className="mx-auto"
                      />
                    </TableHead>
                  ) : null}
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Item Code</TableHead>
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Item Name</TableHead>
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Category</TableHead>
                  <TableHead className="text-right font-black text-[#800020] uppercase tracking-wider text-[11px]">Current</TableHead>
                  <TableHead className="font-black text-[#800020] uppercase tracking-wider text-[11px]">Last Updated</TableHead>
                  {itemEditMode ? (
                    <TableHead className="w-[180px] text-right font-black text-[#800020] uppercase tracking-wider text-[11px]">Action</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingItems ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`inventory-loading-row-${idx}`} className="border-b border-slate-100">
                      {itemEditMode ? <TableCell><Skeleton className="h-5 w-5 rounded-sm mx-auto" /></TableCell> : null}
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-44" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-10 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      {itemEditMode ? <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell> : null}
                    </TableRow>
                  ))
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={inventoryColumnCount} className="h-36 text-center text-slate-500">
                      {items.length === 0 ? 'No inventory items yet.' : 'No items match your filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFilteredItems.map((item) => {
                    const currentStock = Number(item.current_balance || 0)
                    const isEditingRow = itemEditMode && editingItemId === item.id
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
                        {itemEditMode ? (
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedItemIdSet.has(item.id)}
                              onCheckedChange={(checked) => toggleItemSelection(item.id, checked === true)}
                              aria-label={`Select inventory item ${item.item_code}`}
                              disabled={deletingItems || savingItemEdit || !canEditItemSetup}
                              className="mx-auto"
                            />
                          </TableCell>
                        ) : null}
                        <TableCell className="font-black text-slate-700">{item.item_code}</TableCell>
                        <TableCell className="font-semibold text-slate-700">
                          {isEditingRow ? (
                            <Input
                              value={itemEditDraft?.item_name ?? ''}
                              onChange={(e) => setItemEditDraft((prev) => ({ item_name: normalizeUppercaseInventoryText(e.target.value), category: prev?.category ?? '' }))}
                              className="h-8 rounded-sm uppercase"
                              disabled={savingItemEdit || deletingItems || !canEditItemSetup}
                            />
                          ) : (
                            item.item_name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditingRow ? (
                            <Input
                              value={itemEditDraft?.category ?? ''}
                              onChange={(e) => setItemEditDraft((prev) => ({ item_name: prev?.item_name ?? '', category: normalizeUppercaseInventoryText(e.target.value) }))}
                              className="h-8 rounded-sm uppercase"
                              disabled={savingItemEdit || deletingItems || !canEditItemSetup}
                            />
                          ) : (
                            item.category
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={cn('rounded-sm border', getStockBadgeTone(currentStock))}>
                            {item.current_balance}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.last_updated)}</TableCell>
                        {itemEditMode ? (
                          <TableCell className="text-right">
                            {isEditingRow ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 px-3 bg-[#A4163A] hover:bg-[#8D1332] text-white font-bold"
                                  onClick={() => void saveEditedItem(item.id)}
                                  disabled={savingItemEdit || deletingItems || !canEditItemSetup}
                                >
                                  {savingItemEdit ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3"
                                  onClick={cancelEditItem}
                                  disabled={savingItemEdit || deletingItems || !canEditItemSetup}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 border-[#FFE5EC] text-[#A4163A] hover:bg-rose-50"
                                  onClick={() => beginEditItem(item)}
                                  disabled={!canEditItemSetup || deletingItems || (editingItemId !== null && editingItemId !== item.id)}
                                  title="Edit item"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                                  onClick={() => queueItemDeletion([item.id])}
                                  disabled={deletingItems || savingItemEdit || !canEditItemSetup}
                                  title="Delete item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        ) : null}
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
          ref={transactionsSectionRef}
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
                      <TableCell>{getTransactionDepartmentLabel(row)}</TableCell>
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

        <div className="space-y-3 hidden">
          {noStockItemsCount > 0 ? (
            <Card
              className={cn(
                'border border-rose-200 bg-rose-50/70 rounded-sm px-4 py-3 transition-all duration-500',
                statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
              style={{ transitionDelay: '520ms' }}
            >
              <p className="text-[12px] font-bold text-rose-700 inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {noStockItemsCount} item{noStockItemsCount > 1 ? 's have' : ' has'} 0 stock. Please restock immediately.
              </p>
            </Card>
          ) : null}

          {stats.lowStock > 0 ? (
            <Card
              className={cn(
                'border border-amber-200 bg-amber-50/70 rounded-sm px-4 py-3 transition-all duration-500',
                statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
              style={{ transitionDelay: '560ms' }}
            >
              <p className="text-[12px] font-bold text-amber-700 inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {stats.lowStock} item{stats.lowStock > 1 ? 's are' : ' is'} in low stock (1 to 10). Consider restocking soon.
              </p>
            </Card>
          ) : null}

          {noStockItemsCount === 0 && stats.lowStock === 0 ? (
            <Card
              className={cn(
                'border border-emerald-200 bg-emerald-50/70 rounded-sm px-4 py-3 transition-all duration-500',
                statsVisualsAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              )}
              style={{ transitionDelay: '600ms' }}
            >
              <p className="text-[12px] font-bold text-emerald-700 inline-flex items-center gap-2">
                <PackageCheck className="h-4 w-4" />
                All tracked inventory items are above low-stock threshold.
              </p>
            </Card>
          ) : null}
        </div>

      <footer className="sticky bottom-0 w-full bg-white border-t border-slate-200 py-2.5 px-4 shadow-[0_-8px_30px_rgba(225,29,72,0.06)] z-40 flex items-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1700px] flex items-center gap-4 text-[13px] font-bold whitespace-nowrap">
          <div className="shrink-0 flex items-center gap-3 pr-4 border-r border-slate-200">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span className="text-[11px] font-black tracking-[0.2em] text-[#800020] uppercase">Live Alerts</span>
          </div>
          {noStockItemsCount > 0 || stats.lowStock > 0 ? (
            <div className="flex-1 overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 1%, black 99%, transparent)' }}>
              <div className="animate-marquee inline-flex gap-4 whitespace-nowrap items-center min-w-full">
                {noStockItemsCount > 0 && (
                  <span className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 py-1.5 px-4 rounded-full shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span className="font-extrabold text-rose-950">{noStockItemsCount} items</span> have 0 stock. Please restock immediately.
                  </span>
                )}
                {stats.lowStock > 0 && (
                  <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-1.5 px-4 rounded-full shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-amber-950">{stats.lowStock} items</span> are in low stock (1 to 10). Consider restocking soon.
                  </span>
                )}
                {/* duplicate set 1 for smooth scroll */}
                {noStockItemsCount > 0 && (
                  <span className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 py-1.5 px-4 rounded-full shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span className="font-extrabold text-rose-950">{noStockItemsCount} items</span> have 0 stock. Please restock immediately.
                  </span>
                )}
                {stats.lowStock > 0 && (
                  <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-1.5 px-4 rounded-full shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-amber-950">{stats.lowStock} items</span> are in low stock (1 to 10). Consider restocking soon.
                  </span>
                )}
                {/* duplicate set 2 for smooth scroll */}
                {noStockItemsCount > 0 && (
                  <span className="inline-flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 py-1.5 px-4 rounded-full shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span className="font-extrabold text-rose-950">{noStockItemsCount} items</span> have 0 stock. Please restock immediately.
                  </span>
                )}
                {stats.lowStock > 0 && (
                  <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 py-1.5 px-4 rounded-full shadow-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-extrabold text-amber-950">{stats.lowStock} items</span> are in low stock (1 to 10). Consider restocking soon.
                  </span>
                )}
              </div>
            </div>
          ) : (
             <span className="text-emerald-800 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 py-1.5 px-4 rounded-full shadow-sm">
               <PackageCheck className="h-4 w-4 text-emerald-600 shrink-0" /> 
               <span className="font-semibold text-emerald-950">All tracked inventory items are above low-stock threshold.</span>
             </span>
          )}
        </div>
      </footer>

        <AlertDialog
          open={itemIdsToDelete.length > 0}
          onOpenChange={(open) => {
            if (!open) setItemIdsToDelete([])
          }}
        >
          <AlertDialogContent
            size="sm"
            className="popup-surface border-2 border-rose-100 bg-white/95 backdrop-blur-sm rounded-2xl p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          >
            <div className="popup-top-strip bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500" />
            <div className="px-6 pt-6 pb-2">
              <AlertDialogHeader className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700">
                    <Trash2 className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <AlertDialogTitle className="text-xl font-black text-rose-800">
                      {itemIdsToDelete.length > 1 ? `Delete ${itemIdsToDelete.length} inventory items?` : 'Delete this inventory item?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm font-medium text-rose-700/90">
                      {itemIdsToDelete.length > 1
                        ? 'Selected items and their related inventory transactions will be permanently removed.'
                        : 'This item and its related inventory transactions will be permanently removed.'}
                    </AlertDialogDescription>
                  </div>
                </div>
                <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-3 py-2 text-[12px] font-semibold text-rose-700">
                  This action cannot be undone.
                </div>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="px-6 pb-6 flex flex-col sm:flex-row gap-3 mt-3">
              <AlertDialogCancel
                onClick={() => setItemIdsToDelete([])}
                disabled={deletingItems}
                className="h-11 rounded-xl border-2 border-stone-100 text-stone-600 font-bold hover:bg-stone-50"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="h-11 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold shadow-sm"
                onClick={() => void removeSelectedItems()}
                disabled={deletingItems || isViewOnly}
              >
                {deletingItems ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  itemIdsToDelete.length > 1 ? 'Delete Items' : 'Delete Item'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={transactionFxOpen}
          onOpenChange={(open) => {
            if (savingTransaction && isTransactionFxStoring) return
            setTransactionFxOpen(open)
            if (!open) {
              setTransactionFxStage('idle')
              setTransactionFxError(null)
              setTransactionFxPayload(null)
            }
          }}
        >
          <DialogContent className="popup-surface bg-white/95 backdrop-blur-sm border-2 border-[#DCEEF7] rounded-2xl sm:max-w-md p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            <div
              className={cn(
                'popup-top-strip',
                transactionFxPayload?.mode === 'out'
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500'
                  : 'bg-gradient-to-r from-cyan-500 via-sky-500 to-cyan-500'
              )}
            />
            <div className="px-6 pt-6 pb-2">
              <DialogHeader className="flex flex-col items-center gap-4 text-center">
                <div
                  className={cn(
                    'transaction-fx-icon',
                    transactionFxPayload?.mode === 'out' ? 'mode-out' : 'mode-in',
                    isTransactionFxStoring ? 'is-storing' : '',
                    isTransactionFxSuccess ? 'is-success' : '',
                    isTransactionFxError ? 'is-error' : ''
                  )}
                >
                  <span className="transaction-fx-ring" />
                  <span className="transaction-fx-pulse" />
                  <span className="transaction-fx-delta">
                    {(transactionFxPayload?.mode ?? 'in') === 'in' ? '+' : '-'}{transactionFxPayload?.amount ?? 0}
                  </span>
                  <span className="transaction-fx-check" />
                  <span className="transaction-fx-cross">x</span>
                </div>
                <div className="space-y-1">
                  <DialogTitle className={cn(
                    'text-2xl font-bold',
                    isTransactionFxSuccess
                      ? 'text-emerald-700'
                      : isTransactionFxError
                        ? 'text-rose-700'
                        : (transactionFxPayload?.mode === 'out' ? 'text-amber-700' : 'text-sky-700')
                  )}>
                    {isTransactionFxSuccess
                      ? 'Transaction Saved'
                      : isTransactionFxError
                        ? 'Transaction Failed'
                        : `Processing Quantity ${(transactionFxPayload?.mode ?? 'in') === 'in' ? 'In' : 'Out'}`}
                  </DialogTitle>
                  <DialogDescription className={cn('font-medium', isTransactionFxError ? 'text-rose-700/90' : 'text-stone-500')}>
                    {isTransactionFxSuccess
                      ? `Applied ${(transactionFxPayload?.mode ?? 'in') === 'in' ? '+' : '-'}${transactionFxPayload?.amount ?? 0} successfully.`
                      : isTransactionFxError
                        ? (transactionFxError || 'Unable to save this stock movement. Please retry.')
                        : 'Saving stock movement and updating item balance...'}
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div
                className={cn(
                  'mt-4 rounded-xl border px-4 py-3 grid grid-cols-2 gap-3 text-left',
                  (transactionFxPayload?.mode ?? 'in') === 'in'
                    ? 'border-sky-100 bg-sky-50/60'
                    : 'border-amber-100 bg-amber-50/60'
                )}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Movement</p>
                  <p className="text-sm font-bold text-slate-800">
                    {(transactionFxPayload?.mode ?? 'in') === 'in' ? 'Quantity In' : 'Quantity Out'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Amount</p>
                  <p className={cn(
                    'text-sm font-black',
                    (transactionFxPayload?.mode ?? 'in') === 'in' ? 'text-emerald-700' : 'text-amber-700'
                  )}>
                    {(transactionFxPayload?.mode ?? 'in') === 'in' ? '+' : '-'}{transactionFxPayload?.amount ?? 0}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-6 flex flex-col sm:flex-row gap-3 mt-3">
              {isTransactionFxError ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setTransactionFxOpen(false)
                    setTransactionFxStage('idle')
                    setTransactionFxError(null)
                    setTransactionFxPayload(null)
                  }}
                  disabled={savingTransaction}
                  className="flex-1 h-12 rounded-xl border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold"
                >
                  Close
                </Button>
              ) : null}
              {isTransactionFxError ? (
                <Button
                  type="button"
                  onClick={() => void createTransaction()}
                  disabled={savingTransaction || isViewOnly}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#0F766E] to-[#0284C7] hover:from-[#0E8A80] hover:to-[#0B98DB] text-white font-bold shadow-md transition-all active:scale-95"
                >
                  {savingTransaction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Retry Save
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={createItemConfirmOpen}
          onOpenChange={(open) => {
            if (savingItem) return
            setCreateItemConfirmOpen(open)
            if (!open) {
              setCreateItemConfirmDraft(null)
              setCreateItemFxStage('idle')
              setCreateItemFxError(null)
            }
          }}
        >
          <DialogContent className="popup-surface bg-white/95 backdrop-blur-sm border-2 border-[#FFE5EC] rounded-2xl sm:max-w-md p-0 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="popup-top-strip bg-gradient-to-r from-[#A4163A] via-[#B61C4A] to-[#A4163A]" />
            <div className="px-6 pt-6 pb-2">
              <DialogHeader className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
                  <Plus className="w-7 h-7 text-[#A4163A]" />
                </div>
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-bold text-[#4A081A]">Confirm Add Item</DialogTitle>
                  <DialogDescription className="text-stone-500 font-medium">
                    Review the details below before adding this inventory item.
                  </DialogDescription>
                </div>
              </DialogHeader>
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/50 p-4 space-y-2 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]">
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
              <div
                className={cn(
                  'mt-4 rounded-xl border px-4 transition-all duration-300 overflow-hidden',
                  isCreateItemFxVisible
                    ? 'py-4 border-[#F7D1DB] bg-[#FFF7FA] opacity-100 translate-y-0 max-h-56'
                    : 'py-0 border-transparent opacity-0 -translate-y-2 max-h-0 pointer-events-none'
                )}
                aria-live="polite"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'create-item-fx-icon',
                    isCreateItemStoring ? 'is-storing' : '',
                    isCreateItemSuccess ? 'is-success' : '',
                    isCreateItemError ? 'is-error' : ''
                  )}
                  >
                    <span className="create-item-fx-shell" />
                    <span className="create-item-fx-fill" />
                    <span className="create-item-fx-item" />
                    <span className="create-item-fx-check" />
                    <span className="create-item-fx-cross">x</span>
                    <span className="create-item-fx-particle p1" />
                    <span className="create-item-fx-particle p2" />
                    <span className="create-item-fx-particle p3" />
                    <span className="create-item-fx-particle p4" />
                  </div>
                  <div className="space-y-1">
                    <p className={cn(
                      'text-sm font-black',
                      isCreateItemSuccess ? 'text-emerald-700' : isCreateItemError ? 'text-rose-700' : 'text-[#A4163A]'
                    )}>
                      {isCreateItemSuccess ? 'Item stored successfully' : isCreateItemError ? 'Unable to store item' : 'Storing item in inventory'}
                    </p>
                    <p className={cn('text-[12px] font-medium', isCreateItemError ? 'text-rose-700/90' : 'text-slate-600')}>
                      {isCreateItemSuccess
                        ? 'The inventory record is now saved and ready to use.'
                        : isCreateItemError
                          ? (createItemFxError || 'The request was rejected. Review details and retry.')
                          : 'Processing item details and writing them into your stock records.'}
                    </p>
                  </div>
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
                  setCreateItemFxStage('idle')
                  setCreateItemFxError(null)
                }}
                disabled={savingItem}
                className="flex-1 h-12 rounded-xl border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void executeCreateItem()}
                disabled={savingItem || !createItemConfirmDraft || isViewOnly}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white font-bold shadow-md transition-all active:scale-95"
              >
                {isCreateItemStoring ? (
                  <>
                    <Boxes className="h-4 w-4 mr-2" />
                    Storing...
                  </>
                ) : isCreateItemSuccess ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Stored
                  </>
                ) : isCreateItemError ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Add
                  </>
                ) : savingItem ? (
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
        <style jsx>{`
          .popup-surface {
            box-shadow:
              0 18px 45px rgba(15, 23, 42, 0.18),
              0 2px 8px rgba(15, 23, 42, 0.08);
          }

          .popup-top-strip {
            height: 4px;
            width: 100%;
          }

          .create-item-fx-icon {
            position: relative;
            width: 68px;
            height: 68px;
            border-radius: 18px;
            border: 1px solid #ffd4df;
            background: linear-gradient(180deg, #ffffff 0%, #ffe6ee 100%);
            overflow: hidden;
            flex-shrink: 0;
          }

          .create-item-fx-shell {
            position: absolute;
            left: 16px;
            right: 16px;
            bottom: 14px;
            height: 26px;
            border-radius: 8px;
            border: 2px solid #a4163a;
            background: #ffffff;
            transform-origin: center bottom;
          }

          .create-item-fx-fill {
            position: absolute;
            left: 18px;
            right: 18px;
            bottom: 16px;
            height: 0;
            border-radius: 6px;
            background: linear-gradient(180deg, #fbd2dd, #f08aac);
            opacity: 0;
          }

          .create-item-fx-item {
            position: absolute;
            left: 29px;
            top: 8px;
            width: 10px;
            height: 10px;
            border-radius: 3px;
            background: #a4163a;
            opacity: 0;
          }

          .create-item-fx-check {
            position: absolute;
            left: 29px;
            top: 28px;
            width: 12px;
            height: 22px;
            border-right: 3px solid #109867;
            border-bottom: 3px solid #109867;
            transform: rotate(45deg) scale(0.5);
            opacity: 0;
          }

          .create-item-fx-cross {
            position: absolute;
            left: 28px;
            top: 24px;
            font-size: 18px;
            line-height: 1;
            font-weight: 900;
            color: #dc2626;
            opacity: 0;
            transform: scale(0.5);
          }

          .create-item-fx-particle {
            position: absolute;
            left: 32px;
            top: 34px;
            width: 6px;
            height: 6px;
            border-radius: 9999px;
            background: #f1779b;
            opacity: 0;
          }

          .create-item-fx-particle.p1 {
            --tx: -24px;
            --ty: -18px;
          }

          .create-item-fx-particle.p2 {
            --tx: 23px;
            --ty: -16px;
          }

          .create-item-fx-particle.p3 {
            --tx: -20px;
            --ty: 15px;
          }

          .create-item-fx-particle.p4 {
            --tx: 22px;
            --ty: 17px;
          }

          .create-item-fx-icon.is-storing .create-item-fx-item {
            animation: create-item-drop 1.1s cubic-bezier(0.23, 0.7, 0.3, 1) infinite;
          }

          .create-item-fx-icon.is-storing .create-item-fx-shell {
            animation: create-item-shell-pulse 1.1s ease-in-out infinite;
          }

          .create-item-fx-icon.is-storing .create-item-fx-fill {
            opacity: 0.9;
            animation: create-item-fill-rise 1.1s ease-in-out infinite;
          }

          .create-item-fx-icon.is-success {
            box-shadow: 0 0 0 0 rgba(16, 152, 103, 0.38);
            animation: create-item-success-glow 650ms ease-out forwards;
          }

          .create-item-fx-icon.is-success .create-item-fx-shell {
            border-color: #109867;
            animation: create-item-shell-bulge 450ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          }

          .create-item-fx-icon.is-success .create-item-fx-fill {
            height: 16px;
            opacity: 0.32;
            background: linear-gradient(180deg, #ccf8e5, #74d3ad);
          }

          .create-item-fx-icon.is-success .create-item-fx-item {
            opacity: 0;
          }

          .create-item-fx-icon.is-success .create-item-fx-check {
            animation: create-item-check-in 420ms ease-out 120ms forwards;
          }

          .create-item-fx-icon.is-success .create-item-fx-particle {
            animation: create-item-particle-burst 480ms ease-out forwards;
          }

          .create-item-fx-icon.is-error {
            border-color: #ffc6cc;
            background: linear-gradient(180deg, #fff5f6 0%, #ffe9eb 100%);
            animation: create-item-error-shake 440ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
          }

          .create-item-fx-icon.is-error .create-item-fx-shell {
            border-color: #dc2626;
          }

          .create-item-fx-icon.is-error .create-item-fx-fill {
            opacity: 0.5;
            height: 4px;
            background: linear-gradient(180deg, #fecaca, #f87171);
            animation: create-item-error-fill-pulse 760ms ease-in-out infinite;
          }

          .create-item-fx-icon.is-error .create-item-fx-item {
            opacity: 1;
            animation: create-item-eject 520ms ease-out forwards;
          }

          .create-item-fx-icon.is-error .create-item-fx-check {
            opacity: 0;
          }

          .create-item-fx-icon.is-error .create-item-fx-cross {
            animation: create-item-cross-in 240ms ease-out 120ms forwards;
          }

          .create-item-fx-icon.is-error .create-item-fx-particle {
            background: #fb7185;
            animation: create-item-particle-reject 420ms ease-out forwards;
          }

          @keyframes create-item-drop {
            0% {
              transform: translateY(-8px) scale(1);
              opacity: 0;
            }
            15% {
              opacity: 1;
            }
            62% {
              transform: translateY(30px) scale(0.82);
              opacity: 1;
            }
            80% {
              transform: translateY(35px) scale(0.35);
              opacity: 0.45;
            }
            100% {
              transform: translateY(36px) scale(0);
              opacity: 0;
            }
          }

          @keyframes create-item-shell-pulse {
            0%,
            100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.06, 1.08);
            }
          }

          @keyframes create-item-fill-rise {
            0%,
            100% {
              height: 2px;
            }
            45% {
              height: 9px;
            }
            70% {
              height: 12px;
            }
          }

          @keyframes create-item-shell-bulge {
            0% {
              transform: scale(1);
            }
            45% {
              transform: scale(1.12, 1.08);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes create-item-success-glow {
            0% {
              box-shadow: 0 0 0 0 rgba(16, 152, 103, 0.38);
            }
            100% {
              box-shadow: 0 0 0 14px rgba(16, 152, 103, 0);
            }
          }

          @keyframes create-item-check-in {
            0% {
              opacity: 0;
              transform: rotate(45deg) scale(0.45);
            }
            100% {
              opacity: 1;
              transform: rotate(45deg) scale(1);
            }
          }

          @keyframes create-item-particle-burst {
            0% {
              opacity: 0.9;
              transform: translate(0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(var(--tx), var(--ty)) scale(0.12);
            }
          }

          @keyframes create-item-error-shake {
            0%,
            100% {
              transform: translateX(0);
            }
            20% {
              transform: translateX(-4px);
            }
            40% {
              transform: translateX(4px);
            }
            60% {
              transform: translateX(-3px);
            }
            80% {
              transform: translateX(3px);
            }
          }

          @keyframes create-item-error-fill-pulse {
            0%,
            100% {
              opacity: 0.38;
            }
            50% {
              opacity: 0.72;
            }
          }

          @keyframes create-item-eject {
            0% {
              transform: translateY(24px) scale(0.5);
              opacity: 0.7;
            }
            50% {
              transform: translateY(4px) scale(1.05);
              opacity: 1;
            }
            100% {
              transform: translateY(-8px) scale(0.8);
              opacity: 0;
            }
          }

          @keyframes create-item-cross-in {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes create-item-particle-reject {
            0% {
              opacity: 0.8;
              transform: translate(0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate(calc(var(--tx) * 0.65), calc(var(--ty) * -0.35)) scale(0.15);
            }
          }

          .transaction-fx-icon {
            position: relative;
            width: 74px;
            height: 74px;
            border-radius: 18px;
            border: 1px solid #d1e9f7;
            background: linear-gradient(180deg, #ffffff 0%, #eef9ff 100%);
            overflow: hidden;
          }

          .transaction-fx-icon.mode-out {
            border-color: #fde4c4;
            background: linear-gradient(180deg, #ffffff 0%, #fff8ec 100%);
          }

          .transaction-fx-ring {
            position: absolute;
            inset: 14px;
            border-radius: 9999px;
            border: 2px solid #0284c7;
          }

          .transaction-fx-icon.mode-out .transaction-fx-ring {
            border-color: #d97706;
          }

          .transaction-fx-pulse {
            position: absolute;
            inset: 18px;
            border-radius: 9999px;
            background: rgba(56, 189, 248, 0.25);
            opacity: 0;
          }

          .transaction-fx-icon.mode-out .transaction-fx-pulse {
            background: rgba(245, 158, 11, 0.25);
          }

          .transaction-fx-delta {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            font-size: 20px;
            line-height: 1;
            font-weight: 900;
            color: #0369a1;
          }

          .transaction-fx-icon.mode-out .transaction-fx-delta {
            color: #b45309;
          }

          .transaction-fx-check {
            position: absolute;
            left: 30px;
            top: 26px;
            width: 13px;
            height: 24px;
            border-right: 3px solid #109867;
            border-bottom: 3px solid #109867;
            transform: rotate(45deg) scale(0.5);
            opacity: 0;
          }

          .transaction-fx-cross {
            position: absolute;
            left: 31px;
            top: 26px;
            font-size: 20px;
            line-height: 1;
            font-weight: 900;
            color: #dc2626;
            opacity: 0;
            transform: scale(0.5);
          }

          .transaction-fx-icon.is-storing .transaction-fx-pulse {
            animation: transaction-fx-pulse 920ms ease-out infinite;
          }

          .transaction-fx-icon.is-storing.mode-in .transaction-fx-delta {
            animation: transaction-fx-in-delta 920ms ease-in-out infinite;
          }

          .transaction-fx-icon.is-storing.mode-out .transaction-fx-delta {
            animation: transaction-fx-out-delta 920ms ease-in-out infinite;
          }

          .transaction-fx-icon.is-success {
            box-shadow: 0 0 0 0 rgba(16, 152, 103, 0.36);
            animation: transaction-fx-success-glow 650ms ease-out forwards;
          }

          .transaction-fx-icon.is-success .transaction-fx-ring {
            border-color: #109867;
          }

          .transaction-fx-icon.is-success .transaction-fx-delta {
            opacity: 0;
          }

          .transaction-fx-icon.is-success .transaction-fx-check {
            animation: transaction-fx-check-in 360ms ease-out forwards;
          }

          .transaction-fx-icon.is-error {
            border-color: #ffc6cc;
            background: linear-gradient(180deg, #fff5f6 0%, #ffe9eb 100%);
            animation: transaction-fx-error-shake 450ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
          }

          .transaction-fx-icon.is-error .transaction-fx-ring {
            border-color: #dc2626;
          }

          .transaction-fx-icon.is-error .transaction-fx-delta {
            opacity: 0;
          }

          .transaction-fx-icon.is-error .transaction-fx-cross {
            animation: transaction-fx-cross-in 260ms ease-out forwards;
          }

          @keyframes transaction-fx-pulse {
            0% {
              transform: scale(0.7);
              opacity: 0.65;
            }
            100% {
              transform: scale(1.25);
              opacity: 0;
            }
          }

          @keyframes transaction-fx-in-delta {
            0%,
            100% {
              transform: translate(-50%, -50%) scale(1);
            }
            45% {
              transform: translate(-50%, -50%) scale(1.35);
            }
          }

          @keyframes transaction-fx-out-delta {
            0%,
            100% {
              transform: translate(-50%, -50%) scale(1);
            }
            40% {
              transform: translate(-50%, -45%) scale(0.78);
            }
          }

          @keyframes transaction-fx-success-glow {
            0% {
              box-shadow: 0 0 0 0 rgba(16, 152, 103, 0.36);
            }
            100% {
              box-shadow: 0 0 0 15px rgba(16, 152, 103, 0);
            }
          }

          @keyframes transaction-fx-check-in {
            0% {
              opacity: 0;
              transform: rotate(45deg) scale(0.5);
            }
            100% {
              opacity: 1;
              transform: rotate(45deg) scale(1);
            }
          }

          @keyframes transaction-fx-error-shake {
            0%,
            100% {
              transform: translateX(0);
            }
            20% {
              transform: translateX(-5px);
            }
            40% {
              transform: translateX(5px);
            }
            60% {
              transform: translateX(-4px);
            }
            80% {
              transform: translateX(4px);
            }
          }

          @keyframes transaction-fx-cross-in {
            0% {
              opacity: 0;
              transform: scale(0.5);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .quantity-slot {
            position: relative;
            overflow: hidden;
            transition: border-color 220ms ease, box-shadow 220ms ease;
          }

          .quantity-slot-hollow-flash {
            position: absolute;
            inset: 0;
            pointer-events: none;
            opacity: 0;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0));
          }

          .quantity-slot.is-active.is-in {
            border-color: #86efac;
            box-shadow: 0 0 0 1px #bbf7d0;
          }

          .quantity-slot.is-active.is-out {
            border-color: #fecaca;
            box-shadow: 0 0 0 1px #fee2e2;
          }

          .quantity-slot.is-active.is-out .quantity-slot-hollow-flash {
            animation: quantity-out-hollow 420ms ease-out;
          }

          .quantity-value-chip {
            transform-origin: center;
          }

          .quantity-slot.is-active.is-in .quantity-value-chip {
            animation: quantity-chip-pop 460ms cubic-bezier(0.2, 0.9, 0.2, 1);
          }

          .quantity-slot.is-active.is-out .quantity-value-chip {
            animation: quantity-chip-dip 460ms ease-out;
          }

          .quantity-slot.is-active.is-zero-hit .quantity-value-chip {
            animation: quantity-chip-empty-hit 420ms ease-out;
          }

          .quantity-delta-float {
            position: absolute;
            right: 10px;
            top: 6px;
            font-size: 11px;
            font-weight: 900;
            line-height: 1;
            pointer-events: none;
            z-index: 2;
          }

          .quantity-delta-float.is-in {
            color: #059669;
            animation: quantity-delta-rise 760ms ease-out forwards;
          }

          .quantity-delta-float.is-out {
            color: #dc2626;
            animation: quantity-delta-fall 760ms ease-out forwards;
          }

          @keyframes quantity-chip-pop {
            0% {
              transform: scale(1);
              color: inherit;
            }
            45% {
              transform: scale(1.4);
              color: #047857;
            }
            100% {
              transform: scale(1);
              color: inherit;
            }
          }

          @keyframes quantity-chip-dip {
            0% {
              transform: translateY(0) scale(1);
              color: inherit;
            }
            40% {
              transform: translateY(2px) scale(0.86);
              color: #dc2626;
            }
            100% {
              transform: translateY(0) scale(1);
              color: inherit;
            }
          }

          @keyframes quantity-chip-empty-hit {
            0%,
            100% {
              transform: scale(1);
              box-shadow: none;
            }
            40% {
              transform: scale(1.14);
              box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.22);
            }
          }

          @keyframes quantity-delta-rise {
            0% {
              opacity: 0;
              transform: translateY(8px) scale(0.75);
            }
            20% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateY(-16px) scale(1);
            }
          }

          @keyframes quantity-delta-fall {
            0% {
              opacity: 0;
              transform: translateY(-4px) translateX(0) scale(0.78);
            }
            20% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateY(15px) translateX(6px) scale(1);
            }
          }

          @keyframes quantity-out-hollow {
            0% {
              opacity: 0;
              transform: translateX(-24%);
            }
            28% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateX(24%);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .create-item-fx-icon,
            .create-item-fx-shell,
            .create-item-fx-item,
            .create-item-fx-fill,
            .create-item-fx-check,
            .create-item-fx-particle,
            .create-item-fx-cross,
            .transaction-fx-icon,
            .transaction-fx-pulse,
            .transaction-fx-delta,
            .transaction-fx-check,
            .transaction-fx-cross,
            .quantity-value-chip,
            .quantity-delta-float,
            .quantity-slot-hollow-flash {
              animation: none !important;
              transition: none !important;
            }
          }

          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .animate-marquee {
            animation: marquee 25s linear infinite;
          }

          .custom-horizontal-scrollbar::-webkit-scrollbar {
            height: 10px;
          }
          .custom-horizontal-scrollbar::-webkit-scrollbar-track {
            background: #e2e8f0;
            border-radius: 6px;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
          }
          .custom-horizontal-scrollbar::-webkit-scrollbar-thumb {
            background: #94a3b8;
            border-radius: 6px;
            border: 2px solid #e2e8f0;
          }
          .custom-horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
        `}</style>
      </main>
    </div>
  )
}


