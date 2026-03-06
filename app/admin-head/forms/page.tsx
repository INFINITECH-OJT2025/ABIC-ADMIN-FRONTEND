"use client"

import React, { useEffect, useMemo, useState } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Save, Lock, ChevronLeft, ChevronRight, Check, Trash2, Plus, LayoutDashboard, ClipboardList, TriangleAlert, FolderPlus, Filter, ArrowUpDown, ListFilter, CheckCircle2, CircleDashed, Clock3, History, ArrowUpAZ, ArrowDownAZ
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { getApiUrl } from '@/lib/api'
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

interface NamedOption {
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

const getRecordCompletionPercentage = (record: OnboardingRecord) => {
  if (!record.tasks.length) return 0
  const doneCount = record.tasks.filter((task) => task.status === 'DONE').length
  return Math.round((doneCount / record.tasks.length) * 100)
}

const isRecordDone = (record: OnboardingRecord) =>
  String(record.status).toUpperCase() === 'DONE' || getRecordCompletionPercentage(record) === 100

export default function OnboardingChecklistPage() {
  const editMode = true
  const [saving, setSaving] = useState(false)
  const [creatingRecord, setCreatingRecord] = useState(false)
  const [addRecordOpen, setAddRecordOpen] = useState(false)
  const [tasks, setTasks] = useState<ChecklistTask[]>([])
  const [taskIdToDelete, setTaskIdToDelete] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [records, setRecords] = useState<OnboardingRecord[]>([])
  const [employeeInfo, setEmployeeInfo] = useState<OnboardingRecord | null>(null)
  const [positionOptions, setPositionOptions] = useState<string[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [newRecord, setNewRecord] = useState({
    name: '',
    position: '',
    department: '',
    startDate: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recordStatusFilter, setRecordStatusFilter] = useState<RecordStatusFilter>('ALL')
  const [recordSort, setRecordSort] = useState<RecordSort>('UPDATED_DESC')

  useEffect(() => {
    const fetchChecklists = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`${getApiUrl()}/api/onboarding-checklist`, {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const result = await response.json()
        const data = Array.isArray(result?.data) ? result.data.map(normalizeRecord) : []
        setRecords(data)

        if (data.length > 0) {
          setCurrentIndex(0)
          setEmployeeInfo(data[0])
          setTasks(data[0].tasks)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load checklists'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchChecklists()
  }, [])

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [hierarchiesResponse, departmentsResponse] = await Promise.all([
          fetch(`${getApiUrl()}/api/hierarchies`, { headers: { Accept: 'application/json' } }),
          fetch(`${getApiUrl()}/api/departments`, { headers: { Accept: 'application/json' } }),
        ])

        if (hierarchiesResponse.ok) {
          const hierarchiesData = await hierarchiesResponse.json()
          const names = Array.isArray(hierarchiesData?.data)
            ? (hierarchiesData.data as NamedOption[]).map((item) => item.name).filter((n): n is string => !!n)
            : []
          setPositionOptions([...new Set(names)])
        }

        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json()
          const names = Array.isArray(departmentsData?.data)
            ? (departmentsData.data as NamedOption[]).map((item) => item.name).filter((n): n is string => !!n)
            : []
          setDepartmentOptions([...new Set(names)])
        }
      } catch {
      }
    }

    fetchOptions()
  }, [])

