'use client'

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    ChevronLeft,
    Printer,
    Mail,
    Loader2,
    Download,
    CheckCircle2,
    ChevronDown,
    FileText,
    Plus,
    Trash2,
    User,
    Edit3,
    Check,
    Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getApiUrl } from '@/lib/api'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'

// --- Skeleton Component ---
const LetterSkeleton = () => (
    <div className="min-h-screen bg-neutral-100 pb-20">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-28 rounded-xl" />
                <Skeleton className="h-10 w-48 rounded-xl" />
            </div>
        </div>

        <div className="w-full max-w-none mx-auto py-10 px-6 flex flex-wrap justify-center gap-10">
            {[1, 2].map((i) => (
                <Card key={i} className="border-0 shadow-2xl rounded-none min-h-[1056px] w-[816px] bg-white p-16 space-y-8">
                    <div className="flex flex-col items-center gap-4">
                        <Skeleton className="h-16 w-16 rotate-45" />
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-32 ml-auto" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                    </div>
                    <div className="space-y-4 py-10">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                    <div className="pt-20 space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <div className="space-y-1">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    </div>
)

// --- Helper Functions ---
const formatDateLong = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })
}

// --- Dynamic Schedule Types & Helpers ---
interface ShiftInfo {
    startTimeMinutes: number
    gracePeriodMinutes: number
    displayName: string
    allShifts?: { startTimeMinutes: number; displayName: string; shiftOption: string }[]
}

interface OfficeShiftSchedule {
    id?: number
    office_name: string
    shift_options: string[]
}

const DEFAULT_SHIFT_SCHEDULES: Record<string, ShiftInfo> = {
    'ABIC': { startTimeMinutes: 8 * 60, gracePeriodMinutes: 8 * 60 + 5, displayName: '8:00 AM' },
    'INFINITECH': { startTimeMinutes: 9 * 60, gracePeriodMinutes: 9 * 60 + 5, displayName: '9:00 AM' },
    'G-LIMIT': { startTimeMinutes: 10 * 60, gracePeriodMinutes: 10 * 60 + 5, displayName: '10:00 AM' },
}

