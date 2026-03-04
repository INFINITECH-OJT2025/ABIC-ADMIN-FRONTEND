'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import {
    ArrowLeft,
    Save,
    Eraser,
    Eye,
    Layout,
    Type,
    FileText,
    User,
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'

// --- Default Templates ---
const DEFAULT_TARDINESS_REGULAR_TEMPLATE = {
    title: 'TARDINESS WARNING LETTER',
    subject: 'Written Warning - Frequent Tardiness',
    headerLogo: 'ABIC Realty',
    body: `Dear {{salutation}} {{last_name}},

Good day.

This letter serves as a Formal Warning regarding your tardiness. Please be reminded that your scheduled time-in is {{shift_time}}, with a five (5)-minute grace period until {{grace_period}}, in accordance with company policy.

Despite this allowance, you have incurred {{instances_text}} ({{instances_count}}) instances of tardiness beyond the allowable grace period within the current cut-off period, which constitutes a violation of the Company's Attendance and Punctuality Policy.

Below is the recorded instances for this cut-off period:
{{entries_list}}

Consistent tardiness negatively affects team productivity, disrupts workflow, and fails to meet the company's standards for punctuality and professionalism.

Please be reminded of the following:
1. You are expected to immediately correct your attendance behavior and strictly adhere to your scheduled working hours.
2. Any future occurrences of tardiness may result in stricter disciplinary action, up to and including suspension or termination, in accordance with company policy.

This notice shall be documented accordingly. Your cooperation and compliance are expected.

Thank you.`,
    footer: 'Admin Supervisor/HR',
    signatoryName: 'AIZLE MARIE M. ATIENZA'
}

const DEFAULT_TARDINESS_PROBEE_TEMPLATE = {
    title: 'TARDINESS WARNING LETTER',
    subject: 'Tardiness Notice',
    headerLogo: 'ABIC Realty',
    body: `Dear {{salutation}} {{last_name}},

This letter serves as a formal warning regarding your repeated tardiness. It has been recorded that you have reported late to work {{instances_text}} ({{instances_count}}) times, exceeding the company's grace period of five (5) minutes.

Please be reminded that further instances of tardiness may result in stricter disciplinary action, up to and including suspension, in accordance with company policies.

We trust that you will take this matter seriously and make the necessary adjustments to improve your attendance and punctuality moving forward.

Additionally, please note the specific dates of tardiness recorded for this cut-off:
{{entries_list}}

Consistent tardiness affects team productivity, disrupts workflow, and your evaluation needed for your regularization, which requires all employees to report to work on time and adhere to their scheduled working hours.

Thank you.`,
    footer: 'Admin Assistant',
    signatoryName: 'AIZLE MARIE M. ATIENZA'
}

const DEFAULT_LEAVE_TEMPLATE = {
    title: 'FIRST WARNING LETTER',
    subject: 'Record of Extended Leave of Absence',
    headerLogo: 'ABIC Realty',
    body: `Dear {{salutation}} {{last_name}},

This letter serves as a Formal Warning regarding your attendance record for the current cutoff period.

It has been noted that you incurred {{instances_text}} ({{instances_count}}) absences within the {{cutoff_text}} of {{month}} {{year}}, specifically on the following dates:
{{entries_list}}

These absences negatively affect work operations and your evaluation needed for your regularization. As stated in the company’s Attendance and Punctuality Policy, employees are expected to maintain regular attendance and provide valid justification or prior notice for any absence.

Please be reminded that repeated absences, especially within a short period, may lead to further disciplinary action in accordance with company rules and regulations.

Moving forward, you are expected to:
1. Improve your attendance immediately,
2. Avoid unnecessary or unapproved absences, and
3. Provide proper documentation or notice for any unavoidable absence.

Failure to comply may result in stricter sanctions, up to and including suspension or termination.

Please acknowledge receipt of this warning by signing below.`,
    footer: 'Admin Assistant',
    signatoryName: 'AIZLE MARIE M. ATIENZA'
}