  const completionPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((doneTasks / tasks.length) * 100);
  }, [tasks]);
  const showCompletionDate = completionPercentage === 100 || String(employeeInfo?.status ?? '').toUpperCase() === 'DONE'
  const completionDateText = useMemo(() => {
    if (!showCompletionDate) return ''
    const value = employeeInfo?.updatedAt
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [employeeInfo?.updatedAt, showCompletionDate])
  const emptyTaskColSpan = editMode ? 4 : 3

  const positionSelectOptions = useMemo(() => {
    const current = employeeInfo?.position?.trim()
    return [...new Set([...(current ? [current] : []), ...positionOptions])]
  }, [employeeInfo?.position, positionOptions])

  const departmentSelectOptions = useMemo(() => {
    const current = employeeInfo?.department?.trim()
    return [...new Set([...(current ? [current] : []), ...departmentOptions])]
  }, [employeeInfo?.department, departmentOptions])

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

  const resetNewRecord = () => {
    setNewRecord({
      name: '',
      position: '',
      department: '',
      startDate: '',
    })
  }

  const addTask = () => {
    setTasks([...tasks, { id: Date.now() + Math.floor(Math.random() * 1000), task: '', status: 'PENDING', date: '' }]);
  };

  const removeTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const updateTaskText = (id: number, text: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, task: text } : t));
  };

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

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

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

  const handleSave = async () => {
    if (!employeeInfo) return

    try {
      setSaving(true)
      const payload = {
        name: employeeInfo.name,
        position: employeeInfo.position,
        department: employeeInfo.department,
        startDate: employeeInfo.startDate,
        tasks,
        status: completionPercentage === 100 ? 'DONE' : 'PENDING',
      }

      const response = await fetch(`${getApiUrl()}/api/onboarding-checklist/${employeeInfo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      const updated = normalizeRecord(result?.data)
      setEmployeeInfo(updated)
      setTasks(updated.tasks)
      setRecords(prev => prev.map((record, index) => index === currentIndex ? updated : record))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save updates'
      toast.error('Save Failed', {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRecord = async () => {
    if (!newRecord.name.trim() || !newRecord.startDate) {
      toast.warning('Incomplete Form', {
        description: 'Name and start date are required.',
      })
      return
    }

    try {
      setCreatingRecord(true)
      const payload = {
        name: newRecord.name.trim(),
        position: newRecord.position.trim(),
        department: newRecord.department.trim(),
        startDate: newRecord.startDate,
        tasks: [],
      }

      const response = await fetch(`${getApiUrl()}/api/onboarding-checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      const created = normalizeRecord(result?.data)
      setRecords(prev => {
        const next = [...prev, created]
        setCurrentIndex(next.length - 1)
        return next
      })
      setEmployeeInfo(created)
      setTasks(created.tasks)
      setAddRecordOpen(false)
      resetNewRecord()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create onboarding record'
      toast.error('Create Record Failed', {
        description: message,
      })
    } finally {
      setCreatingRecord(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8 font-sans">
        <Card className="mx-auto mt-16 max-w-3xl rounded-[2rem] border-none shadow-2xl bg-white p-10 text-center">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full border-4 border-[#a0153e]/20 border-t-[#a0153e] animate-spin" />
          <p className="text-2xl font-black text-slate-900">Loading Onboarding Checklist</p>
          <p className="mt-2 text-slate-600">Preparing employee record and onboarding tasks...</p>
          <div className="mt-6 space-y-3">
            <div className="h-4 rounded-full bg-slate-200/80 animate-pulse" />
            <div className="h-4 w-11/12 mx-auto rounded-full bg-slate-200/70 animate-pulse [animation-delay:120ms]" />
            <div className="h-4 w-9/12 mx-auto rounded-full bg-slate-200/60 animate-pulse [animation-delay:240ms]" />
          </div>
          <div className="mt-7 flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#a0153e]/80 animate-bounce" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#a0153e]/70 animate-bounce [animation-delay:140ms]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#a0153e]/60 animate-bounce [animation-delay:280ms]" />
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return <div className="p-8 text-rose-600">Failed to load onboarding checklist: {error}</div>
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <header className="-mx-8 -mt-8 mb-8 bg-[#a0153e] text-white px-10 py-10 shadow-lg relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight italic">Onboarding Checklist</h1>

            <div className="flex flex-wrap items-center gap-3 text-rose-100/80 text-lg">
              <span className="opacity-80">Onboarding for</span>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-auto p-0 text-white font-bold text-lg hover:bg-transparent underline underline-offset-4 decoration-rose-400">
                    {employeeInfo?.name || 'No records yet'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 rounded-xl border-none shadow-2xl">
                  <Command>
                    <CommandInput placeholder="Search records..." />
                    <CommandList>
                      <CommandEmpty>No records found.</CommandEmpty>
                      {doneRecords.length > 0 && (
                        <CommandGroup heading="DONE">
                          {doneRecords.map(({ record: emp, index }) => (
                            <CommandItem key={emp.id} onSelect={() => { selectRecordByIndex(index); setOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", currentIndex === index ? "opacity-100" : "opacity-0")} />
                              {emp.name} ({getRecordCompletionPercentage(emp)}%)
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                      {pendingRecords.length > 0 && (
                        <CommandGroup heading="PENDING">
                          {pendingRecords.map(({ record: emp, index }) => (
                            <CommandItem key={emp.id} onSelect={() => { selectRecordByIndex(index); setOpen(false); }}>
                              <Check className={cn("mr-2 h-4 w-4", currentIndex === index ? "opacity-100" : "opacity-0")} />
                              {emp.name} ({getRecordCompletionPercentage(emp)}%)
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex items-center gap-2">
                <Select value={recordStatusFilter} onValueChange={(value) => setRecordStatusFilter(value as RecordStatusFilter)}>
                  <SelectTrigger className="h-9 w-[130px] rounded-full border border-white/25 bg-white/10 text-white text-xs font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-rose-200" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL"><span className="flex items-center gap-2"><ListFilter className="h-3.5 w-3.5" /> All</span></SelectItem>
                    <SelectItem value="DONE"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Done</span></SelectItem>
                    <SelectItem value="PENDING"><span className="flex items-center gap-2"><CircleDashed className="h-3.5 w-3.5 text-amber-600" /> Pending</span></SelectItem>
                  </SelectContent>
                </Select>
                <Select value={recordSort} onValueChange={(value) => setRecordSort(value as RecordSort)}>
                  <SelectTrigger className="h-9 w-[130px] rounded-full border border-white/25 bg-white/10 text-white text-xs font-black uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-3.5 w-3.5 text-rose-200" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPDATED_DESC"><span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Latest</span></SelectItem>
                    <SelectItem value="UPDATED_ASC"><span className="flex items-center gap-2"><History className="h-3.5 w-3.5" /> Oldest</span></SelectItem>
                    <SelectItem value="NAME_ASC"><span className="flex items-center gap-2"><ArrowUpAZ className="h-3.5 w-3.5" /> A - Z</span></SelectItem>
                    <SelectItem value="NAME_DESC"><span className="flex items-center gap-2"><ArrowDownAZ className="h-3.5 w-3.5" /> Z - A</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 ml-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
                <LayoutDashboard className="w-4 h-4 text-rose-300" />
                <span className="text-xs font-black uppercase tracking-widest text-rose-100">Progress:</span>
                <span className="text-sm font-black text-white">{completionPercentage}% Completed</span>
                {completionDateText && (
                  <>
                    <span className="text-rose-200/70">|</span>
                    <span className="text-xs font-black uppercase tracking-widest text-rose-100">Date:</span>
                    <span className="text-sm font-black text-white">{completionDateText}</span>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-8 relative">
        <div className="absolute left-0 top-[25%] -translate-x-1/2 z-10">
          <Button onClick={handlePrev} disabled={records.length === 0 || currentIndex === 0} size="icon" className="rounded-full h-12 w-12 bg-white shadow-xl text-[#a0153e] border-none hover:bg-rose-50">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </div>
        <div className="absolute right-0 top-[25%] translate-x-1/2 z-10">
          <Button onClick={handleNext} disabled={records.length === 0 || currentIndex >= records.length - 1} size="icon" className="rounded-full h-12 w-12 bg-white shadow-xl text-[#a0153e] border-none hover:bg-rose-50">
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        <Card className="rounded-[2rem] border-none shadow-2xl overflow-hidden bg-white mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="p-8 bg-slate-50/30">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-lg font-bold text-[#a0153e] uppercase tracking-wide">Employee Name</p>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">{employeeInfo?.name || '-'}</p>
            </div>

            <div className="p-8">
              <p className="text-lg font-bold text-[#a0153e] uppercase tracking-wide mb-3">Position</p>
              {editMode && employeeInfo ? (
                <Select value={employeeInfo.position || ''} onValueChange={(val) => setEmployeeInfo({ ...employeeInfo, position: val })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {positionSelectOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (<p className="text-2xl md:text-3xl font-extrabold text-slate-700">{employeeInfo?.position || '-'}</p>)}
            </div>

            <div className="p-8">
              <p className="text-lg font-bold text-[#a0153e] uppercase tracking-wide mb-3">Start Date</p>
              {editMode && employeeInfo ? (
                <Input type="date" value={employeeInfo.startDate} onChange={(e) => setEmployeeInfo({ ...employeeInfo, startDate: e.target.value })} className="rounded-xl border-slate-200 h-11" />
              ) : (<p className="text-2xl md:text-3xl font-extrabold text-slate-700">{employeeInfo?.startDate ? new Date(employeeInfo.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-'}</p>)}
            </div>

            <div className="p-8">
              <p className="text-lg font-bold text-[#a0153e] uppercase tracking-wide mb-3">Department</p>
              {editMode && employeeInfo ? (
                <Select value={employeeInfo.department || ''} onValueChange={(val) => setEmployeeInfo({ ...employeeInfo, department: val })}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {departmentSelectOptions.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (<p className="text-2xl md:text-3xl font-extrabold text-slate-700">{employeeInfo?.department || '-'}</p>)}
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-2xl bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="w-[220px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Date</TableHead>
                <TableHead className="w-[180px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Status</TableHead>
                <TableHead className="font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Onboarding Tasks</TableHead>
                {editMode && <TableHead className="w-[100px] text-center font-black text-[#a0153e] uppercase tracking-widest text-[11px] py-8">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors">
                  <TableCell className="py-6 text-center font-semibold text-slate-600">
                    {item.date
                      ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '-'}
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="flex justify-center items-center gap-4">
                      <Checkbox
                        checked={item.status === 'DONE'}
                        onCheckedChange={(checked) => toggleTaskStatus(item.id, !!checked)}
                        className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <Badge className={cn(
                        "rounded-full px-5 py-1 text-[10px] tracking-widest border-none transition-all",
                        item.status === 'DONE' ? "bg-emerald-50 text-emerald-600 shadow-sm" : "bg-slate-100 text-slate-400 opacity-60"
                      )}>
                        {item.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    {editMode ? (
                      <Input value={item.task} onChange={(e) => updateTaskText(item.id, e.target.value)} className="rounded-xl border-slate-200 h-11 bg-slate-50/30" />
                    ) : (
                      <span className={cn("text-[15px] font-medium transition-all duration-300", item.status === 'DONE' && "text-slate-400 line-through decoration-slate-200")}>
                        {item.task}
                      </span>
                    )}
                  </TableCell>
                  {editMode && (
                    <TableCell className="py-6 text-center">
                      <Button variant="ghost" size="icon" onClick={() => setTaskIdToDelete(item.id)} className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {tasks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={emptyTaskColSpan} className="py-16">
                    <div className="flex flex-col items-center justify-center text-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-[#a0153e]/10 flex items-center justify-center">
                        <ClipboardList className="h-7 w-7 text-[#a0153e]" />
                      </div>
                      <p className="text-base font-bold text-slate-700">No tasks to display</p>
                      <p className="text-sm text-slate-500">
                        {records.length === 0 ? 'No onboarding records found yet. Add a record to begin.' : 'This record has no tasks yet.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="bg-slate-50/50 px-10 py-8 flex justify-between items-center border-t border-slate-100">
            <div className="flex items-center gap-4">
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">ABIC Realty Onboarding System</p>
              {editMode && (
                <Button onClick={addTask} size="sm" variant="ghost" className="rounded-full text-[#a0153e] font-bold bg-[#a0153e]/5 hover:bg-[#a0153e]/10 px-6">
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="rounded-full px-8 h-12 shadow-sm border-slate-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                <FolderPlus className="mr-2 h-4 w-4" /> Add to Masterfile
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !employeeInfo}
                className="rounded-full px-12 h-12 font-bold shadow-xl transition-all bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <><Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</>
              </Button>
            </div>
          </div>
        </Card>
      </main>

      <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
        <DialogContent className="sm:max-w-[560px] border-2 border-[#C9184A] p-0 overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-[#800020] via-[#A0153E] to-[#C9184A] p-6 text-white">
            <DialogTitle className="text-2xl font-bold">Add Onboarding Record</DialogTitle>
            <DialogDescription className="text-rose-100">
              Create a new onboarding checklist record.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Employee Name</p>
              <Input
                value={newRecord.name}
                onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter employee name"
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Position</p>
                <Input
                  value={newRecord.position}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Enter position"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Department</p>
                <Input
                  value={newRecord.department}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter department"
                  className="rounded-xl border-slate-200 h-11"
                />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#a0153e] uppercase tracking-[0.2em] mb-2">Start Date</p>
              <Input
                type="date"
                value={newRecord.startDate}
                onChange={(e) => setNewRecord(prev => ({ ...prev, startDate: e.target.value }))}
                className="rounded-xl border-slate-200 h-11"
              />
            </div>
          </div>

          <DialogFooter className="px-6 pb-6 gap-2">
            <Button variant="outline" onClick={() => { setAddRecordOpen(false); resetNewRecord(); }} className="rounded-full">
              Cancel
            </Button>
            <Button onClick={handleCreateRecord} disabled={creatingRecord} className="rounded-full bg-[#a0153e] hover:bg-[#801030] text-white">
              <Plus className="mr-2 h-4 w-4" /> {creatingRecord ? 'Creating...' : 'Create Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={taskIdToDelete !== null} onOpenChange={(open) => { if (!open) setTaskIdToDelete(null) }}>
        <AlertDialogContent className="border-2 border-rose-200">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <TriangleAlert className="h-6 w-6" />
            </div>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This task will be removed from the current checklist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTaskIdToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                if (taskIdToDelete !== null) removeTask(taskIdToDelete)
                setTaskIdToDelete(null)
              }}
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}