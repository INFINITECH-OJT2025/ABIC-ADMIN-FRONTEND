//tardiness

'use client'


import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Clock, Plus, Search, Users, ChevronLeft, ChevronRight, FileDown, FileText, Check, AlertTriangle, Loader2, RotateCcw, X, Calendar } from 'lucide-react'
import * as XLSX from "xlsx-js-style";
import { toast } from 'sonner'





// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

import { cn } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'

// --- Skeleton Components ---
const TardinessSkeleton = () => (
  <div className="min-h-screen bg-slate-50/50">
    {/* Placeholder Header Bar */}
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
    </div>

    <div className="px-8 py-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border-2 border-[#FFE5EC] shadow-md rounded-xl overflow-hidden h-full flex flex-col">
            <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32 bg-stone-200" />
                <Skeleton className="h-4 w-48 bg-stone-100" />
              </div>
              <Skeleton className="h-9 w-24 bg-stone-200" />
            </div>
            <div className="p-4 space-y-6 mt-2">
              {Array(5).fill(0).map((_, idx) => (
                <div key={idx} className="flex gap-4">
                  <Skeleton className="h-10 w-1/3 bg-stone-100" />
                  <Skeleton className="h-10 w-1/5 bg-stone-100" />
                  <Skeleton className="h-10 w-1/5 bg-stone-100" />
                  <Skeleton className="h-10 w-1/5 bg-stone-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)


// ---------- TYPES & MOCK INITIAL DATA ----------
interface LateEntry {

  id: string | number
  employee_id: string | number
  employeeName: string // for backward compatibility in some components
  employee_name: string
  date: string
  actual_in: string
  actualIn?: string // for compatibility with existing display logic
  minutesLate: number
  warningLevel?: number
  warning_level?: number
  cutoff_period?: string
  cutoffPeriod?: string
  month: string
  year: number
  late_occurrence?: number // 1st late, 2nd late, etc.
  department?: string // office/department name
  office?: string // office name
}


interface Employee {
  id: string | number
  name: string
  nickname?: string
  department?: string // office/department name
  office_name?: string // office name from hierarchy
}


interface OfficeShiftSchedule {
  id?: number
  office_name: string
  shift_options: string[]
}


interface LeaveEntry {

  id: number
  employee_id: string | number
  employee_name: string
  department: string
  category: 'half-day' | 'whole-day'
  shift?: string
  start_date: string
  leave_end_date: string
  number_of_days: number
  approved_by: string
  remarks: string
  cite_reason: string
}


interface ShiftInfo {
  startTimeMinutes: number
  gracePeriodMinutes: number
  displayName: string
  allShifts?: { startTimeMinutes: number; displayName: string; shiftOption: string }[]
}

// Default fallback shift schedules (will be overridden by API data)
const DEFAULT_SHIFT_SCHEDULES: Record<string, ShiftInfo> = {
  'ABIC': { startTimeMinutes: 8 * 60, gracePeriodMinutes: 8 * 60 + 5, displayName: '8:00 AM' },
  'INFINITECH': { startTimeMinutes: 9 * 60, gracePeriodMinutes: 9 * 60 + 5, displayName: '9:00 AM' },
  'G-LIMIT': { startTimeMinutes: 10 * 60, gracePeriodMinutes: 10 * 60 + 5, displayName: '10:00 AM' },
}

// Global shift schedules reference (will be populated from API)
let DYNAMIC_SHIFT_SCHEDULES: Record<string, ShiftInfo> = { ...DEFAULT_SHIFT_SCHEDULES }

// Map from Department Name to Office Name
let DEPT_TO_OFFICE_MAP: Record<string, string> = {}

// Parse start time from shift option string (e.g., "8:00 AM – 12:00 PM" -> 8:00 AM)
function extractStartTime(shiftOption: string): string {
  // Support both en-dash (–) and hyphen (-)
  const parts = shiftOption.split(/\s*[–-]\s*/)
  return parts[0].trim()
}

// Unified time string parser (handles "8:00 AM", "08:00", "13:00:00", "01:10 pm", etc.)
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const normalized = timeStr.trim().toUpperCase()

  // 1. Try 12-hour format: HH:MM AM/PM
  const match12 = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/)
  if (match12) {
    let hours = parseInt(match12[1])
    const minutes = parseInt(match12[2])
    const period = match12[3]
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  // 2. Try 24-hour format: HH:MM[:SS]
  const match24 = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (match24) {
    const hours = parseInt(match24[1])
    const minutes = parseInt(match24[2])
    return hours * 60 + minutes
  }

  // 3. Fallback: try direct Date parsing for weird formats
  const dateStr = `2000-01-01 ${normalized}`
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    return d.getHours() * 60 + d.getMinutes()
  }

  return 0
}

// Alias for backward compatibility if needed, but we'll prioritize parseTimeToMinutes
const timeStringToMinutes = parseTimeToMinutes

// Helper to get shift schedule for an employee
function getShiftSchedule(department?: string): ShiftInfo {
  const fallbackKey = Object.keys(DYNAMIC_SHIFT_SCHEDULES).find(k => k.includes('ABIC')) || 'ABIC'
  const fallback = DYNAMIC_SHIFT_SCHEDULES[fallbackKey] || DEFAULT_SHIFT_SCHEDULES['ABIC']

  if (!department) return fallback

  const normalized = department.toUpperCase().trim()

  // 1. Try direct match with office/dept name
  if (DYNAMIC_SHIFT_SCHEDULES[normalized]) return DYNAMIC_SHIFT_SCHEDULES[normalized]

  // 2. Try mapping from department name to office
  const mappedOffice = DEPT_TO_OFFICE_MAP[normalized]
  if (mappedOffice) {
    if (DYNAMIC_SHIFT_SCHEDULES[mappedOffice]) return DYNAMIC_SHIFT_SCHEDULES[mappedOffice]

    // Fuzzy match mapped office against existing schedules
    const partialMapped = Object.keys(DYNAMIC_SHIFT_SCHEDULES).find(off =>
      mappedOffice.includes(off) || off.includes(mappedOffice)
    )
    if (partialMapped) return DYNAMIC_SHIFT_SCHEDULES[partialMapped]
  }

  // 3. Try fuzzy/partial match on department name itself
  const partialMatch = Object.keys(DYNAMIC_SHIFT_SCHEDULES).find(off =>
    normalized.includes(off) || off.includes(normalized)
  )
  if (partialMatch) return DYNAMIC_SHIFT_SCHEDULES[partialMatch]

  return fallback
}


// Helper to get effective shift start time considering approved leaves
function getEffectiveSchedule(
  employeeId: string | number,
  employeeName: string | undefined, // Added employeeName for fallback matching
  date: string,
  department: string | undefined,
  leaves: LeaveEntry[]
): ShiftInfo | null {
  const schedule = getShiftSchedule(department)
  const normalizedDate = formatDate(date)

  // Find approved leave for this employee on this date
  const leave = leaves.find(l =>
    (String(l.employee_id) === String(employeeId) || (employeeName && l.employee_name && l.employee_name.toLowerCase() === employeeName.toLowerCase())) &&
    (l.approved_by !== 'Pending' && l.approved_by !== 'Declined') && // Approved
    (normalizeDate(l.start_date) <= normalizedDate && normalizeDate(l.leave_end_date) >= normalizedDate)
  )

  if (!leave) return schedule

  const leaveCategory = (leave.category || '').toLowerCase().replace(/[\s_-]+/g, '')

  if (leaveCategory.includes('whole')) {
    return null // Signals whole-day leave
  }

  if (leaveCategory.includes('half') && leave.shift && schedule.allShifts && schedule.allShifts.length > 1) {
    const leaveStartMins = timeStringToMinutes(extractStartTime(leave.shift))
    const firstShiftStartMins = schedule.allShifts[0].startTimeMinutes

    // Use a small tolerance (5 mins) for time comparison to avoid floating point or string mismatch issues
    if (Math.abs(leaveStartMins - firstShiftStartMins) < 5) {
      return {
        startTimeMinutes: schedule.allShifts[1].startTimeMinutes,
        gracePeriodMinutes: schedule.allShifts[1].startTimeMinutes + 5,
        displayName: schedule.allShifts[1].displayName,
        allShifts: schedule.allShifts
      }
    }
  }

  return schedule
}

// Helper for normalizeDate (copied from leave page for consistency)
// Robust date normalizer to YYYY-MM-DD
function normalizeDate(dateInput: any): string {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return String(dateInput).slice(0, 10)

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}


// Initialize dynamic shift schedules from API data
async function initializeShiftSchedules() {
  try {
    const [schedRes, deptRes, officeRes] = await Promise.all([
      fetch(`${getApiUrl()}/api/office-shift-schedules`),
      fetch(`${getApiUrl()}/api/departments`),
      fetch(`${getApiUrl()}/api/offices`)
    ])

    const schedData = await schedRes.json()
    const deptData = await deptRes.json()
    const officeData = await officeRes.json()

    if (schedData.success && Array.isArray(schedData.data)) {
      DYNAMIC_SHIFT_SCHEDULES = {}
      schedData.data.forEach((schedule: OfficeShiftSchedule) => {
        if (schedule.shift_options && schedule.shift_options.length > 0) {
          const officeName = schedule.office_name.toUpperCase().trim()
          const shifts = schedule.shift_options.map(opt => ({
            startTimeMinutes: timeStringToMinutes(extractStartTime(opt)),
            displayName: extractStartTime(opt),
            shiftOption: opt
          }))

          DYNAMIC_SHIFT_SCHEDULES[officeName] = {
            startTimeMinutes: shifts[0].startTimeMinutes,
            gracePeriodMinutes: shifts[0].startTimeMinutes + 5,
            displayName: shifts[0].displayName,
            allShifts: shifts
          }
        }

      })
    }

    if (deptData.success && officeData.success) {
      const departments = deptData.data || []
      const offices = officeData.data || []
      DEPT_TO_OFFICE_MAP = {}

      departments.forEach((dept: any) => {
        const off = offices.find((o: any) => o.id === dept.office_id)
        if (off) {
          DEPT_TO_OFFICE_MAP[dept.name.toUpperCase().trim()] = off.name.toUpperCase().trim()
        }
      })
    }
  } catch (error) {
    console.error('Failed to load shift schedules from API:', error)
    // Fall back to defaults
    DYNAMIC_SHIFT_SCHEDULES = { ...DEFAULT_SHIFT_SCHEDULES }
  }
}


// Available years & months
const availableYears = [2025, 2026, 2027]
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']


// ---------- TIME PARSING UTILITY ----------
// Removed redundant parseTimeToMinutes definition (already unified above)


// Calculate minutes from assigned start time (no grace period) - for table display
function calculateMinutesLate(actualIn: string, department: string | undefined, employeeId: string | number | undefined, employeeName: string | undefined, date: string | undefined, leaves: LeaveEntry[]): number {
  if (!actualIn) return 0

  const schedule = (employeeId && date) ? getEffectiveSchedule(employeeId, employeeName, date, department, leaves) : getShiftSchedule(department)

  if (!schedule) return 0 // Whole day leave

  const actualTimeMinutes = parseTimeToMinutes(actualIn)

  if (actualTimeMinutes <= schedule.startTimeMinutes) return 0

  return Math.max(0, Math.floor(actualTimeMinutes - schedule.startTimeMinutes))
}


// Check if time exceeds grace period - for summary occurrences
function exceedsGracePeriod(actualIn: string, department: string | undefined, employeeId: string | number | undefined, employeeName: string | undefined, date: string | undefined, leaves: LeaveEntry[]): boolean {
  const schedule = (employeeId && date) ? getEffectiveSchedule(employeeId, employeeName, date, department, leaves) : getShiftSchedule(department)

  if (!schedule) return false // Whole day leave

  const actualTimeMinutes = parseTimeToMinutes(actualIn)
  return actualTimeMinutes > schedule.gracePeriodMinutes
}



// Convert any time format (12h or 24h) to a 24h HH:MM string for native time inputs
function to24h(timeStr: string): string {
  if (!timeStr) return ''
  const mins = parseTimeToMinutes(timeStr)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}


// Normalizes date input to YYYY-MM-DD using local time to avoid timezone shifts
function formatDate(dateInput: any): string {
  if (!dateInput) return ''
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return String(dateInput)


  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


// Recalculate warnings for all entries
function recalculateWarnings(entries: LateEntry[], leaves: LeaveEntry[]): LateEntry[] {
  // First, group by employee ONLY (to allow monthly cumulative counts)
  const entriesByEmployee = new Map<string | number, LateEntry[]>()



  entries.forEach(entry => {
    const key = entry.employee_id || entry.employee_name
    if (!entriesByEmployee.has(key)) {
      entriesByEmployee.set(key, [])
    }
    entriesByEmployee.get(key)?.push(entry)
  })


  // Now process each group
  const updatedEntries: LateEntry[] = []

  // Note: recalculateWarnings needs leaves too. Since it's a global function, 
  // we either pass leaves or use a closure. For now, let's keep it simple.



  entriesByEmployee.forEach((groupEntries) => {
    // Sort by date/time to ensure order
    groupEntries.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateA - dateB
      const timeA = parseTimeToMinutes(a.actual_in || a.actualIn || '')
      const timeB = parseTimeToMinutes(b.actual_in || b.actualIn || '')
      return timeA - timeB
    })


    let lateCount = 0


    const processedGroup = groupEntries.map(entry => {
      let warningLevel = 0
      const actualIn = entry.actual_in || entry.actualIn || ''
      const department = entry.department || entry.office


      // Check if late (using department-specific grace period)
      if (actualIn && exceedsGracePeriod(actualIn, department, entry.employee_id, entry.employee_name || entry.employeeName, entry.date, leaves)) {

        lateCount++
        // New Rule: 3rd late = 1st warning, 4th = 2nd, 5th = 3rd
        if (lateCount >= 3) {
          warningLevel = lateCount - 2
        }
      }


      const minutesLate = calculateMinutesLate(actualIn, department, entry.employee_id, entry.employee_name || entry.employeeName, entry.date, leaves)

      return {
        ...entry,
        minutesLate: minutesLate,
        warningLevel: warningLevel,
        warning_level: warningLevel, // Update both for consistency
        late_occurrence: actualIn && exceedsGracePeriod(actualIn, department, entry.employee_id, entry.employee_name || entry.employeeName, entry.date, leaves) ? lateCount : 0
      }

    })


    updatedEntries.push(...processedGroup)
  })


  // Return all entries (we might need to re-sort them overall if the global order matters,
  // but usually the specific table fitering will handle sorting)
  // Let's preserve the original global sort order by ID or Date if possible,
  // but for now re-sorting by date locally is fine as the tables re-filter them.
  return updatedEntries.sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (dateA !== dateB) return dateA - dateB
    const timeA = parseTimeToMinutes(a.actual_in || a.actualIn || '')
    const timeB = parseTimeToMinutes(b.actual_in || b.actualIn || '')
    return timeA - timeB
  })
}


