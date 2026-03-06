"use client"

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui'
import { Button } from '@/components/ui'
import {
  UserPlus,
  UserMinus,
  FileText,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  Check,
  Activity,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui'
import {
  fetchActivityLogs,
  type ActivityLog
} from '@/lib/api/activity-logs'

// Activity types
type ActivityType = 'employee' | 'department' | 'position' | 'attendance' | 'system' | 'auth'
type ActivityStatus = 'success' | 'warning' | 'error' | 'info'

// Tardiness entry shape from the tardiness API
interface TardinessEntry {
  id: string | number
  employee_name: string
  date: string
  actual_in: string
  minutes_late: number
  warning_level: number
  cutoff_period?: string
  month: string
  year: number
}

// Human-readable ordinal for warning level
function warningLabel(level: number): string {
  if (level === 1) return '1st Warning'
  if (level === 2) return '2nd Warning'
  if (level === 3) return '3rd Warning'
  if (level > 3) return `${level}th Warning`
  return ''
}

// Format time from 24h or mixed format to 12h AM/PM
function formatTime12h(timeStr: string): string {
  if (!timeStr) return timeStr
  // Handle HH:MM or HH:MM:SS
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})/)
  if (match24) {
    let h = parseInt(match24[1])
    const m = match24[2]
    const ampm = h >= 12 ? 'PM' : 'AM'
    if (h > 12) h -= 12
    if (h === 0) h = 12
    return `${h}:${m} ${ampm}`
  }
  return timeStr
}