function formatTime(timeStr: string): string {
    if (!timeStr) return ''
    // Handle formats like "08:15:20", "08:15", "13:00"
    const parts = timeStr.split(':')
    if (parts.length >= 2) {
        let hours = parseInt(parts[0])
        const minutes = parts[1].padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`
    }
    return timeStr
}

function extractStartTime(shiftOption: string): string {
    const parts = shiftOption.split(/\s*[–-]\s*/)
    return parts[0].trim()
}

function parseTimeToMinutes(timeStr: string): number {
    if (!timeStr) return 0
    const normalized = timeStr.trim().toUpperCase()
    const match12 = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/)
    if (match12) {
        let hours = parseInt(match12[1])
        const minutes = parseInt(match12[2])
        const period = match12[3]
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        return hours * 60 + minutes
    }
    const match24 = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (match24) {
        const hours = parseInt(match24[1])
        const minutes = parseInt(match24[2])
        return hours * 60 + minutes
    }
    const dateStr = `2000-01-01 ${normalized}`
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
        return d.getHours() * 60 + d.getMinutes()
    }
    return 0
}

function FormLetterContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const employeeId = searchParams.get('employeeId')
    const type = searchParams.get('type') // 'late' or 'leave'
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const cutoff = searchParams.get('cutoff')

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const [employee, setEmployee] = useState<any>(null)
    const [entries, setEntries] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [selectedForms, setSelectedForms] = useState<string[]>(['form1', 'form2'])
    const [isActionOpen, setIsActionOpen] = useState(false)
    const [recipients, setRecipients] = useState<{ email: string; type: 'employee' | 'custom' }[]>([])
    const [dynamicSchedules, setDynamicSchedules] = useState<Record<string, ShiftInfo>>(DEFAULT_SHIFT_SCHEDULES)
    const [deptMap, setDeptMap] = useState<Record<string, string>>({})
    const [customTardinessTemplate, setCustomTardinessTemplate] = useState<any>(null)
    const [customLeaveTemplate, setCustomLeaveTemplate] = useState<any>(null)
    const [customSupervisorTemplate, setCustomSupervisorTemplate] = useState<any>(null)
    const [isProbee, setIsProbee] = useState(true)
    const [isEditMode, setIsEditMode] = useState(false)
    const [f1Body, setF1Body] = useState('')
    const [f2Body, setF2Body] = useState('')
    const [hasInitializedContent, setHasInitializedContent] = useState(false)

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/api/warning-letter-templates`)
                const json = await res.json()

                if (json.success && Array.isArray(json.data)) {
                    const mapped: any = {}
                    json.data.forEach((template: any) => {
                        mapped[template.slug] = {
                            title: template.title,
                            subject: template.subject,
                            headerLogoImage: template.header_logo_image,
                            headerDetails: template.header_details,
                            body: template.body,
                            footer: template.footer,
                            signatoryName: template.signatory_name
                        }
                    })
                    setCustomLeaveTemplate(mapped['leave'])
                    setCustomSupervisorTemplate(type === 'late' ? mapped['supervisor-tardiness'] : mapped['supervisor-leave'])
                    setCustomTardinessTemplate(mapped)
                } else {
                    // Fallback to localStorage
                    const saved = localStorage.getItem('warning_letter_templates')
                    if (saved) {
                        const allTemplates = JSON.parse(saved)
                        const mapped: any = {}
                        Object.entries(allTemplates).forEach(([slug, t]: [string, any]) => {
                            mapped[slug] = {
                                ...t,
                                headerLogoImage: t.headerLogoImage || t.header_logo_image,
                                headerDetails: t.headerDetails || t.header_details
                            }
                        })
                        setCustomLeaveTemplate(mapped['leave'])
                        setCustomSupervisorTemplate(mapped['supervisor'])
                        setCustomTardinessTemplate(mapped)
                    }
                }
            } catch (e) {
                console.error('Failed to fetch templates from API:', e)
                const saved = localStorage.getItem('warning_letter_templates')
                if (saved) {
                    const allTemplates = JSON.parse(saved)
                    setCustomLeaveTemplate(allTemplates['leave'])
                    setCustomSupervisorTemplate(allTemplates['supervisor'])
                    setCustomTardinessTemplate(allTemplates)
                }
            }
        }

        fetchTemplates()
    }, [])

    useEffect(() => {
        const loadSchedules = async () => {
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
                    const newSchedules: Record<string, ShiftInfo> = {}
                    schedData.data.forEach((schedule: OfficeShiftSchedule) => {
                        if (schedule.shift_options && schedule.shift_options.length > 0) {
                            const officeName = schedule.office_name.toUpperCase().trim()
                            const shifts = schedule.shift_options.map((opt: string) => ({
                                startTimeMinutes: parseTimeToMinutes(extractStartTime(opt)),
                                displayName: extractStartTime(opt),
                                shiftOption: opt
                            }))
                            newSchedules[officeName] = {
                                startTimeMinutes: shifts[0].startTimeMinutes,
                                gracePeriodMinutes: shifts[0].startTimeMinutes + 5,
                                displayName: shifts[0].displayName,
                                allShifts: shifts
                            }
                        }
                    })
                    if (Object.keys(newSchedules).length > 0) {
                        setDynamicSchedules(newSchedules)
                    }
                }

                if (deptData.success && officeData.success) {
                    const mapped: Record<string, string> = {}
                    deptData.data.forEach((dept: any) => {
                        const off = officeData.data.find((o: any) => o.id === dept.office_id)
                        if (off) {
                            mapped[dept.name.toUpperCase().trim()] = off.name.toUpperCase().trim()
                        }
                    })
                    setDeptMap(mapped)
                }
            } catch (error) {
                console.error('Failed to load shift schedules:', error)
            }
        }
        loadSchedules()
    }, [])

    useEffect(() => {
        if (employeeId) {
            fetchEmployeeData()
        }
    }, [employeeId])

    const fetchEmployeeData = async () => {
        setIsLoading(true)
        try {
            // 1. Fetch Employees and find specific one
            const empRes = await fetch('/api/admin-head/employees?status=employed,rehired')
            const empData = await empRes.json()

            if (empData.success) {
                const found = empData.data.find((e: any) => String(e.id) === String(employeeId))
                if (found) {
                    setEmployee(found)
                    // Initial setup: If form1 is selected, don't add employee by default
                    if (!selectedForms.includes('form1')) {
                        setRecipients([{ email: found.email || '', type: 'employee' }])
                    }

                    // 1.1 Fetch Evaluations to determine status (Probee vs Regular)
                    const evalRes = await fetch(`${getApiUrl()}/api/evaluations`)
                    const evalDataArr = await evalRes.json()
                    if (evalDataArr.success) {
                        const employeeEval = evalDataArr.data.find((ev: any) => String(ev.employee_id) === String(employeeId))
                        if (employeeEval) {
                            const status = String(employeeEval.status || '').toLowerCase()
                            setIsProbee(!(status === 'regular' || status === 'regularized'))
                        } else {
                            setIsProbee(true) // Default to Probee if no evaluation record
                        }
                    }
                }
            }

            // 2. Fetch Entries
            if (type === 'late') {
                const lateRes = await fetch(`${getApiUrl()}/api/admin-head/attendance/tardiness?month=${month}&year=${year}`)
                const lateData = await lateRes.json()
                if (lateData.success) {
                    // Filter by cutoff and employeeId
                    const filtered = lateData.data.filter((e: any) =>
                        String(e.employee_id) === String(employeeId) &&
                        (e.cutoff_period === cutoff || (!e.cutoff_period && (new Date(e.date).getDate() <= 15 ? 'cutoff1' : 'cutoff2') === cutoff))
                    )
                    // Sort by date ascending
                    filtered.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    setEntries(filtered)
                }
            } else {
                const leaveRes = await fetch(`${getApiUrl()}/api/leaves`)
                const leaveData = await leaveRes.json()
                if (leaveData.success) {
                    const filtered = leaveData.data.filter((e: any) => {
                        const isApproved = e.approved_by !== 'Pending' && e.approved_by !== 'Declined'
                        const isLong = (e.number_of_days || 0) >= 3
                        const date = new Date(e.start_date)
                        const matchesDate = (months[date.getMonth()] === month && date.getFullYear() === Number(year))
                        const eCutoff = new Date(e.start_date).getDate() <= 15 ? 'cutoff1' : 'cutoff2'

                        return String(e.employee_id) === String(employeeId) && isApproved && isLong && matchesDate && eCutoff === cutoff
                    })
                    // Sort by start_date ascending
                    filtered.sort((a: any, b: any) => new Date(a.start_date || a.date).getTime() - new Date(b.start_date || b.date).getTime())
                    setEntries(filtered)
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
            toast.error('Failed to load letter information')
        } finally {
            setIsLoading(false)
        }
    }


    const handleSendEmail = async () => {
        const emailList = recipients.map((r: any) => r.email.trim()).filter((e: string) => e !== '')
        if (emailList.length === 0) {
            toast.error('Please provide at least one recipient email address')
            return
        }

        // Validate @gmail.com requirement
        const nonGmail = emailList.filter((email: string) => !email.toLowerCase().endsWith('@gmail.com'))
        if (nonGmail.length > 0) {
            toast.error('Invalid Email: Only @gmail.com addresses are permitted for delivery.')
            return
        }

        setIsSending(true)
        // Simulate email sending
        await new Promise((resolve: any) => setTimeout(resolve, 2000))
        setIsSending(false)
        const recipientList = emailList.join(', ')
        toast.success(`Letter successfully sent to: ${recipientList}`)
    }

    const handleAddRecipient = () => {
        // Check if there are any empty email slots
        const hasEmpty = recipients.some((r: any) => r.email.trim() === '')
        if (hasEmpty) {
            toast.error('Please fill in the current recipient slot before adding another.')
            return
        }
        setRecipients([...recipients, { email: '', type: 'custom' }])
    }

    const handleRemoveRecipient = (index: number) => {
        setRecipients(recipients.filter((_: any, i: number) => i !== index))
    }

    const updateRecipient = (index: number, email: string) => {
        const next = [...recipients]
        next[index].email = email
        setRecipients(next)
    }

    // Confidentiality Logic: Remove employee if Form 1 is selected
    useEffect(() => {
        if (!employee) return

        const hasForm1 = selectedForms.includes('form1')
        const hasEmployeeRecipient = recipients.some((r: any) => r.type === 'employee')

        if (hasForm1 && hasEmployeeRecipient) {
            setRecipients(prev => prev.filter((r: any) => r.type !== 'employee'))
            toast.message('Confidentiality Notice', {
                description: 'Employee recipient removed. Form 1 (Supervisor Notification) is confidential.',
            })
        } else if (!hasForm1 && !hasEmployeeRecipient && selectedForms.includes('form2')) {
            // Restore employee if form1 is removed and form2 is still there
            setRecipients(prev => [{ email: employee.email || '', type: 'employee' }, ...prev])
        }
    }, [selectedForms, employee])

    // --- Content Initialization for Editing ---
    useEffect(() => {
        if (employee && entries.length > 0 && !hasInitializedContent && !isLoading) {
            // Helper to process template or fallback
            const generateInitialBodies = () => {
                const totalCount = type === 'leave'
                    ? entries.reduce((acc: number, curr: any) => acc + (Number(curr.number_of_days) || 0), 0)
                    : entries.length;

                const salutationPrefix = employee.gender?.toLowerCase() === 'male' ? 'Mr.' : 'Ms.'
                const lastName = employee.last_name || employee.name.split(' ').pop()
                const cutoffText = cutoff === 'cutoff1' ? 'first cutoff' : 'second cutoff'

                // Resolve Shift Info
                const department = employee?.department || employee?.office_name
                let currentShift = dynamicSchedules['ABIC'] || DEFAULT_SHIFT_SCHEDULES['ABIC']
                if (department) {
                    const normalized = department.toUpperCase().trim()
                    if (dynamicSchedules[normalized]) currentShift = dynamicSchedules[normalized]
                    else {
                        const mappedOffice = deptMap[normalized]
                        if (mappedOffice && dynamicSchedules[mappedOffice]) currentShift = dynamicSchedules[mappedOffice]
                    }
                }
                const shiftTime = currentShift.displayName
                const gracePeriodMinutes = currentShift.gracePeriodMinutes
                const gracePeriodHours = Math.floor(gracePeriodMinutes / 60)
                const gracePeriodMins = gracePeriodMinutes % 60
                const gracePeriod = `${gracePeriodHours % 12 || 12}:${String(gracePeriodMins).padStart(2, '0')} ${gracePeriodHours >= 12 ? 'PM' : 'AM'}`

                // 3. Process and Clean Entry List (with Expansion for multi-day Leave)
                const processedEntries = type === 'leave' ? (() => {
                    const expanded: any[] = [];
                    entries.forEach((entry: any) => {
                        const isPersonalLeave = entry.remarks?.toUpperCase() === 'PERSONAL LEAVE';
                        const reasonDetail = isPersonalLeave
                            ? `Personal Leave (${entry.cite_reason || 'no stated reason'})`
                            : (entry.remarks || entry.cite_reason || 'No stated reason');

                        if (entry.start_date && entry.number_of_days) {
                            const count = Number(entry.number_of_days);
                            const startDate = new Date(entry.start_date);
                            for (let i = 0; i < count; i++) {
                                const currentDate = new Date(startDate);
                                currentDate.setDate(startDate.getDate() + i);
                                expanded.push({
                                    ...entry,
                                    date: currentDate.toISOString().split('T')[0],
                                    displayRemarks: reasonDetail
                                });
                            }
                        } else {
                            expanded.push({
                                ...entry,
                                displayRemarks: reasonDetail
                            });
                        }
                    });
                    return expanded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                })() : entries;

                const entryListStr = processedEntries.map((e: any) => {
                    const detail = type === 'late'
                        ? formatTime(e.actual_in)
                        : (e.displayRemarks || e.remarks || e.cite_reason || 'No stated reason');
                    return `• ${formatDateLong(e.date || e.start_date)} — ${detail}`;
                }).join('\n')

                // Form 1 body (Supervisor)
                let initialF1 = ""
                if (customSupervisorTemplate) {
                    initialF1 = customSupervisorTemplate.body
                        .replace(/{{employee_name}}/g, employee.name)
                        .replace(/{{last_name}}/g, lastName)
                        .replace(/{{salutation}}/g, salutationPrefix)
                        .replace(/{{instances_text}}/g, numberToText(totalCount))
                        .replace(/{{instances_count}}/g, String(totalCount))
                        .replace(/{{pronoun_he_she}}/g, employee.gender?.toLowerCase() === 'female' ? 'She' : 'He')
                        .replace(/{{pronoun_his_her}}/g, employee.gender?.toLowerCase() === 'female' ? 'her' : 'his')
                        .replace(/{{grace_period}}/g, gracePeriod)
                        .replace(/{{instances_count_ordinal}}/g, totalCount === 1 ? '1st' : totalCount === 2 ? '2nd' : totalCount === 3 ? '3rd' : `${totalCount}th`)
                        .replace(/{{entries_list}}/g, entryListStr)
                        .replace(/Employee Acknowledgment:[\s\S]*$/, ""); // Remove if present in stored template

                    // Reminders are always included for Supervisor Form
                } else {
                    const issueType = type === 'late' ? 'tardiness' : 'leave/absences'
                    let reminders = `\n\nPlease be reminded of the following:\n1. ${salutationPrefix} ${lastName} is expected to correct ${employee.gender?.toLowerCase() === 'female' ? 'her' : 'his'} attendance behavior immediately.\n2. Future occurrences of tardiness may result in stricter disciplinary action.\n\n`

                    initialF1 = `Dear Ma'am Angely,\n\nThis letter serves as a Formal Warning regarding the ${issueType} of ${salutationPrefix} ${employee.name}. ${employee.gender?.toLowerCase() === 'male' ? 'He' : 'She'} has accumulated ${numberToText(totalCount)} (${totalCount}) ${totalCount === 1 ? (type === 'late' ? 'occurrence' : 'day') : (type === 'late' ? 'occurrences' : 'days')} of ${issueType} within the current cut-off period.\n\n` +
                        `In accordance with company policy, reaching this threshold within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee.\n\n` +
                        `Specific dates recorded:\n${entryListStr}${reminders}` +
                        `Kindly ensure that the employee is informed and that corrective action is enforced appropriately.\n\n` +
                        `Thank you.`
                }
                setF1Body(initialF1)

                // Form 2 body
                let initialF2 = ""
                const targetTemplate = type === 'late'
                    ? (customTardinessTemplate?.[isProbee ? 'tardiness-probee' : 'tardiness-regular'])
                    : customLeaveTemplate

                if (targetTemplate) {
                    initialF2 = targetTemplate.body
                        .replace(/{{salutation}}/g, salutationPrefix)
                        .replace(/{{last_name}}/g, lastName)
                        .replace(/{{shift_time}}/g, shiftTime)
                        .replace(/{{grace_period}}/g, gracePeriod)
                        .replace(/{{instances_text}}/g, numberToText(totalCount))
                        .replace(/{{instances_count}}/g, String(totalCount))
                        .replace(/{{cutoff_text}}/g, cutoffText)
                        .replace(/{{month}}/g, month)
                        .replace(/{{year}}/g, year)
                        .replace(/{{entries_list}}/g, entryListStr)
                        .replace(/Employee Acknowledgment:[\s\S]*$/, ""); // Remove if present in stored template

                    // If Probee and is Leave template, remove the reminders section
                    if (isProbee && type === 'leave') {
                        initialF2 = initialF2.replace(/(Moving forward, you are expected to:|Please be reminded of the following:)[\s\S]*?(?=Thank you|Failure to comply|Please acknowledge)/gi, "")
                    }
                } else {
                    if (type === 'late') {
                        initialF2 = `Dear ${salutationPrefix} ${lastName},\n\n` +
                            `This letter serves as a Formal Warning regarding your tardiness. Your scheduled time-in is ${shiftTime}, with a five (5)-minute grace period until ${gracePeriod}.\n\n` +
                            `You have incurred ${numberToText(totalCount)} (${totalCount}) instances of tardiness within the current cut-off period, which constitutes a violation of the Company's Attendance and Punctuality Policy.\n\n` +
                            `Recorded instances:\n${entryListStr}\n\n` +
                            `Consistent tardiness disrupts workflow. You are expected to immediately correct your attendance behavior. Future occurrences may result in stricter disciplinary action.\n\n` +
                            `Thank you.`
                    } else {
                        initialF2 = `Dear ${salutationPrefix} ${lastName},\n\n` +
                            `This letter serves as a Formal Warning regarding your attendance record for the current cutoff period.\n\n` +
                            `It has been noted that you incurred ${numberToText(totalCount)} (${totalCount}) days of leave within the ${cutoffText} of ${month} ${year}, specifically on the following dates:\n\n` +
                            `${entryListStr}\n\n` +
                            `These absences negatively affect work operations. Repeated absences may lead to further disciplinary action.\n\n` +
                            `Moving forward, you are expected to improve your attendance immediately and avoid unapproved absences.\n\n` +
                            `Thank you.`
                    }
                }
                setF2Body(initialF2)
            }

            generateInitialBodies()
            setHasInitializedContent(true)
        }
    }, [employee, entries, hasInitializedContent, isLoading, isProbee, customSupervisorTemplate, customTardinessTemplate, customLeaveTemplate])

    const handlePrint = () => {
        window.print()
    }

    if (isLoading) {
        return <LetterSkeleton />
    }

    if (!employee) {
        return <div className="p-20 text-center">Employee not found.</div>
    }

    // Determine warning title
    let letterTitle = "FORMAL WARNING LETTER"
    if (type === 'late') {
        const maxWarning = Math.max(...entries.map((e: any) => e.warning_level || 0), 0)
        if (maxWarning === 1) letterTitle = "FIRST WARNING LETTER"
        else if (maxWarning === 2) letterTitle = "SECOND WARNING LETTER"
        else if (maxWarning >= 3) letterTitle = "FINAL WARNING LETTER"
        else letterTitle = "ATTENDANCE WARNING LETTER"
    } else {
        letterTitle = "LEAVE WARNING LETTER"
    }

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const cutoffText = cutoff === 'cutoff1' ? 'first cutoff' : 'second cutoff'
    const salutationPrefix = employee.gender?.toLowerCase() === 'male' ? 'Mr.' : 'Ms.'
    const lastName = employee.last_name || employee.name.split(' ').pop()

    // Determine Dynamic Shift
    const getEmployeeShift = (emp: any) => {
        const department = emp?.department || emp?.office_name
        if (!department) return dynamicSchedules['ABIC'] || DEFAULT_SHIFT_SCHEDULES['ABIC']

        const normalized = department.toUpperCase().trim()
        if (dynamicSchedules[normalized]) return dynamicSchedules[normalized]

        const mappedOffice = deptMap[normalized]
        if (mappedOffice && dynamicSchedules[mappedOffice]) return dynamicSchedules[mappedOffice]

        const partial = Object.keys(dynamicSchedules).find((off: string) =>
            normalized.includes(off) || off.includes(normalized)
        )
        if (partial) return dynamicSchedules[partial]

        return dynamicSchedules['ABIC'] || DEFAULT_SHIFT_SCHEDULES['ABIC']
    }

    const currentShift = getEmployeeShift(employee)
    const shiftTime = currentShift.displayName
    const gracePeriodMinutes = currentShift.gracePeriodMinutes
    const gracePeriodHours = Math.floor(gracePeriodMinutes / 60)
    const gracePeriodMins = gracePeriodMinutes % 60
    const gracePeriod = `${gracePeriodHours % 12 || 12}:${String(gracePeriodMins).padStart(2, '0')} ${gracePeriodHours >= 12 ? 'PM' : 'AM'}`

    const numberToText = (n: number) => {
        const texts = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]
        return texts[n] || n.toString()
    }

    const toggleForm = (formId: string) => {
        setSelectedForms(prev =>
            prev.includes(formId)
                ? prev.filter((id: string) => id !== formId)
                : [...prev, formId]
        )
    }

    const selectAll = (checked: boolean) => {
        setSelectedForms(checked ? ['form1', 'form2'] : [])
    }

    return (
        <div className="min-h-screen bg-neutral-100 pb-20 print:bg-white print:pb-0">
            {/* Action Bar */}
            <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6 sticky top-0 z-50 print:hidden">
                {/* Main Header Row */}
                <div className="w-full px-4 md:px-8 py-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">Preview Warning Letter</h1>
                                <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    ABIC REALTY & CONSULTANCY
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span>BACK</span>
                        </Button>
                    </div>
                </div>

                {/* Secondary Toolbar */}
                <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto no-scrollbar">
                    <div className="w-full px-4 md:px-8 py-3">
                        <div className="flex items-center justify-end gap-3 md:gap-4 min-w-max md:min-w-0">
                            <Button
                                onClick={() => setIsEditMode(!isEditMode)}
                                variant="outline"
                                className={cn(
                                    "h-10 px-4 rounded-lg font-bold gap-2 active:scale-95 transition-all text-sm uppercase tracking-wider",
                                    isEditMode
                                        ? "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200"
                                        : "bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A]"
                                )}
                            >
                                {isEditMode ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                {isEditMode ? "Finish Editing" : "Customize Content"}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handlePrint}
                                className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Print PDF</span>
                            </Button>

                            <Popover open={isActionOpen} onOpenChange={setIsActionOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        className="h-10 px-6 rounded-lg font-black gap-2 bg-white border border-white text-[#A4163A] hover:bg-rose-100 shadow-md active:scale-95 transition-all w-auto uppercase tracking-widest"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Send via Email
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-0 rounded-2xl border-stone-200 shadow-2xl overflow-hidden" align="end">
                                    <div className="p-4 space-y-4 text-slate-900">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id="select-all"
                                                    checked={selectedForms.length === 2}
                                                    onCheckedChange={selectAll}
                                                />
                                                <Label htmlFor="select-all" className="font-bold cursor-pointer">Select all</Label>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium">{selectedForms.length} selected</span>
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div className="space-y-3">
                                            <div className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedForms.includes('form1') ? 'bg-rose-50 border border-rose-100' : 'hover:bg-slate-50'}`}>
                                                <Checkbox
                                                    id="form1"
                                                    checked={selectedForms.includes('form1')}
                                                    onCheckedChange={() => toggleForm('form1')}
                                                />
                                                <div className="flex-1 cursor-pointer" onClick={() => toggleForm('form1')}>
                                                    <p className="font-bold text-sm leading-none">Form 1</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">Supervisor Notification</p>
                                                </div>
                                            </div>

                                            <div className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${selectedForms.includes('form2') ? 'bg-rose-50 border border-rose-100' : 'hover:bg-slate-50'}`}>
                                                <Checkbox
                                                    id="form2"
                                                    checked={selectedForms.includes('form2')}
                                                    onCheckedChange={() => toggleForm('form2')}
                                                />
                                                <div className="flex-1 cursor-pointer" onClick={() => toggleForm('form2')}>
                                                    <p className="font-bold text-sm leading-none">Form 2</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">Employee Warning</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-slate-100" />

                                        <div className="space-y-3 px-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recipients:</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-[10px] font-bold text-[#A4163A] hover:bg-rose-50 rounded-lg gap-1 border border-rose-100"
                                                    onClick={handleAddRecipient}
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    Add New
                                                </Button>
                                            </div>

                                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 customize-scrollbar font-sans">
                                                {selectedForms.includes('form1') && (
                                                    <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                                                        <div className="w-4 h-4 mt-0.5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700">!</div>
                                                        <p className="text-[10px] leading-tight text-amber-700 font-medium">
                                                            Employee recipient disabled. Form 1 contains confidential supervisor information.
                                                        </p>
                                                    </div>
                                                )}
                                                {recipients.map((r, idx) => (
                                                    <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 group">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${r.type === 'employee' ? 'bg-rose-100' : 'bg-slate-200'}`}>
                                                                    {r.type === 'employee' ? <User className="w-3 h-3 text-[#A4163A]" /> : <Mail className="w-3 h-3 text-slate-500" />}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                                    {r.type === 'employee' ? `Employee (${employee.name.split(' ').pop()})` : 'Custom Email'}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 w-5 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => handleRemoveRecipient(idx)}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                        <Input
                                                            type="email"
                                                            placeholder="Enter email address"
                                                            value={r.email}
                                                            onChange={(e) => updateRecipient(idx, e.target.value)}
                                                            className="h-9 text-xs rounded-lg border-slate-200 focus-visible:ring-[#A4163A] bg-white shadow-sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => {
                                            handleSendEmail()
                                            setIsActionOpen(false)
                                        }}
                                        disabled={isSending || selectedForms.length === 0}
                                        className="w-full rounded-none h-12 font-bold bg-[#A4163A] hover:bg-[#7B0F2B] text-white gap-2 uppercase tracking-widest"
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SEND EMAIL NOW'}
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>

            {/* Letter Paper Container */}
            <div className="w-full max-w-none mx-auto py-10 px-6 print:px-0 print:py-0 flex flex-wrap justify-center gap-10 print:flex-col print:items-center">
                {selectedForms.includes('form1') && (
                    <FormOneTemplate
                        employee={employee}
                        entries={entries}
                        today={today}
                        shiftTime={shiftTime}
                        gracePeriod={gracePeriod}
                        salutationPrefix={salutationPrefix}
                        lastName={lastName}
                        numberToText={numberToText}
                        type={type}
                        formatDateLong={formatDateLong}
                        customTemplate={customSupervisorTemplate}
                        isEditMode={isEditMode}
                        body={f1Body}
                        setBody={setF1Body}
                    />
                )}

                {selectedForms.includes('form2') && (
                    <FormTwoTemplate
                        employee={employee}
                        entries={entries}
                        today={today}
                        shiftTime={shiftTime}
                        gracePeriod={gracePeriod}
                        salutationPrefix={salutationPrefix}
                        lastName={lastName}
                        numberToText={numberToText}
                        type={type}
                        letterTitle={letterTitle}
                        cutoffText={cutoffText}
                        month={month}
                        year={year}
                        formatDateLong={formatDateLong}
                        customTemplate={type === 'late'
                            ? (customTardinessTemplate?.[isProbee ? 'tardiness-probee' : 'tardiness-regular'])
                            : customLeaveTemplate
                        }
                        isProbee={isProbee}
                        isEditMode={isEditMode}
                        body={f2Body}
                        setBody={setF2Body}
                    />
                )}

                {selectedForms.length === 0 && (
                    <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <FileText className="w-12 h-12 opacity-20" />
                        <p className="font-medium">Please select a form to preview</p>
                    </div>
                )}
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: letter; /* 8.5" x 11" */
                    }
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    )
}

