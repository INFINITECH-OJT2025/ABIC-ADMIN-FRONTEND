//forms onboarding


"use client"


import React, { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TextFieldStatus } from '@/components/ui/text-field-status'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Separator } from '@/components/ui/separator'
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Save, Lock, ChevronLeft, ChevronRight, Check, Trash2, Plus, LayoutDashboard, ClipboardList, FolderPlus, Filter, ArrowUpDown, ListFilter, CheckCircle2, CircleDashed, Clock3, History, ArrowUpAZ, ArrowDownAZ, ChevronDown, Loader2, X, GripVertical, TriangleAlert
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { getApiUrl } from '@/lib/api'
import { ensureOkResponse } from '@/lib/api/error-message'
import { VALIDATION_CONSTRAINTS } from '@/lib/validation/constraints'
import { checklistTemplateTasksSchema } from '@/lib/validation/schemas'
import { DeleteTaskDialog, UnsavedChangesDialog } from '@/components/checklist/confirm-dialogs'
import { useChecklistTemplateSetup } from '@/lib/hooks/use-checklist-template-setup'
import { PageEmptyState, PageErrorState } from '@/components/state/page-feedback'
import { ChecklistPageSkeleton } from '@/components/state/checklist-page-skeleton'
import { toast } from 'sonner'


type TaskStatus = 'DONE' | 'PENDING'
type RecordStatusFilter = 'ALL' | TaskStatus
type RecordSort = 'NAME_ASC' | 'NAME_DESC' | 'UPDATED_DESC' | 'UPDATED_ASC'


interface ChecklistTask {
  id: number
  task: string
  status: TaskStatus
  date: string
}


interface OnboardingRecord {
  id: string
  name: string
  startDate: string
  position: string
  department: string
  status: string
  updatedAt: string
  tasks: ChecklistTask[]
}


const buildBlankRecord = (departmentName: string): OnboardingRecord => ({
  id: '',
  name: '',
  startDate: '',
  position: '',
  department: departmentName,
  status: 'PENDING',
  updatedAt: '',
  tasks: [],
})

interface DepartmentOption {
  id: number
  name: string
}


const normalizeTasks = (input: unknown): ChecklistTask[] => {
  const tasks = Array.isArray(input) ? input : []
  const usedIds = new Set<number>()
  let fallbackId = Date.now()


  return tasks.map((task, index) => {
    const row = (task ?? {}) as { id?: unknown; task?: unknown; status?: unknown; date?: unknown; completedDate?: unknown }
    let id = Number(row.id)
    if (!Number.isFinite(id) || usedIds.has(id)) {
      fallbackId += index + 1
      while (usedIds.has(fallbackId)) fallbackId += 1
      id = fallbackId
    }
    usedIds.add(id)


    const normalizedStatus: TaskStatus = String(row.status).toUpperCase() === 'DONE' ? 'DONE' : 'PENDING'
    const existingDate =
      typeof row.date === 'string' && row.date.trim()
        ? row.date.trim()
        : typeof row.completedDate === 'string' && row.completedDate.trim()
          ? row.completedDate.trim()
          : ''


    return {
      id,
      task: typeof row.task === 'string' ? row.task : '',
      status: normalizedStatus,
      date: normalizedStatus === 'DONE' ? existingDate : '',
    }
  })
}


const normalizeRecord = (record: any): OnboardingRecord => ({
  id: String(record?.id ?? ''),
  name: String(record?.name ?? ''),
  startDate: String(record?.startDate ?? ''),
  position: String(record?.position ?? ''),
  department: String(record?.department ?? ''),
  status: String(record?.status ?? ''),
  updatedAt: String(record?.updated_at ?? record?.updatedAt ?? ''),
  tasks: normalizeTasks(record?.tasks),
})

const normalizeTemplateRecord = (record: any): OnboardingRecord => ({
  id: String(record?.id ?? ''),
  name: '',
  startDate: '',
  position: '',
  department: String(record?.department_name ?? ''),
  status: 'PENDING',
  updatedAt: String(record?.updated_at ?? ''),
  tasks: normalizeTasks(record?.tasks),
})