// Format date string to "Month DD, YYYY"
function formatReadableDate(dateStr: string): string {
  if (!dateStr) return dateStr
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

const getActivityIcon = (type: string, action: string) => {
  if (type === 'employee') {
    if (action === 'created') return <UserPlus className="w-5 h-5" />
    if (action === 'deleted' || action === 'terminated') return <UserMinus className="w-5 h-5" />
    return <CheckCircle className="w-5 h-5" />
  }
  if (type === 'attendance') return <Clock className="w-5 h-5" />
  if (type === 'department' || type === 'position') return <FileText className="w-5 h-5" />
  if (type === 'system') return <Settings className="w-5 h-5" />
  if (type === 'auth') return <Calendar className="w-5 h-5" />
  return <AlertCircle className="w-5 h-5" />
}

export default function AdminHeadPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Tardiness entry state
  const [tardinessEntries, setTardinessEntries] = useState<TardinessEntry[]>([])
  const [tardinessLoading, setTardinessLoading] = useState(true)
  const [tardinessError, setTardinessError] = useState<string | null>(null)

  const loadActivities = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const response = await fetchActivityLogs({
        type: activeTab === 'all' ? undefined : activeTab,
        search: searchQuery || undefined,
        page: currentPage,
        per_page: 15,
      })

      setActivities(response.data)
      setTotalPages(response.pagination.last_page)
    } catch (err) {
      setError('Failed to load activity logs. Please try again.')
      toast.error('Failed to load activity logs', {
        description: 'Please check your connection and try again.'
      })
      console.error('Error loading activities:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, [activeTab, currentPage])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadActivities()
      } else {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadTardinessActivities = async () => {
    try {
      setTardinessLoading(true)
      setTardinessError(null)
      const now = new Date()
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const month = monthNames[now.getMonth()]
      const year = now.getFullYear()
      const res = await fetch(`/api/admin-head/attendance/tardiness?month=${month}&year=${year}`)
      const data = await res.json()
      if (data.success) {
        // Sort by date descending (most recent first), take top 10
        const sorted: TardinessEntry[] = (data.data as TardinessEntry[])
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10)
        setTardinessEntries(sorted)
      } else {
        setTardinessError('Failed to load tardiness records.')
      }
    } catch {
      setTardinessError('Failed to load tardiness records.')
    } finally {
      setTardinessLoading(false)
    }
  }

  useEffect(() => {
    loadTardinessActivities()
  }, [])

  const handleRefresh = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    } else {
      loadActivities(true)
    }
    loadTardinessActivities()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setCurrentPage(1)
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-2">
      <div className="relative w-full sticky top-0 z-10">
        {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
        <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md">
          {/* Main Header Row */}
          <div className="w-full px-4 md:px-8 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">Activity Logs</h1>
                <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  ABIC REALTY & CONSULTANCY - Real-time Monitoring
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all rounded-full px-5 py-2 h-auto text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                  <span>REFRESH</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Secondary Toolbar */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-full px-4 md:px-8 py-3">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {/* Category Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white/70 uppercase tracking-wider">CATEGORY</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[200px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                        <span className="capitalize">{activeTab} Activities</span>
                        <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border-stone-200 shadow-xl rounded-xl p-1.5" align="start">
                      {['all', 'employee', 'department', 'position', 'attendance', 'auth'].map(tab => (
                        <DropdownMenuItem
                          key={tab}
                          onClick={() => handleTabChange(tab)}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                            activeTab === tab ? "bg-red-50 text-red-900 font-semibold" : "text-stone-600 hover:bg-stone-50"
                          )}
                        >
                          <span className="capitalize">{tab}</span>
                          {activeTab === tab && <Check className="w-4 h-4 text-red-600" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Global Search Input */}
                <div className="relative w-full md:w-[350px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                  <Input
                    placeholder="Search activity descriptions, users, or titles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full pl-6 pr-6 py-6">
        {/* Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">

          {/* Attendance tab: show tardiness entries only */}
          {activeTab === 'attendance' ? (
            tardinessLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 text-[#A4163A] animate-spin" />
                <p className="text-stone-400 font-medium">Loading tardiness activity...</p>
              </div>
            ) : tardinessEntries.length === 0 ? (
              <div className="text-center py-20 px-4">
                <Clock className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-400 text-sm">No tardiness records found for this month.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {tardinessEntries.map((entry, idx) => {
                  const warnText = warningLabel(entry.warning_level ?? 0)
                  const timeText = formatTime12h(entry.actual_in)
                  const dateText = formatReadableDate(entry.date)
                  const hasWarning = (entry.warning_level ?? 0) > 0
                  return (
                    <div key={`att-${entry.id ?? idx}`} className="p-6 hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border",
                          hasWarning ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-rose-50 border-rose-100 text-[#A4163A]"
                        )}>
                          {hasWarning ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-stone-900 text-lg">Tardiness Monitoring</h3>
                            <Badge className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border-none",
                              hasWarning ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-rose-100 text-[#A4163A] hover:bg-rose-100"
                            )}>
                              {hasWarning ? warnText : 'Late'}
                            </Badge>
                          </div>
                          <p className="text-stone-500 text-sm font-medium">
                            Entry added for <span className="font-semibold text-stone-900">{entry.employee_name}</span>{' '}
                            at <span className="font-medium">{timeText}</span>{' '}
                            on <span className="font-medium">{dateText}</span>
                            {hasWarning && <span className="text-amber-700 font-semibold"> - {warnText}</span>}
                          </p>
                          <p className="text-stone-400 text-xs mt-0.5">
                            {entry.minutes_late} min{entry.minutes_late !== 1 ? 's' : ''} late from 8:00 AM
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            /* All other tabs (all, employee, department, etc.) */
            loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-12 h-12 text-[#A4163A] animate-spin" />
                <p className="text-stone-400 font-medium">Loading activities...</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 px-4">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-stone-600 font-medium">{error}</p>
                <Button variant="outline" onClick={() => loadActivities()} className="mt-4">Retry</Button>
              </div>
            ) : activities.length === 0 && (activeTab !== 'all' || tardinessEntries.length === 0) ? (
              <div className="text-center py-20 px-4">
                <p className="text-stone-400">No activities found matching your criteria.</p>
              </div>
            ) : (() => {
              // Build merged + sorted list for 'all' tab
              type ApiItem = { _kind: 'api'; _ts: number; activity: typeof activities[0] }
              type TardItem = { _kind: 'tardiness'; _ts: number; entry: typeof tardinessEntries[0]; idx: number }
              type MergedItem = ApiItem | TardItem

              const merged: MergedItem[] = activeTab === 'all'
                ? [
                  ...activities.map(a => ({
                    _kind: 'api' as const,
                    _ts: a.created_at ? new Date(a.created_at).getTime() : 0,
                    activity: a,
                  })),
                  ...tardinessEntries.map((e, idx) => ({
                    _kind: 'tardiness' as const,
                    _ts: e.date ? new Date(e.date).getTime() : 0,
                    entry: e,
                    idx,
                  })),
                ].sort((a, b) => b._ts - a._ts)
                : activities.map(a => ({
                  _kind: 'api' as const,
                  _ts: a.created_at ? new Date(a.created_at).getTime() : 0,
                  activity: a,
                }))

              return (
                <>
                  <div className="divide-y divide-stone-100">
                    {merged.map((item) => {
                      if (item._kind === 'api') {
                        const activity = item.activity
                        return (
                          <div key={`api-${activity.id}`} className="p-6 hover:bg-stone-50/50 transition-colors group">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-[#EBF5FF] border border-[#D1E9FF] text-[#0066FF]">
                                {getActivityIcon(activity.activity_type, activity.action)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-bold text-stone-900 text-lg">{activity.title}</h3>
                                  <Badge className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border-none",
                                    activity.status === 'success'
                                      ? "bg-[#DCFCE7] text-[#15803D] hover:bg-[#DCFCE7]"
                                      : "bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FEE2E2]"
                                  )}>
                                    {activity.status}
                                  </Badge>
                                </div>
                                <p className="text-stone-500 text-sm font-medium">{activity.description}</p>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // Tardiness item
                      const entry = item.entry
                      const warnText = warningLabel(entry.warning_level ?? 0)
                      const timeText = formatTime12h(entry.actual_in)
                      const dateText = formatReadableDate(entry.date)
                      const hasWarning = (entry.warning_level ?? 0) > 0
                      return (
                        <div key={`tard-${entry.id ?? item.idx}`} className="p-6 hover:bg-stone-50/50 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center border",
                              hasWarning ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-rose-50 border-rose-100 text-[#A4163A]"
                            )}>
                              {hasWarning ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-bold text-stone-900 text-lg">Tardiness Monitoring</h3>
                                <Badge className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border-none",
                                  hasWarning ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-rose-100 text-[#A4163A] hover:bg-rose-100"
                                )}>
                                  {hasWarning ? warnText : 'Late'}
                                </Badge>
                              </div>
                              <p className="text-stone-500 text-sm font-medium">
                                Entry added for <span className="font-semibold text-stone-900">{entry.employee_name}</span>{' '}
                                at <span className="font-medium">{timeText}</span>{' '}
                                on <span className="font-medium">{dateText}</span>
                                {hasWarning && <span className="text-amber-700 font-semibold"> - {warnText}</span>}
                              </p>
                              <p className="text-stone-400 text-xs mt-0.5">
                                {entry.minutes_late} min{entry.minutes_late !== 1 ? 's' : ''} late from 8:00 AM
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Footer: See previous notification */}
                  {totalPages > 1 && (
                    <div className="p-4 bg-stone-50/50 border-t border-stone-100">
                      <button
                        onClick={() => { if (currentPage < totalPages) setCurrentPage(p => p + 1) }}
                        className="w-full py-4 bg-[#A4163A]/60 hover:bg-[#A4163A]/70 text-white rounded-md font-bold uppercase tracking-widest text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                      >
                        See previous notification
                      </button>
                    </div>
                  )}
                </>
              )
            })()
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
