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
    CheckCircle2,
    Maximize2,
    Minimize2,
    EyeOff,
    Upload,
    Trash2,
    Image as ImageIcon
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

const DEFAULT_TARDINESS_REGULAR_TEMPLATE = {
    title: 'TARDINESS WARNING LETTER',
    subject: 'Written Warning - Frequent Tardiness',
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
    signatoryName: 'AIZLE MARIE M. ATIENZA',
    headerLogoImage: null,
    headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy. Pio Del Pilar, Makati City, 1230
(02) 8646-6136`
}

const DEFAULT_TARDINESS_PROBEE_TEMPLATE = {
    title: 'TARDINESS WARNING LETTER',
    subject: 'Tardiness Notice',
    body: `Dear {{salutation}} {{last_name}},

This letter serves as a formal warning regarding your repeated tardiness. It has been recorded that you have reported late to work {{instances_text}} ({{instances_count}}) times, exceeding the company's grace period of five (5) minutes.

We trust that you will take this matter seriously and make the necessary adjustments to improve your attendance and punctuality moving forward.

Additionally, please note the specific dates of tardiness recorded for this cut-off:
{{entries_list}}

Consistent tardiness affects team productivity, disrupts workflow, and your evaluation needed for your regularization, which requires all employees to report to work on time and adhere to their scheduled working hours.

Thank you.`,
    footer: 'Admin Assistant',
    signatoryName: 'AIZLE MARIE M. ATIENZA',
    headerLogoImage: null,
    headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy. Pio Del Pilar, Makati City, 1230
(02) 8646-6136`
}

const DEFAULT_LEAVE_TEMPLATE = {
    title: 'FIRST WARNING LETTER',
    subject: 'Record of Extended Leave of Absence',
    body: `Dear {{salutation}} {{last_name}},

This letter serves as a Formal Warning regarding your attendance record for the current cutoff period.

It has been noted that you incurred {{instances_text}} ({{instances_count}}) absences within the {{cutoff_text}} of {{month}} {{year}}, specifically on the following dates:
{{entries_list}}

These absences negatively affect work operations and your evaluation needed for your regularization.

Please be reminded that repeated absences, especially within a short period, may lead to further disciplinary action in accordance with company rules and regulations.

Moving forward, you are expected to:
1. Improve your attendance immediately,
2. Avoid unnecessary or unapproved absences, and
3. Provide proper documentation or notice for any unavoidable absence.

Failure to comply may result in stricter sanctions, up to and including suspension or termination.

Please acknowledge receipt of this warning by signing below.`,
    footer: 'Admin Assistant',
    signatoryName: 'AIZLE MARIE M. ATIENZA',
    headerLogoImage: null,
    headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy. Pio Del Pilar, Makati City, 1230
(02) 8646-6136`
}

const DEFAULT_SUPERVISOR_TARDINESS_TEMPLATE = {
    title: 'WARNING LETTER',
    subject: 'Employee Attendance Advisory',
    body: `Dear Ma'am Angely,

This letter serves as a Formal Warning regarding the tardiness of {{salutation}} {{employee_name}}. {{pronoun_he_she}} has accumulated {{instances_text}} ({{instances_count}}) occurrences of tardiness beyond the grace period of {{grace_period}} within the current cut-off period.

In accordance with company policy, reaching the {{instances_count_ordinal}} occurrence of tardiness within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee and coordinate with the HR/Admin Department for proper documentation and necessary action.

Additionally, please note the specific dates recorded for this cut-off:
{{entries_list}}

Consistent tardiness affects team productivity, disrupts workflow, and violates the company’s Attendance and Punctuality Policy, which requires all employees to report to work on time and adhere to their scheduled working hours.

Please be reminded of the following:
1. {{salutation}} {{last_name}} is expected to correct {{pronoun_his_her}} attendance behavior immediately.
2. Future occurrences of tardiness may result in stricter disciplinary action, including suspension or termination, in accordance with company policy.

Kindly ensure that the employee is informed and that corrective action is enforced appropriately.

Thank you.`,
    footer: 'Admin Assistant',
    signatoryName: 'AIZLE MARIE M. ATIENZA',
    headerLogoImage: null,
    headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy.Pio Del Pilar, Makati City, 1230
(02) 8646-6136`
}