// --- Template Components ---

function FormOneTemplate({
    employee, entries, today, shiftTime, gracePeriod, salutationPrefix, lastName, numberToText, type, formatDateLong, customTemplate, isEditMode, body, setBody
}: any) {
    const totalCount = type === 'leave'
        ? entries.reduce((acc: number, curr: any) => acc + (Number(curr.number_of_days) || 0), 0)
        : entries.length;

    const unit = type === 'late' ? 'occurrence' : 'day';
    const unitPlural = type === 'late' ? 'occurrences' : 'days';
    const issueType = type === 'late' ? 'tardiness' : 'leave/absences';
    const policyName = type === 'late' ? 'Attendance and Punctuality Policy' : 'Leave and Attendance Policy';
    return (
        <Card className="border-0 shadow-2xl rounded-none print:shadow-none min-h-[1056px] w-[816px] flex flex-col bg-white" id="form-letter-1">
            <CardContent className="px-16 py-12 flex-1 flex flex-col font-serif leading-relaxed text-[#333]">
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-2 w-full" style={{ marginTop: '0.5cm' }}>
                    {customTemplate?.headerLogoImage ? (
                        <div className="flex flex-col items-center gap-2">
                            <img src={customTemplate.headerLogoImage} alt="Custom Logo" className="max-w-[150px] max-h-[100px] object-contain" />
                        </div>
                    ) : (
                        <img src="/images/abic-header.png" alt="Company Header" className="max-w-[650px] w-full object-contain" />
                    )}

                    {customTemplate?.headerDetails && (
                        <div className="text-center mt-1 text-[10px] leading-tight text-slate-600 max-w-[500px] whitespace-pre-wrap">
                            {customTemplate.headerDetails}
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-xl font-black text-black tracking-wide uppercase">
                        {customTemplate?.title || (type === 'late' ? 'TARDINESS WARNING LETTER' : 'LEAVE WARNING LETTER')}
                    </h1>
                </div>

                {/* Metadata */}
                <div className="space-y-0.5 mb-6 text-black text-sm">
                    <div className="flex justify-end">
                        <p className="font-bold">Date: <span className="font-bold">{today}</span></p>
                    </div>
                    {/* Form 1 Top Metadata matches edit_forms preview */}
                    <p className="font-bold">Position: <span className="font-bold">{employee.position || 'Employee'}</span></p>
                    {(employee.department || employee.office_name) && (
                        <p className="font-bold">Department: <span className="font-bold">{employee.department || employee.office_name}</span></p>
                    )}

                    {customTemplate?.subject && (
                        <p className="mt-4 font-bold uppercase tracking-tight">RE: {customTemplate.subject}</p>
                    )}
                </div>

                {/* Salutation (only show if NO custom template, as custom includes it) */}
                {!customTemplate && <p className="mb-6">Dear Ma&apos;am Angely,</p>}

                {/* Body Content */}
                <div className="text-black text-sm leading-relaxed text-justify relative group/body">
                    {isEditMode ? (
                        <div className="relative">
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="min-h-[400px] w-full border-2 border-amber-200 focus-visible:ring-amber-500 rounded-xl p-6 font-serif text-[15px] leading-relaxed resize-none bg-amber-50/10 shadow-inner"
                                placeholder="Write the letter body here..."
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                <Edit3 className="w-3 h-3" />
                                Editing Mode
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 space-y-0">
                            {body.split('\n').map((line: string, idx: number) => {
                                const trimmed = line.trim();
                                if (!trimmed) return <div key={idx} className="h-4" />;
                                if (trimmed.startsWith('•')) {
                                    return (
                                        <div key={idx} className="flex gap-4 pl-12 mb-2">
                                            <span className="shrink-0">•</span>
                                            <span>{trimmed.substring(1).trim()}</span>
                                        </div>
                                    );
                                }
                                const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
                                if (numMatch) {
                                    return (
                                        <div key={idx} className="flex gap-4 pl-12 mb-2">
                                            <span className="shrink-0 font-bold">{numMatch[1]}.</span>
                                            <span>{numMatch[2]}</span>
                                        </div>
                                    );
                                }
                                const isSalutation = trimmed.toLowerCase().startsWith('dear') || trimmed.endsWith(',');
                                const isClosing = trimmed.toLowerCase() === 'thank you.' || trimmed.toLowerCase() === 'respectfully,' || trimmed.toLowerCase() === 'respectfully yours,';

                                if (isSalutation || isClosing) {
                                    return <div key={idx} className="mb-4">{line}</div>;
                                }

                                return (
                                    <div key={idx} className="text-justify mb-4" style={{ textIndent: '3.5rem' }}>
                                        {line}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Closing */}
                <div className="mt-12">
                    <p>Respectfully,</p>
                    <div className="mt-10">
                        <p className="font-black text-lg underline uppercase">{customTemplate?.signatoryName || 'AIZLE MARIE M. ATIENZA'}</p>
                        <p className="font-medium text-slate-700">{customTemplate?.footer || 'Admin Assistant'}</p>
                    </div>
                </div>

                {/* Acknowledgment Section */}
                <div className="mt-8 border-t border-slate-100 pt-8 space-y-4">
                    <p className="font-bold mb-4">Employee Acknowledgment:</p>
                    <p className="mb-8">
                        I, <span className="font-bold">{employee.name}</span>, hereby acknowledge receipt of this Formal Warning Letter.
                    </p>
                    <div className="space-y-6 pt-6">
                        <div className="flex items-end gap-2 max-w-[400px]">
                            <span className="font-bold whitespace-nowrap">Employee Signature:</span>
                            <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
                        </div>
                        <div className="flex items-end gap-2 max-w-[250px]">
                            <span className="font-bold whitespace-nowrap">Date:</span>
                            <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function FormTwoTemplate({
    employee, entries, today, shiftTime, gracePeriod, salutationPrefix, lastName, numberToText, type, letterTitle, cutoffText, month, year, formatDateLong, customTemplate, isProbee, isEditMode, body, setBody
}: any) {
    const totalDays = type === 'leave'
        ? entries.reduce((acc: number, curr: any) => acc + (Number(curr.number_of_days) || 0), 0)
        : entries.length;

    return (
        <Card className="border-0 shadow-2xl rounded-none print:shadow-none min-h-[1056px] w-[816px] flex flex-col bg-white" id="form-letter-2">
            <CardContent className="px-16 py-12 flex-1 flex flex-col font-serif leading-relaxed text-[#333]">
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-2 w-full" style={{ marginTop: '0.5cm' }}>
                    {customTemplate?.headerLogoImage ? (
                        <div className="flex flex-col items-center gap-2">
                            <img src={customTemplate.headerLogoImage} alt="Custom Logo" className="max-w-[150px] max-h-[100px] object-contain" />
                        </div>
                    ) : (
                        <img src="/images/abic-header.png" alt="Company Header" className="max-w-[650px] w-full object-contain" />
                    )}

                    {customTemplate?.headerDetails && (
                        <div className="text-center mt-1 text-[10px] leading-tight text-slate-600 max-w-[500px] whitespace-pre-wrap">
                            {customTemplate.headerDetails}
                        </div>
                    )}
                </div>

                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-xl font-black text-black tracking-wide">
                        {customTemplate?.title || (
                            type === 'late'
                                ? `TARDINESS WARNING LETTER - ${isProbee ? 'PROBEE' : 'REGULAR'}`
                                : letterTitle
                        )}
                    </h1>
                </div>

                {/* Metadata Block */}
                <div className="flex flex-col mb-6 text-black text-sm">
                    <div className="flex justify-end">
                        <p className="font-bold">Date: <span className="font-bold">{today}</span></p>
                    </div>
                    <div className="space-y-0.5">
                        <p className="font-bold">Employee Name: <span className="font-bold">{employee.name}</span></p>
                        <p className="font-bold">Position: <span className="font-bold">{employee.position || 'Employee'}</span></p>
                        {(employee.department || employee.office_name) && (
                            <p className="font-bold">Department: <span className="font-bold">{employee.department || employee.office_name}</span></p>
                        )}

                        {customTemplate?.subject && (
                            <p className="mt-4 font-bold uppercase tracking-tight">RE: {customTemplate.subject}</p>
                        )}
                    </div>
                </div>

                {/* Salutation (Only show if NO custom template, as custom body includes it) */}
                {!customTemplate && (
                    <div className="mb-6">
                        <p>Dear <span className="font-bold">{salutationPrefix} {lastName}</span>,</p>
                        {type === 'late' && !isProbee && <p className="mt-2 text-justify">Good day.</p>}
                    </div>
                )}

                {/* Body Content */}
                <div className="text-black text-sm leading-relaxed text-justify relative group/body">
                    {isEditMode ? (
                        <div className="relative">
                            <Textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                className="min-h-[500px] w-full border-2 border-amber-200 focus-visible:ring-amber-500 rounded-xl p-8 font-serif text-[15px] leading-relaxed resize-none bg-amber-50/10 shadow-inner"
                                placeholder="Write the letter body here..."
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                <Edit3 className="w-3 h-3" />
                                Editing Mode
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 space-y-0">
                            {body.split('\n').map((line: string, idx: number) => {
                                const trimmed = line.trim();
                                if (!trimmed) return <div key={idx} className="h-4" />;
                                if (trimmed.startsWith('•')) {
                                    return (
                                        <div key={idx} className="flex gap-4 pl-12 mb-2">
                                            <span className="shrink-0">•</span>
                                            <span>{trimmed.substring(1).trim()}</span>
                                        </div>
                                    );
                                }
                                const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
                                if (numMatch) {
                                    return (
                                        <div key={idx} className="flex gap-4 pl-12 mb-2">
                                            <span className="shrink-0 font-bold">{numMatch[1]}.</span>
                                            <span>{numMatch[2]}</span>
                                        </div>
                                    );
                                }
                                const isSalutation = trimmed.toLowerCase().startsWith('dear') || trimmed.endsWith(',');
                                const isClosing = trimmed.toLowerCase() === 'thank you.' || trimmed.toLowerCase() === 'respectfully,' || trimmed.toLowerCase() === 'respectfully yours,';

                                if (isSalutation || isClosing) {
                                    return <div key={idx} className="mb-4">{line}</div>;
                                }

                                return (
                                    <div key={idx} className="text-justify mb-4" style={{ textIndent: '3.5rem' }}>
                                        {line}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Closing */}
                <div className="mt-12">
                    <p>Respectfully,</p>
                    <div className="mt-10">
                        <p className="font-black text-lg underline uppercase">{customTemplate?.signatoryName || 'AIZLE MARIE M. ATIENZA'}</p>
                        <p className="font-medium text-slate-700">
                            {customTemplate?.footer || (type === 'late'
                                ? (isProbee ? 'Admin Assistant' : 'Admin Supervisor/HR')
                                : 'Admin Assistant')
                            }
                        </p>
                    </div>
                </div>

                {/* Separator */}
                <div className="my-10 border-t-2 border-slate-200 border-dashed print:hidden"></div>

                {/* Acknowledgment */}
                <div className="mt-8 space-y-4">
                    <p className="font-bold mb-4">Employee Acknowledgment:</p>
                    <p className="mb-8">
                        I, <span className="font-bold">{employee.name}</span>, hereby acknowledge receipt of this Formal Warning Letter.
                    </p>
                    <div className="space-y-6 pt-6">
                        <div className="flex items-end gap-2 max-w-[400px]">
                            <span className="font-bold whitespace-nowrap">Employee Signature:</span>
                            <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
                        </div>
                        <div className="flex items-end gap-2 max-w-[250px]">
                            <span className="font-bold whitespace-nowrap">Date:</span>
                            <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function FormLetterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <FormLetterContent />
        </Suspense>
    )
}