// ---------- PAGINATION HOOK ----------
function usePagination<T>(items: T[], itemsPerPage: number = 15) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [items.length, itemsPerPage, currentPage, totalPages])

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedItems = items.slice(startIndex, startIndex + itemsPerPage)

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  }
}


// ---------- EXCEL EXPORT UTILITY ----------
function exportToExcel(
  summaryArray: { name: string; totalMinutes: number; occurrences: number; warnings: number }[],
  cutoffTitle: string,
  month: string,
  year: number
) {
  const now = new Date()
  const generatedLabel = `Generated on: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
  const periodLabel = `Period: ${month} ${year} – ${cutoffTitle}`

  const totalEmployeesWithLates = summaryArray.filter(e => e.occurrences > 0).length
  const totalLateMinutes = summaryArray.reduce((sum, e) => sum + e.totalMinutes, 0)
  const totalOccurrences = summaryArray.reduce((sum, e) => sum + e.occurrences, 0)
  const totalWarnings = summaryArray.reduce((sum, e) => sum + e.warnings, 0)

  // ── Maroon Gradient Palette ────────────────────────────────────────────────
  // Deep maroon for main header band
  const NAVY = '4A081A'
  // Mid maroon for table column header
  const INDIGO = '7B0F2B'
  // Soft rose tint for section header / metadata rows
  const INDIGO_LIGHT = 'FCE8ED'
  // Light rose for alternating data rows
  const SLATE_ALT = 'FDF4F6'
  // Accent for thin borders
  const BORDER_CLR = 'E2A0B0'
  const WHITE = 'FFFFFF'
  const BLACK = '1A0008'
  const GRAY = '6B2033'
  const GRAY_LIGHT = '9B4D63'

  const thin = (c = BORDER_CLR) => ({ style: 'thin' as const, color: { rgb: c } })
  const border = (c = BORDER_CLR) => ({ top: thin(c), bottom: thin(c), left: thin(c), right: thin(c) })

  // ── AOA construction ───────────────────────────────────────────────────────
  const AOA: any[][] = []

  // R0 – Company banner
  AOA.push(['ABIC REALTY AND CONSULTANCY', '', '', ''])
  // R1 – Report type
  AOA.push(['Tardiness Report', '', '', ''])
  // R2 – Period | Generated on
  AOA.push([periodLabel, '', generatedLabel, ''])
  // R3 – blank spacer
  AOA.push(['', '', '', ''])
  // R4 – Table column headings
  AOA.push(['EMPLOYEE NAME', 'TOTAL LATE (minutes)', 'TOTAL LATES (count > 8:05AM)', 'WARNINGS'])

  // R5… – Employee data rows
  summaryArray.forEach(emp => {
    AOA.push([emp.name, emp.totalMinutes, emp.occurrences, emp.warnings])
  })

  // blank separator
  AOA.push(['', '', '', ''])

  // Summary Statistics section
  const summaryHeaderRow = AOA.length
  AOA.push(['Summary Statistics', '', '', ''])

  const summaryData = [
    ['Total Employees with Lates', totalEmployeesWithLates],
    ['Total Late Minutes', totalLateMinutes],
    ['Total Lates', totalOccurrences],
    ['Total Warnings', totalWarnings],
  ]
  summaryData.forEach(([label, val]) => {
    AOA.push([label, '', val, ''])
  })

  // Notes block
  AOA.push(['', '', '', ''])
  const notesStartRow = AOA.length
  AOA.push(['Notes:', '', '', ''])
  AOA.push(['* Minutes are counted from each employee\'s office start time', '', '', ''])
  AOA.push(['* Shift times: ABIC=8:00 AM, INFINITECH=9:00 AM, G-LIMIT=10:00 AM', '', '', ''])
  AOA.push(['* Total Lates count is based on arrivals after respective grace periods (5 minutes)', '', '', ''])
  AOA.push(['* Warnings: 3rd late = 1st warning, 4th = 2nd, 5th = 3rd', '', '', ''])

  // Signatory
  AOA.push(['', '', '', ''])
  AOA.push(['', '', 'Reviewed by:', ''])
  AOA.push(['', '', '', ''])
  AOA.push(['', '', '________________________________', ''])
  AOA.push(['', '', 'Admin Head', ''])

  // ── Sheet creation ─────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(AOA)

  // Column widths
  ws['!cols'] = [
    { wch: 34 },
    { wch: 22 },
    { wch: 30 },
    { wch: 14 },
  ]

  // Row heights
  ws['!rows'] = AOA.map((_, i) => {
    if (i === 0) return { hpt: 28 }              // company banner
    if (i === 1) return { hpt: 20 }              // report title
    if (i === 4) return { hpt: 30 }              // table header
    if (i > 4 && i < summaryHeaderRow) return { hpt: 18 }
    if (i === summaryHeaderRow) return { hpt: 22 }
    return { hpt: 17 }
  })

  // Merges
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },   // company name full width
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },   // report title full width
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },   // period label A–B
    { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } },   // generated label C–D
    { s: { r: summaryHeaderRow, c: 0 }, e: { r: summaryHeaderRow, c: 3 } }, // section header
    ...summaryData.map((_, idx) => ({
      s: { r: summaryHeaderRow + 1 + idx, c: 0 },
      e: { r: summaryHeaderRow + 1 + idx, c: 1 }
    })),
    ...summaryData.map((_, idx) => ({
      s: { r: summaryHeaderRow + 1 + idx, c: 2 },
      e: { r: summaryHeaderRow + 1 + idx, c: 3 }
    })),
    // Notes rows: full width merges
    { s: { r: notesStartRow, c: 0 }, e: { r: notesStartRow, c: 3 } },
    { s: { r: notesStartRow + 1, c: 0 }, e: { r: notesStartRow + 1, c: 3 } },
    { s: { r: notesStartRow + 2, c: 0 }, e: { r: notesStartRow + 2, c: 3 } },
    { s: { r: notesStartRow + 3, c: 0 }, e: { r: notesStartRow + 3, c: 3 } },
  ]

  // ── Style applier ──────────────────────────────────────────────────────────
  const S = (r: number, c: number, style: object) => {
    const addr = XLSX.utils.encode_cell({ r, c })
    if (!ws[addr]) ws[addr] = { t: 's', v: '' }
    ws[addr].s = style
  }

  // R0 – Deep navy company banner
  S(0, 0, {
    font: { bold: true, sz: 14, color: { rgb: WHITE }, name: 'Calibri' },
    fill: { patternType: 'solid', fgColor: { rgb: NAVY } },
    alignment: { horizontal: 'center', vertical: 'center' },
  })

  // R1 – Slightly lighter navy subtitle band
  S(1, 0, {
    font: { bold: false, sz: 11, color: { rgb: WHITE }, name: 'Calibri', italic: true },
    fill: { patternType: 'solid', fgColor: { rgb: '630C22' } },
    alignment: { horizontal: 'center', vertical: 'center' },
  })

  // R2 – Soft indigo tint for metadata row (period / generated)
  S(2, 0, {
    font: { sz: 9, bold: true, color: { rgb: INDIGO }, name: 'Calibri' },
    fill: { patternType: 'solid', fgColor: { rgb: INDIGO_LIGHT } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: { bottom: thin(BORDER_CLR) },
  })
  S(2, 2, {
    font: { sz: 9, bold: false, color: { rgb: GRAY }, name: 'Calibri' },
    fill: { patternType: 'solid', fgColor: { rgb: INDIGO_LIGHT } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: { bottom: thin(BORDER_CLR) },
  })

    // R4 – Indigo table column header
    ;[0, 1, 2, 3].forEach(c => {
      S(4, c, {
        font: { bold: true, sz: 10, color: { rgb: WHITE }, name: 'Calibri' },
        fill: { patternType: 'solid', fgColor: { rgb: INDIGO } },
        alignment: { horizontal: c === 0 ? 'left' : 'center', vertical: 'center', wrapText: true },
        border: border('9B1535'),
      })
    })

  // Data rows – alternating slate / white with thin borders
  summaryArray.forEach((_, i) => {
    const r = 5 + i
    const rowFill = i % 2 === 0 ? WHITE : SLATE_ALT
      ;[0, 1, 2, 3].forEach(c => {
        S(r, c, {
          font: { sz: 10, color: { rgb: BLACK }, name: 'Calibri', bold: c === 0 },
          fill: { patternType: 'solid', fgColor: { rgb: rowFill } },
          alignment: { horizontal: c === 0 ? 'left' : 'center', vertical: 'center' },
          border: border(),
        })
      })
  })

  // Summary Statistics section header — indigo-tinted, no heavy fill
  S(summaryHeaderRow, 0, {
    font: { bold: true, sz: 11, color: { rgb: INDIGO }, name: 'Calibri' },
    fill: { patternType: 'solid', fgColor: { rgb: INDIGO_LIGHT } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: { top: thin(INDIGO), bottom: thin(BORDER_CLR), left: thin(INDIGO), right: thin(BORDER_CLR) },
  })

  // Summary data rows — clean white, text-only label, value in col C
  summaryData.forEach((row, idx) => {
    const r = summaryHeaderRow + 1 + idx
    const isEven = idx % 2 === 0
    // Label cell (A–B merged)
    S(r, 0, {
      font: { sz: 10, bold: true, color: { rgb: GRAY }, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: isEven ? WHITE : SLATE_ALT } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: border(),
    })
    // Value cell (C–D merged)
    S(r, 2, {
      font: { sz: 10, bold: true, color: { rgb: INDIGO }, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: isEven ? WHITE : SLATE_ALT } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: border(),
    })
  })

  // Notes block — plain white, caption font
  const noteStyles = [
    { bold: true, color: GRAY, sz: 9 },
    { bold: false, color: GRAY_LIGHT, sz: 9 },
    { bold: false, color: GRAY_LIGHT, sz: 9 },
    { bold: false, color: GRAY_LIGHT, sz: 9 },
  ]
  noteStyles.forEach((ns, i) => {
    S(notesStartRow + i, 0, {
      font: { sz: ns.sz, bold: ns.bold, italic: i > 0, color: { rgb: ns.color }, name: 'Calibri' },
      fill: { patternType: 'solid', fgColor: { rgb: 'F9FAFB' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    })
  })

  // Signatory rows — centered in C–D
  const sigBase = notesStartRow + 4 + 1
    ;[0, 1, 2, 3, 4].forEach(offset => {
      S(sigBase + offset, 2, {
        font: {
          sz: offset === 1 ? 9 : 10,
          bold: offset === 0 || offset === 4,
          color: { rgb: offset === 4 ? INDIGO : GRAY },
          name: 'Calibri',
        },
        alignment: { horizontal: 'center', vertical: 'center' },
      })
    })

  // ── Page setup — Folio 8½" × 13" with 1-inch margins ──────────────────────
  // paperSize 14 = US Folio (8.5 × 13 in) in the OOXML spec
  ws['!pageSetup'] = {
    paperSize: 14,
    orientation: 'portrait',
    fitToPage: false,
    scale: 100,
  }
  // All margins in inches (1 inch each side; header/footer 0.5 in)
  ws['!margins'] = {
    left: 1,
    right: 1,
    top: 1,
    bottom: 1,
    header: 0.5,
    footer: 0.5,
  }

  // ── Write file ─────────────────────────────────────────────────────────────
  let sheetName = `Tardiness_${cutoffTitle.replace(/[^a-zA-Z0-9]/g, '_')}`
  if (sheetName.length > 31) sheetName = sheetName.substring(0, 31)

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `Tardiness_Summary_${cutoffTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${month}_${year}.xlsx`)
}


// ---------- FUZZY SEARCH UTILITY ----------
function isFuzzyMatch(term: string, target: string): boolean {
  if (target.includes(term)) return true;
  if (term.length < 4) return false;

  const maxTypos = term.length <= 5 ? 1 : 2;

  // Check if term is fuzzy matched within target
  for (let k = 0; k < target.length; k++) {
    for (let len = term.length - maxTypos; len <= term.length + maxTypos; len++) {
      if (len < 1 || k + len > target.length) continue;
      const sub = target.substring(k, k + len);

      const matrix = Array(sub.length + 1).fill(null).map(() => Array(term.length + 1).fill(0));
      for (let i = 0; i <= sub.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= term.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= sub.length; i++) {
        for (let j = 1; j <= term.length; j++) {
          if (sub.charAt(i - 1) === term.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
            );
          }
        }
      }

      if (matrix[sub.length][term.length] <= maxTypos) {
        return true;
      }
    }
  }
  return false;
}


// ---------- EMPLOYEE SELECTOR COMPONENT ----------
function EmployeeSelector({
  value,
  onChange,
  employees
}: {
  value: string
  onChange: (name: string) => void
  employees: Employee[]
}) {
  const [open, setOpen] = useState(false)


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-center gap-2 h-9 text-sm border-stone-200 hover:bg-stone-50 font-normal text-slate-700 rounded-sm shadow-none"
        >
          <span className="truncate shrink-0">
            {value ? (value.length > 35 ? value.substring(0, 35) + '...' : value) : "Select employee..."}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command filter={(value, search) => {
          const searchTerms = search.toLowerCase().trim().split(/\s+/)
          const target = value.toLowerCase()
          return searchTerms.every(term => isFuzzyMatch(term, target)) ? 1 : 0
        }}>
          <CommandInput placeholder="Search employee..." className="h-9" />
          <CommandEmpty>No employee found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {employees.map((employee) => (
                <CommandItem
                  key={employee.id}
                  value={employee.name}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === employee.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {employee.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}




// ---------- SUMMARY SHEET COMPONENT ----------
// ---------- SUMMARY SHEET COMPONENT ----------
interface SummarySheetProps {
  isOpen: boolean
  onClose: () => void
  cutoffTitle: string
  entries: LateEntry[]
  selectedYear: number
  selectedMonth: string
  employees: Employee[]
  leaves: LeaveEntry[]
}


function SummarySheet({ isOpen, onClose, cutoffTitle, entries, selectedYear, selectedMonth, employees, leaves }: SummarySheetProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('')


  // Calculate summary from entries - ONLY from this specific cutoff range
  const summaryMap = new Map<string | number, { totalMinutes: number; occurrences: number; name: string }>()


  // Initialize all employees with 0 values
  employees.forEach(emp => {
    summaryMap.set(emp.id, { totalMinutes: 0, occurrences: 0, name: emp.name })
  })


  // Add actual data
  entries.forEach(entry => {
    const current = summaryMap.get(entry.employee_id)
    if (current) {
      current.totalMinutes += entry.minutesLate
      // Use helper to check if late (using department-specific grace period and leaves)
      const actualTime = entry.actual_in || entry.actualIn || ''
      const department = entry.department || entry.office
      if (actualTime && exceedsGracePeriod(actualTime, department, entry.employee_id, entry.employee_name || entry.employeeName, entry.date, leaves)) {
        current.occurrences += 1
      }
    }
  })


  // Convert to array preserving the order of employees
  const summaryArray = employees.map(emp => {
    const data = summaryMap.get(emp.id) || { totalMinutes: 0, occurrences: 0, name: emp.name }

    // Use the highest warning level reached by this employee in the specific entries for this cutoff
    const empEntriesInRange = entries.filter(e => e.employee_id === emp.id)
    const warnings = empEntriesInRange.length > 0
      ? Math.max(...empEntriesInRange.map(e => e.warningLevel || 0))
      : 0

    return {
      name: data.name,
      totalMinutes: data.totalMinutes,
      occurrences: data.occurrences,
      warnings: warnings
    }
  })


  // Filter based on search query
  const filteredSummaryArray = summaryArray.filter(emp => {
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/)
    const target = emp.name.toLowerCase()
    return searchTerms.every(term => isFuzzyMatch(term, target))
  })


  const totalLateMinutes = summaryArray.reduce((sum, emp) => sum + emp.totalMinutes, 0)
  const totalOccurrences = summaryArray.reduce((sum, emp) => sum + emp.occurrences, 0)
  const totalWarnings = summaryArray.reduce((sum, emp) => sum + emp.warnings, 0)


  // Pagination for summary
  const summaryPagination = usePagination(filteredSummaryArray, 15)


  // Handle export
  const handleExport = () => {
    exportToExcel(summaryArray, cutoffTitle, selectedMonth, selectedYear)
  }


  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl bg-white border-l-4 border-[#4A081A] text-slate-900 overflow-y-auto p-0">
        <SheetHeader className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#7B0F2B] p-8 text-white relative">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-3xl text-white font-bold flex items-center gap-2">
                <FileText className="w-8 h-8" />
                Summary Report
              </SheetTitle>
              <SheetDescription className="text-white/80 text-lg mt-1 font-medium">
                {cutoffTitle} • {selectedMonth} {selectedYear}
              </SheetDescription>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#630C22]" />
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  summaryPagination.setCurrentPage(1)
                }}
                className="bg-white/90 border-0 text-slate-800 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-white rounded-lg"
              />
            </div>
            <Button
              size="sm"
              onClick={handleExport}
              className="bg-white text-[#4A081A] hover:bg-rose-50 border-0 text-sm h-10 px-6 flex items-center gap-2 font-bold shadow-lg transition-all duration-300 w-full sm:w-auto"
            >
              <FileDown className="w-4 h-4" />
              Export
            </Button>
          </div>
        </SheetHeader>




        <div className="p-6 space-y-6">


          {/* Summary table - ONLY shows entries from this cutoff */}
          <Card className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl text-[#4A081A] font-bold">Employee Lates Summary</CardTitle>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#630C22]">
                    {totalLateMinutes} mins / {totalOccurrences} occ / <span className="text-red-600">{totalWarnings} warnings</span>
                  </p>
                </div>
              </div>
              <CardDescription className="text-[#630C22]/70 text-xs font-medium">
                Minutes from Assigned Shift • Occurrences after 5min Grace Period • {cutoffTitle} only
              </CardDescription>
            </CardHeader>


            <CardContent className="p-0">
              <div className="overflow-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">EMPLOYEE NAME</th>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">TOTAL LATES (MINS)</th>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">NO. OF LATES</th>
                      <th className="px-4 py-3 text-left font-bold text-[#800020] text-xs uppercase tracking-wider">WARNINGS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-50">
                    {summaryPagination.paginatedItems.length > 0 ? (
                      summaryPagination.paginatedItems.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-[#FFE5EC] transition-colors duration-200">
                          <td className="px-4 py-3 text-slate-700 font-semibold">{emp.name}</td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">
                            {emp.totalMinutes}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-700">
                            {emp.occurrences > 0 ? emp.occurrences : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {emp.warnings > 0 ? (
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-200">
                                  {emp.warnings}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">
                          No late entries found for this cutoff period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>




          <div className="text-xs text-stone-500 space-y-1">
            <p>* Minutes are counted from assigned shift start time (no grace period in minutes display)</p>
            <p>* Occurrences are only counted for arrivals after the 5-minute grace period</p>
            <p>* Warnings: 3rd late = 1st warning, 4th = 2nd, 5th = 3rd</p>
            <p>This report includes data only from {cutoffTitle}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}



// ---------- MAIN DASHBOARD ----------
export default function AttendanceDashboard() {
  // State for year & month selection
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()])
  const [yearsList, setYearsList] = useState<number[]>(availableYears)


  // State for all entries (Master Record)
  const [allEntries, setAllEntries] = useState<LateEntry[]>([])
  const [leaves, setLeaves] = useState<LeaveEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)



  // Fetch years list
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


  // Fetch employees and entries
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // 1. Initialize shift schedules (essential for minutesLate calculations)
        await initializeShiftSchedules()

        // 2. Fetch all required supporting data
        const [empRes, hierRes, deptRes, posRes, leavesRes, offRes] = await Promise.all([
          fetch('/api/admin-head/employees?status=employed,rehired'),
          fetch(`${getApiUrl()}/api/hierarchies`),
          fetch(`${getApiUrl()}/api/departments`),
          fetch(`${getApiUrl()}/api/positions`),
          fetch(`${getApiUrl()}/api/leaves`),
          fetch(`${getApiUrl()}/api/offices`)
        ])

        const empData = await empRes.json()
        const hierData = await hierRes.json()
        const deptData = await deptRes.json()
        const posData = await posRes.json()
        const leavesData = await leavesRes.json()
        const offData = await offRes.json()

        const currentLeaves = leavesData.success ? leavesData.data : []
        setLeaves(currentLeaves)

        if (empData.success) {
          const hierarchies = hierData.success ? hierData.data : []
          const positions = posData.success ? posData.data : []
          const departments = deptData.success ? deptData.data : []
          const offices = offData.success ? offData.data : []

          // 3. Resolve department and names for all employees immediately
          const resolvedEmployees = empData.data.map((e: any) => {
            let deptName = e.department
            if (!deptName && e.position && positions.length > 0 && hierarchies.length > 0) {
              const pos = positions.find((p: any) => p.name.toLowerCase() === e.position?.toLowerCase())
              if (pos) {
                const hier = hierarchies.find((h: any) => String(h.position_id) === String(pos.id))
                if (hier && hier.department_id) {
                  const d = departments.find((d: any) => String(d.id) === String(hier.department_id))
                  if (d) deptName = d.name
                }
              }
            }

            // Corrected Name Resolution: Use 'e.name' if provided by the API (which it is for this route)
            const fullName = e.name || (e.first_name && e.last_name ? `${e.first_name} ${e.last_name}` : String(e.id))

            return {
              ...e,
              id: String(e.id),
              name: fullName,
              department: deptName || e.department || e.office_name
            }
          })
          setEmployees(resolvedEmployees)

          // 4. Fetch and map attendance entries for the current selected month/year
          const entRes = await fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness?month=${selectedMonth}&year=${selectedYear}`)
          const entData = await entRes.json()

          if (entData.success) {
            const mappedEntries = entData.data.map((e: any) => {
              const empInfo = resolvedEmployees.find((emp: any) => String(emp.id) === String(e.employee_id))
              return {
                ...e,
                date: formatDate(e.date),
                employeeName: e.employee_name,
                cutoffPeriod: e.cutoff_period,
                actualIn: e.actual_in,
                minutesLate: calculateMinutesLate(e.actual_in, empInfo?.department, e.employee_id, e.employee_name, e.date, currentLeaves),
                warningLevel: e.warning_level,
                department: empInfo?.department,
                office: empInfo?.department
              }
            })

            const sorted = mappedEntries.sort((a: any, b: any) => {
              const dateA = new Date(a.date).getTime()
              const dateB = new Date(b.date).getTime()
              if (dateA !== dateB) return dateA - dateB
              return parseTimeToMinutes(a.actual_in) - parseTimeToMinutes(b.actual_in)
            })

            setAllEntries(recalculateWarnings(sorted, currentLeaves))
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load data from server')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedMonth, selectedYear])


  // Derive cutoff data for the SELECTED month and year
  const filteredByPeriod = allEntries.filter(
    entry => entry.month === selectedMonth && entry.year === selectedYear
  )


  const firstCutoffEntries = filteredByPeriod.filter(e => e.cutoffPeriod === 'cutoff1')
  const secondCutoffEntries = filteredByPeriod.filter(e => e.cutoffPeriod === 'cutoff2')


  // Summary visibility state - controlled by Summary buttons
  const [summarySheetOpen, setSummarySheetOpen] = useState(false)
  const [activeCutoffSummary, setActiveCutoffSummary] = useState<{ title: string; entries: LateEntry[] } | null>(null)


  // UI state for which cutoff table to show
  const [showCutoff, setShowCutoff] = useState<'first' | 'second' | 'both'>(
    new Date().getDate() <= 15 ? 'first' : 'second'
  )


  // Global Search state for both cutoff tables
  const [searchQuery, setSearchQuery] = useState('')


  // Filter entries based on search before pagination
  const filteredFirstEntries = firstCutoffEntries.filter(entry => {
    const empName = (entry.employee_name || entry.employeeName || '').toLowerCase()
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/)
    return searchTerms.every(term => isFuzzyMatch(term, empName))
  })


  const filteredSecondEntries = secondCutoffEntries.filter(entry => {
    const empName = (entry.employee_name || entry.employeeName || '').toLowerCase()
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/)
    return searchTerms.every(term => isFuzzyMatch(term, empName))
  })


  // Pagination states for each table removed per user request


  // New Year confirmation state
  const [showNewYearConfirm, setShowNewYearConfirm] = useState(false)
  const [isAddingYear, setIsAddingYear] = useState(false)


  // Handler to add a new year after confirmation
  const handleAddNewYearConfirm = () => {
    setShowNewYearConfirm(true)
  }


  // Handler to undo year addition
  const handleUndoYear = async (year: number) => {
    try {
      const res = await fetch(`/api/admin-head/attendance/tardiness/years?year=${year}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        setYearsList(prev => prev.filter(y => y !== year).sort())
        setSelectedYear(new Date().getFullYear()) // Fallback to current year
        toast.success(`Year ${year} has been removed.`)
      }
    } catch (error) {
      console.error('Undo error:', error)
      toast.error('Failed to undo year addition')
    }
  }


  // Actual logic to add year
  const addNewYear = async () => {
    const nextYear = Math.max(...yearsList) + 1
    setIsAddingYear(true)
    try {
      const res = await fetch('/api/admin-head/attendance/tardiness/years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: nextYear })
      })
      const data = await res.json()
      if (data.success) {
        setYearsList(prev => [...prev, nextYear].sort())
        setSelectedYear(nextYear)
        setShowNewYearConfirm(false)


        // Show success with Undo action
        toast.success(`Year ${nextYear} added`, {
          description: "Click undo if this was a mistake",
          action: {
            label: "Undo",
            onClick: () => handleUndoYear(nextYear)
          },
          duration: 10000, // 10 seconds for undo
        })
      } else {
        // Parse validation errors if present
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(' ')
          toast.error(errorMessages || data.message)
        } else {
          toast.error(data.message || 'Failed to add year')
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Connection Error: Could not reach the server.')
      } else {
        toast.error('Could not add year. Please try again later.')
      }
    } finally {
      setIsAddingYear(false)
    }
  }




  // Debounce refs to avoid firing API on every keystroke
  const debounceTimers = useRef<Record<string | number, ReturnType<typeof setTimeout>>>({})


  // Shared handler to update actual_in time — updates local state immediately
  // and persists to the database after a short debounce
  const updateEntryTime = (id: string | number, newTime: string) => {
    // Find the entry to get its department
    const entryToUpdate = allEntries.find(e => e.id === id)
    // Try to get fresh employee info to be 100% sure about the department
    const employee = employees.find(e => {
      const entryEmpId = String(entryToUpdate?.employee_id)
      return String(e.id) === entryEmpId || e.name === entryToUpdate?.employee_name
    })

    const department = employee?.department || entryToUpdate?.department || entryToUpdate?.office
    // Validation: Check for approved leave that covers this time
    const dateStr = entryToUpdate?.date ? formatDate(entryToUpdate.date) : ''
    const approvedLeave = leaves.find(l =>
      String(l.employee_id) === String(entryToUpdate?.employee_id) &&
      (l.approved_by !== 'Pending' && l.approved_by !== 'Declined') && // Approved
      (normalizeDate(l.start_date) <= dateStr && normalizeDate(l.leave_end_date) >= dateStr)
    )

    if (approvedLeave) {
      if (approvedLeave.category === 'whole-day') {
        toast.error(`${entryToUpdate?.employee_name} has an approved whole-day leave. Attendance cannot be recorded.`)
        return
      }

      if (approvedLeave.category === 'half-day' && approvedLeave.shift) {
        const parts = approvedLeave.shift.split(' – ')
        if (parts.length === 2) {
          const startMins = timeStringToMinutes(parts[0])
          const endMins = timeStringToMinutes(parts[1])
          const entryMins = parseTimeToMinutes(newTime)

          if (entryMins >= startMins && entryMins <= endMins) {
            toast.error(`${entryToUpdate?.employee_name} has an approved half-day leave during this shift (${approvedLeave.shift}). Attendance cannot be recorded for this time.`)
            return
          }
        }
      }
    }

    // Persist the calculated minutes late immediately
    const minutesLate = calculateMinutesLate(newTime, department, entryToUpdate?.employee_id, entryToUpdate?.employee_name, entryToUpdate?.date, leaves)


    // Optimistic local update with recalculation
    setAllEntries(prev => {
      const updatedList = prev.map(entry => {
        if (entry.id === id) {
          const updated = {
            ...entry,
            actual_in: newTime,
            actualIn: newTime,
            minutesLate,
          }
          return updated
        }
        return entry
      })
      // Must recalculate warnings because changing one time might change the count/order of warnings
      return recalculateWarnings(updatedList, leaves)
    })



    // Debounce the API call (600ms)
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id])
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actualIn: newTime, minutesLate }),
        })
        const data = await res.json()
        if (!data.success) {
          toast.error(data.message || 'Failed to update entry')
        } else {
          toast.success(data.message || 'Tardiness entry updated successfully')
        }
      } catch (err) {
        console.error('Update error:', err)
        toast.error('An error occurred while updating the entry')
      }
    }, 600)
  }


  const updateFirstCutoffTime = (id: string | number, newTime: string) => updateEntryTime(id, newTime)
  const updateSecondCutoffTime = (id: string | number, newTime: string) => updateEntryTime(id, newTime)


  const [newEntryEmployee, setNewEntryEmployee] = useState('')
  const [newEntryTime, setNewEntryTime] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false)


  // Reset new entry fields
  const resetAddEntryFields = () => {
    setNewEntryEmployee('')
    setNewEntryTime('')
  }




  const [showSaveConfirm, setShowSaveConfirm] = useState(false)


  // Validation before opening confirmation
  const handleSaveClick = () => {
    if (!newEntryEmployee || !newEntryTime) {
      toast.error('Please select an employee and enter the actual in time.')
      return
    }


    const selectedEmployee = employees.find(e => e.name === newEntryEmployee)
    if (!selectedEmployee) return


    // ALWAYS use today's date for new entries as requested
    const dateObj = new Date()
    const entryYear = dateObj.getFullYear()
    const dayOfMonth = dateObj.getDate()
    const dateStr = `${entryYear}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`


    // Validation 2: Check if employee already has an entry for this date (Strict Prevention)
    const duplicateEntry = allEntries.find(
      entry => entry.employee_id === selectedEmployee.id && formatDate(entry.date) === dateStr
    )


    if (duplicateEntry) {
      toast.error(`${newEntryEmployee} already has a late entry recorded for today (${dateStr}).`)
      return
    }


    // Validation 3: Check for approved leave
    const approvedLeave = leaves.find(l =>
      String(l.employee_id) === String(selectedEmployee.id) &&
      (l.approved_by !== 'Pending' && l.approved_by !== 'Declined') &&
      (normalizeDate(l.start_date) <= dateStr && normalizeDate(l.leave_end_date) >= dateStr)
    )

    if (approvedLeave) {
      if (approvedLeave.category === 'whole-day') {
        toast.error(`${newEntryEmployee} has an approved whole-day leave for today. Attendance cannot be recorded.`)
        return
      }

      if (approvedLeave.category === 'half-day' && approvedLeave.shift) {
        const parts = approvedLeave.shift.split(' – ')
        if (parts.length === 2) {
          const startMins = timeStringToMinutes(parts[0])
          const endMins = timeStringToMinutes(parts[1])
          const entryMins = parseTimeToMinutes(newEntryTime)

          if (entryMins >= startMins && entryMins <= endMins) {
            toast.error(`${newEntryEmployee} has an approved half-day leave for this shift (${approvedLeave.shift}). Attendance cannot be recorded for this time.`)
            return
          }
        }
      }
    }



    // If validation passes, open confirmation modal
    setShowSaveConfirm(true)
  }


  // Actual Save Logic (triggered by confirmation modal)
  const executeSaveEntry = async () => {
    const selectedEmployee = employees.find(e => e.name === newEntryEmployee)
    if (!selectedEmployee) return


    const dateObj = new Date()
    const entryYear = dateObj.getFullYear()
    const entryMonth = months[dateObj.getMonth()]
    const dayOfMonth = dateObj.getDate()
    const dateStr = `${entryYear}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`


    const autoCutoff: 'cutoff1' | 'cutoff2' = dayOfMonth <= 15 ? 'cutoff1' : 'cutoff2'
    // Calculate minutes late based on employee's department shift AND leaves
    const minutesLate = calculateMinutesLate(newEntryTime, selectedEmployee.department, selectedEmployee.id, selectedEmployee.name, dateStr, leaves)


    setIsSaving(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          employeeName: selectedEmployee.name,
          date: dateStr,
          actualIn: newEntryTime, // Save as 24h time in DB
          minutesLate: minutesLate,
          warningLevel: 0,
          cutoffPeriod: autoCutoff,
          month: entryMonth,
          year: entryYear
        })
      })


      const data = await response.json()
      if (data.success) {
        toast.success('Entry saved successfully')
        // Refresh entries with corrected mapping
        const entRes = await fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness?month=${selectedMonth}&year=${selectedYear}`)
        const entData = await entRes.json()
        if (entData.success) {
          const mapped = entData.data.map((e: any) => {
            const empInfo = employees.find(emp => String(emp.id) === String(e.employee_id))
            return {
              ...e,
              date: formatDate(e.date),
              employeeName: e.employee_name,
              cutoffPeriod: e.cutoff_period,
              actualIn: e.actual_in,
              // Recalculate with CORRECT department and leaves
              minutesLate: calculateMinutesLate(e.actual_in, empInfo?.department, e.employee_id, e.employee_name, e.date, leaves),
              warningLevel: e.warning_level,
              department: empInfo?.department,
              office: empInfo?.department
            }
          })
          // Sort entries by date ascending (oldest to newest), then by time
          const sorted = mapped.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime()
            const dateB = new Date(b.date).getTime()
            if (dateA !== dateB) return dateA - dateB
            return parseTimeToMinutes(a.actual_in || a.actualIn) - parseTimeToMinutes(b.actual_in || b.actualIn)
          })
          // Apply dynamic warning calculation
          const entriesWithWarnings = recalculateWarnings(sorted, leaves)
          setAllEntries(entriesWithWarnings)
        }



        resetAddEntryFields()
        setShowSaveConfirm(false) // Close modal on success
      } else {
        toast.error(data.message || 'Failed to save entry')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }


  // Summary button handler - opens summary sheet for specific cutoff
  const handleSummaryClick = (cutoffTitle: string, entries: LateEntry[]) => {
    setActiveCutoffSummary({ title: cutoffTitle, entries })
    setSummarySheetOpen(true)
  }


  // Close summary sheet
  const handleCloseSummary = () => {
    setSummarySheetOpen(false)
    setActiveCutoffSummary(null)
  }


  // ---------- RENDER ----------

  if (isLoading) {
    return <TardinessSkeleton />
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-12">
      <div className="relative w-full">


        {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
        <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6 sticky top-0 z-50">
          {/* Main Header Row */}
          <div className="w-full px-4 md:px-8 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Tardiness Monitoring</h1>
                <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  ABIC REALTY & CONSULTANCY
                </p>
              </div>


              {/* Year selector & Actions */}
              <div className="flex items-center gap-3">
                <Button onClick={handleAddNewYearConfirm} variant="outline" className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg">
                  <Plus className="w-4 h-4 mr-2" /> New Year
                </Button>
                <Button
                  onClick={() => setIsEntryFormOpen(!isEntryFormOpen)}
                  variant="outline"
                  className={cn(
                    "bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2",
                    isEntryFormOpen && "bg-rose-100 text-[#4A081A]"
                  )}
                >
                  {isEntryFormOpen ? (
                    <>
                      <X className="w-4 h-4" />
                      <span>CLOSE</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>NEW RECORD</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>


          {/* Secondary Toolbar */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto no-scrollbar">
            <div className="w-full px-4 md:px-8 py-3">
              <div className="flex items-center gap-3 md:gap-4 min-w-max md:min-w-0">


                {/* Year Selection */}
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
                          onClick={() => setSelectedYear(year)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                            selectedYear === year ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                          )}
                        >
                          {year}
                          {selectedYear === year && <Check className="w-4 h-4 text-red-600" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>


                {/* Month Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Month</span>


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[140px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
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


                {/* Period Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Period</span>


                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[180px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                        {showCutoff === 'first' ? '1st - 15th' : showCutoff === 'second' ? (selectedMonth === 'February' ? '16th - 28/29th' : '16th - 30/31st') : 'Show Both'}
                        <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </DropdownMenuTrigger>


                    <DropdownMenuContent className="w-56 bg-white border-stone-200 shadow-xl rounded-xl p-1.5" align="start">
                      <DropdownMenuItem
                        onClick={() => setShowCutoff('first')}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          showCutoff === 'first' ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        1st - 15th
                        {showCutoff === 'first' && <Check className="w-4 h-4 text-red-600" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowCutoff('second')}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          showCutoff === 'second' ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        {selectedMonth === 'February' ? '16th - 28/29th' : '16th - 30/31st'}
                        {showCutoff === 'second' && <Check className="w-4 h-4 text-red-600" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setShowCutoff('both')}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          showCutoff === 'both' ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                        )}
                      >
                        Show Both
                        {showCutoff === 'both' && <Check className="w-4 h-4 text-red-600" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>


                {/* Global Search Input */}
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
      </div>




      <div className="bg-white p-3 md:p-6 rounded-lg shadow-lg border-b-2 md:border-2 border-[#FFE5EC] space-y-6">


        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isEntryFormOpen ? "max-h-[500px] opacity-100 mb-6" : "max-h-0 opacity-0 pointer-events-none mb-0"
        )}>
          <div className="flex justify-center pt-2">
            <Card className="w-full bg-white border-[1.5px] border-[#800020] shadow-sm rounded-none">
              <CardContent className="p-6 pb-4">
                <div className="flex flex-col">
                  {/* Header Part */}
                  <div className="flex items-center gap-2 shrink-0 mb-4 mt-2">
                    <div className="w-6 h-6 bg-[#FBDADD]/40 rounded-md flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-[#4A081A] stroke-[2.5]" />
                    </div>
                    <h2 className="text-[13px] font-black text-[#4A081A] uppercase tracking-wider whitespace-nowrap">
                      New Late Entry
                    </h2>
                  </div>

                  {/* Form Fields & Actions - Horizontal Inline */}
                  <div className="flex flex-col lg:flex-row items-center w-full px-2 gap-4">
                    {/* Employee & Time Group */}
                    <div className="flex flex-col sm:flex-row items-center flex-1 gap-4 w-full">
                      <div className="flex-1 w-full">
                        <EmployeeSelector
                          value={newEntryEmployee}
                          onChange={setNewEntryEmployee}
                          employees={employees}
                        />
                      </div>
                      <div className="relative group w-full sm:w-36 shrink-0">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 group-focus-within:text-[#4A081A] transition-colors" />
                        <Input
                          id="time"
                          type="time"
                          value={newEntryTime}
                          onChange={(e) => setNewEntryTime(e.target.value)}
                          className="bg-white border text-center border-rose-100 text-slate-800 pl-8 pr-2 h-9 w-full rounded-md text-sm font-bold focus:ring-[#800020]/10 focus:border-[#630C22] shadow-none transition-all"
                        />
                      </div>

                      {/* Shift Display */}
                      {newEntryEmployee && employees.find(e => e.name === newEntryEmployee) && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#FFE5EC] rounded-md text-xs font-semibold text-[#4A081A] whitespace-nowrap">
                          <span className="text-[10px] opacity-70">SHIFT:</span>
                          <span>{getShiftSchedule(employees.find(e => e.name === newEntryEmployee)?.department).displayName}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Group */}
                    <div className="flex items-center gap-3 shrink-0 mt-4 lg:mt-0 lg:ml-auto">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEntryFormOpen(false)
                          resetAddEntryFields()
                        }}
                        className="border border-[#FBDADD] text-slate-700 hover:bg-rose-50 text-xs px-6 h-9 rounded-sm shadow-none font-medium"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleSaveClick}
                        disabled={isSaving || selectedYear !== new Date().getFullYear()}
                        className="bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#800020] hover:shadow-md active:scale-95 text-white font-medium text-sm px-6 h-9 rounded-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px] shadow-none"
                      >
                        {isSaving ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                          </div>
                        ) : (
                          "Save Record"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


        {/* ----- CUTOFF TABLES - WITH SUMMARY BUTTONS ----- */}
        <div className={`grid ${showCutoff === 'both' ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1'} w-full`}>
          <>
            {(showCutoff === 'first' || showCutoff === 'both') && (
              <CutoffTable
                title={`${selectedMonth} ${selectedYear} – 1-15`}
                entries={filteredFirstEntries}
                onUpdateTime={updateFirstCutoffTime}
                onSummaryClick={() => handleSummaryClick(
                  `${selectedMonth} ${selectedYear} – 1-15`,
                  firstCutoffEntries
                )}
                totalRecords={filteredFirstEntries.length}
              />
            )}


            {(showCutoff === 'second' || showCutoff === 'both') && (
              <CutoffTable
                title={`${selectedMonth} ${selectedYear} – ${selectedMonth === 'February' ? '16-28/29' : '16-30/31'}`}
                entries={filteredSecondEntries}
                onUpdateTime={updateSecondCutoffTime}
                onSummaryClick={() => handleSummaryClick(
                  `${selectedMonth} ${selectedYear} – ${selectedMonth === 'February' ? '16-28/29' : '16-30/31'}`,
                  secondCutoffEntries
                )}
                totalRecords={filteredSecondEntries.length}
              />
            )}
          </>

          <div className="col-span-full text-right mt-2 text-md text-[#A0153E] font-medium italic">
            * Table shows minutes from assigned shift start time • Summary counts arrivals after 5th minute grace period
          </div>
        </div>
      </div>


      {/* Summary Sheet - only appears when Summary button is clicked */}
      {
        activeCutoffSummary && (
          <SummarySheet
            isOpen={summarySheetOpen}
            onClose={handleCloseSummary}
            cutoffTitle={activeCutoffSummary.title}
            entries={activeCutoffSummary.entries}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            employees={employees}
            leaves={leaves}
          />

        )
      }






      <Dialog open={showNewYearConfirm} onOpenChange={setShowNewYearConfirm}>
        <DialogContent className="bg-white border-2 border-[#FFE5EC] rounded-2xl max-w-sm">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <Calendar className="w-8 h-8 text-[#4A081A]" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-[#4A081A]">Confirm New Year</DialogTitle>
              <DialogDescription className="text-stone-500 font-medium">
                Are you sure you want to initialize year {Math.max(...yearsList) + 1}? This will add it to the selection menu.
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowNewYearConfirm(false)}
              disabled={isAddingYear}
              className="flex-1 border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={addNewYear}
              disabled={isAddingYear}
              className="flex-1 bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-95"
            >
              {isAddingYear ? "Initializing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <DialogContent className="bg-white border-2 border-[#FFE5EC] rounded-2xl max-w-sm">
          <DialogHeader className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 bg-red-50 rounded-full">
              <Clock className="w-8 h-8 text-[#4A081A]" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold text-[#4A081A]">Confirm New Entry</DialogTitle>
              <DialogDescription className="text-stone-500 font-medium">
                Are you sure you want to add a late entry for <span className="text-[#4A081A] font-bold">{newEntryEmployee}</span> at <span className="text-[#4A081A] font-bold">{newEntryTime}</span>?
              </DialogDescription>
            </div>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowSaveConfirm(false)}
              disabled={isSaving}
              className="flex-1 border-2 border-stone-100 text-stone-600 hover:bg-stone-50 font-bold h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={executeSaveEntry}
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-[#4A081A] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white font-bold h-12 rounded-xl shadow-md transition-all active:scale-95"
            >
              {isSaving ? "Saving..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}






// ---------- CUTOFF TABLE COMPONENT - WITH SUMMARY BUTTON ----------
function CutoffTable({
  title,
  entries,
  onUpdateTime,
  onSummaryClick,
  totalRecords,
}: {
  title: string
  entries: LateEntry[]
  onUpdateTime: (id: string | number, newTime: string) => void
  onSummaryClick: () => void
  totalRecords: number
}) {
  return (
    <Card className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5">
          <CardTitle className="text-xl text-[#4A081A] font-bold">{title}</CardTitle>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              size="sm"
              onClick={onSummaryClick}
              className="bg-gradient-to-r from-[#4A081A] to-[#630C22] hover:from-[#630C22] hover:to-[#7B0F2B] text-white text-xl md:text-xl h-9 px-4 flex items-center gap-1 shrink-0 shadow-md transition-all duration-300"
            >


              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
              Summary
            </Button>
          </div>
        </div>
        <CardDescription className="text-[#A0153E]/70 flex items-center gap-2 text-xs font-medium mt-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C9184A]" />
          <span>Minutes from Assigned Shift</span>
          <span className="text-[#FFE5EC]">|</span>
          <span>{totalRecords} records</span>
        </CardDescription>
      </CardHeader>


      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
              <tr>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[30%]">Employee Name</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[20%]">Date</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[20%]">Actual In</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[20%]">Minutes Late</th>
                <th className="px-3 py-4 text-left font-bold text-[#800020] text-sm md:text-base uppercase tracking-wider w-[10%]">Warning</th>
              </tr>
            </thead>


            <tbody className="divide-y divide-stone-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200">
                  <td className="px-3 py-5">
                    <span className="font-bold text-slate-800 text-base md:text-lg">
                      {entry.employeeName}
                    </span>
                  </td>


                  <td className="px-3 py-5 text-slate-600 text-sm md:text-base font-semibold">
                    {entry.date || '—'}
                  </td>
                  <td className="px-3 py-5">
                    <Input
                      type="time"
                      value={to24h(entry.actual_in || entry.actualIn || '')}
                      onChange={(e) => onUpdateTime(entry.id, e.target.value)}
                      className="bg-white border-[#FFE5EC] text-slate-800 placeholder:text-slate-300 h-10 text-base md:text-lg w-32 font-bold focus:ring-2 focus:ring-[#A0153E] shadow-sm appearance-none"
                    />
                  </td>


                  <td className="px-2.5 py-5">
                    {entry.minutesLate > 0 ? (
                      <span className={`
                      inline-block px-4 py-1.5 rounded-full text-base md:text-lg font-bold border
                      ${entry.late_occurrence === 2 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          entry.late_occurrence && entry.late_occurrence >= 3 ? 'bg-red-100 text-red-700 border-red-200 shadow-sm' :
                            'bg-transparent text-slate-700 border-transparent'}
                    `}>
                        {entry.minutesLate} min
                      </span>
                    ) : (
                      <span className="text-stone-400 font-bold">—</span>
                    )}
                  </td>
                  <td className="px-2.5 py-5">
                    {entry.warningLevel && entry.warningLevel > 0 ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="text-base md:text-lg font-bold">
                          {entry.warningLevel}
                          {entry.warningLevel === 1 ? 'st' : entry.warningLevel === 2 ? 'nd' : entry.warningLevel === 3 ? 'rd' : 'th'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-stone-400 font-bold">—</span>
                    )}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>


      </CardContent>
    </Card>




  )
}