'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    FileText,
    AlertTriangle,
    Calendar,
    User,
    Clock,
    Search,
    ChevronRight,
    Filter,
    Loader2,
    Mail,
    ShieldAlert
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

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
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

export default function WarningLetterPage() {
    const router = useRouter()
    const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()])
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [lateEntries, setLateEntries] = useState<LateEntry[]>([])
    const [leaveEntries, setLeaveEntries] = useState<LeaveEntry[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [cutoffFilter, setCutoffFilter] = useState<'cutoff1' | 'cutoff2' | 'both'>('both')

    useEffect(() => {
        fetchData()
    }, [selectedMonth, selectedYear])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [empRes, leavesRes, entRes] = await Promise.all([
                fetch('/api/admin-head/employees?status=employed,rehired'),
                fetch(`${getApiUrl()}/api/leaves`),
                fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness?month=${selectedMonth}&year=${selectedYear}`)
            ])

            const empData = await empRes.json()
            const leavesData = await leavesRes.json()
            const entData = await entRes.json()

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

            const summarizedLeaves = Array.from(leaveGroups.values()).map(entry => ({
                ...entry,
                number_of_days: entry.total_days,
                remarks: entry.remarks_list.join('; '),
                cite_reason: entry.reasons_list.join('; ')
            }))
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
                setLateEntries(Array.from(lateGroups.values()))
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

    return (
        <div className="min-h-screen bg-[#FDF4F6] p-6 lg:p-10">
            <div className="max-w-7xl mx-auto mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-[#4A081A] tracking-tight flex items-center gap-3">
                            <ShieldAlert className="w-10 h-10 text-[#A4163A]" />
                            Attendance Watchlist
                        </h1>
                        <p className="text-[#7B0F2B]/70 font-medium mt-2 text-lg">
                            Monitoring critical attendance patterns for {selectedMonth} {selectedYear}.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                        {/* Month/Year Selection */}
                        <div className="flex gap-2">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="h-12 px-4 bg-white border-2 border-[#FFE5EC] rounded-2xl font-bold text-[#4A081A] focus:ring-[#A4163A] focus:border-[#A4163A] outline-none transition-all shadow-sm cursor-pointer"
                            >
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="h-12 px-4 bg-white border-2 border-[#FFE5EC] rounded-2xl font-bold text-[#4A081A] focus:ring-[#A4163A] focus:border-[#A4163A] outline-none transition-all shadow-sm cursor-pointer"
                            >
                                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        {/* Cutoff Selector */}
                        <div className="flex bg-white p-1.5 rounded-2xl border-2 border-[#FFE5EC] shadow-sm">
                            <button
                                onClick={() => setCutoffFilter('cutoff1')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                    cutoffFilter === 'cutoff1' ? "bg-[#4A081A] text-white shadow-md" : "text-[#7B0F2B] hover:bg-rose-50"
                                )}
                            >
                                Cut-off 1
                            </button>
                            <button
                                onClick={() => setCutoffFilter('cutoff2')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                    cutoffFilter === 'cutoff2' ? "bg-[#4A081A] text-white shadow-md" : "text-[#7B0F2B] hover:bg-rose-50"
                                )}
                            >
                                Cut-off 2
                            </button>
                            <button
                                onClick={() => setCutoffFilter('both')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                    cutoffFilter === 'both' ? "bg-[#4A081A] text-white shadow-md" : "text-[#7B0F2B] hover:bg-rose-50"
                                )}
                            >
                                Both
                            </button>
                        </div>

                        <div className="relative w-full md:w-64 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A4163A] group-focus-within:text-[#7B0F2B] transition-colors" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 bg-white border-2 border-[#FFE5EC] rounded-2xl shadow-sm focus:ring-[#A4163A] focus:border-[#A4163A] transition-all font-medium"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-12 h-12 text-[#A4163A] animate-spin" />
                        <p className="text-[#7B0F2B] font-bold text-xl animate-pulse">Gathering intelligence...</p>
                    </div>
                ) : (
                    <>
                        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group transition-all duration-300 hover:shadow-[#7B0F2B]/10">
                            <CardHeader className="bg-gradient-to-r from-[#4A081A] to-[#A4163A] p-8 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                            <Clock className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black tracking-wide">Late Entries (Warnings Reached)</CardTitle>
                                            <CardDescription className="text-rose-100/80 font-medium text-base mt-1">
                                                Warnings for {selectedMonth} {selectedYear} ({cutoffFilter === 'both' ? 'Both Cut-offs' : cutoffFilter === 'cutoff1' ? 'Cut-off 1' : 'Cut-off 2'})
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg px-4 py-1.5 rounded-full backdrop-blur-sm">
                                        {filteredLateEntries.length} Records
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-[#FDF4F6] border-b-2 border-[#FFE5EC] hover:bg-[#FDF4F6]">
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px]">Employee</TableHead>
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Summary</TableHead>
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Warning</TableHead>
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLateEntries.length > 0 ? (
                                            filteredLateEntries.map((entry) => (
                                                <TableRow key={entry.id} className="border-b border-[#FFE5EC] group/row transition-colors hover:bg-rose-50/50">
                                                    <TableCell className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B0F2B] to-[#A4163A] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                                                {entry.employee_name[0]}
                                                            </div>
                                                            <span className="font-bold text-[#4A081A] text-sm leading-tight line-clamp-2">{entry.employee_name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-center text-slate-600">
                                                        <div className="flex flex-col items-center">
                                                            <div className="flex items-center gap-1 font-black text-[10px] text-[#A4163A] uppercase">
                                                                <AlertTriangle className="w-3 h-3" />
                                                                {(entry as any).instances} LATES
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-bold mt-0.5 whitespace-nowrap">
                                                                {formatDate(entry.date)}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-center">
                                                        <div className="flex justify-center">
                                                            <div className={cn(
                                                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-black text-[10px] border-2 shadow-sm uppercase",
                                                                entry.warning_level === 1 ? "bg-amber-50 text-amber-600 border-amber-200" :
                                                                    entry.warning_level === 2 ? "bg-orange-50 text-orange-600 border-orange-200" :
                                                                        "bg-red-50 text-red-600 border-red-200"
                                                            )}>
                                                                {entry.warning_level === 1 ? '1st' :
                                                                    entry.warning_level === 2 ? '2nd' :
                                                                        'Final'}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-center">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => router.push(`/admin-head/attendance/warning-letter/forms-letter?employeeId=${entry.employee_id}&type=late&month=${selectedMonth}&year=${selectedYear}&cutoff=${(entry as any).cutoff}`)}
                                                            className="bg-[#4A081A] hover:bg-[#630C22] text-white rounded-lg font-bold gap-1 shadow hover:shadow-lg transition-all active:scale-95 text-[10px] h-8 px-3"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            VIEW
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic text-xl">
                                                    No employees with attendance warnings found for this selected period and cutoff.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group transition-all duration-300 hover:shadow-[#7B0F2B]/10">
                            <CardHeader className="bg-gradient-to-r from-[#7B0F2B] to-[#D61F4D] p-8 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                            <Calendar className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black tracking-wide">Extended Leave Monitoring</CardTitle>
                                            <CardDescription className="text-rose-100/80 font-medium text-base mt-1">
                                                Approved leaves for {selectedMonth} {selectedYear} ({cutoffFilter === 'both' ? 'Both Cut-offs' : cutoffFilter === 'cutoff1' ? 'Cut-off 1' : 'Cut-off 2'})
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-lg px-4 py-1.5 rounded-full backdrop-blur-sm">
                                        {filteredLeaveEntries.length} Records
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-[#FDF4F6] border-b-2 border-[#FFE5EC] hover:bg-[#FDF4F6]">
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px]">Employee</TableHead>
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Days</TableHead>
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px]">Reason</TableHead>
                                            <TableHead className="py-5 px-4 text-[#4A081A] font-black uppercase tracking-widest text-[10px] text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLeaveEntries.length > 0 ? (
                                            filteredLeaveEntries.map((entry) => (
                                                <TableRow key={entry.id} className="border-b border-[#FFE5EC] group/row transition-colors hover:bg-rose-50/50">
                                                    <TableCell className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D61F4D] to-[#7B0F2B] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                                                                {entry.employee_name[0]}
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-[#4A081A] text-sm block leading-tight">{entry.employee_name}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight line-clamp-1">{entry.department}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-center">
                                                        <div className="font-black text-[#A4163A] text-xl">
                                                            {entry.number_of_days}
                                                            <span className="text-[9px] font-bold ml-0.5 text-slate-400">D</span>
                                                        </div>
                                                        <div className="text-[9px] text-slate-400 font-bold mt-0.5 whitespace-nowrap">
                                                            {new Date(entry.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4">
                                                        <div className="max-w-[120px]">
                                                            <p className="font-black text-[#4A081A] text-[10px] truncate uppercase leading-tight">{entry.remarks}</p>
                                                            <p className="text-slate-500 text-[10px] italic mt-0.5 line-clamp-1">{entry.cite_reason || "No reason"}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4 px-4 text-center">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => router.push(`/admin-head/attendance/warning-letter/forms-letter?employeeId=${entry.employee_id}&type=leave&month=${selectedMonth}&year=${selectedYear}&cutoff=${(entry as any).cutoff}`)}
                                                            className="bg-[#7B0F2B] hover:bg-[#A4163A] text-white rounded-lg font-bold gap-1 shadow hover:shadow-lg transition-all active:scale-95 text-[10px] h-8 px-3"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            VIEW
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-20 text-center text-slate-400 italic text-xl">
                                                    No approved extended leave requests (3+ days) found for this period and cutoff.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}

