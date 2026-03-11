"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, UserCheck, TrendingUp, PieChart, Search, Plus, ThumbsUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { format, addMonths } from 'date-fns'

interface Employee {
  id: string
  first_name: string
  last_name: string
  date_hired: string
  status: 'pending' | 'employed' | 'terminated' | 'rehire_pending' | 'rehired_employee'
  position: string
  regularization_date: string | null
}

interface Evaluation {
  employee_id: string
  score_1: number | null
  remarks_1: string | null
  score_2: number | null
  remarks_2: string | null
  status: string | null
  regularization_date?: string
}

const EvaluationSkeleton = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    {/* White Header Skeleton */}
    <div className="bg-white border-b border-slate-200 shadow-sm h-48 w-full animate-pulse px-8 py-6 flex flex-col justify-center">
      <Skeleton className="h-10 w-64 bg-slate-200 mb-3" />
      <Skeleton className="h-4 w-96 bg-slate-100 mb-6" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40 bg-slate-100 rounded-lg" />
        <Skeleton className="h-10 w-40 bg-slate-100 rounded-lg" />
        <Skeleton className="h-10 w-40 bg-slate-100 rounded-lg" />
      </div>
    </div>
    <div className="p-8 space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-8 animate-pulse shadow-sm">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-80 bg-slate-100" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-60 bg-slate-50" />
            <Skeleton className="h-10 w-48 bg-slate-50" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-slate-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default function EvaluationPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>({})
  const [persistedEvaluations, setPersistedEvaluations] = useState<Record<string, Evaluation>>({})
  const [lockedScores, setLockedScores] = useState<Record<string, boolean>>({})
  const [editingScores, setEditingScores] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Probee' | 'For Recommendation' | 'Regular' | 'Failed'>('All')
  const [editingRegularization, setEditingRegularization] = useState<Record<string, boolean>>({})
  const [regularizationDates, setRegularizationDates] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const deriveStatusFromRemarks = (evalData?: Partial<Evaluation>) => {
    const remarks1 = String(evalData?.remarks_1 ?? '').toLowerCase()
    const remarks2 = String(evalData?.remarks_2 ?? '').toLowerCase()
    const secondEvalFailed = remarks2 === 'failed'
    const hasPassedAtLeastOne = remarks1 === 'passed' || remarks2 === 'passed'

    // Only show Failed if 2nd evaluation failed (final decision)
    if (secondEvalFailed) return 'Failed'
    // Show For Recommendation if they passed at least one evaluation
    if (hasPassedAtLeastOne) return 'For Recommendation'
    return 'Probee'
  }

  const fetchData = async () => {
    await Promise.all([fetchEmployees(), fetchEvaluations()])
  }

  const fetchEvaluations = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/evaluations`)
      const data = await response.json()
      if (data.success) {
        const evalMap: Record<string, Evaluation> = {}
        data.data.forEach((evalItem: Evaluation) => {
          evalMap[evalItem.employee_id] = evalItem
        })
        setEvaluations(evalMap)
        setPersistedEvaluations(JSON.parse(JSON.stringify(evalMap)))
      }
    } catch (error) {
      console.error('Error fetching evaluations:', error)
    }
  }

  const fetchEmployees = async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const response = await fetch(`${getApiUrl()}/api/employees`)
      const data = await response.json()
      if (data.success) {
        // Only show employed or rehired_employee
        const activeEmployees = data.data.filter((emp: Employee) => 
          emp.status === 'employed' || emp.status === 'rehired_employee'
        )
        setEmployees(activeEmployees)
      } else {
        setFetchError(data.message || 'Failed to load employees')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setFetchError('Connection failed. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const calculateEvaluationDates = (dateHired: string, evaluationContext?: { id?: string } & Partial<Evaluation>) => {
    if (!dateHired) return null
    const hiredDate = new Date(dateHired)
    
    const liveEvaluation = evaluations[evaluationContext?.id || '']
    const evaluation = (liveEvaluation || evaluationContext || {}) as Partial<Evaluation>
    
    const firstEval = addMonths(hiredDate, 3)
    const secondEval = addMonths(hiredDate, 5)
    
    // Check if employee has regularization date set
    const hasRegularizationDate = evaluation?.regularization_date && evaluation.regularization_date !== ''
    
    // Check evaluation results
    const remarks1 = String(evaluation?.remarks_1 ?? '').toLowerCase()
    const remarks2 = String(evaluation?.remarks_2 ?? '').toLowerCase()
    const secondEvalFailed = remarks2 === 'failed'
    const hasPassedAtLeastOne = remarks1 === 'passed' || remarks2 === 'passed'
    
    // Status logic priority: 
    // 1. If regularization date is set → Regular (admin manually sets)
    // 2. If 2nd evaluation failed → Failed (final decision)
    // 3. If passed at least 1 evaluation → For Recommendation (pending admin action)
    // 4. Otherwise → Probee (default)
    let status = 'Probee'
    if (hasRegularizationDate) {
      status = 'Regular'
    } else if (secondEvalFailed) {
      status = 'Failed'
    } else if (hasPassedAtLeastOne) {
      status = 'For Recommendation'
    }

    let regularizationDate = null
    if (hasRegularizationDate) {
      regularizationDate = new Date(evaluation.regularization_date!)
    }
    
    return {
      firstEval: format(firstEval, 'MMMM d, yyyy'),
      secondEval: format(secondEval, 'MMMM d, yyyy'),
      regularization: regularizationDate ? format(regularizationDate, 'MMMM d, yyyy') : '-',
      status
    }
  }

  // Helper to calculate dates for an employee
  const getDatesForEmployee = (emp: Employee) => {
    const evalRecord = evaluations[emp.id] || persistedEvaluations[emp.id]
    if (evalRecord) {
      return calculateEvaluationDates(emp.date_hired, { id: emp.id, ...evalRecord })
    }
    return calculateEvaluationDates(emp.date_hired)
  }

  const getStatusForFilter = (emp: Employee) => {
    const persisted = persistedEvaluations[emp.id]
    if (persisted) {
      return calculateEvaluationDates(emp.date_hired, { id: emp.id, ...persisted })?.status || 'Probee'
    }
    return calculateEvaluationDates(emp.date_hired)?.status || 'Probee'
  }

  const handleScoreChange = (employeeId: string, scoreType: 'score_1' | 'score_2', value: string) => {
    // Restrict to numbers only and max 2 digits
    const cleanedValue = value.replace(/[^0-9]/g, '').slice(0, 2)
    const score = cleanedValue === '' ? null : parseInt(cleanedValue)
    const remarks = score === null ? null : (score >= 31 ? 'Passed' : 'Failed')
    
    setEvaluations(prev => {
      const updated = {
        ...(prev[employeeId] || { employee_id: employeeId, score_1: null, remarks_1: null, score_2: null, remarks_2: null, status: null }),
        [scoreType]: score,
        [scoreType === 'score_1' ? 'remarks_1' : 'remarks_2']: remarks
      };
      if (scoreType === 'score_1' && remarks === 'Passed') {
        updated.score_2 = 0
        updated.remarks_2 = 'Failed'
      }
      updated.status = deriveStatusFromRemarks(updated);
      
      return {
        ...prev,
        [employeeId]: updated
      };
    })
  }

  const saveEvaluation = async (employeeId: string) => {
    const currentEval = evaluations[employeeId]
    if (!currentEval) return

    const evalData = { ...currentEval }
    const derivedStatus = deriveStatusFromRemarks(evalData)
    // When saving evaluation, preserve existing regularization_date if it exists
    // Status is derived from evaluation results, not from regularization date
    evalData.status = derivedStatus
    // Don't clear regularization_date if it already exists
    const existingEval = persistedEvaluations[employeeId]
    if (existingEval?.regularization_date) {
      evalData.regularization_date = existingEval.regularization_date
    }

    setIsActionLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evalData)
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Evaluation saved successfully')
        setLockedScores(prev => ({ ...prev, [employeeId]: true }))
        setEditingScores(prev => ({ ...prev, [employeeId]: false }))
        fetchData() // Refresh to get updated regularization dates and status
      } else {
        toast.error(data.message || 'Failed to save evaluation')
      }
    } catch (error) {
      console.error('Error saving evaluation:', error)
      toast.error('Connection failed')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRegularizationDateChange = async (employeeId: string, date: string) => {
    setRegularizationDates(prev => ({ ...prev, [employeeId]: date }))
    
    // Auto-save when date is set
    if (date) {
      setIsActionLoading(true)
      try {
        const currentEval = evaluations[employeeId] || persistedEvaluations[employeeId] || {
          employee_id: employeeId,
          score_1: null,
          remarks_1: null,
          score_2: null,
          remarks_2: null,
          status: null
        }
        
        const response = await fetch(`${getApiUrl()}/api/evaluations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...currentEval,
            regularization_date: date,
            status: 'Regular'
          })
        })
        const data = await response.json()
        if (data.success) {
          toast.success('Regularization date saved')
          fetchData()
        } else {
          toast.error(data.message || 'Failed to save regularization date')
        }
      } catch (error) {
        console.error('Error saving regularization date:', error)
        toast.error('Connection failed')
      } finally {
        setIsActionLoading(false)
      }
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.includes(searchQuery)
    const status = getStatusForFilter(emp)
    const matchesStatus = statusFilter === 'All' ? true : status === statusFilter
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    const statusA = getStatusForFilter(a)
    const statusB = getStatusForFilter(b)
    
    // Sort order: Probee → For Recommendation → Failed → Regular
    const order: Record<string, number> = { 'Probee': 0, 'For Recommendation': 1, 'Failed': 2, 'Regular': 3, 'Regularized': 3 }
    return (order[statusA] ?? 10) - (order[statusB] ?? 10)
  })

  // Shared counters so navbar and table summaries stay consistent.
  const totalEmployedCount = employees.length
  const underProbationCount = employees.filter(e => getDatesForEmployee(e)?.status === 'Probee').length
  const forRecommendationCount = employees.filter(e => getDatesForEmployee(e)?.status === 'For Recommendation').length
  const regularEmployeesCount = employees.filter(e => ['Regular', 'Regularized'].includes(getDatesForEmployee(e)?.status || '')).length
  const failedEmployeesCount = employees.filter(e => getDatesForEmployee(e)?.status === 'Failed').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ----- GLOBAL LOADING OVERLAY (For Actions Only) ----- */}
      {isActionLoading && (
        <div className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white/80 backdrop-blur-xl w-[400px] h-auto p-12 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center gap-10 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-14 h-14 border-[3px] border-slate-100 border-t-[#A4163A] rounded-full animate-spin" />
            </div>
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Loading...</h1>
            </div>
          </div>
        </div>
      )}

      {fetchError ? (
        <div className="min-h-screen flex items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="bg-white/80 backdrop-blur-xl w-[500px] h-auto p-16 rounded-[48px] shadow-2xl shadow-slate-200/50 border border-slate-200/60 flex flex-col items-center">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-8 group">
              <Badge variant="outline" className="h-14 w-14 border-rose-200 bg-white shadow-sm flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <X className="w-8 h-8 text-rose-500" />
              </Badge>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Connection Failed</h3>
            <p className="text-slate-500 text-lg max-w-md mx-auto mb-10 leading-relaxed">
              {fetchError} Please ensure the backend server is running and try again.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#A4163A] hover:bg-[#80122D] text-white px-10 h-14 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-lg"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      ) : loading ? (
        <EvaluationSkeleton />
      ) : (
        <>
      {/* Header aligned with Hierarchy Management styling */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Employee Evaluation</h1>
              <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                <PieChart className="w-4 h-4" />
                Manage employee evaluations and performance reviews
              </p>
            </div>

          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-bold uppercase tracking-wider text-white/85">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <UserCheck className="h-4 w-4" />
                Total Employed: {totalEmployedCount}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <Calendar className="h-4 w-4" />
                Under Probation: {underProbationCount}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <ThumbsUp className="h-4 w-4" />
                For Recommendation: {forRecommendationCount}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <TrendingUp className="h-4 w-4" />
                Regular Employees: {regularEmployeesCount}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <X className="h-4 w-4" />
                Failed Employees: {failedEmployeesCount}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Button
                onClick={() => router.push('/admin-head/employee/evaluation/evaluate_employee')}
                className="bg-white text-[#7B0F2B] hover:bg-rose-50 px-4 h-10 rounded-lg font-bold transition-all flex items-center gap-2 text-xs md:text-sm w-full lg:w-auto"
              >
                <Plus className="w-4 h-4" />
                Evaluate an Employee
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-8 pb-12">

        {/* Monitoring Table Section matching Masterfile design */}
        <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-xl flex flex-col">
          <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="text-2xl text-[#4A081A] font-bold flex items-center gap-3">
                <PieChart className="w-6 h-6" />
                EVALUATION MONITORING FOR {new Date().getFullYear()} - {new Date().getFullYear() + 1}
              </h3>
              <div className="text-[#A0153E]/70 flex items-center gap-2 text-xs font-bold uppercase mt-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C9184A]" />
                <span>Tracking employee progression milestones</span>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input 
                  placeholder="Search candidates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 bg-stone-50/50 border-[#FFE5EC] focus:border-[#C9184A] rounded-xl text-sm"
                />
              </div>
              <div className="flex items-center gap-2 bg-[#FFE5EC]/40 border border-[#FFE5EC] rounded-xl p-1 h-11">
                {(['All', 'Probee', 'For Recommendation', 'Regular', 'Failed'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 h-9 rounded-lg text-[11px] font-extrabold uppercase tracking-wide transition-all ${
                      statusFilter === status
                        ? 'bg-white text-[#7B0F2B] shadow-sm'
                        : 'text-[#7B0F2B]/70 hover:text-[#7B0F2B]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
                <tr>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap">ID Number</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap">Date Hired</th>
                  <th className="px-6 py-4 text-center font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Date of 1st Evaluation</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Score</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Remarks</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Date of 2nd Evaluation</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Score</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Remarks</th>
                   <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Date of Regularization</th>
                   <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-400 italic">
                      No active records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const dates = getDatesForEmployee(emp)
                    const evalData = evaluations[emp.id] ?? persistedEvaluations[emp.id]
                    const remarks1 = evalData?.remarks_1 ?? null
                    const remarks2 = evalData?.remarks_2 ?? null
                    const score1 = evalData?.score_1 ?? null
                    const score2 = evalData?.score_2 ?? null
                    const hasTakenFirstEvaluation = score1 !== null && score1 !== undefined
                    const hasPassedFirstEvaluation = remarks1 === 'Passed'
                    const shouldShowSecondEvaluationDetails = hasTakenFirstEvaluation && !hasPassedFirstEvaluation
                    const hasRegularizationDate = evalData?.regularization_date && evalData.regularization_date !== ''
                    const hasPassedEvaluation = remarks1 === 'Passed' || remarks2 === 'Passed'
                    
                    // Determine remarks display: only show 'Regularized' if they passed that specific evaluation AND regularization date is set
                    const displayRemarks1 = (hasRegularizationDate && remarks1 === 'Passed') ? 'Regularized' : (remarks1 || 'Pending')
                    const displayRemarks2 = (hasRegularizationDate && remarks2 === 'Passed') ? 'Regularized' : (remarks2 || 'Pending')

                    return (
                      <tr key={emp.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200 group">
                        <td className="px-6 py-4 font-bold text-[#630C22] border-r border-rose-50/30 whitespace-nowrap">{emp.id}</td>
                        <td className="px-6 py-4 border-r border-rose-50/30">
                          <div className="font-bold text-slate-800 text-base group-hover:text-[#630C22] transition-colors">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-slate-500 text-[11px] font-semibold uppercase">{emp.position}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium border-r border-rose-50/30 whitespace-nowrap">
                          {emp.date_hired ? format(new Date(emp.date_hired), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 border-r border-rose-50/30 text-center">
                          <Badge className={`${
                            dates?.status === 'Regular' || dates?.status === 'Regularized'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : dates?.status === 'For Recommendation'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : dates?.status === 'Failed'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          } border shadow-none font-bold px-3 py-1 uppercase text-[10px] pointer-events-none rounded-full`}>
                            {dates?.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold text-[13px] border-r border-rose-50/30 italic whitespace-nowrap text-center">
                          {dates?.firstEval || '-'}
                        </td>
                        <td className={`px-6 py-4 font-bold text-[14px] border-r border-rose-50/30 text-center ${
                          remarks1 === 'Passed' ? 'text-emerald-600' : remarks1 === 'Failed' ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {score1 ?? <span className="text-slate-300 italic text-xs font-normal">-</span>}
                        </td>
                        <td className="px-6 py-4 border-r border-rose-50/30 text-center">
                          <Badge variant="outline" className={`font-bold px-2 py-0.5 uppercase text-[9px] rounded-md ${
                            displayRemarks1 === 'Regularized'
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                              : displayRemarks1 === 'Passed'
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                              : displayRemarks1 === 'Failed'
                              ? 'border-rose-200 text-rose-700 bg-rose-50'
                              : 'border-amber-200 text-amber-700 bg-amber-50'
                          }`}>
                            {displayRemarks1}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold text-[13px] border-r border-rose-50/30 italic whitespace-nowrap text-center">
                          {shouldShowSecondEvaluationDetails ? (dates?.secondEval || '-') : '-'}
                        </td>
                        <td className={`px-6 py-4 font-bold text-[14px] border-r border-rose-50/30 text-center ${
                          remarks2 === 'Passed' ? 'text-emerald-600' : remarks2 === 'Failed' ? 'text-rose-600' : 'text-slate-700'
                        }`}>
                          {shouldShowSecondEvaluationDetails
                            ? (score2 ?? <span className="text-slate-300 italic text-xs font-normal">-</span>)
                            : <span className="text-slate-300 italic text-xs font-normal">-</span>}
                        </td>
                        <td className="px-6 py-4 border-r border-rose-50/30 text-center">
                          {shouldShowSecondEvaluationDetails ? (
                            <Badge variant="outline" className={`font-bold px-2 py-0.5 uppercase text-[9px] rounded-md ${
                              displayRemarks2 === 'Regularized'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                : displayRemarks2 === 'Passed'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                : displayRemarks2 === 'Failed'
                                ? 'border-rose-200 text-rose-700 bg-rose-50'
                                : 'border-amber-200 text-amber-700 bg-amber-50'
                            }`}>
                              {displayRemarks2}
                            </Badge>
                          ) : (
                            <span className="text-slate-300 italic text-xs font-normal">-</span>
                          )}
                        </td>
                         <td className="px-6 py-4 text-sm whitespace-nowrap text-center border-r border-rose-50/30">
                           {hasPassedEvaluation ? (
                             <Input
                               type="date"
                               value={regularizationDates[emp.id] || evalData?.regularization_date || ''}
                               onChange={(e) => handleRegularizationDateChange(emp.id, e.target.value)}
                               className="h-8 text-xs border-[#A4163A]/30 focus:border-[#A4163A]"
                               placeholder="Set date"
                             />
                           ) : (
                             <span className="text-slate-300 italic text-xs font-normal">-</span>
                           )}
                         </td>
                        <td className="px-6 py-4 text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-lg font-bold transition-all text-[#630C22] border-[#630C22] hover:bg-[#630C22] hover:text-white"
                            onClick={() => router.push(`/admin-head/employee/evaluation/evaluate_employee?id=${emp.id}`)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  )
}
