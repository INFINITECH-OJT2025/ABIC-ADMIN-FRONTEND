"use client"

import React, { useEffect, useState, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Button,
  Badge,
  Input
} from '@/components/ui'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Save, 
  FileDown,
  Mail,
  Pencil,
  Search,
  Check,
  Circle
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { toast } from 'sonner'
import { format, addMonths } from 'date-fns'

interface Employee {
  id: string
  first_name: string
  last_name: string
  date_hired: string
  position: string
  department: string
  status: string
}

interface Evaluation {
  employee_id: string
  score_1: number | null
  score_1_breakdown?: Record<CriteriaId, number> | null
  agreement_1?: 'agree' | 'disagree' | null
  comment_1?: string | null
  signature_1?: string | null
  remarks_1: string | null
  rated_by?: string | null
  reviewed_by?: string | null
  approved_by?: string | null
  score_2: number | null
  score_2_breakdown?: Record<CriteriaId, number> | null
  agreement_2?: 'agree' | 'disagree' | null
  comment_2?: string | null
  signature_2?: string | null
  remarks_2: string | null
  rated_by_2?: string | null
  reviewed_by_2?: string | null
  approved_by_2?: string | null
  status: string | null
}

interface Department {
  id: string
  name: string
  office_id: string
}

interface Office {
  id: string
  name: string
}

type EvaluationView = 'first' | 'second' | 'both'
type CriteriaId =
  | 'work_attitude'
  | 'job_knowledge'
  | 'quality_of_work'
  | 'handle_workload'
  | 'work_with_supervisor'
  | 'work_with_coemployees'
  | 'attendance'
  | 'compliance'
  | 'grooming'
  | 'communication'

const CRITERIA = [
  { id: 'work_attitude', label: '1. WORK ATTITUDE', desc: 'How does an employee feel about his/her job? Is he/she interested in his/her work? \nDoes the employee work hard? Is he alert and resourceful?' },
  { id: 'job_knowledge', label: '2. KNOWLEDGE OF THE JOB', desc: 'Does he know the requirements of the job he is working on?' },
  { id: 'quality_of_work', label: '3. QUALITY OF WORK', desc: 'Is he accurate, thorough and neat? Consider working habits. Extent to which decision \nand action are based on facts and sound reasoning and weighing of outcome?' },
  { id: 'handle_workload', label: '4. ABILITY TO HANDLE ASSIGNED WORKLOAD', desc: 'Consider working habits. Is work completed on time? Do you have to follow up?' },
  { id: 'work_with_supervisor', label: '5. ABILITY TO WORK WITH SUPERVISOR', desc: 'Consider working relationship / Interaction with superior?' },
  { id: 'work_with_coemployees', label: '6. ABILITY TO WORK WITH CO-EMPLOYEE', desc: 'Can he work harmoniously with others?' },
  { id: 'attendance', label: '7. ATTENDANCE (ABSENCES/TARDINESS/ UNDERTIME)', desc: 'Is he regular and punctual in his attendance? What is his attitude towards time lost?' },
  { id: 'compliance', label: '8. COMPLIANCE WITH COMPANY RULES AND REGULATIONS', desc: 'Does the employee follow the company\'s rules and regulations at all times?' },
  { id: 'grooming', label: '9. GROOMING AND APPEARANCE', desc: 'Does he wear his uniform completely and neatly? Is he clean and neat?' },
  { id: 'communication', label: '10. COMMUNICATION SKILLS', desc: 'How successful is he in expressing himself orally, verbally and in written form?' }
] as const

const EMPTY_SCORES: Record<CriteriaId, string> = {
  work_attitude: '',
  job_knowledge: '',
  quality_of_work: '',
  handle_workload: '',
  work_with_supervisor: '',
  work_with_coemployees: '',
  attendance: '',
  compliance: '',
  grooming: '',
  communication: ''
}