const DEFAULT_SUPERVISOR_TEMPLATE = {
    title: 'WARNING LETTER',
    subject: 'Employee Attendance Advisory',
    headerLogo: 'ABIC Realty',
    body: `Dear Ma'am Angely,

This letter serves as a Formal Warning regarding the attendance/tardiness of {{salutation}} {{employee_name}}. {{pronoun_he_she}} has accumulated {{instances_text}} ({{instances_count}}) occurrences/days of issues within the current cut-off period.

In accordance with company policy, reaching this count within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee and coordinate with the HR/Admin Department for proper documentation and necessary action.

Additionally, please note the specific dates recorded for this cut-off:
{{entries_list}}

Consistent attendance issues affect team productivity, disrupts workflow, and violates the company's policy, which requires all employees to report to work on time and adhere to their scheduled working hours.

Please be reminded of the following:
1. {{salutation}} {{last_name}} is expected to correct {{pronoun_his_her}} behavior immediately.
2. Future occurrences may result in stricter disciplinary action, including suspension or termination, in accordance with company policy.

Kindly ensure that the employee is informed and that corrective action is enforced appropriately.

Thank you.`,
    footer: 'Admin Assistant',
    signatoryName: 'AIZLE MARIE M. ATIENZA'
}

// --- Skeleton Component ---
const EditorSkeleton = () => (
    <div className="min-h-screen bg-neutral-100 pb-20 pt-12">
        <div className="max-w-[1400px] mx-auto px-10 space-y-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-12 w-32 rounded-2xl" />
                    <Skeleton className="h-12 w-48 rounded-2xl" />
                </div>
            </div>

            <div className="flex justify-center">
                <Skeleton className="h-12 w-[600px] rounded-2xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                    <Card className="flex-1 border-0 shadow-xl overflow-hidden rounded-2xl bg-white flex flex-col">
                        <Skeleton className="h-16 w-full" />
                        <CardContent className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-[350px] w-full rounded-xl" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-6 w-32 rounded-full" />
                    </div>
                    <Card className="border-0 shadow-2xl rounded-none min-h-[1056px] w-[816px] bg-white mx-auto p-16 space-y-8">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <Skeleton className="h-16 w-16 rotate-45" />
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-80" />
                        </div>
                        <div className="space-y-2 py-10">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    </div>
)

