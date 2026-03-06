"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, UserCheck, TrendingUp, PieChart, Search, Download, Plus } from 'lucide-react'
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
  updated_at?: string
}

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
  const [statusFilter, setStatusFilter] = useState<'All' | 'Probee' | 'Regular' | 'Failed'>('All')

  useEffect(() => {
    fetchData()
  }, [])

  const deriveStatusFromRemarks = (evalData?: Partial<Evaluation>) => {
    const remarks1 = String(evalData?.remarks_1 ?? '').toLowerCase()
    const remarks2 = String(evalData?.remarks_2 ?? '').toLowerCase()
    const hasFailed = remarks1 === 'failed' || remarks2 === 'failed'
    const hasPassed = remarks1 === 'passed' || remarks2 === 'passed'

    if (hasFailed) return 'Failed'
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
    
    const rawStatus = String(evaluation?.status ?? '').trim().toLowerCase()
    let normalizedStatus = ''
    if (rawStatus === 'regular' || rawStatus === 'regularized') normalizedStatus = 'Regular'
    else if (rawStatus === 'for recommendation') normalizedStatus = 'For Recommendation'
    else if (rawStatus === 'failed') normalizedStatus = 'Failed'
    else if (rawStatus === 'probee') normalizedStatus = 'Probee'

    let regularizationDate = null
    if (normalizedStatus === 'Regular' && evaluation?.regularization_date) {
      regularizationDate = new Date(evaluation.regularization_date)
    } else if (normalizedStatus === 'Regular' && evaluation?.updated_at) {
      regularizationDate = new Date(evaluation.updated_at)
    }

    const status = normalizedStatus || 'Probee'
    
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

  const saveEvaluation = async (employeeId: string, isRecommend = false) => {
    const currentEval = evaluations[employeeId]
    if (!currentEval) return

    const evalData = { ...currentEval }
    const derivedStatus = deriveStatusFromRemarks(evalData)
    if (isRecommend) {
      evalData.status = 'Regular'
      const today = new Date()
      evalData.regularization_date = format(today, 'yyyy-MM-dd')
    } else {
      evalData.status = derivedStatus
      evalData.regularization_date = undefined
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
        toast.success(isRecommend ? 'Employee recommended to Regular status' : 'Evaluation saved successfully')
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
    
    // Probee first, then Regular
    const order: Record<string, number> = { 'Probee': 0, 'Regular': 1, 'Regularized': 1 }
    return (order[statusA] ?? 10) - (order[statusB] ?? 10)
  })

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
        <div className="w-full py-12 px-8 space-y-12">
          {/* Header Skeleton */}
          <div className="bg-slate-200/50 h-32 w-full rounded-3xl animate-pulse flex flex-col justify-center px-8 space-y-3">
             <Skeleton className="h-10 w-64" />
             <Skeleton className="h-4 w-96" />
          </div>
          
          <div className="space-y-8">
            <Skeleton className="h-[600px] w-full rounded-3xl" />
          </div>
        </div>
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
                Total Employed: {employees.length}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <Calendar className="h-4 w-4" />
                Under Probation: {employees.filter(e => getDatesForEmployee(e)?.status === 'Probee').length}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <TrendingUp className="h-4 w-4" />
                Regular Employees: {employees.filter(e => ['Regular', 'Regularized'].includes(getDatesForEmployee(e)?.status || '')).length}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 h-10 rounded-lg font-bold transition-all flex items-center gap-2 text-xs md:text-sm w-full lg:w-auto">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
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
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Employed', value: employees.length, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Under Probation', value: employees.filter(e => getDatesForEmployee(e)?.status === 'Probee').length, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Regular Employees', value: employees.filter(e => ['Regular', 'Regularized'].includes(getDatesForEmployee(e)?.status || '')).length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Failed Employees', value: employees.filter(e => getDatesForEmployee(e)?.status === 'Failed').length, icon: X, color: 'text-rose-600', bg: 'bg-rose-50' },
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`${stat.bg} p-4 rounded-2xl`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                {(['All', 'Probee', 'Regular', 'Failed'] as const).map((status) => (
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
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">1st Evaluation</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Score</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Remarks</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">2nd Evaluation</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Score</th>
                  <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Remarks</th>
                   <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Regularization</th>
                   <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider border-r border-[#FFE5EC]/50 whitespace-nowrap text-center">Eval Status</th>
                   <th className="px-6 py-4 text-left font-bold text-[#800020] text-[11px] uppercase tracking-wider whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-12 text-center text-slate-400 italic">
                      No active records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const dates = getDatesForEmployee(emp)
                    const currentEvalStatus = String(evaluations[emp.id]?.status ?? persistedEvaluations[emp.id]?.status ?? dates?.status ?? '')
                    const persistedStatus = String(persistedEvaluations[emp.id]?.status ?? '').trim()
                    const hasPersistedDecision = persistedStatus.length > 0
                    const isRecommended = currentEvalStatus === 'Regular' || currentEvalStatus === 'Regularized'
                    const isEditing = Boolean(editingScores[emp.id])
                    const isLocked = (isRecommended || hasPersistedDecision || Boolean(lockedScores[emp.id])) && !isEditing
                    const remarks1 = evaluations[emp.id]?.remarks_1 ?? persistedEvaluations[emp.id]?.remarks_1
                    const remarks2 = evaluations[emp.id]?.remarks_2 ?? persistedEvaluations[emp.id]?.remarks_2
                    const score1 = evaluations[emp.id]?.score_1 ?? persistedEvaluations[emp.id]?.score_1
                    const score2 = evaluations[emp.id]?.score_2 ?? persistedEvaluations[emp.id]?.score_2
                    const isForRecommendation = remarks1 === 'Passed' || remarks2 === 'Passed'

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
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          } border shadow-none font-bold px-3 py-1 uppercase text-[10px] pointer-events-none rounded-full`}>
                            {dates?.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold text-[13px] border-r border-rose-50/30 italic whitespace-nowrap text-center">
                          {dates?.firstEval || '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 text-[14px] border-r border-rose-50/30 text-center">
                          {score1 ?? <span className="text-slate-300 italic text-xs font-normal">N/A</span>}
                        </td>
                        <td className="px-6 py-4 border-r border-rose-50/30 text-center">
                          {remarks1 ? (
                            <Badge variant="outline" className={`font-bold px-2 py-0.5 uppercase text-[9px] rounded-md ${
                              remarks1 === 'Passed'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                : 'border-rose-200 text-rose-700 bg-rose-50'
                            }`}>
                              {remarks1}
                            </Badge>
                          ) : <span className="text-slate-300 italic text-[10px]">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold text-[13px] border-r border-rose-50/30 italic whitespace-nowrap text-center">
                          {dates?.secondEval || '-'}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700 text-[14px] border-r border-rose-50/30 text-center">
                          {score2 ?? <span className="text-slate-300 italic text-xs font-normal">N/A</span>}
                        </td>
                        <td className="px-6 py-4 border-r border-rose-50/30 text-center">
                          {remarks2 ? (
                            <Badge variant="outline" className={`font-bold px-2 py-0.5 uppercase text-[9px] rounded-md ${
                              remarks2 === 'Passed'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                                : 'border-rose-200 text-rose-700 bg-rose-50'
                            }`}>
                              {remarks2}
                            </Badge>
                          ) : <span className="text-slate-300 italic text-[10px]">N/A</span>}
                        </td>
                         <td className="px-6 py-4 font-bold text-[#A4163A] text-sm whitespace-nowrap text-center border-r border-rose-50/30">
                           {dates?.regularization || '-'}
                         </td>
                         <td className="px-6 py-4 border-r border-rose-50/30 text-center">
                           {currentEvalStatus === 'Regular' || currentEvalStatus === 'Regularized' ? (
                             <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 uppercase text-[9px] rounded-md whitespace-nowrap">
                               Recommended
                             </Badge>
                           ) : isForRecommendation ? (
                             <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 font-bold px-2 py-0.5 uppercase text-[9px] rounded-md">
                               For Recommendation
                             </Badge>
                           ) : currentEvalStatus ? (
                             <Badge variant="outline" className={`font-bold px-2 py-0.5 uppercase text-[9px] rounded-md ${
                               currentEvalStatus === 'Failed'
                                 ? 'border-rose-200 text-rose-700 bg-rose-50'
                                 : 'border-amber-200 text-amber-700 bg-amber-50'
                             }`}>
                               {currentEvalStatus}
                             </Badge>
                           ) : <span className="text-slate-300 italic text-[10px]">None</span>}
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