const DEFAULT_SUPERVISOR_LEAVE_TEMPLATE = {
    title: 'WARNING LETTER',
    subject: 'Employee Attendance Advisory - Leave',
    body: `Dear Ma'am Angely,

This letter serves as a Formal Warning regarding the leave absences of {{salutation}} {{employee_name}}. {{pronoun_he_she}} has accumulated {{instances_text}} ({{instances_count}}) days of leave within the current cut-off period.

In accordance with company policy, reaching this threshold within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee and coordinate with the HR/Admin Department for proper documentation and necessary action.

Additionally, please note the specific dates recorded for this cut-off:
{{entries_list}}

These absences negatively affect work operations and your evaluation needed for your regularization.

Please be reminded of the following:
1. {{salutation}} {{last_name}} is expected to correct {{pronoun_his_her}} attendance behavior immediately.
2. Future occurrences of absences may result in stricter disciplinary action, including suspension or termination, in accordance with company policy.

Kindly ensure that the employee is informed and that corrective action is enforced appropriately.

Thank you.`,
    footer: 'Admin Assistant',
    signatoryName: 'AIZLE MARIE M. ATIENZA',
    headerLogoImage: null,
    headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy.Pio Del Pilar, Makati City, 1230
(02) 8646-6136`
}

// --- Skeleton Component ---
const EditorSkeleton = () => (
    <div className="min-h-screen bg-[#FDF4F6] pb-20">
        <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-10 pt-10 space-y-10">
            <div className="flex justify-center">
                <Skeleton className="h-10 w-[800px] rounded-xl" />
            </div>

            <div className="flex justify-center">
                <Skeleton className="h-8 w-[600px] rounded-lg" />
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
    const [activeTab, setActiveTab] = useState('letterhead')
    const [templates, setTemplates] = useState({
        'tardiness-regular': DEFAULT_TARDINESS_REGULAR_TEMPLATE,
        'tardiness-probee': DEFAULT_TARDINESS_PROBEE_TEMPLATE,
        'leave': DEFAULT_LEAVE_TEMPLATE,
        'supervisor-tardiness': DEFAULT_SUPERVISOR_TARDINESS_TEMPLATE,
        'supervisor-leave': DEFAULT_SUPERVISOR_LEAVE_TEMPLATE
    })
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [showPreview, setShowPreview] = useState(true)
    const [isFullWidth, setIsFullWidth] = useState(true)

    const [hasLocalOnlyChanges, setHasLocalOnlyChanges] = useState(false)

    // Load templates from API on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true)
            try {
                const res = await fetch(`${getApiUrl()}/api/warning-letter-templates`)
                const data = await res.json()

                const localSaved = localStorage.getItem('warning_letter_templates')

                if (data && data.success && Array.isArray(data.data)) {
                    const mapped: any = { ...templates }
                    data.data.forEach((template: any) => {
                        const slug = template.slug
                        if (slug) {
                            mapped[slug] = {
                                title: template.title,
                                subject: template.subject,
                                headerLogoImage: template.header_logo_image,
                                headerDetails: template.header_details,
                                body: template.body,
                                footer: template.footer,
                                signatoryName: template.signatory_name
                            }
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
            'supervisor-tardiness': DEFAULT_SUPERVISOR_TARDINESS_TEMPLATE,
            'supervisor-leave': DEFAULT_SUPERVISOR_LEAVE_TEMPLATE
        }

        const newTemplate = defaults[type];
        setHasLocalOnlyChanges(true)

        setTemplates(prev => {
            const updated = { ...prev };
            Object.keys(updated).forEach(slug => {
                if (slug === type) {
                    (updated as any)[slug] = newTemplate;
                } else {
                    // Update header fields of other templates to match the reset template's defaults
                    (updated as any)[slug] = {
                        ...(updated as any)[slug],
                        headerLogoImage: newTemplate.headerLogoImage,
                        headerDetails: newTemplate.headerDetails
                    };
                }
            });
            return updated;
        });

        toast.info('Template and global header reset to default values.')
    }

    const updateTemplate = (key: string, value: any) => {
        const headerFields = ['headerLogoImage', 'headerDetails'];

        setHasLocalOnlyChanges(true);

        if (headerFields.includes(key)) {
            // Update all templates for header fields
            setTemplates(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(slug => {
                    (updated as any)[slug] = { ...(updated as any)[slug], [key]: value };
                });
                return updated;
            });
        } else {
            // Normal update for specific tab
            setTemplates(prev => ({ ...prev, [activeTab]: { ...(prev as any)[activeTab], [key]: value } }));
        }
    }

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Image is too large. Please select a logo under 2MB.')
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const base64 = event.target?.result as string
            updateTemplate('headerLogoImage', base64)
            toast.success('Logo uploaded successfully!')
        }
        reader.readAsDataURL(file)
    }

    const renderPreview = () => {
        const type = activeTab === 'letterhead' ? 'tardiness-regular' : activeTab
        const template = (templates as any)[type]
        if (!template) return null; // Safety check
        let content = template.body
        const todayLabel = "[Letter Date]"

        // Placeholder replacements for preview instead of mock data
        const mockEntriesList = `[List of Attendance/Leave Entries for current cut-off]`

        if (type.startsWith('tardiness')) {
            content = content
                .replace(/{{salutation}}/g, '[Salutation]')
                .replace(/{{last_name}}/g, '[Last Name]')
                .replace(/{{shift_time}}/g, '[Shift Time]')
                .replace(/{{grace_period}}/g, '[Grace Period]')
                .replace(/{{instances_text}}/g, '[Count in words]')
                .replace(/{{instances_count}}/g, '[#]')
                .replace(/{{entries_list}}/g, mockEntriesList)
        } else if (type === 'leave') {
            content = content
                .replace(/{{salutation}}/g, '[Salutation]')
                .replace(/{{last_name}}/g, '[Last Name]')
                .replace(/{{instances_text}}/g, '[Count in words]')
                .replace(/{{instances_count}}/g, '[#]')
                .replace(/{{cutoff_text}}/g, '[Cut-off Period]')
                .replace(/{{month}}/g, '[Month]')
                .replace(/{{year}}/g, '[Year]')
                .replace(/{{entries_list}}/g, mockEntriesList)
        } else if (type === 'supervisor-tardiness') {
            content = content
                .replace(/{{salutation}}/g, '[Salutation]')
                .replace(/{{employee_name}}/g, '[Employee Full Name]')
                .replace(/{{last_name}}/g, '[Last Name]')
                .replace(/{{pronoun_he_she}}/g, '[He/She]')
                .replace(/{{pronoun_his_her}}/g, '[His/Her]')
                .replace(/{{instances_text}}/g, '[Count in words]')
                .replace(/{{instances_count}}/g, '[#]')
                .replace(/{{instances_count_ordinal}}/g, '[#th]')
                .replace(/{{grace_period}}/g, '[Grace Period]')
                .replace(/{{entries_list}}/g, mockEntriesList)
        } else if (type === 'supervisor-leave') {
            content = content
                .replace(/{{salutation}}/g, '[Salutation]')
                .replace(/{{employee_name}}/g, '[Employee Full Name]')
                .replace(/{{last_name}}/g, '[Last Name]')
                .replace(/{{pronoun_he_she}}/g, '[He/She]')
                .replace(/{{pronoun_his_her}}/g, '[His/Her]')
                .replace(/{{instances_text}}/g, '[Count in words]')
                .replace(/{{instances_count}}/g, '[#]')
                .replace(/{{cutoff_text}}/g, '[Cut-off Period]')
                .replace(/{{month}}/g, '[Month]')
                .replace(/{{year}}/g, '[Year]')
                .replace(/{{entries_list}}/g, mockEntriesList)
        }

        const isSupervisor = type.startsWith('supervisor')

        return (
            <div className="bg-white border-0 shadow-2xl px-16 py-12 w-[816px] mx-auto min-h-[1056px] font-serif flex flex-col items-center print:shadow-none print:p-0">
                {/* Header Branding */}
                <div className="flex flex-col items-center mb-2 w-full" style={{ marginTop: '0.5cm' }}>
                    {template.headerLogoImage ? (
                        <div className="flex flex-col items-center gap-2">
                            <img src={template.headerLogoImage} alt="Custom Logo" className="max-w-[150px] max-h-[100px] object-contain" />
                        </div>
                    ) : (
                        <img src="/images/abic-header.png" alt="Company Header" className="max-w-[650px] w-full object-contain" />
                    )}

                    {template.headerDetails && (
                        <div className="text-center mt-1 text-[10px] leading-tight text-slate-600 max-w-[500px] whitespace-pre-wrap">
                            {template.headerDetails}
                        </div>
                    )}
                </div>

                <div className="w-full text-center mb-6">
                    <h1 className="text-xl font-black text-black tracking-wide uppercase">
                        {template.title}
                    </h1>
                </div>

                <div className="w-full text-right mb-8 text-sm font-bold">
                    Date: {todayLabel}
                </div>

                <div className="w-full text-left mb-6 text-sm font-bold space-y-1">
                    {!isSupervisor && (
                        <p>Employee Name: <span className="font-bold text-[#A4163A]">[Employee Full Name]</span></p>
                    )}
                    <p>Position: <span className="font-bold text-[#A4163A]">[Employee Position]</span></p>
                    <p>Department: <span className="font-bold text-[#A4163A]">[Employee Department]</span></p>
                    {template.subject && (
                        <p className="mt-4 font-bold uppercase tracking-tight">RE: {template.subject}</p>
                    )}
                    {isSupervisor && (
                        <p className="mt-4">Dear Ma&apos;am Angely,</p>
                    )}
                </div>

                <div className="w-full text-justify text-sm leading-relaxed flex-1 text-slate-800">
                    {content.split('\n').map((line: string, idx: number) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={idx} className="h-4" />;

                        // Bullet points
                        if (trimmed.startsWith('•')) {
                            return (
                                <div key={idx} className="flex gap-4 pl-12 mb-2">
                                    <span className="shrink-0">•</span>
                                    <span>{trimmed.substring(1).trim()}</span>
                                </div>
                            );
                        }

                        // Numbered lists (e.g., "1.", "2.")
                        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
                        if (numMatch) {
                            return (
                                <div key={idx} className="flex gap-4 pl-12 mb-2">
                                    <span className="shrink-0 font-bold">{numMatch[1]}.</span>
                                    <span>{numMatch[2]}</span>
                                </div>
                            );
                        }

                        // Salutation & Closing (usually small/no indent)
                        const isSalutation = trimmed.toLowerCase().startsWith('dear') || trimmed.endsWith(',');
                        const isClosing = trimmed.toLowerCase() === 'thank you.' || trimmed.toLowerCase() === 'respectfully,' || trimmed.toLowerCase() === 'respectfully yours,';

                        if (isSalutation || isClosing) {
                            return <div key={idx} className="mb-4">{line}</div>;
                        }

                        // Paragraph with first-line indent
                        return (
                            <div key={idx} className="text-justify mb-4" style={{ textIndent: '3.5rem' }}>
                                {line}
                            </div>
                        );
                    })}
                </div>

                {/* Official Footer Signature */}
                <div className="w-full mt-12 text-left text-sm space-y-8">
                    <div>
                        <p>Respectfully,</p>
                        <div className="mt-8">
                            <p className="font-black text-lg underline uppercase">{template.signatoryName || 'AIZLE MARIE M. ATIENZA'}</p>
                            <p className="font-medium text-slate-600">{template.footer || 'Admin Assistant'}</p>
                        </div>
                    </div>

                    <div className="mt-12 border-t border-slate-100 pt-8 space-y-4">
                        <p className="font-bold mb-4">Employee Acknowledgment:</p>
                        <p className="mb-8">
                            I, <span className="font-bold text-[#A4163A]">[Employee Full Name]</span>, hereby acknowledge receipt of this Formal Warning Letter.
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
                </div>
            </div>
        )
    }

    if (isLoading) {
        return <EditorSkeleton />
    }

    return (
        <div className="min-h-screen bg-[#FDF4F6]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
                <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-lg mb-6 sticky top-0 z-50">
                    {/* Main Header Row */}
                    <div className="w-full px-4 md:px-8 py-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold mb-2">Template Editor</h1>
                                <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    ABIC REALTY & CONSULTANCY
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={() => setIsFullWidth(!isFullWidth)}
                                    variant="ghost"
                                    className="text-white hover:bg-white/10 rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all bg-white/5 border border-white/10"
                                    title={isFullWidth ? "Standard Width" : "Full Width"}
                                >
                                    {isFullWidth ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                </Button>

                                <Button
                                    onClick={() => router.push('/admin-head/attendance/warning-letter')}
                                    variant="outline"
                                    className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-6 rounded-lg flex items-center"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    <span>Back</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Toolbar */}
                    <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto no-scrollbar">
                        <div className="w-full px-4 md:px-8 py-4">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center">
                                    <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner h-10 flex gap-1">
                                        <TabsTrigger
                                            value="letterhead"
                                            className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                            LETTERHEAD
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="tardiness-regular"
                                            className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                                        >
                                            <Clock className="w-4 h-4" />
                                            TARDINESS (REGULAR)
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="tardiness-probee"
                                            className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                                        >
                                            <Clock className="w-4 h-4" />
                                            TARDINESS (PROBEE)
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="leave"
                                            className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                                        >
                                            <Calendar className="w-4 h-4" />
                                            LEAVE FORM
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="supervisor-tardiness"
                                            className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                                        >
                                            <User className="w-4 h-4" />
                                            SUPERVISOR (TARDINESS)
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="supervisor-leave"
                                            className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                                        >
                                            <User className="w-4 h-4" />
                                            SUPERVISOR (LEAVE)
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => setShowPreview(!showPreview)}
                                        variant="outline"
                                        className={cn(
                                            "h-10 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border-2",
                                            showPreview
                                                ? "bg-rose-50 border-rose-200 text-[#7B0F2B] hover:bg-rose-100"
                                                : "bg-[#7B0F2B] border-[#7B0F2B] text-white hover:bg-[#4A081A]"
                                        )}
                                    >
                                        {showPreview ? (
                                            <>
                                                <EyeOff className="w-4 h-4" />
                                                Hide Preview
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4" />
                                                Show Preview
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={() => handleSave()}
                                        disabled={isSaving}
                                        className="bg-white text-[#7B0F2B] hover:bg-rose-50 shadow-md hover:shadow-lg transition-all duration-300 text-[10px] font-black uppercase tracking-widest h-10 px-8 rounded-xl flex items-center border-b-4 border-rose-200 active:border-b-0 active:translate-y-1"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                                                SAVING
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                SYNC CHANGES
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "mx-auto p-4 md:p-6 lg:p-8 transition-all duration-500 ease-in-out",
                    isFullWidth ? "max-w-[100%] px-4 md:px-10" : "max-w-[1400px]"
                )}>
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

                    <div className={cn(
                        "grid gap-8 transition-all duration-500",
                        showPreview
                            ? "grid-cols-1 xl:grid-cols-[1fr_816px]"
                            : "grid-cols-1 max-w-[1200px] mx-auto"
                    )}>
                        {/* Editor Side */}
                        <div className={cn(
                            "space-y-6 transition-all duration-500",
                            showPreview ? "animate-in slide-in-from-left" : "w-full"
                        )}>
                            <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
                                <CardHeader className="bg-gradient-to-r from-[#4A081A] to-[#7B0F2B] text-white p-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-3">
                                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                                                <FileText className="w-6 h-6 text-rose-300" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xl font-bold tracking-tight">
                                                    {activeTab === 'letterhead' ? 'Company Letterhead' : activeTab.startsWith('supervisor-tardiness') ? 'Supervisor Tardiness Advisory' : activeTab.startsWith('supervisor-leave') ? 'Supervisor Leave Advisory' : 'Employee Warning'}
                                                </span>
                                                <span className="text-[10px] font-medium text-rose-200/70 uppercase tracking-[0.2em]">{activeTab === 'letterhead' ? 'Shared Branding' : 'Configuration Panel'}</span>
                                            </div>
                                        </CardTitle>
                                        <Badge className="bg-rose-500/20 text-rose-100 border border-rose-400/30 font-bold uppercase text-[9px] px-3 py-1 rounded-full backdrop-blur-sm">
                                            {activeTab === 'letterhead' ? 'GLOBAL' : activeTab.replace('-', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    {activeTab === 'letterhead' ? (
                                        <div className="space-y-6 bg-rose-50/10 p-2 border-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-rose-100 rounded-lg">
                                                    <ImageIcon className="w-4 h-4 text-[#A4163A]" />
                                                </div>
                                                <h4 className="text-xs font-black text-[#A4163A] uppercase tracking-wider">Letterhead Customization</h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">Logo Image</Label>
                                                        <span className="text-[9px] text-slate-400 pl-1 mb-2 font-medium">Recommended: Transparent PNG, 300x150px</span>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        {(templates as any)['tardiness-regular'].headerLogoImage ? (
                                                            <div className="relative group w-full aspect-video bg-white rounded-2xl border-2 border-dashed border-rose-200 overflow-hidden flex items-center justify-center p-6 shadow-sm">
                                                                <img
                                                                    src={(templates as any)['tardiness-regular'].headerLogoImage}
                                                                    alt="Preview"
                                                                    className="max-h-full max-w-full object-contain drop-shadow-sm"
                                                                />
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 border-0 text-white font-bold"
                                                                        onClick={() => updateTemplate('headerLogoImage', null)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <label className="w-full aspect-video bg-white hover:bg-rose-50/50 rounded-2xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:border-[#A4163A] hover:shadow-md group">
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                                                <div className="p-4 bg-rose-50 rounded-full group-hover:bg-rose-100 transition-colors">
                                                                    <Upload className="w-8 h-8 text-rose-300 group-hover:text-[#A4163A]" />
                                                                </div>
                                                                <div className="text-center">
                                                                    <span className="block text-[11px] font-black text-slate-600 uppercase tracking-wider">Upload Branding Logo</span>
                                                                    <span className="block text-[9px] text-slate-400 font-bold mt-1 uppercase">PNG, JPG up to 2MB</span>
                                                                </div>
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">Header Subtext (Address/Tel)</Label>
                                                    <Textarea
                                                        value={(templates as any)['tardiness-regular'].headerDetails}
                                                        onChange={(e) => updateTemplate('headerDetails', e.target.value)}
                                                        placeholder="Enter company address, contact info..."
                                                        className="min-h-[160px] bg-white border-rose-100 shadow-sm rounded-2xl font-medium text-[14px] leading-relaxed text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all p-5 resize-none"
                                                    />
                                                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-2">
                                                        <Clock className="w-4 h-4 text-blue-500 mt-0.5" />
                                                        <p className="text-[10px] text-blue-800 leading-tight font-medium">This information will be displayed below the logo on all warning letter forms.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2.5">
                                                    <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">Document Title</Label>
                                                    <Input
                                                        value={(templates as any)[activeTab].title}
                                                        onChange={(e) => updateTemplate('title', e.target.value)}
                                                        className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2.5">
                                                <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">Subject / Warning Level</Label>
                                                <Input
                                                    value={(templates as any)[activeTab].subject}
                                                    onChange={(e) => updateTemplate('subject', e.target.value)}
                                                    className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center pl-1">
                                                    <Label className="text-[#4A081A] font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                                                        <Type className="w-3.5 h-3.5 text-[#A4163A]" />
                                                        Letter Body Content
                                                    </Label>
                                                    <div className="flex items-center gap-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                                        <span className="text-[9px] text-rose-700 uppercase font-black tracking-wider">Dynamic Component</span>
                                                    </div>
                                                </div>
                                                <div className="relative group">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-b from-rose-100 to-transparent rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                                                    <Textarea
                                                        value={(templates as any)[activeTab].body}
                                                        onChange={(e) => updateTemplate('body', e.target.value)}
                                                        className="relative min-h-[400px] bg-white border-rose-100 shadow-inner rounded-xl font-serif text-[15px] leading-relaxed text-[#4A081A] focus:ring-0 focus:border-[#A4163A] transition-all p-6 resize-y"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-slate-100">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2.5">
                                                        <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">Signatory Name</Label>
                                                        <Input
                                                            value={(templates as any)[activeTab].signatoryName}
                                                            onChange={(e) => updateTemplate('signatoryName', e.target.value)}
                                                            placeholder="AIZLE MARIE M. ATIENZA"
                                                            className="bg-white border-rose-100 shadow-sm rounded-xl font-bold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                                                        />
                                                    </div>
                                                    <div className="space-y-2.5">
                                                        <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">Signatory Title</Label>
                                                        <Input
                                                            value={(templates as any)[activeTab].footer}
                                                            onChange={(e) => updateTemplate('footer', e.target.value)}
                                                            className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {activeTab !== 'letterhead' && (
                                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-slate-50 border-l-[6px] border-[#A4163A]">
                                    <CardHeader className="py-4 px-6 border-b border-slate-200/60 bg-white">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xs font-bold text-[#4A081A] uppercase tracking-[0.15em] flex items-center gap-2">
                                                <Layout className="w-4 h-4 text-[#A4163A]" />
                                                Available Placeholders
                                            </CardTitle>
                                            <span className="text-[10px] font-medium text-slate-400 italic">Click to reference in body</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap gap-2.5">
                                            {(activeTab.startsWith('supervisor')
                                                ? ['{{employee_name}}', '{{last_name}}', '{{instances_text}}', '{{instances_count}}', '{{entries_list}}', '{{pronoun_he_she}}', '{{pronoun_his_her}}']
                                                : activeTab === 'leave'
                                                    ? ['{{salutation}}', '{{last_name}}', '{{instances_text}}', '{{instances_count}}', '{{month}}', '{{year}}', '{{cutoff_text}}', '{{entries_list}}']
                                                    : ['{{salutation}}', '{{last_name}}', '{{shift_time}}', '{{grace_period}}', '{{instances_text}}', '{{instances_count}}', '{{entries_list}}']
                                            ).map(tag => (
                                                <button
                                                    key={tag}
                                                    className="group relative px-3 py-1.5 bg-white hover:bg-[#A4163A] rounded-lg border border-slate-200 hover:border-[#A4163A] transition-all duration-200 shadow-sm"
                                                >
                                                    <code className="text-[10px] font-mono font-bold text-[#A4163A] group-hover:text-white">
                                                        {tag}
                                                    </code>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="mt-5 flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                            </div>
                                            <p className="text-[11px] leading-relaxed font-medium text-blue-800/80">
                                                Insert these tags into your letter body. They will be automatically populated with the relevant employee details when generating the final document.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Preview Side */}
                        {showPreview && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-500">
                                <div className="flex items-center justify-between px-4 sticky top-[20px] lg:top-[120px] z-10 bg-[#FDF4F6]/80 backdrop-blur-sm py-3 rounded-2xl border border-rose-100 shadow-sm">
                                    <h3 className="text-lg font-black text-[#4A081A] flex items-center gap-2">
                                        <div className="p-1.5 bg-[#A4163A] rounded-lg">
                                            <Eye className="w-4 h-4 text-white" />
                                        </div>
                                        Dynamic Preview
                                    </h3>
                                    <Badge className="bg-[#A4163A] text-white px-3 py-1 rounded-full uppercase text-[9px] font-black tracking-[0.15em] animate-pulse border-0">
                                        Live Rendering
                                    </Badge>
                                </div>
                                <div className="sticky top-[80px] lg:top-[180px] shadow-2xl rounded-sm overflow-auto border border-slate-200 bg-white max-h-[85vh]">
                                    <div className="origin-top transition-transform duration-500" style={{ transform: 'scale(0.95)' }}>
                                        {renderPreview()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Tabs>

            {/* --- BOTTOM DECORATION --- */}
            <div className="h-40 bg-gradient-to-t from-[#FFE5EC] to-transparent opacity-30 mt-20" />
        </div>
    )
}