export default function EditFormsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('tardiness-regular')
    const [templates, setTemplates] = useState({
        'tardiness-regular': DEFAULT_TARDINESS_REGULAR_TEMPLATE,
        'tardiness-probee': DEFAULT_TARDINESS_PROBEE_TEMPLATE,
        'leave': DEFAULT_LEAVE_TEMPLATE,
        'supervisor': DEFAULT_SUPERVISOR_TEMPLATE
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [hasLocalOnlyChanges, setHasLocalOnlyChanges] = useState(false)

    // Load templates from API on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`${getApiUrl()}/api/warning-letter-templates`)
                const data = await res.json()

                const localSaved = localStorage.getItem('warning_letter_templates')

                if (data && Object.keys(data).length > 0) {
                    const mapped: any = { ...templates }
                    Object.entries(data).forEach(([slug, template]: [string, any]) => {
                        mapped[slug] = {
                            title: template.title,
                            subject: template.subject,
                            headerLogo: template.header_logo,
                            body: template.body,
                            footer: template.footer,
                            signatoryName: template.signatory_name
                        }
                    })
                    setTemplates(mapped)

                    // Check if local storage differs from recently fetched server data
                    if (localSaved) {
                        const local = JSON.parse(localSaved)
                        const isDifferent = JSON.stringify(local) !== JSON.stringify(mapped)
                        setHasLocalOnlyChanges(isDifferent)
                    }
                } else if (localSaved) {
                    // DB is empty but local exists - user likely needs to sync!
                    setTemplates(JSON.parse(localSaved))
                    setHasLocalOnlyChanges(true)
                }
            } catch (e) {
                console.error('Failed to fetch templates:', e)
                const saved = localStorage.getItem('warning_letter_templates')
                if (saved) setTemplates(JSON.parse(saved))
            } finally {
                setIsLoading(false)
            }
        }

        fetchTemplates()
    }, [])

    const handleSave = async (silent = false) => {
        if (!silent) setIsSaving(true)
        try {
            const res = await fetch(`${getApiUrl()}/api/warning-letter-templates/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templates)
            })

            if (res.ok) {
                localStorage.setItem('warning_letter_templates', JSON.stringify(templates))
                setHasLocalOnlyChanges(false)
                if (!silent) toast.success('Form templates synced to database successfully!')
            } else {
                localStorage.setItem('warning_letter_templates', JSON.stringify(templates))
                if (!silent) toast.warning('Saved locally, but server sync failed.')
            }
        } catch (e) {
            console.error('Save failed:', e)
            localStorage.setItem('warning_letter_templates', JSON.stringify(templates))
            if (!silent) toast.error('Templates saved locally (Network error).')
        } finally {
            if (!silent) setIsSaving(false)
        }
    }

    const resetTemplate = (type: string) => {
        const defaults: any = {
            'tardiness-regular': DEFAULT_TARDINESS_REGULAR_TEMPLATE,
            'tardiness-probee': DEFAULT_TARDINESS_PROBEE_TEMPLATE,
            'leave': DEFAULT_LEAVE_TEMPLATE,
            'supervisor': DEFAULT_SUPERVISOR_TEMPLATE
        }
        setTemplates(prev => ({ ...prev, [type]: defaults[type] }))
        toast.info('Template reset to default values.')
    }

    const updateTemplate = (key: string, value: any) => {
        setTemplates(prev => ({ ...prev, [activeTab]: { ...(prev as any)[activeTab], [key]: value } }))
    }

    const renderPreview = () => {
        const type = activeTab
        const template = (templates as any)[type]
        let content = template.body

        // Mock replacements for preview
        const mockEntriesList = type === 'leave' || type === 'supervisor'
            ? `• March 02, 2026 – Personal Leave (Family Emergency)
• March 05, 2026 – Sick Leave
• March 10, 2026 – Personal Leave (Medical Checkup)`
            : `• March 02, 2026 – 08:15 AM
• March 05, 2026 – 08:12 AM
• March 10, 2026 – 08:20 AM`

        if (type.startsWith('tardiness')) {
            content = content
                .replace(/{{salutation}}/g, 'Mr.')
                .replace(/{{last_name}}/g, 'DAPIAOEN')
                .replace(/{{shift_time}}/g, '8:00 AM')
                .replace(/{{grace_period}}/g, '8:05 AM')
                .replace(/{{instances_text}}/g, 'three')
                .replace(/{{instances_count}}/g, '3')
                .replace(/{{entries_list}}/g, mockEntriesList)
        } else if (type === 'leave') {
            content = content
                .replace(/{{salutation}}/g, 'Ms.')
                .replace(/{{last_name}}/g, 'SMITH')
                .replace(/{{instances_text}}/g, 'four')
                .replace(/{{instances_count}}/g, '4')
                .replace(/{{cutoff_text}}/g, 'first cutoff')
                .replace(/{{month}}/g, 'March')
                .replace(/{{year}}/g, '2026')
                .replace(/{{entries_list}}/g, mockEntriesList)
        } else if (type === 'supervisor') {
            content = content
                .replace(/{{salutation}}/g, 'Ms.')
                .replace(/{{employee_name}}/g, 'Kaila Rose Dapiaoen')
                .replace(/{{last_name}}/g, 'Dapiaoen')
                .replace(/{{pronoun_he_she}}/g, 'She')
                .replace(/{{pronoun_his_her}}/g, 'her')
                .replace(/{{instances_text}}/g, 'three')
                .replace(/{{instances_count}}/g, '3')
                .replace(/{{entries_list}}/g, mockEntriesList)
        }

        const isProbee = type === 'tardiness-probee'
        const isSupervisor = type === 'supervisor'

        return (
            <div className="bg-white border-0 shadow-2xl p-16 w-[816px] mx-auto min-h-[1056px] font-serif flex flex-col items-center">
                {/* Header Image */}
                <div className="flex justify-center mb-8 w-full" style={{ marginTop: '1.5cm' }}>
                    <img src="/images/abic-header.png" alt="Company Header" className="max-w-[650px] w-full object-contain" />
                </div>

                <div className="w-full text-center mb-6">
                    <h1 className="text-xl font-black text-black tracking-wide uppercase">
                        {template.title}
                    </h1>
                </div>

                <div className="w-full text-right mb-8 text-sm font-bold">
                    Date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>

                <div className="w-full text-left mb-6 text-sm font-bold space-y-1">
                    {!isSupervisor && (
                        <p>Employee Name: <span className="font-bold">{type === 'leave' ? 'JANE SMITH' : 'KAILA ROSE DAPIAOEN'}</span></p>
                    )}
                    <p>Position: {type === 'leave' ? 'Senior Accountant' : 'Sales Supervisor'}</p>
                    <p>Department: Sales Department</p>
                    {isSupervisor && (
                        <p className="mt-4">Dear Ma&apos;am Angely,</p>
                    )}
                </div>

                {isSupervisor ? (
                    <div className="w-full text-justify text-sm leading-relaxed whitespace-pre-wrap flex-1 text-slate-800">
                        {content}
                    </div>
                ) : (
                    <>
                        {/* Template body already includes salutation */}
                        <div className="w-full text-justify text-sm leading-relaxed whitespace-pre-wrap flex-1 text-slate-800">
                            {content}
                        </div>
                    </>
                )}

                {/* Official Footer Signature */}
                <div className="w-full mt-12 text-left text-sm space-y-8">
                    <div>
                        <p>Respectfully,</p>
                        <div className="mt-8">
                            <p className="font-black text-lg underline uppercase">{template.signatoryName || 'AIZLE MARIE M. ATIENZA'}</p>
                            <p className="font-medium text-slate-600">{template.footer || 'Admin Assistant'}</p>
                        </div>
                    </div>

                    {!isSupervisor && (
                        <div className="pt-8 border-t border-dashed border-slate-300">
                            <p className="font-bold mb-4">Employee Acknowledgment:</p>
                            <p className="mb-4 font-medium">I, <span className="font-bold">{type === 'leave' ? 'Jane Smith' : 'Kaila Rose Dapiaoen'}</span>, hereby acknowledge receipt of this Formal Warning Letter.</p>
                            <div className="space-y-6">
                                <div className="flex items-end gap-2 max-w-md">
                                    <span className="font-bold whitespace-nowrap">Employee Signature:</span>
                                    <div className="flex-1 border-b border-black h-5"></div>
                                </div>
                                <div className="flex items-end gap-2 max-w-[280px]">
                                    <span className="font-bold whitespace-nowrap">Date:</span>
                                    <div className="flex-1 border-b border-black h-5"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (isLoading) {
        return <EditorSkeleton />
    }

    return (
        <div className="min-h-screen bg-[#FDF4F6]">
            {/* --- HEADER --- */}
            <div className="bg-gradient-to-r from-[#4A081A] to-[#7B0F2B] text-white shadow-xl sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 py-6 lg:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Button
                            onClick={() => router.push('/admin-head/attendance/warning-letter')}
                            variant="ghost"
                            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-3 h-12 w-12"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <Layout className="w-8 h-8 text-rose-300" />
                                Template Editor
                            </h1>
                            <p className="text-rose-100/70 font-medium text-sm">Configure your warning letter designs and contents</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button
                            onClick={() => resetTemplate(activeTab as 'tardiness' | 'leave')}
                            variant="outline"
                            className="bg-transparent border-rose-300 text-rose-100 hover:bg-rose-900/40 rounded-xl font-bold px-6 border-2 flex-1 md:flex-none"
                        >
                            <Eraser className="w-4 h-4 mr-2" />
                            Reset Local
                        </Button>
                        <Button
                            onClick={() => handleSave()}
                            disabled={isSaving}
                            className="bg-[#A4163A] hover:bg-[#D61F4D] text-white rounded-xl font-black px-8 py-6 shadow-xl active:scale-95 transition-all text-lg flex-1 md:flex-none"
                        >
                            {isSaving ? (
                                <span className="animate-pulse flex items-center gap-2">
                                    <Clock className="w-5 h-5 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Save className="w-5 h-5" />
                                    Save Changes
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">
                {hasLocalOnlyChanges && (
                    <div className="bg-amber-50 border-2 border-amber-200 text-amber-800 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 rounded-2xl">
                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg tracking-tight">Sync Required</h4>
                                <p className="text-sm font-medium opacity-80">You have customized templates in this browser that are not yet saved to the database.</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleSave()}
                            disabled={isSaving}
                            className="bg-white hover:bg-amber-600 hover:text-white border-amber-300 text-amber-900 font-black rounded-2xl px-8 h-14 shadow-md transition-all active:scale-95"
                        >
                            {isSaving ? 'Syncing...' : 'Migrate to Cloud'}
                        </Button>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border-2 border-[#FFE5EC] shadow-inner h-auto flex flex-wrap justify-center gap-2">
                            <TabsTrigger
                                value="tardiness-regular"
                                className="px-6 py-3 rounded-xl font-black text-xs data-[state=active]:bg-[#4A081A] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                TARDINESS (REGULAR)
                            </TabsTrigger>
                            <TabsTrigger
                                value="tardiness-probee"
                                className="px-6 py-3 rounded-xl font-black text-xs data-[state=active]:bg-[#4A081A] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                <Clock className="w-4 h-4 mr-2" />
                                TARDINESS (PROBEE)
                            </TabsTrigger>
                            <TabsTrigger
                                value="leave"
                                className="px-6 py-3 rounded-xl font-black text-xs data-[state=active]:bg-[#4A081A] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                LEAVE FORM
                            </TabsTrigger>
                            <TabsTrigger
                                value="supervisor"
                                className="px-6 py-3 rounded-xl font-black text-xs data-[state=active]:bg-[#4A081A] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                            >
                                <User className="w-4 h-4 mr-2" />
                                SUPERVISOR (FORM 1)
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Editor Side */}
                        <div className="space-y-6 animate-in slide-in-from-left duration-500">
                            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-3">
                                            <FileText className="w-6 h-6 text-rose-400" />
                                            {activeTab === 'supervisor' ? 'Supervisor Advisory' : 'Employee Warning'} Config
                                        </CardTitle>
                                        <Badge className="bg-rose-500 text-white border-0 font-bold uppercase text-[9px]">
                                            {activeTab.replace('-', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Header Logo Text</Label>
                                            <Input
                                                value={(templates as any)[activeTab].headerLogo}
                                                onChange={(e) => updateTemplate('headerLogo', e.target.value)}
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Main Title</Label>
                                            <Input
                                                value={(templates as any)[activeTab].title}
                                                onChange={(e) => updateTemplate('title', e.target.value)}
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Subject / Warning Level</Label>
                                        <Input
                                            value={(templates as any)[activeTab].subject}
                                            onChange={(e) => updateTemplate('subject', e.target.value)}
                                            className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center pl-1">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest">Letter Body</Label>
                                            <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-200 uppercase font-black">Dynamic Context</Badge>
                                        </div>
                                        <Textarea
                                            value={(templates as any)[activeTab].body}
                                            onChange={(e) => updateTemplate('body', e.target.value)}
                                            className="min-h-[350px] bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-serif text-lg leading-relaxed text-[#4A081A] focus:ring-[#A4163A]"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-100 pt-6">
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Signatory Name</Label>
                                            <Input
                                                value={(templates as any)[activeTab].signatoryName}
                                                onChange={(e) => updateTemplate('signatoryName', e.target.value)}
                                                placeholder="AIZLE MARIE M. ATIENZA"
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-black text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[#4A081A] font-black uppercase text-[10px] tracking-widest pl-1">Signatory Title</Label>
                                            <Input
                                                value={(templates as any)[activeTab].footer}
                                                onChange={(e) => updateTemplate('footer', e.target.value)}
                                                className="bg-[#FDF4F6] border-2 border-[#FFE5EC] rounded-xl font-bold text-[#4A081A] focus:ring-[#A4163A]"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-rose-50 border-l-4 border-rose-500">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-sm font-black text-rose-900 uppercase tracking-widest flex items-center gap-2">
                                        <Type className="w-5 h-5 text-rose-500" />
                                        Contextual Placeholders
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 pb-6">
                                    <div className="flex flex-wrap gap-2">
                                        {(activeTab === 'supervisor'
                                            ? ['{{employee_name}}', '{{last_name}}', '{{instances_text}}', '{{instances_count}}', '{{entries_list}}', '{{pronoun_he_she}}', '{{pronoun_his_her}}']
                                            : activeTab === 'leave'
                                                ? ['{{salutation}}', '{{last_name}}', '{{instances_text}}', '{{instances_count}}', '{{month}}', '{{year}}', '{{cutoff_text}}', '{{entries_list}}']
                                                : ['{{salutation}}', '{{last_name}}', '{{shift_time}}', '{{grace_period}}', '{{instances_text}}', '{{instances_count}}', '{{entries_list}}']
                                        ).map(tag => (
                                            <div key={tag} className="bg-white px-3 py-1.5 rounded-lg border border-rose-200 text-[10px] font-mono font-bold text-rose-700">
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="mt-4 text-[11px] font-medium text-rose-600/80">
                                        These values will be automatically replaced with real employee data during letter generation.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Side */}
                        <div className="space-y-6 animate-in slide-in-from-right duration-500">
                            <div className="flex items-center justify-between px-4 sticky top-[120px] z-10 bg-[#FDF4F6]/80 backdrop-blur-sm py-2">
                                <h3 className="text-xl font-black text-[#4A081A] flex items-center gap-2">
                                    <Eye className="w-6 h-6 text-[#A4163A]" />
                                    Dynamic Preview
                                </h3>
                                <Badge className="bg-[#A4163A] text-white px-3 py-1 rounded-full uppercase text-[10px] font-black tracking-widest animate-pulse">
                                    Live Rendering
                                </Badge>
                            </div>
                            <div className="sticky top-[180px]">
                                {renderPreview()}
                            </div>
                        </div>
                    </div>
                </Tabs>
            </div>

            {/* --- BOTTOM DECORATION --- */}
            <div className="h-40 bg-gradient-to-t from-[#FFE5EC] to-transparent opacity-30 mt-20" />
        </div>
    )
}
