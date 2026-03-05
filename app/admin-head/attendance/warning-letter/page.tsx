'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Check,
    ChevronDown,
    Plus,
    FileText,
    AlertTriangle,
    Calendar,
    Clock,
    Search,
    ChevronRight,
    Filter,
    Loader2,
    Mail,
    ShieldAlert,
    ClipboardEdit,
    CheckCircle2
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

// --- Skeleton Components ---
const SummarySkeleton = () => (
    <div className="min-h-screen bg-slate-50/50">
        {/* Placeholder Header Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
        </div>

        <div className="w-full px-4 md:px-8 xl:px-12 pt-10 pb-12">
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-start">
                {[1, 2].map((i) => (
                    <Card key={i} className="border-0 shadow-xl rounded-3xl overflow-hidden bg-white">
                        <div className="bg-slate-50 p-8 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-14 h-14 rounded-2xl bg-slate-200" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-8 w-48 bg-slate-200" />
                                        <Skeleton className="h-4 w-64 bg-slate-200" />
                                    </div>
                                </div>
                                <Skeleton className="w-24 h-10 rounded-full bg-slate-200" />
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {[1, 2, 3, 4, 5].map((row) => (
                                <div key={row} className="flex items-center justify-between pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40 bg-slate-100" />
                                            <Skeleton className="h-3 w-24 bg-slate-50" />
                                        </div>
                                    </div>
                                    <div className="flex gap-10">
                                        <div className="flex flex-col items-center gap-1">
                                            <Skeleton className="h-4 w-12 bg-slate-100" />
                                            <Skeleton className="h-3 w-16 bg-slate-50" />
                                        </div>
                                        <Skeleton className="h-10 w-20 rounded-lg bg-slate-100" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    </div>
)

// --- Types ---
interface LateEntry {
    id: string | number
    employee_id: string | number
    employee_name: string
    date: string
    actual_in: string
    minutesLate: number
    warning_level: number
    late_occurrence?: number
    department?: string
    is_email_sent?: boolean
}

interface LeaveEntry {
    id: number
    employee_id: string
    employee_name: string
    department: string
    category: 'half-day' | 'whole-day'
    start_date: string
    leave_end_date: string
    number_of_days: number
    remarks: string
    cite_reason: string
    approved_by: string
    is_email_sent?: boolean
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function WarningLetterPage() {
    const router = useRouter()
    const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()])
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [yearsList, setYearsList] = useState<number[]>([new Date().getFullYear()])
    const [lateEntries, setLateEntries] = useState<LateEntry[]>([])
    const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [cutoffFilter, setCutoffFilter] = useState<'cutoff1' | 'cutoff2' | 'both'>('both')
    const [evaluations, setEvaluations] = useState<any[]>([])

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness/years`)
                const data = await res.json()
                if (data.success) {
                    setYearsList(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch years:', error)
            }
        }
        fetchYears()
    }, [])

    useEffect(() => {
        fetchData()
    }, [selectedMonth, selectedYear])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [empRes, leavesRes, entRes, evalRes] = await Promise.all([
                fetch('/api/admin-head/employees?status=employed,rehired'),
                fetch(`${getApiUrl()}/api/leaves`),
                fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness?month=${selectedMonth}&year=${selectedYear}`),
                fetch(`${getApiUrl()}/api/evaluations`)
            ])

            const empData = await empRes.json()
            const leavesData = await leavesRes.json()
            const entData = await entRes.json()
            const evalData = await evalRes.json()

            if (evalData.success) {
                setEvaluations(evalData.data)
            }

            const currentLeaves = leavesData.success ? leavesData.data : []

            // Group and summarize leave entries
            const leaveGroups = new Map<string, any>()
            currentLeaves
                .filter((entry: any) => {
                    const isApproved = entry.approved_by !== 'Pending' && entry.approved_by !== 'Declined'
                    const isLong = (entry.number_of_days || 0) >= 3
                    const date = new Date(entry.start_date)
                    return isApproved && isLong && months[date.getMonth()] === selectedMonth && date.getFullYear() === selectedYear
                })
                .forEach((entry: any) => {
                    const date = new Date(entry.start_date)
                    const day = date.getDate()
                    const cutoff = day <= 15 ? 'cutoff1' : 'cutoff2'
                    const key = `${entry.employee_id}-${cutoff}`

                    if (!leaveGroups.has(key)) {
                        leaveGroups.set(key, {
                            ...entry,
                            cutoff,
                            total_days: Number(entry.number_of_days),
                            remarks_list: [entry.remarks],
                            reasons_list: entry.cite_reason ? [entry.cite_reason] : []
                        })
                    } else {
                        const existing = leaveGroups.get(key)
                        existing.total_days += Number(entry.number_of_days)
                        if (entry.remarks && !existing.remarks_list.includes(entry.remarks)) {
                            existing.remarks_list.push(entry.remarks)
                        }
                        if (entry.cite_reason && !existing.reasons_list.includes(entry.cite_reason)) {
                            existing.reasons_list.push(entry.cite_reason)
                        }
                        // Update range if needed
                        if (new Date(entry.start_date) < new Date(existing.start_date)) existing.start_date = entry.start_date
                        if (new Date(entry.leave_end_date) > new Date(existing.leave_end_date)) existing.leave_end_date = entry.leave_end_date
                    }
                })

            const summarizedLeaves = Array.from(leaveGroups.values()).map(entry => {
                // Try eager loaded relationship first, then fallback to local evaluations array
                const eagerStatus = entry.employee?.evaluation?.status
                const empEval = eagerStatus ? null : evalData.data.find((ev: any) => String(ev.employee_id) === String(entry.employee_id))

                const status = (eagerStatus || empEval?.status || 'Probee').toLowerCase()
                const isRegular = status === 'regular' || status === 'regularized'

                return {
                    ...entry,
                    number_of_days: entry.total_days,
                    remarks: entry.remarks_list.join('; '),
                    cite_reason: entry.reasons_list.join('; '),
                    is_regular: isRegular,
                    is_email_sent: Math.random() > 0.5 // Mock data for demonstration
                }
            })
            setLeaveEntries(summarizedLeaves)

            if (empData.success && entData.success) {
                const employees = empData.data
                const entriesByEmployee = new Map<string | number, any[]>()
                const mappedEntries = entData.data.map((e: any) => {
                    const empInfo = employees.find((emp: any) => String(emp.id) === String(e.employee_id))
                    const date = new Date(e.date)
                    const day = date.getDate()
                    const cutoff = e.cutoff_period || (day <= 15 ? 'cutoff1' : 'cutoff2')
                    return {
                        ...e,
                        employee_name: e.employee_name || empInfo?.name || String(e.employee_id),
                        department: empInfo?.department || empInfo?.office_name,
                        cutoff: cutoff
                    }
                })

                mappedEntries.forEach((entry: any) => {
                    const key = entry.employee_id
                    if (!entriesByEmployee.has(key)) entriesByEmployee.set(key, [])
                    entriesByEmployee.get(key)?.push(entry)
                })

                const lateGroups = new Map<string, any>()
                entriesByEmployee.forEach((group) => {
                    group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    let lateCount = 0
                    group.forEach((entry) => {
                        const isLate = (entry.minutes_late > 0) || (entry.minutesLate > 0)
                        let currentWarningLevel = 0

                        if (entry.warning_level > 0) {
                            currentWarningLevel = entry.warning_level
                            lateCount = Math.max(lateCount, entry.warning_level + 2)
                        } else if (isLate) {
                            lateCount++
                            if (lateCount >= 3) {
                                currentWarningLevel = lateCount - 2
                            }
                        }

                        if (currentWarningLevel > 0) {
                            const key = `${entry.employee_id}-${entry.cutoff}`
                            if (!lateGroups.has(key)) {
                                lateGroups.set(key, {
                                    ...entry,
                                    warning_level: currentWarningLevel,
                                    instances: 1
                                })
                            } else {
                                const existing = lateGroups.get(key)
                                // Keep the highest warning level in the cutoff
                                if (currentWarningLevel > existing.warning_level) {
                                    existing.warning_level = currentWarningLevel
                                    existing.date = entry.date
                                    existing.actual_in = entry.actual_in
                                }
                                existing.instances += 1
                            }
                        }
                    })
                })
                setLateEntries(Array.from(lateGroups.values()).map(entry => {
                    const eagerStatus = entry.employee?.evaluation?.status
                    const empEval = eagerStatus ? null : evalData.data.find((ev: any) => String(ev.employee_id) === String(entry.employee_id))

                    const status = (eagerStatus || empEval?.status || 'Probee').toLowerCase()
                    const isRegular = status === 'regular' || status === 'regularized'

                    return {
                        ...entry,
                        is_regular: isRegular,
                        is_email_sent: Math.random() > 0.7 // Mock data for demonstration
                    }
                }))
            }
        } catch (error) { console.error('Error fetching data:', error) } finally { setIsLoading(false) }
    }

    const filteredLateEntries = lateEntries.filter(entry => {
        const matchesSearch = entry.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCutoff = cutoffFilter === 'both' || (entry as any).cutoff === cutoffFilter
        return matchesSearch && matchesCutoff
    })

    const filteredLeaveEntries = leaveEntries.filter(entry => {
        const matchesSearch = entry.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCutoff = cutoffFilter === 'both' || (entry as any).cutoff === cutoffFilter
        return matchesSearch && matchesCutoff
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    if (isLoading) {
        return <SummarySkeleton />
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
            <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6 sticky top-0 z-50">
                {/* Main Header Row */}
                <div className="w-full px-4 md:px-8 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">
                                Employee Warning Summary
                            </h1>
                            <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                ABIC REALTY & CONSULTANCY
                            </p>
                        </div>

                        {/* Optional Actions Group */}
                        <div className="flex items-center gap-3">
                            <Button
                                onClick={() => router.push('/admin-head/attendance/warning-letter/edit_forms')}
                                variant="outline"
                                className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg cursor-pointer"
                            >
                                <ClipboardEdit className="w-4 h-4 mr-2 text-[#7B0F2B]" />
                                <span>Edit Form Templates</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Secondary Toolbar */}
                <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto no-scrollbar">
                    <div className="w-full px-4 md:px-8 py-3">
                        <div className="flex items-center gap-3 md:gap-4 min-w-max md:min-w-0">

                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Year</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[120px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                                            {selectedYear} <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-32 bg-white border-stone-200 shadow-xl rounded-xl p-1.5" align="start">
                                        {yearsList.map(year => (
                                            <DropdownMenuItem
                                                key={year}
                                                onClick={() => setSelectedYear(typeof year === 'string' ? parseInt(year) : year)}
                                                className={cn(
                                                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                                                    selectedYear === (typeof year === 'string' ? parseInt(year) : year) ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                                                )}
                                            >
                                                {year}
                                                {selectedYear === (typeof year === 'string' ? parseInt(year) : year) && <Check className="w-4 h-4 text-red-600" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Month</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[150px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                                            {selectedMonth} <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-48 bg-white border-stone-200 shadow-xl rounded-xl p-1.5 max-h-[350px] overflow-y-auto" align="start">
                                        {months.map(month => (
                                            <DropdownMenuItem
                                                key={month}
                                                onClick={() => setSelectedMonth(month)}
                                                className={cn(
                                                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                                                    selectedMonth === month ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                                                )}
                                            >
                                                {month}
                                                {selectedMonth === month && <Check className="w-4 h-4 text-red-600" />}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Period</span>
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner h-10">
                                    <button
                                        onClick={() => setCutoffFilter('cutoff1')}
                                        className={cn(
                                            "px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider cursor-pointer",
                                            cutoffFilter === 'cutoff1' ? "bg-[#800020] text-white shadow-md" : "text-[#800020]/60 hover:bg-slate-200"
                                        )}
                                    >
                                        1st-15th
                                    </button>
                                    <button
                                        onClick={() => setCutoffFilter('cutoff2')}
                                        className={cn(
                                            "px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider cursor-pointer",
                                            cutoffFilter === 'cutoff2' ? "bg-[#800020] text-white shadow-md" : "text-[#800020]/60 hover:bg-slate-200"
                                        )}
                                    >
                                        16th-End
                                    </button>
                                    <button
                                        onClick={() => setCutoffFilter('both')}
                                        className={cn(
                                            "px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider cursor-pointer",
                                            cutoffFilter === 'both' ? "bg-[#800020] text-white shadow-md" : "text-[#800020]/60 hover:bg-slate-200"
                                        )}
                                    >
                                        Both
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-[400px]">
                                <span className="text-sm font-bold text-white/70 uppercase tracking-wider hidden 2xl:block">Search</span>
                                <div className="relative w-full">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        placeholder="Search employee..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-10 w-full bg-white border-2 border-[#FFE5EC] text-[#800020] placeholder:text-slate-400 font-medium rounded-lg shadow-sm focus-visible:ring-rose-200 transition-all duration-200"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-8 xl:px-12 pb-12 -mt-4">
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8 items-start">
                    {/* Late Entries Card */}
                    <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:border-slate-300 ring-1 ring-black/[0.03]">
                        <CardHeader className="bg-white/50 px-8 py-6 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-[#4A081A]/10 rounded-lg">
                                        <Clock className="w-6 h-6 text-[#4A081A]" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Late Entries (Warnings Reached)</CardTitle>
                                        <CardDescription className="text-slate-500 font-medium text-sm mt-0.5">
                                            Warnings for {selectedMonth} {selectedYear} ({cutoffFilter === 'both' ? 'Both Cut-offs' : cutoffFilter === 'cutoff1' ? 'Cut-off 1' : 'Cut-off 2'})
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-xs px-4 py-1 rounded-full font-bold shadow-sm">
                                    {filteredLateEntries.length} Active Warnings
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/30 border-b border-slate-100 hover:bg-slate-50/30 transition-none">
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Employee</TableHead>
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">Warning Level</TableHead>
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">Manage</TableHead>
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">Email Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLateEntries.length > 0 ? (
                                        filteredLateEntries.map((entry) => (
                                            <TableRow key={entry.id} className="border-b border-slate-100 group/row transition-colors hover:bg-slate-50">
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-[15px]">{entry.employee_name}</span>
                                                            <Badge className={cn(
                                                                "text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter uppercase",
                                                                (entry as any).is_regular ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                            )}>
                                                                {(entry as any).is_regular ? 'Regular' : 'Probee'}
                                                            </Badge>
                                                        </div>
                                                        {(entry as any).department && (
                                                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">{(entry as any).department}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    <div className="flex justify-center">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-md font-bold text-[10px] border tracking-wider uppercase",
                                                            entry.warning_level === 1 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                                                entry.warning_level === 2 ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                                    "bg-red-50 text-red-700 border-red-200"
                                                        )}>
                                                            {entry.warning_level === 1 ? '1st Warning' :
                                                                entry.warning_level === 2 ? '2nd Warning' :
                                                                    'Final Warning'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-8 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => router.push(`/admin-head/attendance/warning-letter/forms-letter?employeeId=${entry.employee_id}&type=late&month=${selectedMonth}&year=${selectedYear}&cutoff=${(entry as any).cutoff}`)}
                                                        className="text-[#800020] hover:text-[#800020] hover:bg-rose-50/50 rounded-xl font-bold gap-2 text-xs h-10 px-6 border border-transparent hover:border-rose-100 transition-all shadow-none hover:shadow-sm cursor-pointer"
                                                    >
                                                        <FileText className="w-4 h-4 text-[#800020]" />
                                                        View Analysis
                                                        <ChevronRight className="w-3 h-3 ml-auto opacity-30 group-hover/row:translate-x-1 transition-transform" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    <div className="flex justify-center">
                                                        {entry.is_email_sent ? (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[10px] uppercase shadow-sm">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Sent
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                                                                <Mail className="w-3.5 h-3.5 opacity-50" />
                                                                Not Sent
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-20 text-center text-slate-400 italic text-xl">
                                                No employees with attendance warnings found for this selected period and cutoff.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Extended Leave Card */}
                    <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white/70 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:border-slate-300 ring-1 ring-black/[0.03]">
                        <CardHeader className="bg-white/50 px-8 py-6 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-[#7B0F2B]/10 rounded-lg">
                                        <Calendar className="w-6 h-6 text-[#7B0F2B]" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Extended Leave Monitoring</CardTitle>
                                        <CardDescription className="text-slate-500 font-medium text-sm mt-0.5">
                                            Approved leaves for {selectedMonth} {selectedYear} ({cutoffFilter === 'both' ? 'Both Cut-offs' : cutoffFilter === 'cutoff1' ? 'Cut-off 1' : 'Cut-off 2'})
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-xs px-4 py-1 rounded-full font-bold shadow-sm">
                                    {filteredLeaveEntries.length} Approved Leaves
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/30 border-b border-slate-100 hover:bg-slate-50/30 transition-none">
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px]">Employee</TableHead>
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">Absence Days</TableHead>
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">Manage</TableHead>
                                        <TableHead className="py-5 px-8 text-slate-500 font-bold uppercase tracking-wider text-[11px] text-center">Email Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeaveEntries.length > 0 ? (
                                        filteredLeaveEntries.map((entry) => (
                                            <TableRow key={entry.id} className="border-b border-slate-100 group/row transition-colors hover:bg-slate-50">
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900 text-[15px] block leading-tight">{entry.employee_name}</span>
                                                            <Badge className={cn(
                                                                "text-[9px] px-2 py-0.5 rounded-full font-black tracking-tighter uppercase",
                                                                (entry as any).is_regular ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-blue-50 text-blue-600 border-blue-100"
                                                            )}>
                                                                {(entry as any).is_regular ? 'Regular' : 'Probee'}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tight line-clamp-1">{entry.department}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    <div className="font-bold text-[#A4163A] text-lg">
                                                        {entry.number_of_days}
                                                        <span className="text-[10px] ml-0.5 text-slate-400">D</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                                                        {new Date(entry.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-8 text-center">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => router.push(`/admin-head/attendance/warning-letter/forms-letter?employeeId=${entry.employee_id}&type=leave&month=${selectedMonth}&year=${selectedYear}&cutoff=${(entry as any).cutoff}`)}
                                                        className="text-[#800020] hover:text-[#800020] hover:bg-rose-50/50 rounded-xl font-bold gap-2 text-xs h-10 px-6 border border-transparent hover:border-rose-100 transition-all shadow-none hover:shadow-sm cursor-pointer"
                                                    >
                                                        <FileText className="w-4 h-4 text-[#800020]" />
                                                        View Analysis
                                                        <ChevronRight className="w-3 h-3 ml-auto opacity-30 group-hover/row:translate-x-1 transition-transform" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-center">
                                                    <div className="flex justify-center">
                                                        {entry.is_email_sent ? (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-[10px] uppercase shadow-sm">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Sent
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 font-bold text-[10px] uppercase">
                                                                <Mail className="w-3.5 h-3.5 opacity-50" />
                                                                Not Sent
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-20 text-center text-slate-400 italic text-xl">
                                                No approved extended leave requests (3+ days) found for this period and cutoff.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
