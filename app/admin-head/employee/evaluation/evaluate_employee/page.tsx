"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Button,
  Badge,
  Input
} from '@/components/ui'
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
  Search,
  Check,
  Circle
} from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

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
]

export default function EvaluateEmployeePage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({})
  const [departments, setDepartments] = useState<Department[]>([])
  const [offices, setOffices] = useState<Office[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Scoring State
  const [scores, setScores] = useState<Record<string, string>>({
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
  })
  const [remarks, setRemarks] = useState('')
  const [agreement, setAgreement] = useState<'agree' | 'disagree' | null>(null)
  const [recommendation, setRecommendation] = useState<'yes' | 'no' | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

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

  const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmployeeId), [selectedEmployeeId, employees])

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

  const handleScoreChange = (id: string, value: string) => {
    const cleaned = value.replace(/[^1-5]/g, '').slice(0, 1)
    setScores(prev => ({ ...prev, [id]: cleaned }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeId) return toast.error('Please select an employee')
    if (Object.values(scores).some(s => s === '')) return toast.error('Please complete all rating criteria')

    setIsSubmitting(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmployeeId,
          score_1: totalScore,
          remarks_1: remarks,
          status: recommendation === 'yes' ? 'Regular' : 'Probee' 
        })
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
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-200 py-10 px-4 font-serif">
      {/* Action Bar */}
      <div className="max-w-[850px] mx-auto mb-4 flex justify-between">
        <Button variant="outline" onClick={() => router.back()} className="rounded-none border-black flex gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting} 
          className="bg-black text-white rounded-none hover:bg-slate-800 flex gap-2"
        >
          {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Evaluation</>}
        </Button>
      </div>

      {/* Main Document Body */}
      <div className="max-w-[850px] mx-auto bg-white shadow-2xl p-[60px] text-[13px] leading-relaxed text-black border border-slate-300">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[#D32F2F] font-bold text-lg uppercase tracking-tight">INFINITECH ADVERTISING CORPORATION</h1>
          <h2 className="font-bold text-lg uppercase tracking-wider">PERFORMANCE APPRAISAL</h2>
        </div>

        {/* Metadata section */}
        <div className="space-y-2 mb-10">
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">NAME</span>
            <span className="w-full relative border-b border-black">
              <span className="absolute left-0 -top-0.5 text-[#D32F2F] font-bold">
                {selectedEmployee ? employeeDetails?.name : (
                  <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                    <SelectTrigger className="h-6 border-none bg-transparent p-0 shadow-none text-rose-700 font-bold focus:ring-0">
                      <SelectValue placeholder="[Select Employee Here]" />
                    </SelectTrigger>
                    <SelectContent>
                      {probeeEmployees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </span>
              <span className="ml-[180px] font-bold">:</span>
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">DEPARTMENT/JOB TITLE</span>
            <span className="w-full relative border-b border-black">
              <span className="absolute left-0 -top-0.5 text-[#D32F2F] font-bold">
                {selectedEmployee ? `${employeeDetails?.department} / ${employeeDetails?.position}` : ''}
              </span>
              <span className="ml-[180px] font-bold">:</span>
            </span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">RATING PERIOD</span>
            <span className="w-full relative border-b border-black">
              <span className="absolute left-0 -top-0.5 text-[#D32F2F] font-bold">
                {format(new Date(), 'MMMM yyyy')}
              </span>
              <span className="ml-[180px] font-bold">:</span>
            </span>
          </div>
        </div>

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
                  className="w-full bg-transparent text-center font-bold text-lg outline-none"
                  value={scores[criterion.id]}
                  onChange={(e) => handleScoreChange(criterion.id, e.target.value)}
                  maxLength={1}
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
            <span className="flex items-center gap-1 cursor-pointer" onClick={() => setAgreement('agree')}>
              <span className={`w-3 h-3 border border-black rounded-full flex items-center justify-center`}>
                {agreement === 'agree' && <div className="w-1.5 h-1.5 bg-black rounded-full"/>}
              </span>
              <span>agree</span>
            </span>
            <span className="flex items-center gap-1 cursor-pointer" onClick={() => setAgreement('disagree')}>
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
              <span className="text-[#0000FF] underline">DATE:</span>
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRecommendation('yes')}>
            <span className="w-10 border-b border-black text-center">{recommendation === 'yes' ? '___' : '___'}</span>
            <span>YES</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRecommendation('no')}>
            <span className="w-10 border-b border-black text-center">{recommendation === 'no' ? '___' : '___'}</span>
            <span>NO</span>
          </div>
        </div>

        {/* Comment Lines */}
        <div className="space-y-2 mb-20">
          <div className="border-b border-black h-4 w-full"></div>
          <div className="border-b border-black h-4 w-full"></div>
          <div className="border-b border-black h-4 w-full"></div>
        </div>

        {/* Manager Signatures */}
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
    </div>
  )
}