const getRecordCompletionPercentage = (record: OnboardingRecord) => {
  if (!record.tasks.length) return 0
  const doneCount = record.tasks.filter((task) => task.status === 'DONE').length
  return Math.round((doneCount / record.tasks.length) * 100)
}


const isRecordDone = (record: OnboardingRecord) =>
  String(record.status).toUpperCase() === 'DONE' || getRecordCompletionPercentage(record) === 100

const ONBOARDING_DEFAULT_TASKS = [
  'Signing of Job Offer',
  'Signing of Employment Contract',
  'Information Fill-Up for ID and Employee Record',
  'Provide Link to Employee Handbook',
  'Conduct Onboarding Presentation',
  'Introduce to Departments and Key Team Members',
  'Distribute Polo Shirt, ID Lace & keys',
  'Add Employee to Biometrics',
  'Create Company Accounts (Email and Telegram - Required)',
  'Create Optional Accounts (Viber, WhatsApp, WeChat - Sales/Marketing only)',
  'Set Up Email Signature',
  'Add New Employee to Official Group Chats',
  'Add New Employee to Masterfile Google Sheet',
  'Add New Employee to Tardiness & Leave Monitoring Google Sheet',
  'Prepare Requirement Checklist (Medical Certificate, Diploma, TOR, Birth Certificate, Philhealth, Pag-IBIG, SSS)',
  'Collect and Verify Employee Requirements',
] as const

const createChecklistTask = (task = '', idSeed = Date.now()): ChecklistTask => ({
  id: idSeed,
  task,
  status: 'PENDING',
  date: '',
})

const buildChecklistTasks = (taskLabels: readonly string[]): ChecklistTask[] => {
  const baseId = Date.now()
  return taskLabels.map((task, index) => createChecklistTask(task, baseId + index + 1))
}


export default function OnboardingChecklistPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen p-8 bg-slate-50"><Loader2 className="animate-spin h-8 w-8 text-[#630C22]" /></div>}>
      <OnboardingChecklistPageContent />
    </Suspense>
  )
}


function OnboardingChecklistPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetName = searchParams.get('name')
  const editMode = true
  const [saving, setSaving] = useState(false)
  const [taskIdToDelete, setTaskIdToDelete] = useState<number | null>(null)
  const [dragTaskId, setDragTaskId] = useState<number | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null)
  const [recentlyMovedTaskId, setRecentlyMovedTaskId] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [recordStatusFilter, setRecordStatusFilter] = useState<RecordStatusFilter>('ALL')
  const [recordSort, setRecordSort] = useState<RecordSort>('UPDATED_DESC')
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [startChecklistOpen, setStartChecklistOpen] = useState(false)
  const [unsavedPromptOpen, setUnsavedPromptOpen] = useState(false)
  const [pendingDepartmentSelection, setPendingDepartmentSelection] = useState<string | null>(null)
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null)
  const {
    records,
    setRecords,
    employeeInfo,
    setEmployeeInfo,
    tasks,
    setTasks,
    currentIndex,
    setCurrentIndex,
    departmentsData,
    selectedDepartmentId,
    setSelectedDepartmentId,
    positionOptions,
    departmentOptions,
    loading,
    error,
    setReloadToken,
  } = useChecklistTemplateSetup<ChecklistTask, OnboardingRecord>({
    checklistType: 'ONBOARDING',
    normalizeTemplateRecord,
    buildBlankRecord,
    targetName,
  })

  useEffect(() => {
    if (!employeeInfo?.department) return
    const departmentMatch = departmentsData.find((item) => item.name === employeeInfo.department)
    setSelectedDepartmentId(departmentMatch?.id ?? null)
  }, [employeeInfo?.department, departmentsData])

  useEffect(() => {
    if (loading) return
    if (employeeInfo) return
    const firstDepartment = departmentOptions[0]
    if (!firstDepartment) return
    const blank = buildBlankRecord(firstDepartment)
    setEmployeeInfo(blank)
    setTasks([])
    const departmentMatch = departmentsData.find((item) => item.name === firstDepartment)
    setSelectedDepartmentId(departmentMatch?.id ?? null)
  }, [loading, employeeInfo, departmentOptions, departmentsData])


  const completionPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((doneTasks / tasks.length) * 100);
  }, [tasks]);
  const completionDateText = useMemo(() => {
    const value = employeeInfo?.updatedAt
    if (!value) return '-'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return '-'
    return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [employeeInfo?.updatedAt])


  const positionSelectOptions = useMemo(() => {
    const current = employeeInfo?.position?.trim()
    return [...new Set([...(current ? [current] : []), ...positionOptions])]
  }, [employeeInfo?.position, positionOptions])


  const departmentSelectOptions = useMemo(() => {
    const current = employeeInfo?.department?.trim()
    return [...new Set([...(current ? [current] : []), ...departmentOptions])]
  }, [employeeInfo?.department, departmentOptions])

  const departmentTemplateRecords = useMemo(() => {
    const parseTime = (value: string) => {
      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }
    const latestByDepartment = new Map<string, { record: OnboardingRecord; index: number; department: string }>()
    records.forEach((record, index) => {
      const department = String(record.department || '').trim() || 'Unassigned'
      const key = department.toLowerCase()
      const current = latestByDepartment.get(key)
      if (!current || parseTime(record.updatedAt) >= parseTime(current.record.updatedAt)) {
        latestByDepartment.set(key, { record, index, department })
      }
    })
    return Array.from(latestByDepartment.values()).sort((a, b) => a.department.localeCompare(b.department))
  }, [records])


  const filteredAndSortedRecords = useMemo(() => {
    const rows = records.map((record, index) => ({ record, index }))
    const filtered = recordStatusFilter === 'ALL'
      ? rows
      : rows.filter(({ record }) => (recordStatusFilter === 'DONE' ? isRecordDone(record) : !isRecordDone(record)))


    const withTime = (value: string) => {
      const timestamp = new Date(value).getTime()
      return Number.isNaN(timestamp) ? 0 : timestamp
    }


    return [...filtered].sort((a, b) => {
      if (recordSort === 'NAME_ASC') return a.record.name.localeCompare(b.record.name)
      if (recordSort === 'NAME_DESC') return b.record.name.localeCompare(a.record.name)
      if (recordSort === 'UPDATED_ASC') return withTime(a.record.updatedAt) - withTime(b.record.updatedAt)
      return withTime(b.record.updatedAt) - withTime(a.record.updatedAt)
    })
  }, [records, recordSort, recordStatusFilter])


  const doneRecords = useMemo(
    () => filteredAndSortedRecords.filter(({ record }) => isRecordDone(record)),
    [filteredAndSortedRecords]
  )
  const pendingRecords = useMemo(
    () => filteredAndSortedRecords.filter(({ record }) => !isRecordDone(record)),
    [filteredAndSortedRecords]
  )


  const selectRecordByIndex = (index: number) => {
    const selected = records[index]
    if (!selected) return


    setCurrentIndex(index)
    setEmployeeInfo(selected)
    setTasks(normalizeTasks(selected.tasks))
  }

  const selectRecordByDepartment = (department: string) => {
    const departmentMeta = departmentsData.find((item) => item.name === department)
    setSelectedDepartmentId(departmentMeta?.id ?? null)

    const selected = departmentTemplateRecords.find((entry) => entry.department === department)
    if (!selected) {
      const blank = buildBlankRecord(department)
      setCurrentIndex(0)
      setEmployeeInfo(blank)
      setTasks([])
      return
    }

    setCurrentIndex(selected.index)
    setEmployeeInfo(selected.record)
    setTasks(normalizeTasks(selected.record.tasks))
  }

  const requestDepartmentChange = (department: string) => {
    const currentDepartment = String(employeeInfo?.department || '').trim()
    if (hasUnsavedChanges && department !== currentDepartment) {
      setPendingDepartmentSelection(department)
      setPendingNavigationUrl(null)
      setUnsavedPromptOpen(true)
      return
    }
    selectRecordByDepartment(department)
  }

  const clearUnsavedIntents = () => {
    setPendingDepartmentSelection(null)
    setPendingNavigationUrl(null)
  }

  const proceedWithoutSaving = () => {
    const department = pendingDepartmentSelection
    const route = pendingNavigationUrl
    setUnsavedPromptOpen(false)
    clearUnsavedIntents()

    if (department) {
      selectRecordByDepartment(department)
      return
    }
    if (route) {
      router.push(route)
    }
  }

  const savedTaskCount = useMemo(() => {
    const departmentName = String(employeeInfo?.department || '').trim()
    if (!departmentName) return 0
    const selected = records.find((record) => String(record.department || '').trim() === departmentName)
    if (!selected) return 0
    return selected.tasks.filter((row) => String(row.task || '').trim().length > 0).length
  }, [employeeInfo?.department, records])

  const hasUnsavedChanges = useMemo(() => {
    if (String(employeeInfo?.id || '') === '' && tasks.length === 0) return false
    const departmentName = String(employeeInfo?.department || '').trim()
    if (!departmentName) return false
    const savedRecord = records.find((record) => String(record.department || '').trim() === departmentName)
    const currentTasks = tasks
      .map((row) => row.task.trim())
      .filter((task) => task.length > 0)
    const savedTasks = (savedRecord?.tasks ?? [])
      .map((row) => String(row.task || '').trim())
      .filter((task) => task.length > 0)
    return JSON.stringify(currentTasks) !== JSON.stringify(savedTasks)
  }, [employeeInfo?.department, records, tasks])

  const duplicateTaskIds = useMemo(() => {
    const counts = new Map<string, number>()
    tasks.forEach((row) => {
      const normalized = String(row.task || '').trim().toLowerCase()
      if (!normalized) return
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    })

    const duplicates = new Set<number>()
    tasks.forEach((row) => {
      const normalized = String(row.task || '').trim().toLowerCase()
      if (!normalized) return
      if ((counts.get(normalized) ?? 0) > 1) duplicates.add(row.id)
    })
    return duplicates
  }, [tasks])

  const editedTaskLabels = useMemo(() => {
    const labels = new Map<number, 'Edited' | 'Added'>()
    if (!hasUnsavedChanges) return labels

    const departmentName = String(employeeInfo?.department || '').trim()
    if (!departmentName) return labels
    const savedRecord = records.find((record) => String(record.department || '').trim() === departmentName)
    const savedRows = savedRecord?.tasks ?? []

    tasks.forEach((row, index) => {
      const currentTask = String(row.task || '').trim()
      const savedTask = String(savedRows[index]?.task || '').trim()
      if (currentTask !== savedTask) {
        labels.set(row.id, index >= savedRows.length ? 'Added' : 'Edited')
      }
    })

    return labels
  }, [employeeInfo?.department, hasUnsavedChanges, records, tasks])


  const handleNext = () => {
    if (currentIndex < records.length - 1) {
      selectRecordByIndex(currentIndex + 1)
    }
  }


  const handlePrev = () => {
    if (currentIndex > 0) {
      selectRecordByIndex(currentIndex - 1)
    }
  }


  const toggleAllTasks = () => {
    if (!employeeInfo) return
    const allCompleted = tasks.every(task => task.status === 'DONE')
    const updatedTasks: ChecklistTask[] = tasks.map(t => ({
      ...t,
      status: (allCompleted ? 'PENDING' : 'DONE') as TaskStatus,
      date: allCompleted ? '' : new Date().toLocaleDateString('en-CA')
    }))
    setTasks(updatedTasks)


    if (!editMode) {
      persistTaskStatus(updatedTasks, tasks)
    }
  }


  const addTask = () => {
    setTasks([...tasks, createChecklistTask('', Date.now() + Math.floor(Math.random() * 1000))])
  }

  const startChecklistWithoutDefaultTasks = () => {
    setTasks([])
    setStartChecklistOpen(false)
    toast.info('Checklist started with no default tasks. Add rows to build your own list.')
  }

  const startChecklistWithDefaultTasks = () => {
    setTasks(buildChecklistTasks(ONBOARDING_DEFAULT_TASKS))
    setStartChecklistOpen(false)
    toast.success('Onboarding default tasks loaded.')
  }


  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };


  const updateTaskText = (id: number, text: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, task: text } : t));
  };

  const reorderTasksById = (sourceId: number, targetId: number) => {
    if (sourceId === targetId) return
    setTasks((prev) => {
      const sourceIndex = prev.findIndex((row) => row.id === sourceId)
      const targetIndex = prev.findIndex((row) => row.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return prev

      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      setRecentlyMovedTaskId(moved.id)
      return next
    })
  }

  useEffect(() => {
    if (recentlyMovedTaskId === null) return
    const timer = setTimeout(() => setRecentlyMovedTaskId(null), 220)
    return () => clearTimeout(timer)
  }, [recentlyMovedTaskId])


  const persistTaskStatus = async (updatedTasks: ChecklistTask[], previousTasks: ChecklistTask[]) => {
    if (!employeeInfo) return


    try {
      const response = await fetch(`${getApiUrl()}/api/onboarding-checklist/${employeeInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ tasks: updatedTasks }),
      })


      await ensureOkResponse(response, 'Unable to update this task status right now.')


      const result = await response.json()
      const updated = normalizeRecord(result?.data)
      setEmployeeInfo(updated)
      setTasks(updated.tasks)
      setRecords(prev => prev.map((record, index) => index === currentIndex ? updated : record))
      toast.success('Changes saved successfully!')
    } catch (err) {
      setTasks(previousTasks)
      const message = err instanceof Error ? err.message : 'Failed to update task status'
      toast.error('Task Status Update Failed', {
        description: message,
      })
    }
  }


  const toggleTaskStatus = async (id: number, checked: boolean) => {
    const previousTasks = tasks
    const updatedTasks = tasks.map(t => t.id === id
      ? { ...t, status: (checked ? 'DONE' : 'PENDING') as TaskStatus, date: checked ? new Date().toLocaleDateString('en-CA') : '' }
      : t)
    setTasks(updatedTasks)


    if (!editMode) {
      await persistTaskStatus(updatedTasks, previousTasks)
    }
  };


  const handleSave = async (): Promise<boolean> => {
    if (!employeeInfo) return false


    try {
      setSaving(true)
      const departmentName = String(employeeInfo.department || '').trim()
      const departmentId = selectedDepartmentId ?? departmentsData.find((row) => row.name === departmentName)?.id ?? null
      if (!departmentId) {
        throw new Error('Please select a valid department before saving.')
      }

      const payloadTasks = tasks
        .map((row, index) => ({
          task: row.task.trim(),
          sort_order: index + 1,
          is_active: true,
        }))
        .filter((row) => row.task.length > 0)

      if (payloadTasks.length === 0) {
        throw new Error('Please add at least one checklist task before saving.')
      }

      const tasksValidation = checklistTemplateTasksSchema.safeParse(payloadTasks)
      if (!tasksValidation.success) {
        const message = tasksValidation.error.issues[0]?.message || 'Some checklist tasks are invalid.'
        throw new Error(message)
      }

      const duplicateTask = (() => {
        const seen = new Set<string>()
        for (const row of payloadTasks) {
          const normalized = row.task.toLowerCase()
          if (seen.has(normalized)) return row.task
          seen.add(normalized)
        }
        return null
      })()

      if (duplicateTask) {
        toast.warning('Duplicate Tasks Detected', {
          description: `The task "${duplicateTask}" is duplicated. Remove highlighted duplicates before saving.`,
        })
        return false
      }

      const payload = {
        department_id: departmentId,
        checklist_type: 'ONBOARDING',
        tasks: payloadTasks,
      }


      const response = await fetch(`${getApiUrl()}/api/department-checklist-templates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })


      await ensureOkResponse(response, 'Unable to save the checklist template.')


      const result = await response.json()
      const updated = normalizeTemplateRecord(result?.data)
      setSelectedDepartmentId(departmentId)
      setEmployeeInfo(updated)
      setTasks(updated.tasks)
      setRecords((prev) => {
        const remaining = prev.filter((record) => record.department !== updated.department)
        return [...remaining, updated].sort((a, b) => a.department.localeCompare(b.department))
      })
      toast.success('Checklist template saved successfully!', { position: 'top-right' })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save updates'
      toast.error('Save Failed', {
        description: message,
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndContinue = async () => {
    const success = await handleSave()
    if (!success) return

    const department = pendingDepartmentSelection
    const route = pendingNavigationUrl
    setUnsavedPromptOpen(false)
    clearUnsavedIntents()

    if (department) {
      selectRecordByDepartment(department)
      return
    }
    if (route) {
      router.push(route)
    }
  }

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasUnsavedChanges) return
      const target = event.target as HTMLElement | null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!link) return
      if (link.target === '_blank' || link.hasAttribute('download')) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return

      const url = new URL(href, window.location.origin)
      if (url.origin !== window.location.origin) return
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      const next = `${url.pathname}${url.search}${url.hash}`
      if (current === next) return

      event.preventDefault()
      setPendingNavigationUrl(next)
      setPendingDepartmentSelection(null)
      setUnsavedPromptOpen(true)
    }

    document.addEventListener('click', handleDocumentClick, true)
    return () => document.removeEventListener('click', handleDocumentClick, true)
  }, [hasUnsavedChanges, router])


  if (loading) {
    return <ChecklistPageSkeleton />
  }


  if (error) {
    return (
      <PageErrorState
        title="Failed to load onboarding checklist"
        description={error}
        onRetry={() => setReloadToken((prev) => prev + 1)}
        onBack={() => router.back()}
      />
    )
  }

  if (!employeeInfo) {
    return (
      <PageEmptyState
        title="No onboarding template available"
        description="Create or seed department checklist templates to start onboarding workflows."
        actionLabel="Reload"
        onAction={() => setReloadToken((prev) => prev + 1)}
      />
    )
  }


  return (
    <div className="min-h-screen w-full bg-[#F5F6F8] text-stone-900 font-sans pb-10">
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-xl mb-6">
        {/* Main Header Row */}
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Onboarding Checklist</h1>
              <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                ABIC REALTY & CONSULTANCY
              </p>
            </div>


            <div />
          </div>
        </div>


        {/* Secondary Toolbar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4">


              


              {/* Department Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Department</span>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      aria-label="Select department"
                      className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[240px] shadow-sm font-bold rounded-lg border-2 ring-0 focus:ring-0 justify-between"
                    >
                      <span className="truncate">{String(employeeInfo?.department || '').trim() || 'Select Department'}</span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 rounded-xl border-stone-200 shadow-xl">
                    <Command>
                      <CommandInput placeholder="Search department..." />
                      <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup>
                          {departmentSelectOptions.map((department) => (
                            <CommandItem
                              key={department}
                              value={department}
                              onSelect={() => {
                                requestDepartmentChange(department)
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  String(employeeInfo?.department || '').trim() === department ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {department}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>


              


              {/* Updated At */}
              <div className="ml-auto hidden xl:flex items-center gap-4 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60 leading-none mb-1">Updated</span>
                  <span className="text-sm font-black text-white tracking-tight">{completionDateText}</span>
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>


      <main className="w-full max-w-[1600px] mx-auto px-4 md:px-8 relative mb-16 transition-all duration-500 animate-in fade-in slide-in-from-bottom-5">




        <Card className="rounded-2xl border border-[#FFE5EC] shadow-lg overflow-hidden bg-white mb-6 transition-all hover:shadow-xl">
          <div className="p-5 bg-rose-50/20">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-[11px] font-black text-[#800020]/60 uppercase tracking-widest">Selected Department</p>
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
                    Unsaved Changes
                  </span>
                )}
                <span className="inline-flex items-center rounded-full border border-[#FFE5EC] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#A4163A]">
                  {savedTaskCount} Saved Tasks
                </span>
              </div>
            </div>
            <p className="text-2xl font-black text-slate-800 leading-tight">{employeeInfo?.department || '-'}</p>
          </div>
        </Card>


        {/* Task List Section */}
        <Card className="rounded-2xl border border-[#FFE5EC] shadow-2xl bg-white overflow-hidden mb-12">
          <div className="p-4 md:px-8 bg-slate-50/50 border-b border-[#FFE5EC] flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Button onClick={addTask} size="sm" className="bg-[#A4163A] hover:bg-[#800020] text-white font-black text-xs h-9 px-6 rounded-xl shadow-md active:scale-95 transition-all">
                <Plus className="w-3.5 h-3.5 mr-2" /> ADD ROW
              </Button>
              <Separator orientation="vertical" className="h-4 bg-slate-200" />
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                ADMINISTRATION FRAMEWORK - ABIC HR
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setSaveConfirmOpen(true)}
                disabled={saving || !employeeInfo}
                className="h-9 px-8 font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 transition-all rounded-xl"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                {saving ? 'UPDATING...' : 'SAVE CHECKLIST'}
              </Button>
            </div>
          </div>
          {duplicateTaskIds.size > 0 && (
            <div className="mx-4 md:mx-8 mt-3 mb-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-700 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {duplicateTaskIds.size} duplicate task{duplicateTaskIds.size > 1 ? 's are' : ' is'} highlighted in red. Remove duplicates before saving.
            </div>
          )}

          <Table>
            <TableHeader className="bg-[#FFE5EC]/40">
              <TableRow className="border-b border-[#FFE5EC] hover:bg-transparent">
                <TableHead className="font-black text-[#800020] uppercase tracking-[0.12em] text-[12px] py-3">
                  <span>Required Onboarding Tasks</span>
                  <p className="mt-1 text-[10px] normal-case font-semibold tracking-normal text-[#800020]/70">
                    Task length: {VALIDATION_CONSTRAINTS.checklistTemplate.task.min} to {VALIDATION_CONSTRAINTS.checklistTemplate.task.max} characters.
                  </p>
                </TableHead>
                <TableHead className="w-[80px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[12px] py-3">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((item) => (
                <TableRow
                  key={item.id}
                  onDragOver={(event) => {
                    if (!editMode || tasks.length <= 1) return
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDragEnter={(event) => {
                    if (!editMode || tasks.length <= 1) return
                    event.preventDefault()
                    setDragOverTaskId(item.id)
                    if (dragTaskId !== null && dragTaskId !== item.id) {
                      reorderTasksById(dragTaskId, item.id)
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    if (!editMode || tasks.length <= 1) return
                    const sourceId = dragTaskId ?? Number(event.dataTransfer.getData('text/plain'))
                    if (!Number.isFinite(sourceId)) return
                    reorderTasksById(sourceId, item.id)
                    setDragOverTaskId(null)
                    setDragTaskId(null)
                  }}
                  onDragEnd={() => {
                    setDragTaskId(null)
                    setDragOverTaskId(null)
                  }}
                  className={cn(
                    "border-b border-rose-50/30 last:border-0 hover:bg-[#FFE5EC]/5 transition-all duration-200 ease-out group",
                    duplicateTaskIds.has(item.id) ? "bg-rose-50/70 ring-1 ring-rose-300/90" : "",
                    !duplicateTaskIds.has(item.id) && editedTaskLabels.has(item.id) ? "bg-amber-50/50 ring-1 ring-amber-200/80" : "",
                    dragTaskId === item.id ? "opacity-45" : "",
                    dragOverTaskId === item.id && dragTaskId !== item.id ? "bg-rose-50/60 ring-1 ring-rose-200" : "",
                    recentlyMovedTaskId === item.id ? "bg-rose-50/40" : ""
                  )}
                >
                  <TableCell className="py-2.5">
                    {editMode ? (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          draggable={tasks.length > 1}
                          onDragStart={(event) => {
                            setDragTaskId(item.id)
                            event.dataTransfer.effectAllowed = 'move'
                            event.dataTransfer.setData('text/plain', String(item.id))
                          }}
                          aria-label="Drag to reorder task"
                          title="Drag to reorder"
                          className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-100 bg-rose-50/70 text-[#A4163A] shadow-sm transition-all hover:scale-105 hover:bg-rose-100 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </button>
                        <div className="flex-1">
                        {duplicateTaskIds.has(item.id) ? (
                          <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-rose-700 inline-flex items-center gap-1">
                            <TriangleAlert className="h-3 w-3" />
                            Duplicate
                          </p>
                        ) : editedTaskLabels.has(item.id) ? (
                          <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-amber-700">
                            {editedTaskLabels.get(item.id)}
                          </p>
                        ) : null}
                        <Input
                          value={item.task}
                          onChange={(e) => updateTaskText(item.id, e.target.value)}
                          minLength={VALIDATION_CONSTRAINTS.checklistTemplate.task.min}
                          maxLength={VALIDATION_CONSTRAINTS.checklistTemplate.task.max}
                          title={`Task must be ${VALIDATION_CONSTRAINTS.checklistTemplate.task.min} to ${VALIDATION_CONSTRAINTS.checklistTemplate.task.max} characters.`}
                          className={cn(
                            "h-8 border-transparent bg-transparent hover:border-[#FFE5EC]/50 focus:border-[#A4163A] focus-visible:ring-0 transition-all font-bold px-0 text-lg",
                            item.status === 'DONE' ? "text-slate-300 line-through" : "text-slate-700"
                          )}
                          placeholder="Define onboarding task..."
                        />
                        <TextFieldStatus
                          value={item.task}
                          min={VALIDATION_CONSTRAINTS.checklistTemplate.task.min}
                          max={VALIDATION_CONSTRAINTS.checklistTemplate.task.max}
                        />
                        </div>
                      </div>
                    ) : (
                      <span className={cn(
                        "text-sm font-bold transition-all duration-300",
                        item.status === 'DONE' ? "text-slate-300 line-through" : "text-slate-700"
                      )}>
                        {item.task}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-2.5 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTaskIdToDelete(item.id)}
                      className="h-7 w-7 text-slate-300 hover:text-rose-500 transition-colors rounded-lg group-hover:bg-rose-50"
                    >
                      <Trash2 className="h-5.5 w-5.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}


              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-24 text-center">
                    <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No tasks initialized</p>
                    <Button onClick={() => setStartChecklistOpen(true)} variant="outline" size="sm" className="mt-4 border-[#FFE5EC] text-[#A4163A] font-black h-9 rounded-xl">
                      <Plus className="w-4 h-4 mr-1" /> START CHECKLIST
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>


          {/* Table Footer */}
          <div className="hidden p-4 md:px-8 bg-slate-50/50 border-t border-[#FFE5EC] flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Button onClick={addTask} size="sm" className="bg-[#A4163A] hover:bg-[#800020] text-white font-black text-xs h-9 px-6 rounded-xl shadow-md active:scale-95 transition-all">
                <Plus className="w-3.5 h-3.5 mr-2" /> ADD ROW
              </Button>
              <Separator orientation="vertical" className="h-4 bg-slate-200" />
              <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                ADMINISTRATION FRAMEWORK • ABIC HR
              </p>
            </div>


            <div className="flex gap-3">
              <Button
                onClick={() => setSaveConfirmOpen(true)}
                disabled={saving || !employeeInfo}
                className="h-9 px-8 font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 transition-all rounded-xl"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                {saving ? 'UPDATING...' : 'SAVE CHECKLIST'}
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent className="border-4 border-[#FFE5EC] rounded-3xl p-8 bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Save Department Tasks?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              You are about to save changes for {employeeInfo?.department || 'the selected department'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border border-[#FFE5EC] bg-rose-50/30 p-4 text-sm font-semibold text-slate-700">
            Tasks to save: {tasks.filter((row) => row.task.trim().length > 0).length}
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-2">
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={async () => {
                setSaveConfirmOpen(false)
                await handleSave()
              }}
            >
              {saving ? 'Saving...' : 'Confirm Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={startChecklistOpen} onOpenChange={setStartChecklistOpen}>
        <AlertDialogContent className="border-4 border-[#FFE5EC] rounded-3xl p-8 bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-900">Start Onboarding Checklist</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Choose how you want to initialize this department&apos;s checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl border border-[#FFE5EC] bg-rose-50/30 p-4 text-sm font-semibold text-slate-700">
            You can either begin with no tasks and add your own, or preload the onboarding default tasks.
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={startChecklistWithoutDefaultTasks}>
              Start With No Tasks
            </Button>
            <AlertDialogAction className="bg-[#A4163A] text-white hover:bg-[#800020]" onClick={startChecklistWithDefaultTasks}>
              Use Default Tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UnsavedChangesDialog
        open={unsavedPromptOpen}
        onOpenChange={setUnsavedPromptOpen}
        onStay={() => {
          setUnsavedPromptOpen(false)
          clearUnsavedIntents()
        }}
        onProceedWithoutSaving={proceedWithoutSaving}
        onSaveAndContinue={() => void handleSaveAndContinue()}
      />

      <DeleteTaskDialog
        open={taskIdToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTaskIdToDelete(null)
        }}
        onCancel={() => setTaskIdToDelete(null)}
        onDelete={() => {
          if (taskIdToDelete !== null) removeTask(taskIdToDelete)
          setTaskIdToDelete(null)
        }}
      />
    </div>
  )
}