const EvaluationFormSkeleton = () => (
  <div className="min-h-screen bg-slate-50 py-10 px-4 animate-pulse">
    <div className="max-w-[850px] mx-auto mb-4 flex justify-between">
      <Skeleton className="h-10 w-24 bg-white border border-slate-200 shadow-sm" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-32 bg-white border border-slate-200 shadow-sm" />
        <Skeleton className="h-10 w-32 bg-white border border-slate-200 shadow-sm" />
        <Skeleton className="h-10 w-40 bg-white border border-slate-200 shadow-sm" />
      </div>
    </div>
    <div className="max-w-[850px] mx-auto bg-white shadow-sm p-[60px] border border-slate-200 space-y-10">
      <div className="text-center space-y-4">
        <Skeleton className="h-8 w-80 mx-auto bg-slate-200" />
        <Skeleton className="h-8 w-64 mx-auto bg-slate-100" />
      </div>
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <Skeleton className="h-6 w-full bg-slate-50" />
        <Skeleton className="h-6 w-full bg-slate-50" />
        <Skeleton className="h-6 w-full bg-slate-50" />
      </div>
      <div className="space-y-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 items-start pt-4 border-t border-slate-100">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-48 bg-slate-200" />
              <Skeleton className="h-4 w-full bg-slate-50" />
            </div>
            <Skeleton className="h-10 w-24 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

function EvaluateEmployeeForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({})
  const [departments, setDepartments] = useState<Department[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(searchParams?.get('id') || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isEmailSending, setIsEmailSending] = useState(false)
  const [isEditMode, setIsEditMode] = useState(true)
  const [evaluationView, setEvaluationView] = useState<EvaluationView>('first')
  
  // Scoring State
  const [scores, setScores] = useState<Record<CriteriaId, string>>(EMPTY_SCORES)
  const [remarks, setRemarks] = useState('')
  const [agreement, setAgreement] = useState<'agree' | 'disagree' | null>(null)
  const [recommendation, setRecommendation] = useState<'yes' | 'no' | null>(null)
  
  // Manager Signature State
  const [ratedBy, setRatedBy] = useState('')
  const [reviewedBy, setReviewedBy] = useState('')
  const [approvedBy, setApprovedBy] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    const employeeIdFromQuery = searchParams?.get('id') || ''
    if (employeeIdFromQuery && employeeIdFromQuery !== selectedEmployeeId) {
      setSelectedEmployeeId(employeeIdFromQuery)
    }
  }, [searchParams, selectedEmployeeId])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [empRes, evalRes, deptRes, officeRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/employees`),
        fetch(`${getApiUrl()}/api/evaluations`),
        fetch(`${getApiUrl()}/api/departments`),
        fetch(`${getApiUrl()}/api/offices`)
      ])

      const [empData, evalData, deptData, officeData] = await Promise.all([
        empRes.json(),
        evalRes.json(),
        deptRes.json(),
        officeRes.json()
      ])

      if (empData.success) setEmployees(empData.data)
      if (evalData.success) {
        const evalMap: Record<string, Evaluation> = {}
        evalData.data.forEach((ev: Evaluation) => { evalMap[ev.employee_id] = ev })
        setEvaluations(evalMap)
      }
      setDepartments(deptData.data || [])
      if (officeData.success) setOffices(officeData.data)

    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load required data')
    } finally {
      setLoading(false)
    }
  }

  const probeeEmployees = useMemo(() => {
    return employees.filter(emp => {
      const evalRecord = evaluations[emp.id]
      return (emp.status === 'employed' || emp.status === 'rehired_employee') && 
             (!evalRecord || (evalRecord.status !== 'Regular' && evalRecord.status !== 'Regularized'))
    }).sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
  }, [employees, evaluations])

  const selectableEmployees = useMemo(() => {
    if (!selectedEmployeeId) return probeeEmployees
    const currentSelected = employees.find(emp => emp.id === selectedEmployeeId)
    if (!currentSelected) return probeeEmployees
    const existsInProbee = probeeEmployees.some(emp => emp.id === currentSelected.id)
    if (existsInProbee) return probeeEmployees
    return [currentSelected, ...probeeEmployees]
  }, [selectedEmployeeId, employees, probeeEmployees])

  const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmployeeId), [selectedEmployeeId, employees])
  const selectedEvaluation = useMemo(() => (
    selectedEmployee ? evaluations[selectedEmployee.id] : undefined
  ), [selectedEmployee, evaluations])
  const firstBreakdown = selectedEvaluation?.score_1_breakdown ?? null
  const secondBreakdown = selectedEvaluation?.score_2_breakdown ?? null
  const failedFirstEvaluation = useMemo(() => (
    selectedEvaluation?.score_1 !== null &&
    selectedEvaluation?.score_1 !== undefined &&
    selectedEvaluation.score_1 <= 30
  ), [selectedEvaluation])
  const showFirstEvaluationPanel = failedFirstEvaluation && (evaluationView === 'first' || evaluationView === 'both')
  const showSecondEvaluationPanel = !failedFirstEvaluation || evaluationView === 'second' || evaluationView === 'both'
  const showSideBySide = failedFirstEvaluation && evaluationView === 'both'
  const isViewDetailsMode = Boolean(searchParams?.get('id'))

  const buildFallbackBreakdownFromTotal = (total?: number | null): Record<CriteriaId, number> | null => {
    if (typeof total !== 'number') return null
    if (total <= 0) {
      return CRITERIA.reduce((acc, criterion) => {
        acc[criterion.id as CriteriaId] = 0
        return acc
      }, {} as Record<CriteriaId, number>)
    }

    // Reconstruct per-criteria values from old records that only saved total.
    const values = Array<number>(CRITERIA.length).fill(1)
    let remaining = Math.max(0, Math.min(40, total - CRITERIA.length))
    let idx = 0
    while (remaining > 0) {
      if (values[idx] < 5) {
        values[idx] += 1
        remaining -= 1
      }
      idx = (idx + 1) % values.length
    }

    return CRITERIA.reduce((acc, criterion, index) => {
      acc[criterion.id as CriteriaId] = values[index]
      return acc
    }, {} as Record<CriteriaId, number>)
  }

  const firstDisplayBreakdown = useMemo(
    () => firstBreakdown ?? buildFallbackBreakdownFromTotal(selectedEvaluation?.score_1),
    [firstBreakdown, selectedEvaluation?.score_1]
  )
  const secondDisplayBreakdown = useMemo(
    () => secondBreakdown ?? buildFallbackBreakdownFromTotal(selectedEvaluation?.score_2),
    [secondBreakdown, selectedEvaluation?.score_2]
  )

  const mapBreakdownToScoreState = (breakdown?: Record<CriteriaId, number> | null): Record<CriteriaId, string> => {
    if (!breakdown) return { ...EMPTY_SCORES }
    const next = { ...EMPTY_SCORES }
    CRITERIA.forEach((criterion) => {
      const criterionId = criterion.id as CriteriaId
      const value = breakdown[criterionId]
      if (typeof value === 'number' && value >= 1 && value <= 5) {
        next[criterionId] = String(value)
      }
    })
    return next
  }

  const isDirty = useMemo(() => {
    const hasScores = Object.values(scores).some(s => s !== '')
    return hasScores || remarks !== '' || agreement !== null || recommendation !== null || ratedBy !== '' || reviewedBy !== '' || approvedBy !== ''
  }, [scores, remarks, agreement, recommendation, ratedBy, reviewedBy, approvedBy])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!selectedEmployee) {
      setEvaluationView('first')
      return
    }
    setEvaluationView(failedFirstEvaluation ? 'second' : 'first')
  }, [selectedEmployeeId, selectedEmployee, failedFirstEvaluation])

  useEffect(() => {
    if (!selectedEmployee) {
      setScores({ ...EMPTY_SCORES })
      setRemarks('')
      setAgreement(null)
      return
    }
    const targetBreakdown = failedFirstEvaluation ? secondDisplayBreakdown : firstDisplayBreakdown
    setScores(mapBreakdownToScoreState(targetBreakdown))
    const targetAgreement = failedFirstEvaluation ? selectedEvaluation?.agreement_2 : selectedEvaluation?.agreement_1
    const targetComment = failedFirstEvaluation ? selectedEvaluation?.comment_2 : selectedEvaluation?.comment_1
    const targetRatedBy = failedFirstEvaluation ? selectedEvaluation?.rated_by_2 : selectedEvaluation?.rated_by
    const targetReviewedBy = failedFirstEvaluation ? selectedEvaluation?.reviewed_by_2 : selectedEvaluation?.reviewed_by
    const targetApprovedBy = failedFirstEvaluation ? selectedEvaluation?.approved_by_2 : selectedEvaluation?.approved_by
    setAgreement(targetAgreement ?? null)
    setRemarks(targetComment ?? '')
    setRatedBy(targetRatedBy ?? '')
    setReviewedBy(targetReviewedBy ?? '')
    setApprovedBy(targetApprovedBy ?? '')
  }, [selectedEmployeeId, selectedEmployee, failedFirstEvaluation, firstDisplayBreakdown, secondDisplayBreakdown, selectedEvaluation])

  const handleBackWindow = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved evaluation progress. Are you sure you want to leave?")) {
        router.back()
      }
    } else {
      router.back()
    }
  }

  const handleEmployeeChange = (employeeId: string) => {
    if (isDirty && !window.confirm("You have unsaved progress. Are you sure you want to change candidate? Unsaved changes will be lost.")) {
      return;
    }
    setSelectedEmployeeId(employeeId);
    setScores({ ...EMPTY_SCORES });
    setRemarks('');
    setAgreement(null);
    setRecommendation(null);
    setRatedBy('');
    setReviewedBy('');
    setApprovedBy('');
  }
  const employeeDetails = useMemo(() => {
    if (!selectedEmployee) return null
    const deptObj = departments.find(d => String(d.id) === String(selectedEmployee.department) || d.name === selectedEmployee.department)
    const hiredDate = selectedEmployee.date_hired ? new Date(selectedEmployee.date_hired) : null
    return {
      name: `${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
      position: selectedEmployee.position,
      department: deptObj?.name || selectedEmployee.department || 'Not Assigned',
    }
  }, [selectedEmployee, departments])

  const totalScore = useMemo(() => {
    return Object.values(scores).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0)
  }, [scores])

  useEffect(() => {
    const hasScores = Object.values(scores).some(s => s !== '')
    if (hasScores) {
      if (totalScore >= 31) {
        setRecommendation('yes')
      } else if (totalScore > 0) {
        setRecommendation('no')
      }
    } else {
      setRecommendation(null)
    }
  }, [totalScore, scores])

  const evaluationContext = useMemo(() => {
    if (!selectedEmployee) {
      return {
        isSecond: false,
        ratingPeriod: format(new Date(), 'MMMM yyyy'),
        targetScore: 'score_1' as const,
        targetRemarks: 'remarks_1' as const,
        targetBreakdown: 'score_1_breakdown' as const,
        targetAgreement: 'agreement_1' as const,
        targetComment: 'comment_1' as const,
        targetSignature: 'signature_1' as const
      }
    }
    const prevEval = evaluations[selectedEmployee.id]
    
    const hiredDate = new Date(selectedEmployee.date_hired)
    const firstEvalDate = addMonths(hiredDate, 3)
    const secondEvalDate = addMonths(hiredDate, 5)
    
    // Check if 1st eval failed (<= 30)
    const failedFirst = prevEval && prevEval.score_1 !== null && prevEval.score_1 <= 30
    
    return {
      isSecond: !!failedFirst,
      ratingPeriod: format(failedFirst ? secondEvalDate : firstEvalDate, 'MMMM dd, yyyy (EEEE)'),
      targetScore: failedFirst ? 'score_2' : 'score_1',
      targetRemarks: failedFirst ? 'remarks_2' : 'remarks_1',
      targetBreakdown: failedFirst ? 'score_2_breakdown' : 'score_1_breakdown',
      targetAgreement: failedFirst ? 'agreement_2' : 'agreement_1',
      targetComment: failedFirst ? 'comment_2' : 'comment_1',
      targetSignature: failedFirst ? 'signature_2' : 'signature_1'
    }
  }, [selectedEmployee, evaluations])

  const currentSavedScore = (selectedEvaluation?.[evaluationContext.targetScore as keyof Evaluation]) as number | null | undefined
  const hasSavedCurrentEvaluation = typeof currentSavedScore === 'number' && currentSavedScore > 0

  useEffect(() => {
    if (!selectedEmployee) {
      setIsEditMode(true)
      return
    }
    setIsEditMode(!hasSavedCurrentEvaluation)
  }, [selectedEmployeeId, selectedEmployee, evaluationContext.targetScore, hasSavedCurrentEvaluation])

  const handleScoreChange = (id: CriteriaId, value: string) => {
    const cleaned = value.replace(/[^1-5]/g, '').slice(0, 1)
    setScores(prev => ({ ...prev, [id]: cleaned }))
  }

  const handleExportPdf = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee first')
      return
    }

    setIsExportingPdf(true)
    try {
      const response = await fetch(
        `${getApiUrl()}/api/evaluations/${selectedEmployeeId}/pdf?view=${evaluationView}`
      )
      if (!response.ok) {
        throw new Error('Failed to export PDF')
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/pdf')) {
        const text = await response.text()
        throw new Error(text || 'Invalid PDF response')
      }

      const blob = await response.blob()
      if (!blob || blob.size === 0) {
        throw new Error('Generated PDF is empty')
      }
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `evaluation_${selectedEmployeeId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => window.URL.revokeObjectURL(url), 5000)
      toast.success('PDF exported')
    } catch (error) {
      toast.error('Failed to export PDF')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleSendPdfToEmail = async () => {
    if (!selectedEmployeeId) {
      toast.error('Please select an employee first')
      return
    }

    setIsEmailSending(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/evaluations/${selectedEmployeeId}/email-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view: evaluationView })
      })
      const raw = await response.text()
      let data: any = null
      try {
        data = raw ? JSON.parse(raw) : null
      } catch {
        data = null
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || raw || 'Failed to send PDF to email')
      }
      toast.success('Evaluation PDF sent to employee email')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send PDF to employee email'
      toast.error(message)
    } finally {
      setIsEmailSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeId) return toast.error('Please select an employee')
    if (failedFirstEvaluation && !showSecondEvaluationPanel) {
      return toast.error('Switch to 2nd Evaluation or Both to submit the second evaluation')
    }
    if (Object.values(scores).some(s => s === '')) return toast.error('Please complete all rating criteria')
    if (!isEditMode) return toast.error('Click Edit Evaluation first to modify and save')
    if (!agreement) return toast.error('Please select agree or disagree')

    setIsSubmitting(true)
    try {
      const computedRemarks = totalScore >= 31 ? 'Passed' : 'Failed'
      // Regular/Regularized must only happen after manual regularization date input on monitoring page.
      const derivedStatus = computedRemarks === 'Passed'
        ? 'For Recommendation'
        : (evaluationContext.isSecond ? 'Failed' : 'Probee')

      const payload = {
        employee_id: selectedEmployeeId,
        [evaluationContext.targetScore]: totalScore,
        [evaluationContext.targetBreakdown]: CRITERIA.reduce((acc, criterion) => {
          const criterionId = criterion.id as CriteriaId
          acc[criterionId] = parseInt(scores[criterionId], 10) || 0
          return acc
        }, {} as Record<CriteriaId, number>),
        [evaluationContext.targetRemarks]: computedRemarks,
        [evaluationContext.targetAgreement]: agreement,
        [evaluationContext.targetComment]: remarks.trim(),
        [evaluationContext.targetSignature]: null,
        [`${evaluationContext.isSecond ? 'rated_by_2' : 'rated_by'}`]: ratedBy.trim() || undefined,
        [`${evaluationContext.isSecond ? 'reviewed_by_2' : 'reviewed_by'}`]: reviewedBy.trim() || undefined,
        [`${evaluationContext.isSecond ? 'approved_by_2' : 'approved_by'}`]: approvedBy.trim() || undefined,
        status: derivedStatus,
        regularization_date: undefined
      }

      const response = await fetch(`${getApiUrl()}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Evaluation submitted successfully!')
        router.push('/admin-head/employee/evaluation')
      } else {
        toast.error(data.message || 'Failed to submit evaluation')
      }
    } catch (error) {
      toast.error('Connection failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <EvaluationFormSkeleton />
  }

  const firstEvaluationDate = selectedEmployee
    ? format(addMonths(new Date(selectedEmployee.date_hired), 3), 'MMMM dd, yyyy (EEEE)')
    : ''
  const firstEvaluationRemark = selectedEvaluation?.remarks_1 ?? 'N/A'
  const firstEvaluationScore = selectedEvaluation?.score_1 ?? 'N/A'
  const firstEvaluationAgreement = selectedEvaluation?.agreement_1 ?? null
  const firstEvaluationSignature = selectedEvaluation?.signature_1 ?? null
  const firstEvaluationComment = selectedEvaluation?.comment_1 ?? ''
  const secondEvaluationRemark = selectedEvaluation?.remarks_2 ?? 'N/A'
  const secondEvaluationComment = selectedEvaluation?.comment_2 ?? ''
  const firstEvaluationPassed = String(firstEvaluationRemark).toLowerCase() === 'passed'
  const firstFormattedComment = firstEvaluationRemark !== 'N/A'
    ? `${firstEvaluationRemark}: ${firstEvaluationComment || '-'}`
    : '-'
  const secondFormattedComment = secondEvaluationRemark !== 'N/A'
    ? `${secondEvaluationRemark}: ${secondEvaluationComment || '-'}`
    : '-'
  const liveComputedRemark = totalScore > 0 ? (totalScore >= 31 ? 'Passed' : 'Failed') : ''
  const hasFirstBreakdown = CRITERIA.some((criterion) => {
    const criterionId = criterion.id as CriteriaId
    return typeof firstDisplayBreakdown?.[criterionId] === 'number'
  })
  const hasSecondBreakdown = CRITERIA.some((criterion) => {
    const criterionId = criterion.id as CriteriaId
    return typeof secondDisplayBreakdown?.[criterionId] === 'number'
  })

  return (
    <div className="min-h-screen bg-slate-200 py-10 px-4 font-serif">
      {/* Action Bar */}
      <div className={`${showSideBySide ? 'max-w-[1800px]' : 'max-w-[850px]'} mx-auto mb-4 flex justify-between`}>
        <Button variant="outline" onClick={handleBackWindow} className="rounded-none border-black flex gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExportingPdf || !selectedEmployeeId}
            className="rounded-none border-black flex gap-2"
          >
            {isExportingPdf ? 'Exporting...' : <><FileDown className="w-4 h-4" /> Export PDF</>}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleSendPdfToEmail}
            disabled={isEmailSending || !selectedEmployeeId}
            className="rounded-none border-black flex gap-2"
          >
            {isEmailSending ? 'Sending...' : <><Mail className="w-4 h-4" /> Send to Email</>}
          </Button>
          {hasSavedCurrentEvaluation && !isEditMode && showSecondEvaluationPanel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditMode(true)}
              className="rounded-none border-[#7B0F2B] text-[#7B0F2B] flex gap-2"
            >
              <Pencil className="w-4 h-4" /> Edit Evaluation
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !showSecondEvaluationPanel || !isEditMode}
            className="bg-black text-white rounded-none hover:bg-slate-800 flex gap-2"
          >
            {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Evaluation</>}
          </Button>
        </div>
      </div>

      {failedFirstEvaluation && (
        <div className={`${showSideBySide ? 'max-w-[1800px]' : 'max-w-[850px]'} mx-auto mb-4 bg-white border border-slate-300 p-4`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Evaluation View</span>
            <Button
              type="button"
              size="sm"
              variant={evaluationView === 'first' ? 'default' : 'outline'}
              className="rounded-none"
              onClick={() => setEvaluationView('first')}
            >
              1st Evaluation
            </Button>
            <Button
              type="button"
              size="sm"
              variant={evaluationView === 'second' ? 'default' : 'outline'}
              className="rounded-none"
              onClick={() => setEvaluationView('second')}
            >
              2nd Evaluation
            </Button>
            <Button
              type="button"
              size="sm"
              variant={evaluationView === 'both' ? 'default' : 'outline'}
              className="rounded-none"
              onClick={() => setEvaluationView('both')}
            >
              Both (Side by Side)
            </Button>
          </div>
        </div>
      )}

      <div className={`${showSideBySide ? 'max-w-[1800px] grid grid-cols-1 xl:grid-cols-2 gap-6' : 'max-w-[850px]'} mx-auto`}>
        {showFirstEvaluationPanel && (
          <div className="bg-white shadow-2xl p-[60px] text-[13px] leading-relaxed text-black border border-slate-300">
            <div className="text-center mb-10">
              <h1 className="text-[#D32F2F] font-bold text-lg uppercase tracking-tight">INFINITECH ADVERTISING CORPORATION</h1>
              <h2 className="font-bold text-lg uppercase tracking-wider">PERFORMANCE APPRAISAL</h2>
            </div>

            <div className="space-y-2 mb-10">
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">NAME</span>
                <span className="relative inline-flex max-w-full border-b border-black pr-1">
                  <span className="text-[#D32F2F] font-bold">
                    {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : ''}
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">DEPARTMENT/JOB TITLE</span>
                <span className="relative inline-flex max-w-full border-b border-black pr-1">
                  <span className="text-[#D32F2F] font-bold">
                    {selectedEmployee ? `${employeeDetails?.department} / ${employeeDetails?.position}` : ''}
                  </span>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold whitespace-nowrap">RATING PERIOD</span>
                <span className="relative inline-flex max-w-full border-b border-black pr-1">
                  <span className="text-[#D32F2F] font-bold">
                    {selectedEmployee && (
                      <>
                        {firstEvaluationDate}
                        <span className="ml-4 text-xs italic text-slate-400 font-normal">(1st Evaluation)</span>
                      </>
                    )}
                  </span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 mb-4 border-b-2 border-transparent relative">
              <div className="col-span-10 text-center font-bold underline">CRITERIA</div>
              <div className="col-span-2 text-center font-bold underline">RATING</div>
            </div>

            <div className="space-y-6 mb-10">
              {CRITERIA.map((criterion) => {
                const criterionId = criterion.id as CriteriaId
                const criterionScore = firstDisplayBreakdown?.[criterionId]
                return (
                  <div key={criterion.id} className="grid grid-cols-12 gap-4 items-start">
                    <div className="col-span-9">
                      <div className="font-bold">{criterion.label}</div>
                      <div className="ml-6 text-[12px] whitespace-pre-wrap">{criterion.desc}</div>
                    </div>
                    <div className="col-span-3 pt-4 border-b border-black relative">
                      <div className="w-full text-center font-bold text-lg min-h-7">
                        {typeof criterionScore === 'number' ? criterionScore : '-'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {!hasFirstBreakdown && (
              <div className="mb-6 text-xs text-blue-700 border border-blue-300 bg-blue-50 p-3">
                Showing reconstructed per-criteria ratings based on saved total score.
              </div>
            )}

            <div className="flex justify-end mb-4 mr-0">
              <div className="flex items-center gap-4">
                <span className="font-bold uppercase">TOTAL SCORE</span>
                <div className="w-[180px] border-b border-black text-center font-bold text-xl text-[#D32F2F]">
                  {firstEvaluationScore}
                </div>
              </div>
            </div>

            <div className="mb-10 text-[12px]">
              <div className="flex flex-wrap items-center gap-x-2">
                <span>The above appraisal was discussed with me by my superior and I</span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border border-black rounded-full flex items-center justify-center">
                    {firstEvaluationAgreement === 'agree' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </span>
                  <span>agree</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border border-black rounded-full flex items-center justify-center">
                    {firstEvaluationAgreement === 'disagree' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </span>
                  <span>disagree on the following items:</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-20 mb-10">
              <div className="space-y-1">
                <div className="flex gap-2 font-bold">
                  <span>SIGNATURE OF EMPLOYEE:</span>
                  <div className="flex-1 border-b border-black relative">
                    {firstEvaluationSignature && (
                      <img
                        src={firstEvaluationSignature}
                        alt="Employee Signature"
                        className="absolute left-1 -top-8 h-8 object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-2 font-bold">
                  <span className="font-bold">DATE:</span>
                  <div className="flex-1 border-b border-black" />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="font-bold uppercase mb-2">EMPLOYEE SHALL BE RATED AS FOLLOWS:</div>
              <div className="ml-10 space-y-0 text-[12px]">
                <div>1 - Poor</div>
                <div>2 - Needs Improvement</div>
                <div>3 - Meets Minimum Requirement</div>
                <div>4 - Very Satisfactory</div>
                <div>5 - Outstanding</div>
              </div>
            </div>

            <div className="mb-10">
              <div className="font-bold uppercase mb-2">INTERPRETATION OF TOTAL RATING SCORE:</div>
              <div className="space-y-0 text-[12px]">
                <div>50 - 41 Highly suitable to the position</div>
                <div>40 - 31 Suitable to the position</div>
                <div>30 - 16 Fails to meet minimum requirements of the job</div>
                <div>15 - 0 Employee advise to resign</div>
              </div>
            </div>

            <div className="mb-10 font-bold flex items-center gap-6">
              <span>RECOMMENDATION: REGULAR EMPLOYMENT</span>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 border-2 border-black flex items-center justify-center ${firstEvaluationPassed ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-transparent'}`}>
                  {firstEvaluationPassed && <Check className="w-4 h-4 text-white font-bold" />}
                </div>
                <span>YES</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 border-2 border-black flex items-center justify-center ${!firstEvaluationPassed ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-transparent'}`}>
                  {!firstEvaluationPassed && <Check className="w-4 h-4 text-white font-bold" />}
                </div>
                <span>NO</span>
              </div>
            </div>

            <div className="mb-20">
              <div className="font-bold uppercase mb-2">COMMENTS / REMARKS:</div>
              <Textarea
                placeholder="Write your comments here..."
                className="w-full border-b border-black rounded-none shadow-none focus:ring-0 min-h-[100px] resize-none p-0 text-[13px] leading-relaxed italic"
                value={firstFormattedComment}
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-x-20 gap-y-2">
              <div className="flex gap-2">
                <span className="min-w-[80px]">Rated by:</span>
                <div className="flex-1 border-b border-black"></div>
              </div>
              <div className="flex gap-2">
                <span className="min-w-[40px]">Date:</span>
                <div className="flex-1 border-b border-black"></div>
              </div>
              <div className="flex gap-2">
                <span className="min-w-[80px]">Reviewed by:</span>
                <div className="flex-1 border-b border-black"></div>
              </div>
              <div className="flex gap-2">
                <span className="min-w-[40px]">Date:</span>
                <div className="flex-1 border-b border-black"></div>
              </div>
              <div className="flex gap-2">
                <span className="min-w-[80px]">Approved by:</span>
                <div className="flex-1 border-b border-black"></div>
              </div>
              <div className="flex gap-2">
                <span className="min-w-[40px]">Date:</span>
                <div className="flex-1 border-b border-black"></div>
              </div>
            </div>
          </div>
        )}

      {/* Main Document Body */}
      {showSecondEvaluationPanel && (
      <div className="bg-white shadow-2xl p-[60px] text-[13px] leading-relaxed text-black border border-slate-300">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[#D32F2F] font-bold text-lg uppercase tracking-tight">INFINITECH ADVERTISING CORPORATION</h1>
          <h2 className="font-bold text-lg uppercase tracking-wider">PERFORMANCE APPRAISAL</h2>
        </div>

        {/* Metadata section */}
        <div className="space-y-2 mb-10">
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">NAME</span>
            <span className={`${isViewDetailsMode ? 'relative inline-flex max-w-full border-b border-black pr-1' : 'w-full relative border-b border-black'}`}>
              <span className={`${isViewDetailsMode ? 'text-[#D32F2F] font-bold' : 'absolute left-0 -top-1 w-full text-[#D32F2F] font-bold'}`}>
                {isViewDetailsMode ? (
                  <span className="block h-6 leading-6">
                    {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : '[Loading Employee]'}
                  </span>
                ) : (
                  <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange}>
                    <SelectTrigger className="h-6 border-none bg-transparent p-0 shadow-none text-[#D32F2F] font-bold focus:ring-0 w-full hover:bg-transparent hover:text-rose-800 transition-colors">
                      <SelectValue placeholder="[Select Employee Here]" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableEmployees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </span>
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">DEPARTMENT/JOB TITLE</span>
            <span className="relative inline-flex max-w-full border-b border-black pr-1">
              <span className="text-[#D32F2F] font-bold">
                {selectedEmployee ? `${employeeDetails?.department} / ${employeeDetails?.position}` : ''}
              </span>
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">RATING PERIOD</span>
            <span className="relative inline-flex max-w-full border-b border-black pr-1">
              <span className="text-[#D32F2F] font-bold">
                {selectedEmployee && (
                  <>
                    {evaluationContext.ratingPeriod}
                    <span className="ml-4 text-xs italic text-slate-400 font-normal">
                      ({evaluationContext.isSecond ? '2nd' : '1st'} Evaluation)
                    </span>
                  </>
                )}
              </span>
            </span>
          </div>
        </div>

        {failedFirstEvaluation && hasSecondBreakdown && (
          <div className="mb-6 text-xs text-emerald-700 border border-emerald-300 bg-emerald-50 p-3">
            Loaded saved 2nd evaluation criteria scores for this employee. You can still update and save if needed.
          </div>
        )}
        {hasSavedCurrentEvaluation && !isEditMode && (
          <div className="mb-6 text-xs text-amber-800 border border-amber-300 bg-amber-50 p-3">
            This evaluation is locked to prevent accidental edits. Click <strong>Edit Evaluation</strong> to modify and save.
          </div>
        )}

        {/* Criteria Header */}
        <div className="grid grid-cols-12 mb-4 border-b-2 border-transparent relative">
          <div className="col-span-10 text-center font-bold underline">CRITERIA</div>
          <div className="col-span-2 text-center font-bold underline">RATING</div>
        </div>

        {/* Criteria List */}
        <div className="space-y-6 mb-10">
          {CRITERIA.map((criterion) => (
            <div key={criterion.id} className="grid grid-cols-12 gap-4 items-start">
              <div className="col-span-9">
                <div className="font-bold">{criterion.label}</div>
                <div className="ml-6 text-[12px] whitespace-pre-wrap">{criterion.desc}</div>
              </div>
              <div className="col-span-3 pt-4 border-b border-black relative">
                <input 
                  type="text" 
                  className="w-full bg-transparent text-center font-bold text-lg outline-none disabled:text-slate-500 disabled:cursor-not-allowed"
                  value={scores[criterion.id]}
                  onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                  maxLength={1}
                  disabled={!isEditMode}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Total Score */}
        <div className="flex justify-end mb-10 mr-0">
          <div className="flex items-center gap-4">
            <span className="font-bold uppercase">TOTAL SCORE</span>
            <div className="w-[180px] border-b border-black text-center font-bold text-xl">
              {totalScore || ''}
            </div>
          </div>
        </div>

        {/* Agreement Text */}
        <div className="mb-10 text-[12px]">
          <div className="flex flex-wrap items-center gap-x-2">
            <span>The above appraisal was discussed with me by my superior and I</span>
            <span className={`flex items-center gap-1 ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} onClick={() => isEditMode && setAgreement('agree')}>
              <span className={`w-3 h-3 border border-black rounded-full flex items-center justify-center`}>
                {agreement === 'agree' && <div className="w-1.5 h-1.5 bg-black rounded-full"/>}
              </span>
              <span>agree</span>
            </span>
            <span className={`flex items-center gap-1 ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} onClick={() => isEditMode && setAgreement('disagree')}>
              <span className={`w-3 h-3 border border-black rounded-full flex items-center justify-center`}>
                {agreement === 'disagree' && <div className="w-1.5 h-1.5 bg-black rounded-full"/>}
              </span>
              <span>disagree on the following items:</span>
            </span>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-20 mb-10">
          <div className="space-y-1">
            <div className="flex gap-2 font-bold">
              <span>SIGNATURE OF EMPLOYEE:</span>
              <div className="flex-1 border-b border-black"></div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex gap-2 font-bold">
              <span className="font-bold">DATE:</span>
              <div className="flex-1 border-b border-black"></div>
            </div>
          </div>
        </div>

        {/* Rating Instructions */}
        <div className="mb-8">
          <div className="font-bold uppercase mb-2">EMPLOYEE SHALL BE RATED AS FOLLOWS:</div>
          <div className="ml-10 space-y-0 text-[12px]">
            <div>1 – Poor</div>
            <div>2 – Needs Improvement</div>
            <div>3 – Meets Minimum Requirement</div>
            <div>4 – Very Satisfactory</div>
            <div>5 – Outstanding</div>
          </div>
        </div>

        {/* Interpretation */}
        <div className="mb-10">
          <div className="font-bold uppercase mb-2">INTERPRETATION OF TOTAL RATING SCORE:</div>
          <div className="space-y-0 text-[12px]">
            <div>50 – 41 Highly suitable to the position</div>
            <div>40 – 31 Suitable to the position</div>
            <div>30 – 16 Fails to meet minimum requirements of the job</div>
            <div>15 – 0 Employee advise to resign</div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="mb-10 font-bold flex items-center gap-6">
          <span>RECOMMENDATION: REGULAR EMPLOYMENT</span>
          <div className={`flex items-center gap-2 ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} onClick={() => isEditMode && setRecommendation('yes')}>
            <div className={`w-5 h-5 border-2 border-black flex items-center justify-center ${recommendation === 'yes' ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-transparent'}`}>
              {recommendation === 'yes' && <Check className="w-4 h-4 text-white font-bold" />}
            </div>
            <span>YES</span>
          </div>
          <div className={`flex items-center gap-2 ${isEditMode ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`} onClick={() => isEditMode && setRecommendation('no')}>
            <div className={`w-5 h-5 border-2 border-black flex items-center justify-center ${recommendation === 'no' ? 'bg-[#D32F2F] border-[#D32F2F]' : 'bg-transparent'}`}>
              {recommendation === 'no' && <Check className="w-4 h-4 text-white font-bold" />}
            </div>
            <span>NO</span>
          </div>
        </div>

        {/* Comment Lines / Remarks Section */}
        <div className="mb-20">
          <div className="font-bold uppercase mb-2">COMMENTS / REMARKS:</div>
          <Textarea 
            placeholder="Write your comments here..."
            className="w-full border-b border-black rounded-none shadow-none focus:ring-0 min-h-[100px] resize-none p-0 text-[13px] leading-relaxed italic"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            readOnly={!isEditMode}
          />
          <div className="mt-2 text-xs font-semibold text-[#7B0F2B]">
            {liveComputedRemark ? `${liveComputedRemark}: ${remarks.trim() || '(comment here)'}` : 'Status comment preview will appear once score is computed.'}
          </div>
          {failedFirstEvaluation && selectedEvaluation?.remarks_2 && (
            <div className="mt-1 text-[11px] text-slate-600">
              Last saved: {secondFormattedComment}
            </div>
          )}
        </div>

        {/* Manager Signatures */}
        <div className="mb-10">
          <div className="font-bold uppercase mb-2 text-[12px]">Manager Approval Signatures</div>
          <div className="grid grid-cols-2 gap-x-20 gap-y-2 bg-slate-50 border border-slate-200 p-4">
            <div className="flex gap-2 items-center">
              <span className="min-w-[80px] font-semibold">Rated by:</span>
              <input 
                type="text" 
                className="flex-1 border-b border-black bg-transparent outline-none disabled:text-slate-500 disabled:cursor-not-allowed text-[13px]"
                value={ratedBy}
                onChange={(e) => setRatedBy(e.target.value)}
                disabled={!isEditMode}
                placeholder="Enter manager name"
              />
            </div>
            <div className="flex gap-2">
              <span className="min-w-[40px]">Date:</span>
              <div className="flex-1 border-b border-black"></div>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="min-w-[80px] font-semibold">Reviewed by:</span>
              <input 
                type="text" 
                className="flex-1 border-b border-black bg-transparent outline-none disabled:text-slate-500 disabled:cursor-not-allowed text-[13px]"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                disabled={!isEditMode}
                placeholder="Enter manager name"
              />
            </div>
            <div className="flex gap-2">
              <span className="min-w-[40px]">Date:</span>
              <div className="flex-1 border-b border-black"></div>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="min-w-[80px] font-semibold">Approved by:</span>
              <input 
                type="text" 
                className="flex-1 border-b border-black bg-transparent outline-none disabled:text-slate-500 disabled:cursor-not-allowed text-[13px]"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                disabled={!isEditMode}
                placeholder="Enter manager name"
              />
            </div>
            <div className="flex gap-2">
              <span className="min-w-[40px]">Date:</span>
              <div className="flex-1 border-b border-black"></div>
            </div>
          </div>
        </div>

      </div>
      )}
      </div>
    </div>
  )
}

export default function EvaluateEmployeePage() {
  return (
    <Suspense fallback={<EvaluationFormSkeleton />}>
      <EvaluateEmployeeForm />
    </Suspense>
  )
}
