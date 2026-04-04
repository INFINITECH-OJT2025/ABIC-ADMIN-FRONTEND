"use client"

import React, { useEffect, useState, Suspense, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Briefcase,
  User,
  Phone,
  CreditCard,
  Users,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save as LucideSave,
  Trash2,
  ChevronDown,
  ChevronUp,
  PlusCircle,
  AlertCircle,
  ClipboardList,
  Save,
  Check,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { Skeleton } from '@/components/ui/skeleton'

// PH Address Data
import regionsDataRaw from '@/ph-json/region.json'
import provincesDataRaw from '@/ph-json/province.json'
import citiesDataRaw from '@/ph-json/city.json'
import barangaysDataRaw from '@/ph-json/barangay.json'

const regionsData = regionsDataRaw as any[]
const provincesData = provincesDataRaw as any[]
const citiesData = citiesDataRaw as any[]
const barangaysData = barangaysDataRaw as any[]

interface EmployeeDetails {
  [key: string]: any
}

interface Position {
  id: number
  name: string
}

interface Department {
  id: number
  name: string
}

const toPlainString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim()
  if (value && typeof value === 'object') {
    const maybeName = (value as any).name
    if (typeof maybeName === 'string') return maybeName.trim()
  }
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

const toIsoDate = (value: unknown): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    const datePart = trimmed.includes('T') ? trimmed.split('T')[0] : trimmed
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart
    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      const year = parsed.getFullYear()
      const month = String(parsed.getMonth() + 1).padStart(2, '0')
      const day = String(parsed.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return ''
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  return ''
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <OnboardPageContent />
    </Suspense>
  )
}

function OnboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const employeeIdParam = searchParams.get('id')
  const employeeEmailParam = searchParams.get('email')
  const requestedViewParam = searchParams.get('view')
  const rehireParam = searchParams.get('rehire')
  const batchParam = searchParams.get('batch')
  const isRehireFlow = rehireParam === '1'
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'onboard' | 'checklist' | 'update-info'>('onboard')

  // Form States
  const [onboardFormData, setOnboardFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    position: '',
    onboarding_date: '',
    department: '',
  })
  const [currentBatch, setCurrentBatch] = useState(1)
  const [onboardingEmployeeId, setOnboardingEmployeeId] = useState<string | null>(null)
  const [progressionFormData, setProgressionFormData] = useState<Partial<EmployeeDetails>>({})

  // Checklist States
  const [checklistData, setChecklistData] = useState<{
    name: string,
    position: string,
    department: string,
    date: string,
    raw_date: string
  } | null>(null)
  const [checklistRecordId, setChecklistRecordId] = useState<number | null>(null)
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: string }>({})
  const [savedTasks, setSavedTasks] = useState<Set<string>>(new Set())

  // Dropdown Data
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([])
  const [currentProvinces, setCurrentProvinces] = useState<{ code: string; name: string }[]>([])
  const [currentCities, setCurrentCities] = useState<{ code: string; name: string }[]>([])
  const [currentBarangays, setCurrentBarangays] = useState<{ code: string; name: string }[]>([])
  const [permanentProvinces, setPermanentProvinces] = useState<{ code: string; name: string }[]>([])
  const [permanentCities, setPermanentCities] = useState<{ code: string; name: string }[]>([])
  const [permanentBarangays, setPermanentBarangays] = useState<{ code: string; name: string }[]>([])

  // UI States
  const [isSaving, setIsSaving] = useState(false)
  const [inlineManagerType, setInlineManagerType] = useState<'position' | 'department' | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)
  
  // Email Check States
  const [emailChecking, setEmailChecking] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  // Name Check States
  const [nameChecking, setNameChecking] = useState(false)
  const [nameExists, setNameExists] = useState(false)

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant: "default" | "destructive" | "success" | "warning"
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default'
  })

  const batches = [
    { id: 1, title: 'Employee Details', icon: Briefcase, description: 'Basic employment information' },
    { id: 2, title: 'Personal Information', icon: User, description: 'Your personal details' },
    { id: 3, title: 'Contact Information', icon: Phone, description: 'How to reach you' },
    { id: 4, title: 'Government IDs', icon: CreditCard, description: 'Official identification numbers' },
    { id: 5, title: 'Family Information', icon: Users, description: 'Parent information' },
    { id: 6, title: 'Current Address', icon: MapPin, description: 'Current residence' },
    { id: 7, title: 'Permanent Address', icon: MapPin, description: 'Permanent residence' },
  ]

  const onboardingTasks = [
    "Signing of Job Offer",
    "Signing of Employment Contract",
    "Information Fill-Up for ID and Employee Record",
    "Provide Link to Employee Handbook",
    "Conduct Onboarding Presentation",
    "Introduce to Departments and Key Team Members",
    "Distribute Polo Shirt, ID Lace & keys",
    "Add Employee to Biometrics",
    "Create Company Accounts (Email and Telegram - Required)",
    "Create Optional Accounts (Viber, WhatsApp, WeChat - Sales/Marketing only)",
    "Set Up Email Signature",
    "Add New Employee to Official Group Chats",
    "Add New Employee to Masterfile Google Sheet",
    "Add New Employee to Tardiness & Leave Monitoring Google Sheet",
    "Prepare Requirement Checklist (Medical Certificate, Diploma, TOR, Birth Certificate, PhilHealth, Pag-IBIG, SSS)",
    "Collect and Verify Employee Requirements"
  ]

  const completionPercentage = useMemo(() => {
    if (!onboardingTasks.length) return 0
    return Math.round((Object.keys(completedTasks).length / onboardingTasks.length) * 100)
  }, [completedTasks, onboardingTasks])

  const completionDateText = useMemo(() => {
    const dates = Object.values(completedTasks)
    if (dates.length === 0) return ''
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
  }, [completedTasks])

  const getApiBaseCandidates = () => {
    const primary = getApiUrl().replace(/\/+$/, '')
    const candidates = [primary]

    if (typeof window !== 'undefined') {
      if (primary.includes('localhost:8000')) {
        candidates.push('http://127.0.0.1:8000')
      }
      const host = window.location.hostname
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        candidates.push(`http://${host}:8000`)
      }
    }

    return [...new Set(candidates)]
  }

  const apiFetch = async (path: string, init?: RequestInit) => {
    const candidates = getApiBaseCandidates()
    let lastError: unknown = null

    for (const base of candidates) {
      try {
        return await fetch(`${base}${path}`, init)
      } catch (error) {
        lastError = error
      }
    }

    // Retry once for transient network-change failures.
    await new Promise((resolve) => setTimeout(resolve, 300))

    for (const base of candidates) {
      try {
        return await fetch(`${base}${path}`, init)
      } catch (error) {
        lastError = error
      }
    }

    throw lastError ?? new Error('Failed to fetch')
  }

  const parseJsonFromResponse = async (response: Response) => {
    const raw = await response.text()
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }

  const fetchEmployeeByIdentifier = async (identifier: string, fallbackEmail?: string) => {
    const normalizedId = String(identifier ?? '').trim().toLowerCase()
    const normalizedEmail = String(fallbackEmail ?? '').trim().toLowerCase()

    // If email is available, resolve via employee list first.
    // This avoids direct-ID 404s when re-hire rotated the employee code.
    if (normalizedEmail) {
      const listResponse = await apiFetch('/api/employees', { headers: { Accept: 'application/json' } })
      const listData = await parseJsonFromResponse(listResponse)
      const employees = Array.isArray(listData?.data) ? listData.data : []

      const matchedByEmail = employees
        .filter((emp: any) => {
          const emailCandidates = [
            emp?.email,
            emp?.email_address,
          ].map((value) => String(value ?? '').trim().toLowerCase()).filter(Boolean)
          return emailCandidates.includes(normalizedEmail)
        })
        .sort((a: any, b: any) => {
          const aTs = new Date(a?.updated_at ?? a?.created_at ?? 0).getTime()
          const bTs = new Date(b?.updated_at ?? b?.created_at ?? 0).getTime()
          return bTs - aTs
        })[0]

      if (matchedByEmail) {
        const canonicalId = String(matchedByEmail?.id ?? matchedByEmail?.employee_id ?? identifier)
        for (const path of [`/api/employees/${encodeURIComponent(canonicalId)}`, `/api/employees/${canonicalId}`]) {
          const response = await apiFetch(path, { headers: { Accept: 'application/json' } })
          const data = await parseJsonFromResponse(response)
          if (data?.success && data?.data) return data.data
        }
        return matchedByEmail
      }
    }

    const directPaths = [
      `/api/employees/${encodeURIComponent(identifier)}`,
      `/api/employees/${identifier}`,
    ]

    for (const path of directPaths) {
      const response = await apiFetch(path, { headers: { Accept: 'application/json' } })
      const data = await parseJsonFromResponse(response)
      if (data?.success && data?.data) return data.data
    }

    const listResponse = await apiFetch('/api/employees', { headers: { Accept: 'application/json' } })
    const listData = await parseJsonFromResponse(listResponse)
    const employees = Array.isArray(listData?.data) ? listData.data : []

    const matched = employees.find((emp: any) => {
      const candidates = [
        emp?.id,
        emp?.employee_id,
        emp?.employee_code,
        emp?.code,
      ].map((value) => String(value ?? '').trim().toLowerCase()).filter(Boolean)

      if (normalizedId && candidates.includes(normalizedId)) return true

      const emailCandidates = [
        emp?.email,
        emp?.email_address,
      ].map((value) => String(value ?? '').trim().toLowerCase()).filter(Boolean)

      return normalizedEmail ? emailCandidates.includes(normalizedEmail) : false
    })

    if (!matched) return null

    const canonicalId = String(matched?.id ?? matched?.employee_id ?? identifier)
    if (!canonicalId) return matched

    for (const path of [`/api/employees/${encodeURIComponent(canonicalId)}`, `/api/employees/${canonicalId}`]) {
      const response = await apiFetch(path, { headers: { Accept: 'application/json' } })
      const data = await parseJsonFromResponse(response)
      if (data?.success && data?.data) return data.data
    }

    return matched
  }

  // Persistence Logic
  useEffect(() => {
    const savedState = localStorage.getItem('employee_onboarding_state')
    if (savedState && !isRehireFlow) {
      try {
        const parsed = JSON.parse(savedState)
        const hasExplicitEmployee = Boolean(employeeIdParam)
        const sameEmployee = hasExplicitEmployee &&
          String(parsed.onboardingEmployeeId ?? '') === employeeIdParam

        if (sameEmployee) {
          if (parsed.view) setView(parsed.view)
          if (parsed.currentBatch) setCurrentBatch(parsed.currentBatch)
          if (parsed.progressionFormData) setProgressionFormData(parsed.progressionFormData)
          if (parsed.onboardingEmployeeId) setOnboardingEmployeeId(String(parsed.onboardingEmployeeId))
          if (parsed.checklistData) setChecklistData(parsed.checklistData)
          if (parsed.checklistRecordId) setChecklistRecordId(parsed.checklistRecordId)
          if (parsed.completedTasks) setCompletedTasks(parsed.completedTasks)
        } else if (!hasExplicitEmployee) {
          // Opening /onboard without an ID should always start a clean onboarding session.
          localStorage.removeItem('employee_onboarding_state')
        }
      } catch (e) {
        console.error('Failed to restore state', e)
        localStorage.removeItem('employee_onboarding_state')
      }
    }
    fetchPositions()
    fetchDepartments()
    fetchRegions()
    
    // Override batch if provided in query param
    if (batchParam) {
      const bId = parseInt(batchParam)
      if (!isNaN(bId) && bId >= 1 && bId <= 6) {
        setCurrentBatch(bId)
      }
    }

    // Load employee if ID is provided in URL
    if (employeeIdParam) {
      const requestedView: 'onboard' | 'checklist' | 'update-info' = isRehireFlow
        ? 'onboard'
        : requestedViewParam === 'checklist'
          ? 'checklist'
          : requestedViewParam === 'onboard'
            ? 'onboard'
            : 'update-info'
      loadExistingEmployee(employeeIdParam, requestedView)
    } else {
      const timer = setTimeout(() => setLoading(false), 1200)
      return () => clearTimeout(timer)
    }
  }, [employeeIdParam, employeeEmailParam, requestedViewParam, rehireParam, batchParam])

  useEffect(() => {
    if (!regions.length) return

    const hydrateAddressDropdowns = async () => {
      // Current address chain
      const currentRegionName = toPlainString(progressionFormData.region)
      if (currentRegionName) {
        const region = regions.find((r) => r.name === currentRegionName)
        if (region) {
          await fetchProvinces(region.code, true, false)
          const provinceName = toPlainString(progressionFormData.province)
          const province = provincesData.find(
            (p: any) => p.region_code === region.code && p.province_name === provinceName
          )
          if (province) {
            await fetchCities(province.province_code, true, false)
            const cityName = toPlainString(progressionFormData.city_municipality)
            const city = citiesData.find(
              (c: any) => c.province_code === province.province_code && c.city_name === cityName
            )
            if (city) {
              await fetchBarangays(city.city_code, true, false)
            }
          }
        }
      }

      // Permanent address chain
      const permanentRegionName = toPlainString(progressionFormData.perm_region)
      if (permanentRegionName) {
        const region = regions.find((r) => r.name === permanentRegionName)
        if (region) {
          await fetchProvinces(region.code, true, true)
          const provinceName = toPlainString(progressionFormData.perm_province)
          const province = provincesData.find(
            (p: any) => p.region_code === region.code && p.province_name === provinceName
          )
          if (province) {
            await fetchCities(province.province_code, true, true)
            const cityName = toPlainString(progressionFormData.perm_city_municipality)
            const city = citiesData.find(
              (c: any) => c.province_code === province.province_code && c.city_name === cityName
            )
            if (city) {
              await fetchBarangays(city.city_code, true, true)
            }
          }
        }
      }
    }

    hydrateAddressDropdowns()
  }, [
    regions,
    progressionFormData.region,
    progressionFormData.province,
    progressionFormData.city_municipality,
    progressionFormData.perm_region,
    progressionFormData.perm_province,
    progressionFormData.perm_city_municipality,
  ])

  // Email Detection Logic
  useEffect(() => {
    const checkEmail = async (email: string) => {
      if (isRehireFlow) {
        setEmailExists(false)
        setEmailChecking(false)
        return
      }
      if (!email || !email.includes('@')) {
        setEmailExists(false)
        return
      }

      setEmailChecking(true)
      try {
        const response = await apiFetch(`/api/employees/check-email?email=${encodeURIComponent(email)}`)
        const data = await response.json()
        if (data.success) {
          setEmailExists(data.exists)
        }
      } catch (error) {
        console.error('Error checking email:', error)
      } finally {
        setEmailChecking(false)
      }
    }

    const timer = setTimeout(() => {
      checkEmail(onboardFormData.email)
    }, 600) // 600ms debounce

    return () => clearTimeout(timer)
  }, [onboardFormData.email, isRehireFlow])

  // Name Detection Logic
  useEffect(() => {
    const checkName = async (firstName: string, lastName: string) => {
      if (isRehireFlow) {
        setNameExists(false)
        setNameChecking(false)
        return
      }
      if (!firstName || !lastName || firstName.length < 2 || lastName.length < 2) {
        setNameExists(false)
        return
      }

      setNameChecking(true)
      try {
        const response = await apiFetch(`/api/employees/check-name?first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`)
        const data = await response.json()
        if (data.success) {
          setNameExists(data.exists)
        }
      } catch (error) {
        console.error('Error checking name:', error)
      } finally {
        setNameChecking(false)
      }
    }

    const timer = setTimeout(() => {
      checkName(onboardFormData.first_name, onboardFormData.last_name)
    }, 600) // 600ms debounce

    return () => clearTimeout(timer)
  }, [onboardFormData.first_name, onboardFormData.last_name, isRehireFlow])


  const fetchChecklistProgress = async (employeeName: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/onboarding-checklist`, {
        headers: { Accept: 'application/json' },
      })
      const data = await response.json()
      const list = Array.isArray(data?.data) ? data.data : []
      const normalizeName = (value: unknown) =>
        toPlainString(value)
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim()
      const normalizedName = normalizeName(employeeName)
      const nameParts = normalizedName.split(' ').filter(Boolean)
      const firstName = nameParts[0] || ''
      const lastName = nameParts[nameParts.length - 1] || ''
      const sortedByLatest = [...list].sort((a: any, b: any) => {
        const aTime = new Date(a?.updated_at ?? a?.created_at ?? 0).getTime()
        const bTime = new Date(b?.updated_at ?? b?.created_at ?? 0).getTime()
        return bTime - aTime
      })

      let matched = sortedByLatest.find((item: any) => normalizeName(item?.name) === normalizedName)
      if (!matched && firstName && lastName) {
        matched = sortedByLatest.find((item: any) => {
          const candidate = normalizeName(item?.name)
          return candidate.includes(firstName) && candidate.includes(lastName)
        })
      }

      if (!matched) {
        setChecklistRecordId(null)
        setCompletedTasks({})
        return
      }

      const matchedId = Number(matched.id)
      setChecklistRecordId(Number.isFinite(matchedId) ? matchedId : null)

      const matchedStartDateRaw = toIsoDate(matched?.startDate ?? matched?.start_date)
      const matchedStartDateFormatted =
        matchedStartDateRaw && !Number.isNaN(new Date(matchedStartDateRaw).getTime())
          ? new Date(matchedStartDateRaw).toLocaleDateString()
          : null

      setChecklistData((prev) => ({
        name: toPlainString(matched?.name) || toPlainString(prev?.name) || employeeName,
        position: toPlainString(matched?.position) || toPlainString(prev?.position),
        department: toPlainString(matched?.department) || toPlainString(prev?.department),
        date: matchedStartDateFormatted ?? prev?.date ?? '',
        raw_date: matchedStartDateRaw || prev?.raw_date || ''
      }))

      const fallbackDateRaw = matched?.updated_at ?? matched?.created_at
      const fallbackDate = !Number.isNaN(new Date(fallbackDateRaw).getTime())
        ? new Date(fallbackDateRaw).toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'Completed'

      const tasks = Array.isArray(matched?.tasks) ? matched.tasks : []
      const restoredTasks = tasks.reduce((acc: { [key: string]: string }, task: any) => {
        const taskName = String(task?.task ?? '').trim()
        const taskStatus = String(task?.status ?? '').toUpperCase()
        if (!taskName || taskStatus !== 'DONE') return acc
        const taskDate = String(task?.date ?? '').trim()
        acc[taskName] = taskDate || fallbackDate
        return acc
      }, {})

      setCompletedTasks(restoredTasks)
      setSavedTasks(new Set(Object.keys(restoredTasks)))
    } catch (error) {
      console.error('Error fetching checklist progress:', error)
      setChecklistRecordId(null)
      setCompletedTasks({})
    }
  }

  const loadExistingEmployee = async (id: string, targetView: 'onboard' | 'checklist' | 'update-info' = 'update-info') => {
    try {
      setLoading(true)
      const emp = await fetchEmployeeByIdentifier(id, employeeEmailParam ?? undefined)

      if (emp) {
        setOnboardingEmployeeId(String(emp?.id ?? id))
        setProgressionFormData(emp)
        setOnboardFormData({
          first_name: toPlainString(emp.first_name),
          last_name: toPlainString(emp.last_name),
          email: toPlainString(emp.email || emp.email_address),
          position: toPlainString(emp.position),
          onboarding_date: toIsoDate(emp.onboarding_date || emp.date_hired),
          department: toPlainString(emp.department),
        })
        setChecklistData({
          name: `${emp.first_name} ${emp.last_name}`,
          position: toPlainString(emp.position),
          department: toPlainString(emp.department),
          date: toIsoDate(emp.onboarding_date || emp.date_hired)
            ? new Date(toIsoDate(emp.onboarding_date || emp.date_hired)).toLocaleDateString()
            : '',
          raw_date: toIsoDate(emp.onboarding_date || emp.date_hired)
        })
        if (!isRehireFlow) {
          await fetchChecklistProgress(`${emp.first_name} ${emp.last_name}`)
        } else {
          setChecklistRecordId(null)
          setCompletedTasks({})
          setSavedTasks(new Set())
        }
        setView(targetView)
      } else {
        toast.error('Employee not found')
      }
    } catch (error) {
      console.error('Error loading employee:', error)
      toast.error('Failed to load employee details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (view !== 'onboard' || Object.values(onboardFormData).some(v => v)) {
      localStorage.setItem('employee_onboarding_state', JSON.stringify({
        view,
        currentBatch,
        progressionFormData,
        onboardingEmployeeId,
        checklistData,
        checklistRecordId,
        completedTasks
      }))
    }
  }, [view, currentBatch, progressionFormData, onboardingEmployeeId, checklistData, checklistRecordId, completedTasks, onboardFormData])

  const clearStorage = () => {
    localStorage.removeItem('employee_onboarding_state')
  }

  // Fetch Functions
  const fetchPositions = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/positions`)
      const data = await response.json()
      if (data.success) {
        setPositions([...data.data].sort((a: Position, b: Position) => a.name.localeCompare(b.name)))
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/departments`)
      const data = await response.json()
      if (data.success) {
        setDepartments([...data.data].sort((a: Department, b: Department) => a.name.localeCompare(b.name)))
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchRegions = async () => {
    setLoadingRegions(true)
    try {
      // Using local JSON data instead of external API
      const regionsArray = regionsData.map((region: any) => ({
        code: region.region_code,
        name: region.region_name
      }))

      // Deduplicate by code
      const uniqueRegions = Array.from(
        new Map(regionsArray.map(r => [r.code, r])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      setRegions(uniqueRegions)
    } catch (error) {
      console.error('Error loading regions:', error)
      setRegions([])
    } finally {
      setLoadingRegions(false)
    }
  }

  const fetchProvinces = async (regionCode: string, preserveValues = false, isPermanent = false) => {
    if (!regionCode) {
      if (isPermanent) {
        setPermanentProvinces([])
        setPermanentCities([])
        setPermanentBarangays([])
      } else {
        setCurrentProvinces([])
        setCurrentCities([])
        setCurrentBarangays([])
      }
      return
    }
    setLoadingProvinces(true)
    try {
      // Using local JSON data: filter provinces by region_code
      const filteredProvinces = provincesData
        .filter((prov: any) => prov.region_code === regionCode)
        .map((prov: any) => ({
          code: prov.province_code,
          name: prov.province_name
        }))

      // Deduplicate by code
      const uniqueProvinces = Array.from(
        new Map(filteredProvinces.map(p => [p.code, p])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      if (isPermanent) {
        setPermanentProvinces(uniqueProvinces)
        setPermanentCities([])
        setPermanentBarangays([])
      } else {
        setCurrentProvinces(uniqueProvinces)
        setCurrentCities([])
        setCurrentBarangays([])
      }
      if (!preserveValues) {
        if (isPermanent) {
          setProgressionFormData((prev) => ({ ...prev, perm_province: '', perm_city_municipality: '', perm_barangay: '' }))
        } else {
          setProgressionFormData((prev) => ({ ...prev, province: '', city_municipality: '', barangay: '' }))
        }
      }
    } catch (error) {
      console.error('Error filtering provinces:', error)
      if (isPermanent) {
        setPermanentProvinces([])
      } else {
        setCurrentProvinces([])
      }
    } finally {
      setLoadingProvinces(false)
    }
  }

  const fetchCities = async (provinceCode: string, preserveValues = false, isPermanent = false) => {
    if (!provinceCode) {
      if (isPermanent) {
        setPermanentCities([])
        setPermanentBarangays([])
      } else {
        setCurrentCities([])
        setCurrentBarangays([])
      }
      return
    }
    setLoadingCities(true)
    try {
      // Using local JSON data: filter cities by province_code
      const filteredCities = citiesData
        .filter((city: any) => city.province_code === provinceCode)
        .map((city: any) => ({
          code: city.city_code,
          name: city.city_name
        }))

      // Deduplicate by code
      const uniqueCities = Array.from(
        new Map(filteredCities.map(c => [c.code, c])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      if (isPermanent) {
        setPermanentCities(uniqueCities)
        setPermanentBarangays([])
      } else {
        setCurrentCities(uniqueCities)
        setCurrentBarangays([])
      }
      if (!preserveValues) {
        if (isPermanent) {
          setProgressionFormData((prev) => ({ ...prev, perm_city_municipality: '', perm_barangay: '' }))
        } else {
          setProgressionFormData((prev) => ({ ...prev, city_municipality: '', barangay: '' }))
        }
      }
    } catch (error) {
      console.error('Error filtering cities:', error)
      if (isPermanent) {
        setPermanentCities([])
      } else {
        setCurrentCities([])
      }
    } finally {
      setLoadingCities(false)
    }
  }

  const fetchBarangays = async (cityCode: string, preserveValues = false, isPermanent = false) => {
    if (!cityCode) {
      if (isPermanent) {
        setPermanentBarangays([])
      } else {
        setCurrentBarangays([])
      }
      return
    }
    setLoadingBarangays(true)
    try {
      // Using local JSON data: filter barangays by city_code
      const filteredBarangays = barangaysData
        .filter((brgy: any) => brgy.city_code === cityCode)
        .map((brgy: any) => ({
          code: brgy.brgy_code,
          name: brgy.brgy_name
        }))

      // Deduplicate by code
      const uniqueBarangays = Array.from(
        new Map(filteredBarangays.map(b => [b.code, b])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      if (isPermanent) {
        setPermanentBarangays(uniqueBarangays)
      } else {
        setCurrentBarangays(uniqueBarangays)
      }
      if (!preserveValues) {
        if (isPermanent) {
          setProgressionFormData((prev) => ({ ...prev, perm_barangay: '' }))
        } else {
          setProgressionFormData((prev) => ({ ...prev, barangay: '' }))
        }
      }
    } catch (error) {
      console.error('Error filtering barangays:', error)
      if (isPermanent) {
        setPermanentBarangays([])
      } else {
        setCurrentBarangays([])
      }
    } finally {
      setLoadingBarangays(false)
    }
  }

  // Handlers
  const handleAddItem = async () => {
    if (!newItemName.trim() || !inlineManagerType) return

    setIsActionLoading(true)
    try {
      const endpoint = inlineManagerType === 'position' ? 'positions' : 'departments'
      const response = await fetch(`${getApiUrl()}/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim() }),
      })

      const data = await response.json()
      if (data.success) {
        if (inlineManagerType === 'position') {
          await fetchPositions()
        } else {
          await fetchDepartments()
        }
        setNewItemName('')
        toast.success(`${inlineManagerType === 'position' ? 'Position' : 'Department'} added successfully`)
      } else {
        toast.error(data.message || 'Error adding item')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (!inlineManagerType) return

    setConfirmModal({
      isOpen: true,
      title: `Delete ${inlineManagerType === 'position' ? 'Position' : 'Department'}`,
      description: `Are you sure you want to delete this ${inlineManagerType}? This action cannot be undone.`,
      variant: 'destructive',
      onConfirm: async () => {
        setIsActionLoading(true)
        try {
          const endpoint = inlineManagerType === 'position' ? 'positions' : 'departments'
          const response = await fetch(`${getApiUrl()}/api/${endpoint}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })

          const data = await response.json()
          if (data.success) {
            if (inlineManagerType === 'position') {
              await fetchPositions()
              if (onboardFormData.position === data.name) setOnboardFormData(prev => ({ ...prev, position: '' }))
            } else {
              await fetchDepartments()
              if (onboardFormData.department === data.name) setOnboardFormData(prev => ({ ...prev, department: '' }))
            }
            toast.success(`${inlineManagerType === 'position' ? 'Position' : 'Department'} deleted successfully`)
          } else {
            toast.error(data.message || 'Error deleting item')
          }
        } catch (error) {
          console.error('Error deleting item:', error)
          toast.error('Failed to delete item')
        } finally {
          setIsActionLoading(false)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const handleStartOnboarding = async () => {
    const { first_name, last_name, email, position, onboarding_date, department } = onboardFormData
    if (!first_name || !last_name || !email || !position || !onboarding_date || !department) {
      toast.error('Please fill in all fields')
      return
    }

    setIsSaving(true)
    try {
      if (isRehireFlow && onboardingEmployeeId) {
        const onboardResponse = await fetch(`${getApiUrl()}/api/employees/${encodeURIComponent(onboardingEmployeeId)}/onboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position, department, onboarding_date, rehire_process: true }),
        })

        const onboardData = await onboardResponse.json()
        if (!onboardResponse.ok || !onboardData.success) {
          if (onboardData?.errors) {
            const errorMessages = Object.values(onboardData.errors).flat().join(' ')
            throw new Error(errorMessages || onboardData.message)
          }
          throw new Error(onboardData?.message || 'Failed to start re-hire onboarding')
        }

        toast.success('Re-hire onboarding started')
        setProgressionFormData((prev) => ({
          ...prev,
          first_name,
          last_name,
          email: email,
          email_address: email,
          position,
          department,
          date_hired: onboarding_date,
          onboarding_date,
        }))
        setChecklistData({
          name: `${first_name} ${last_name}`,
          position,
          department,
          date: new Date(onboarding_date).toLocaleDateString(),
          raw_date: onboarding_date,
        })
        setChecklistRecordId(null)
        setCompletedTasks({})
        setSavedTasks(new Set())
        setView('checklist')
        return
      }

      // Step 1: Create Employee
      const empResponse = await fetch(`${getApiUrl()}/api/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name, last_name, email }),
      })

      const empData = await empResponse.json()
      if (!empResponse.ok || !empData.success) {
        // Parse validation errors if present
        if (empData.errors) {
          const errorMessages = Object.values(empData.errors).flat().join(' ')
          throw new Error(errorMessages || empData.message)
        }
        throw new Error(empData.message || 'Failed to create employee')
      }

      const employeeId = empData.data.id

      // Step 2: Save Onboarding Data
      const onboardResponse = await fetch(`${getApiUrl()}/api/employees/${employeeId}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position, department, onboarding_date }),
      })

      const onboardData = await onboardResponse.json()
      if (onboardData.success) {
        toast.success('Employee created and onboarding started')
        setOnboardingEmployeeId(String(employeeId))
        setProgressionFormData({
          first_name,
          last_name,
          position,
          department,
          date_hired: onboarding_date,
        })
        setChecklistData({
          name: `${first_name} ${last_name}`,
          position: position,
          department: department,
          date: new Date(onboarding_date).toLocaleDateString(),
          raw_date: onboarding_date
        })
        setChecklistRecordId(null)
        setCompletedTasks({})
        setView('checklist')
        setOnboardFormData({
          first_name: '',
          last_name: '',
          email: '',
          position: '',
          onboarding_date: '',
          department: '',
        })
      } else {
        // Parse validation errors if present
        if (onboardData.errors) {
          const errorMessages = Object.values(onboardData.errors).flat().join(' ')
          toast.error(errorMessages || onboardData.message)
        } else {
          toast.error(onboardData.message || 'Error saving onboarding data')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        toast.error('Network Error: Could not connect to the server.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to complete onboarding')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveChecklist = async (
    redirect = true,
    options: { showSuccessToast?: boolean } = {}
  ) => {
    const { showSuccessToast = true } = options
    if (!checklistData) return false

    setIsSaving(true)
    try {
      const allTasks = onboardingTasks.map(taskName => ({
        task: taskName,
        status: completedTasks[taskName] ? 'DONE' : 'PENDING',
        date: completedTasks[taskName] || null
      }))

      const normalizedDepartment =
        toPlainString(checklistData.department) ||
        toPlainString(progressionFormData.department) ||
        toPlainString(onboardFormData.department)
      const normalizedStartDate =
        toIsoDate(checklistData.raw_date) ||
        toIsoDate(checklistData.date) ||
        toIsoDate(progressionFormData.onboarding_date) ||
        toIsoDate(progressionFormData.date_hired) ||
        toIsoDate(onboardFormData.onboarding_date)

      const isUpdate = checklistRecordId !== null
      if (!normalizedDepartment || !normalizedStartDate) {
        toast.error('Department and Start Date are required before saving checklist')
        return false
      }

      const response = await apiFetch(
        `/api/onboarding-checklist${isUpdate ? `/${checklistRecordId}` : ''}`,
        {
          method: isUpdate ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            employeeId: onboardingEmployeeId,
            name: toPlainString(checklistData.name),
            position: toPlainString(checklistData.position),
            department: normalizedDepartment,
            startDate: normalizedStartDate,
            status: completionPercentage === 100 ? 'DONE' : 'PENDING',
            tasks: allTasks
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        const savedId = Number(data?.data?.id)
        if (Number.isFinite(savedId)) {
          setChecklistRecordId(savedId)
          // Synchronize savedTasks with currently completed tasks
          setSavedTasks(new Set(Object.keys(completedTasks)))
        }
        if (showSuccessToast) {
          toast.success('Checklist progress saved successfully')
        }
        if (redirect) {
          clearStorage()
          router.push('/admin-head/employee/masterfile')
        }
        return true
      } else {
        if (data?.errors) {
          const errorMessages = Object.values(data.errors).flat().join(' ')
          toast.error(errorMessages || data.message || 'Error saving checklist')
        } else {
          toast.error(data.message || 'Error saving checklist')
        }
      }
    } catch (error) {
      console.error('Error saving checklist:', error)
      toast.error('Failed to save checklist')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTask = (task: string) => {
    // Prevent unchecking if already saved
    if (completedTasks[task] && savedTasks.has(task)) {
      toast.error("Saved progress cannot be undone")
      return
    }

    setCompletedTasks(prev => {
      const newTasks = { ...prev }
      if (newTasks[task]) {
        delete newTasks[task]
      } else {
        newTasks[task] = new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        })
      }
      return newTasks
    })
  }

  const toggleAllTasks = () => {
    const allCompleted = onboardingTasks.every(task => completedTasks[task])
    if (allCompleted) {
      // Only uncheck what is NOT saved
      const newTasks = { ...completedTasks }
      let undoCount = 0
      onboardingTasks.forEach(task => {
        if (!savedTasks.has(task)) {
          delete newTasks[task]
          undoCount++
        }
      })
      
      if (undoCount === 0 && onboardingTasks.length > 0) {
        toast.error("Saved progress cannot be undone")
      } else {
        setCompletedTasks(newTasks)
      }
    } else {
      const newTasks: {[key: string]: string} = {}
      const now = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      })
      onboardingTasks.forEach(task => {
        newTasks[task] = now
      })
      setCompletedTasks(newTasks)
    }
  }

  const handleProgressionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Validation for mobile number: only numbers, max 10 digits
    if (name === 'mobile_number') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setProgressionFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }))
      return
    }

    setProgressionFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (name === 'region') {
      const selectedRegion = regions.find(r => r.name === value)
      if (selectedRegion) fetchProvinces(selectedRegion.code)
    } else if (name === 'province') {
      const selectedProvince = currentProvinces.find(p => p.name === value)
      if (selectedProvince) fetchCities(selectedProvince.code)
    } else if (name === 'city_municipality') {
      const selectedCity = currentCities.find(c => c.name === value)
      if (selectedCity) fetchBarangays(selectedCity.code)
    } else if (name === 'perm_region') {
      const selectedRegion = regions.find(r => r.name === value)
      if (selectedRegion) fetchProvinces(selectedRegion.code, false, true)
    } else if (name === 'perm_province') {
      const selectedProvince = permanentProvinces.find(p => p.name === value)
      if (selectedProvince) fetchCities(selectedProvince.code, false, true)
    } else if (name === 'perm_city_municipality') {
      const selectedCity = permanentCities.find(c => c.name === value)
      if (selectedCity) fetchBarangays(selectedCity.code, false, true)
    }
  }

  const calculateProgressionProgress = () => {
    const allFields = [
      'position', 'date_hired',
      'last_name', 'first_name', 'birthday', 'birthplace', 'civil_status', 'gender',
      'mobile_number', 'street',
      'sss_number', 'philhealth_number', 'pagibig_number', 'tin_number',
      'mlast_name', 'mfirst_name', 'flast_name', 'ffirst_name',
      'region', 'province', 'city_municipality', 'barangay', 'zip_code', 'email_address',
      'perm_street', 'perm_region', 'perm_province', 'perm_city_municipality', 'perm_barangay', 'perm_zip_code'
    ]

    const filledFields = allFields.filter(field => {
      const value = progressionFormData[field]
      return value !== null && value !== undefined && value !== ''
    }).length

    return Math.round((filledFields / allFields.length) * 100)
  }

  const isCurrentBatchValid = () => {
    const data = progressionFormData
    switch (currentBatch) {
      case 1:
        return !!data.position && !!data.date_hired
      case 2:
        return !!data.last_name && !!data.first_name && !!data.birthday &&
          !!data.birthplace && !!data.gender && !!data.civil_status
      case 3:
        return !!data.mobile_number && !!data.street
      case 4:
        return true
      case 5:
        return !!data.mlast_name && !!data.mfirst_name
      case 6:
        return !!data.region && !!data.province && !!data.city_municipality &&
          !!data.barangay && !!data.zip_code && !!data.email_address
      case 7:
        return !!data.perm_region && !!data.perm_province && !!data.perm_city_municipality &&
          !!data.perm_barangay && !!data.perm_zip_code && !!data.perm_street
      default:
        return true
    }
  }

  const nextBatch = () => {
    if (isCurrentBatchValid() && currentBatch < 7) {
      setCurrentBatch(currentBatch + 1)
    } else if (!isCurrentBatchValid()) {
      toast.error('Please fill in all required fields to proceed.')
    }
  }

  const prevBatch = () => { if (currentBatch > 1) setCurrentBatch(currentBatch - 1) }

  const handleProgressionSave = async () => {
    setIsSaving(true)
    try {
      if (Object.keys(completedTasks).length < onboardingTasks.length) {
        toast.error('Please complete all onboarding tasks before finishing.')
        return
      }

      const checklistSaved = await handleSaveChecklist(false, { showSuccessToast: false })
      if (!checklistSaved) {
        toast.error('Failed to save onboarding checklist. Please try again.')
        return
      }

      const cleanedData = Object.entries(progressionFormData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value
        return acc
      }, {} as any)

      const response = await apiFetch(`/api/employees/${onboardingEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRehireFlow
            ? { ...cleanedData, rehire_process: true }
            : cleanedData
        ),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Employee record completed successfully!')
        clearStorage()
        router.push('/admin-head/employee/masterfile')
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePartialSave = async () => {
    if (!onboardingEmployeeId) return
    setIsSaving(true)
    try {
      const cleanedData = Object.entries(progressionFormData).reduce((acc, [key, value]) => {
        acc[key] = value === '' ? null : value
        return acc
      }, {} as any)

      const response = await apiFetch(`/api/employees/${onboardingEmployeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isRehireFlow ? { ...cleanedData, rehire_process: true } : cleanedData),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Progress saved successfully')
        clearStorage()
        router.push('/admin-head/employee/masterfile')
      } else {
        toast.error(data.message || 'Failed to save progress')
      }
    } catch (error) {
      console.error('Error in partial save:', error)
      toast.error('Failed to save progress.')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmSaveProgress = (type: 'checklist' | 'partial') => {
    setConfirmModal({
      isOpen: true,
      title: 'Save Progress',
      description: 'Are you sure you want to save your current progress and return to the masterfile?',
      variant: 'default',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        if (type === 'checklist') {
          await handleSaveChecklist(true)
        } else {
          await handlePartialSave()
        }
      }
    })
  }

  const handleCancelOnboarding = () => {
    if (hasUnsavedProgress) {
      const shouldLeave = window.confirm('You have unsaved onboarding progress. Leave this page without saving?')
      if (!shouldLeave) return
    }
    clearStorage()
    router.push('/admin-head/employee/masterfile')
  }

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch { return '' }
  }

  const hasUnsavedProgress = useMemo(() => {
    if (isSaving) return false

    const hasOnboardDraft = Object.values(onboardFormData).some(
      (value) => String(value ?? '').trim() !== ''
    )
    const hasChecklistDraft = Object.keys(completedTasks).length > 0
    const hasProfileDraft = Object.values(progressionFormData).some(
      (value) => String(value ?? '').trim() !== ''
    )

    return hasOnboardDraft || hasChecklistDraft || hasProfileDraft
  }, [isSaving, onboardFormData, completedTasks, progressionFormData])

  useEffect(() => {
    const warningMessage = 'You have unsaved onboarding progress. Leave this page without saving?'

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedProgress) return
      event.preventDefault()
      event.returnValue = warningMessage
      return warningMessage
    }

    const handleLinkNavigation = (event: MouseEvent) => {
      if (!hasUnsavedProgress) return
      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target === '_blank') return
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return

      const currentUrl = new URL(window.location.href)
      const nextUrl = new URL(anchor.href, window.location.href)
      const isSamePage =
        currentUrl.pathname === nextUrl.pathname &&
        currentUrl.search === nextUrl.search &&
        currentUrl.hash === nextUrl.hash

      if (isSamePage) return

      const shouldLeave = window.confirm(warningMessage)
      if (!shouldLeave) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleLinkNavigation, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleLinkNavigation, true)
    }
  }, [hasUnsavedProgress])

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-12 relative">
      {/* ----- GLOBAL LOADING OVERLAY (For Actions Only) ----- */}
      {(isSaving || isActionLoading) && (
        <div className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          <div className="bg-white/80 backdrop-blur-xl w-[400px] h-auto p-12 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center gap-10 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="w-14 h-14 border-[3px] border-slate-100 border-t-[#A4163A] rounded-full animate-spin" />
            </div>
            <div className="flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold text-[#1e293b] tracking-tight">Loading...</h3>
            </div>
            <div className="flex gap-2.5">
              <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* ----- INTEGRATED PREMIUM HEADER ----- */}
      <header className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md p-4 md:p-8 mb-4 md:mb-8 relative overflow-hidden">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center gap-6 lg:gap-8 relative z-10">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">
              {view === 'onboard' ? 'Onboard New Employee' : view === 'checklist' ? 'Onboarding Process' : 'Employee Data Entry'}
            </h1>
            <div className="flex items-center gap-2 text-white/80 transition-all duration-500">
              {view === 'onboard' ? <Briefcase className="w-4 h-4 md:w-5 h-5" /> : <ClipboardList className="w-4 h-4 md:w-5 h-5" />}
              <p className="text-sm md:text-lg font-bold uppercase tracking-widest leading-none">ABIC REALTY & CONSULTANCY</p>
            </div>
            {isRehireFlow && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-amber-300/70 bg-amber-100/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-amber-100">
                <AlertCircle className="h-3.5 w-3.5" />
                Rehire Employee Process
              </div>
            )}
          </div>
          <div className="h-10 w-px bg-white/10 hidden lg:block" />
          {checklistData && view !== 'onboard' && (
            <div className="flex flex-wrap items-center gap-6 flex-1 animate-in slide-in-from-left-4 duration-500">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Employee</span>
                <span className="text-sm font-bold text-white leading-none">{checklistData.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Position</span>
                <span className="text-sm font-bold text-white leading-none">{checklistData.position}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Department</span>
                <span className="text-sm font-bold text-white leading-none">{checklistData.department}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Start Date</span>
                <span className="text-sm font-bold text-white leading-none">{checklistData.date}</span>
              </div>
              <div className="ml-auto hidden xl:flex items-center gap-6 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">Overall Progress</span>
                  <span className="text-xl font-black text-white">{view === 'checklist' ? completionPercentage : calculateProgressionProgress()}%</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40 leading-none mb-1">
                    {view === 'checklist' ? 'Last Updated' : `Batch ${currentBatch} of 6`}
                  </span>
                  <span className="text-xl font-black text-white tracking-tight">
                    {view === 'checklist' ? (completionDateText || '—') : batches[currentBatch - 1].title}
                  </span>
                </div>
              </div>
            </div>
          )}
          {view === 'onboard' && (
            <div className="ml-auto">
              <Button variant="ghost" onClick={handleCancelOnboarding} className="bg-white/10 hover:bg-white/20 text-white border-white/20 h-11 px-6 font-bold">
                <ChevronLeft className="mr-2 h-4 w-4" />Back to Masterfile
              </Button>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transition-transform duration-700 ease-in-out transform rotate-12">
          {view === 'onboard' ? <User className="w-48 h-48" /> : view === 'checklist' ? <ClipboardList className="w-48 h-48" /> : <Briefcase className="w-48 h-48" />}
        </div>
      </header>

      {loading ? (
        <div className="max-w-7xl mx-auto py-8 px-8 space-y-12">
           <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/60 shadow-xl space-y-12">
              <div className="flex justify-between items-center">
                 <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-4 w-96" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {Array(6).fill(0).map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-12 w-full rounded-xl" /></div>))}
              </div>
           </div>
        </div>
      ) : (
        <>
          {view === 'onboard' && (
            <div className="w-full">
              <div className="max-w-3xl mx-auto py-4">
                <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-slate-700">First Name <span className="text-red-500">*</span></label>
                        {!isRehireFlow && nameChecking && (<div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium"><Loader2 className="w-3 h-3 animate-spin" />Checking...</div>)}
                        {!isRehireFlow && !nameChecking && onboardFormData.first_name.length >= 2 && onboardFormData.last_name.length >= 2 && (
                          nameExists ? (<div className="flex items-center gap-1.5 text-xs text-rose-500 font-bold animate-in fade-in slide-in-from-right-2"><AlertCircle className="w-3 h-3" />Name already exists</div>)
                          : (<div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold animate-in fade-in slide-in-from-right-2"><CheckCircle2 className="w-3 h-3" />Name available</div>)
                        )}
                      </div>
                      <Input 
                        value={onboardFormData.first_name} 
                        onChange={(e) => setOnboardFormData(prev => ({ ...prev, first_name: e.target.value }))} 
                        placeholder="John" 
                        className={cn("transition-all duration-300", 
                          !isRehireFlow && nameExists && onboardFormData.first_name.length >= 2 && onboardFormData.last_name.length >= 2 && "border-rose-400 focus-visible:ring-rose-400 bg-rose-50/30",
                          !isRehireFlow && !nameExists && onboardFormData.first_name.length >= 2 && onboardFormData.last_name.length >= 2 && "border-emerald-400 focus-visible:ring-emerald-400 bg-emerald-50/30"
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-slate-700">Last Name <span className="text-red-500">*</span></label>
                      </div>
                      <Input 
                        value={onboardFormData.last_name} 
                        onChange={(e) => setOnboardFormData(prev => ({ ...prev, last_name: e.target.value }))} 
                        placeholder="Doe" 
                        className={cn("transition-all duration-300", 
                          !isRehireFlow && nameExists && onboardFormData.first_name.length >= 2 && onboardFormData.last_name.length >= 2 && "border-rose-400 focus-visible:ring-rose-400 bg-rose-50/30",
                          !isRehireFlow && !nameExists && onboardFormData.first_name.length >= 2 && onboardFormData.last_name.length >= 2 && "border-emerald-400 focus-visible:ring-emerald-400 bg-emerald-50/30"
                        )}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                        {!isRehireFlow && emailChecking && (<div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium"><Loader2 className="w-3 h-3 animate-spin" />Checking availability...</div>)}
                        {!isRehireFlow && !emailChecking && onboardFormData.email && onboardFormData.email.includes('@') && (
                          emailExists ? (<div className="flex items-center gap-1.5 text-xs text-rose-500 font-bold animate-in fade-in slide-in-from-right-2"><AlertCircle className="w-3 h-3" />Email already exists</div>)
                          : (<div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold animate-in fade-in slide-in-from-right-2"><CheckCircle2 className="w-3 h-3" />Email available</div>)
                        )}
                      </div>
                      <div className="relative">
                        <Input type="email" value={onboardFormData.email} onChange={(e) => setOnboardFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="john@example.com" className={cn("transition-all duration-300", !isRehireFlow && emailExists && "border-rose-400 focus-visible:ring-rose-400 bg-rose-50/30", !isRehireFlow && !emailExists && onboardFormData.email && onboardFormData.email.includes('@') && "border-emerald-400 focus-visible:ring-emerald-400 bg-emerald-50/30")} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-700">Position <span className="text-red-500">*</span></label>
                        <button onClick={() => setInlineManagerType(inlineManagerType === 'position' ? null : 'position')} className={`text-xs flex items-center gap-1 font-bold transition-colors ${inlineManagerType === 'position' ? 'text-[#630C22]' : 'text-slate-400 hover:text-slate-600'}`}>
                          {inlineManagerType === 'position' ? 'CLOSE MANAGER' : 'MANAGE LIST'}{inlineManagerType === 'position' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      <select value={onboardFormData.position} onChange={(e) => setOnboardFormData(prev => ({ ...prev, position: e.target.value }))} className="w-full h-10 px-3 py-2 border border-slate-200 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#630C22] transition-all">
                        <option value="">Select Position...</option>
                        {positions.map((pos) => (<option key={pos.id} value={pos.name}>{pos.name}</option>))}
                      </select>
                      {inlineManagerType === 'position' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2 shadow-inner">
                          <div className="flex gap-2 mb-3">
                            <Input placeholder="Add new position..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="h-9 text-xs" onKeyDown={(e) => e.key === 'Enter' && handleAddItem()} />
                            <button onClick={handleAddItem} disabled={isActionLoading || !newItemName.trim()} className="bg-[#630C22] h-9 px-3 text-white rounded-md"><PlusCircle size={16} /></button>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {positions.map(pos => (
                              <div key={pos.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded text-xs">
                                <span className="truncate max-w-[150px]">{pos.name}</span>
                                <button onClick={() => handleDeleteItem(pos.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-semibold text-slate-700">Department <span className="text-red-500">*</span></label>
                        <button onClick={() => setInlineManagerType(inlineManagerType === 'department' ? null : 'department')} className={`text-xs flex items-center gap-1 font-bold transition-colors ${inlineManagerType === 'department' ? 'text-[#630C22]' : 'text-slate-400 hover:text-slate-600'}`}>
                          {inlineManagerType === 'department' ? 'CLOSE MANAGER' : 'MANAGE LIST'}{inlineManagerType === 'department' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
                      <select value={onboardFormData.department} onChange={(e) => setOnboardFormData(prev => ({ ...prev, department: e.target.value }))} className="w-full h-10 px-3 py-2 border border-slate-200 bg-white rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#630C22] transition-all">
                        <option value="">Select Department...</option>
                        {departments.map((dept) => (<option key={dept.id} value={dept.name}>{dept.name}</option>))}
                      </select>
                      {inlineManagerType === 'department' && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mt-2 shadow-inner">
                          <div className="flex gap-2 mb-3">
                            <Input placeholder="Add new department..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="h-9 text-xs" onKeyDown={(e) => e.key === 'Enter' && handleAddItem()} />
                            <button onClick={handleAddItem} disabled={isActionLoading || !newItemName.trim()} className="bg-[#630C22] h-9 px-3 text-white rounded-md"><PlusCircle size={16} /></button>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {departments.map(dept => (
                              <div key={dept.id} className="flex justify-between items-center p-2 bg-white border border-slate-100 rounded text-xs">
                                <span className="truncate max-w-[150px]">{dept.name}</span>
                                <button onClick={() => handleDeleteItem(dept.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 size={12} /></button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Onboarding Date <span className="text-red-500">*</span></label>
                      <Input type="date" value={onboardFormData.onboarding_date} onChange={(e) => setOnboardFormData(prev => ({ ...prev, onboarding_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-slate-100">
                    <Button 
                      onClick={handleStartOnboarding} 
                      disabled={isSaving || (!isRehireFlow && (emailExists || emailChecking || nameExists || nameChecking))} 
                      className={cn(
                        "flex-1 text-white font-bold h-12 rounded-xl transition-all shadow-md", 
                        (!isRehireFlow && (emailExists || emailChecking || nameExists || nameChecking)) ? "bg-slate-300 hover:bg-slate-300 cursor-not-allowed" : "bg-[#630C22] hover:bg-[#4A081A]"
                      )}
                    >
                      {isSaving ? 'SAVING...' : 'START ONBOARDING'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelOnboarding} disabled={isSaving} className="flex-1 border-slate-200 text-slate-600 font-bold h-12 rounded-xl">
                      CANCEL
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'checklist' && checklistData && (
            <div className="max-w-[1600px] mx-auto py-4 px-6 md:px-8 text-stone-900">
              {/* Task List Section */}
              <Card className="rounded-2xl border-2 border-[#FFE5EC] shadow-2xl bg-white overflow-hidden mb-12">
                {/* Progress Banner */}
                <div className="bg-[#FFE5EC]/20 p-4 md:px-8 border-b border-[#FFE5EC]">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-[11px] font-black text-[#800020] uppercase tracking-widest">Process Onboarding Progress</h3>
                    <span className="text-sm font-black text-[#A4163A] bg-white px-3 py-0.5 rounded-full shadow-sm border border-[#FFE5EC]">
                      {Object.keys(completedTasks).length} / {onboardingTasks.length} Completed
                    </span>
                  </div>
                  <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#FFE5EC] shadow-inner p-0.5">
                    <div
                      className="bg-gradient-to-r from-[#A4163A] to-[#630C22] h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${(Object.keys(completedTasks).length / onboardingTasks.length) * 100}%` }}
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader className="bg-[#FFE5EC]/40">
                    <TableRow className="border-b border-[#FFE5EC] hover:bg-transparent">
                      <TableHead className="w-[200px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">Completed Date</TableHead>
                      <TableHead className="w-[100px] text-center font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">Status</TableHead>
                      <TableHead className="font-black text-[#800020] uppercase tracking-[0.12em] text-[9px] py-3">
                        <div className="flex items-center justify-between">
                          <span>Tasks</span>
                          <button 
                            onClick={toggleAllTasks}
                            className="text-[8px] normal-case bg-white/50 hover:bg-rose-50 text-[#800020] px-2 py-1 rounded-md border border-[#FFE5EC] transition-all font-black shadow-sm"
                          >
                            {onboardingTasks.every(task => completedTasks[task]) ? 'UNCHECK ALL' : 'CHECK ALL'}
                          </button>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onboardingTasks.map((task, index) => (
                      <TableRow 
                        key={index} 
                        className="border-b border-rose-50/30 last:border-0 hover:bg-[#FFE5EC]/5 transition-colors group cursor-pointer"
                        onClick={() => toggleTask(task)}
                      >
                        <TableCell className="text-center py-2.5 font-mono text-[10px] font-bold text-slate-400">
                          {completedTasks[task] || '-'}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex justify-center">
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center transition-all border-2",
                                completedTasks[task]
                                  ? (savedTasks.has(task) ? "bg-emerald-700 border-emerald-700 opacity-60 cursor-not-allowed" : "bg-emerald-500 border-emerald-500 text-white shadow-sm")
                                  : "border-slate-200 bg-white hover:border-[#A4163A]"
                            )}>
                              {completedTasks[task] && <Check className="h-3.5 w-3.5" />}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className={cn(
                            "text-sm font-bold transition-all duration-300",
                            completedTasks[task] ? "text-slate-300 line-through" : "text-slate-700"
                          )}>
                            {task}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Table Footer */}
                <div className="p-4 md:px-8 bg-slate-50/50 border-t border-[#FFE5EC] flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic">
                      ADMINISTRATION FRAMEWORK • ABIC HR
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={async () => {
                        const success = await handleSaveChecklist(false)
                        if (success) setView('update-info')
                      }}
                      disabled={Object.keys(completedTasks).length < onboardingTasks.length || isSaving}
                      className="h-9 px-8 font-black text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-95 transition-all rounded-xl disabled:opacity-50"
                    >
                      {isSaving ? 'SAVING...' : 'PROCEED TO DATA ENTRY'}
                    </Button>
                    <Button 
                      onClick={() => confirmSaveProgress('checklist')} 
                      disabled={isSaving}
                      className="h-9 px-8 font-black text-xs uppercase tracking-widest bg-[#A4163A] hover:bg-[#800020] text-white shadow-lg active:scale-95 transition-all rounded-xl"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2" />}
                      {isSaving ? 'SAVING...' : 'SAVE PROGRESS'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {view === 'update-info' && (
            <div className="max-w-7xl mx-auto py-8">
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                {/* Horizontal Stepper Progress Card */}
                <Card className="border-none shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] px-6 pt-8 pb-6 font-sans">
                    {/* Horizontal Stepper with Progress Bar */}
                    <div className="relative">
                      {/* Progress Bar Background */}
                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                        <div
                          className="bg-gradient-to-r from-rose-300 to-white h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${calculateProgressionProgress()}%` }}
                        />
                      </div>

                      {/* Steps with Labels */}
                      <div className="flex justify-between items-start mt-4">
                        {batches.map((batch, index) => {
                          const BatchIcon = batch.icon
                          const isActive = currentBatch === batch.id
                          const isCompleted = batch.id < currentBatch

                          return (
                            <div
                              key={batch.id}
                              className={`flex flex-col items-center group ${batch.id <= currentBatch || isCurrentBatchValid() ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                              style={{ width: `${100 / batches.length}%` }}
                              onClick={() => {
                                if (batch.id < currentBatch) {
                                  setCurrentBatch(batch.id)
                                } else if (batch.id === currentBatch + 1 && isCurrentBatchValid()) {
                                  setCurrentBatch(batch.id)
                                }
                              }}
                            >
                              <div className="relative mb-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isActive
                                    ? 'bg-white text-maroon-700 scale-110 shadow-lg'
                                    : isCompleted
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-white/30 text-white/70 group-hover:bg-white/40'
                                    }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : (
                                    <BatchIcon className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                              <div className="text-center hidden md:block">
                                <p className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-emerald-200' : 'text-rose-100/80 group-hover:text-white'}`}>
                                  {batch.title}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Current Batch Form */}
                <Card className="shadow-xl border-maroon-100">
                  <CardHeader className="bg-gradient-to-br from-[#6B1C23] via-[#7B2431] to-[#8B2C3F] text-white rounded-t-xl py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        {React.createElement(batches[currentBatch - 1].icon, { className: "h-5 w-5" })}
                      </div>
                      <div>
                        <CardTitle className="text-xl text-white font-bold">Batch {currentBatch}: {batches[currentBatch - 1].title}</CardTitle>
                        <CardDescription className="text-white/80 text-xs font-medium">{batches[currentBatch - 1].description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6 md:p-10">
                    {/* BATCH 1: Employee Details */}
                    {currentBatch === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="position" className="text-base font-semibold text-slate-800">
                            Position <span className="text-red-500">*</span>
                          </Label>
                          <select
                            id="position"
                            name="position"
                            value={progressionFormData.position || ''}
                            onChange={handleProgressionChange}
                            className="flex h-12 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-base focus-visible:ring-2 focus-visible:ring-maroon-500 transition-all font-medium"
                          >
                            <option value="">Select Position...</option>
                            {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="date_hired" className="text-base font-semibold text-slate-800">
                            Date Hired <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="date_hired"
                            type="date"
                            name="date_hired"
                            value={formatDateForInput(progressionFormData.date_hired)}
                            onChange={handleProgressionChange}
                            className="h-12 text-base border-2 border-slate-300 rounded-lg font-medium"
                          />
                        </div>
                      </div>
                    )}

                    {/* BATCH 2: Personal Information */}
                    {currentBatch === 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="last_name" className="text-sm font-semibold">Last Name <span className="text-red-500">*</span></Label>
                          <Input id="last_name" name="last_name" value={progressionFormData.last_name || ''} onChange={handleProgressionChange} placeholder="e.g., Dela Cruz" className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="first_name" className="text-sm font-semibold">First Name <span className="text-red-500">*</span></Label>
                          <Input id="first_name" name="first_name" value={progressionFormData.first_name || ''} onChange={handleProgressionChange} placeholder="e.g., Juan" className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="middle_name" className="text-sm font-semibold">Middle Name</Label>
                          <Input id="middle_name" name="middle_name" value={progressionFormData.middle_name || ''} onChange={handleProgressionChange} placeholder="Optional" className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="suffix" className="text-sm font-semibold">Suffix</Label>
                          <Input id="suffix" name="suffix" value={progressionFormData.suffix || ''} onChange={handleProgressionChange} placeholder="e.g., Jr." className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="birthday" className="text-sm font-semibold">Birthday <span className="text-red-500">*</span></Label>
                          <Input id="birthday" type="date" name="birthday" value={formatDateForInput(progressionFormData.birthday)} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="birthplace" className="text-sm font-semibold">Birthplace <span className="text-red-500">*</span></Label>
                          <Input id="birthplace" name="birthplace" value={progressionFormData.birthplace || ''} onChange={handleProgressionChange} placeholder="e.g., Manila" className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="gender" className="text-sm font-semibold">Gender <span className="text-red-500">*</span></Label>
                          <select id="gender" name="gender" value={progressionFormData.gender || ''} onChange={handleProgressionChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select...</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="civil_status" className="text-sm font-semibold">Civil Status <span className="text-red-500">*</span></Label>
                          <select id="civil_status" name="civil_status" value={progressionFormData.civil_status || ''} onChange={handleProgressionChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select...</option>
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* BATCH 3: Contact Information */}
                    {currentBatch === 3 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="mobile_number" className="text-sm font-semibold">Mobile Number <span className="text-red-500">*</span></Label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#A4163A] pointer-events-none group-focus-within:text-[#800020] transition-colors">
                              +63
                            </div>
                            <Input 
                              id="mobile_number" 
                              name="mobile_number" 
                              value={progressionFormData.mobile_number || ''} 
                              onChange={handleProgressionChange} 
                              placeholder="9XXXXXXXXX" 
                              className="pl-11 font-bold" 
                              maxLength={10}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="house_number" className="text-sm font-semibold">House number</Label>
                          <Input id="house_number" name="house_number" value={progressionFormData.house_number || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="street" className="text-sm font-semibold">Street <span className="text-red-500">*</span></Label>
                          <Input id="street" name="street" value={progressionFormData.street || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="village" className="text-sm font-semibold">Village</Label>
                          <Input id="village" name="village" value={progressionFormData.village || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="subdivision" className="text-sm font-semibold">Subdivision</Label>
                          <Input id="subdivision" name="subdivision" value={progressionFormData.subdivision || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                      </div>
                    )}

                    {/* BATCH 4: Government IDs */}
                    {currentBatch === 4 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="sss_number" className="text-sm font-semibold">SSS Number</Label>
                          <Input id="sss_number" name="sss_number" value={progressionFormData.sss_number || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="philhealth_number" className="text-sm font-semibold">PhilHealth Number</Label>
                          <Input id="philhealth_number" name="philhealth_number" value={progressionFormData.philhealth_number || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pagibig_number" className="text-sm font-semibold">Pag-IBIG Number</Label>
                          <Input id="pagibig_number" name="pagibig_number" value={progressionFormData.pagibig_number || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tin_number" className="text-sm font-semibold">TIN Number</Label>
                          <Input id="tin_number" name="tin_number" value={progressionFormData.tin_number || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                      </div>
                    )}

                    {/* BATCH 5: Family Information */}
                    {currentBatch === 5 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-rose-100 bg-rose-50/30 p-4">
                          <h4 className="font-bold text-rose-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-rose-500 rounded-full"></div>Mother's Maiden Name</h4>
                          <div className="space-y-4">
                            <Input placeholder="Last Name *" name="mlast_name" value={progressionFormData.mlast_name || ''} onChange={handleProgressionChange} className="font-medium" />
                            <Input placeholder="First Name *" name="mfirst_name" value={progressionFormData.mfirst_name || ''} onChange={handleProgressionChange} className="font-medium" />
                            <Input placeholder="Middle Name" name="mmiddle_name" value={progressionFormData.mmiddle_name || ''} onChange={handleProgressionChange} className="font-medium" />
                            <Input placeholder="Suffix" name="msuffix" value={progressionFormData.msuffix || ''} onChange={handleProgressionChange} className="font-medium" />
                          </div>
                        </Card>
                        <Card className="border-slate-100 bg-slate-50/30 p-4">
                          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-slate-500 rounded-full"></div>Father's Name (Optional)</h4>
                          <div className="space-y-4">
                            <Input placeholder="Last Name" name="flast_name" value={progressionFormData.flast_name || ''} onChange={handleProgressionChange} className="font-medium" />
                            <Input placeholder="First Name" name="ffirst_name" value={progressionFormData.ffirst_name || ''} onChange={handleProgressionChange} className="font-medium" />
                            <Input placeholder="Middle Name" name="fmiddle_name" value={progressionFormData.fmiddle_name || ''} onChange={handleProgressionChange} className="font-medium" />
                            <Input placeholder="Suffix" name="fsuffix" value={progressionFormData.fsuffix || ''} onChange={handleProgressionChange} className="font-medium" />
                          </div>
                        </Card>
                      </div>
                    )}

                    {/* BATCH 6: Current Address Details */}
                    {currentBatch === 6 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="region" className="text-sm font-semibold">Region <span className="text-red-500">*</span></Label>
                          <select name="region" value={progressionFormData.region || ''} onChange={handleProgressionChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select Region...</option>
                            {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="province" className="text-sm font-semibold">Province <span className="text-red-500">*</span></Label>
                          <select name="province" value={progressionFormData.province || ''} onChange={handleProgressionChange} disabled={!progressionFormData.region} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select Province...</option>
                            {currentProvinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city_municipality" className="text-sm font-semibold">City/Municipality <span className="text-red-500">*</span></Label>
                          <select name="city_municipality" value={progressionFormData.city_municipality || ''} onChange={handleProgressionChange} disabled={!progressionFormData.province} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select City...</option>
                            {currentCities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="barangay" className="text-sm font-semibold">Barangay <span className="text-red-500">*</span></Label>
                          <select name="barangay" value={progressionFormData.barangay || ''} onChange={handleProgressionChange} disabled={!progressionFormData.city_municipality} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select Barangay...</option>
                            {currentBarangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zip_code" className="text-sm font-semibold">ZIP Code <span className="text-red-500">*</span></Label>
                          <Input id="zip_code" name="zip_code" value={progressionFormData.zip_code || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email_address" className="text-sm font-semibold">Email Address <span className="text-red-500">*</span></Label>
                          <Input id="email_address" type="email" name="email_address" value={progressionFormData.email_address || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                      </div>
                    )}

                    {/* BATCH 7: Permanent Address Details */}
                    {currentBatch === 7 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="perm_house_number" className="text-sm font-semibold">House number</Label>
                          <Input id="perm_house_number" name="perm_house_number" value={progressionFormData.perm_house_number || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_street" className="text-sm font-semibold">Street <span className="text-red-500">*</span></Label>
                          <Input id="perm_street" name="perm_street" value={progressionFormData.perm_street || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_village" className="text-sm font-semibold">Village</Label>
                          <Input id="perm_village" name="perm_village" value={progressionFormData.perm_village || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_subdivision" className="text-sm font-semibold">Subdivision</Label>
                          <Input id="perm_subdivision" name="perm_subdivision" value={progressionFormData.perm_subdivision || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_region" className="text-sm font-semibold">Region <span className="text-red-500">*</span></Label>
                          <select name="perm_region" value={progressionFormData.perm_region || ''} onChange={handleProgressionChange} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select Region...</option>
                            {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_province" className="text-sm font-semibold">Province <span className="text-red-500">*</span></Label>
                          <select name="perm_province" value={progressionFormData.perm_province || ''} onChange={handleProgressionChange} disabled={!progressionFormData.perm_region} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select Province...</option>
                            {permanentProvinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_city_municipality" className="text-sm font-semibold">City/Municipality <span className="text-red-500">*</span></Label>
                          <select name="perm_city_municipality" value={progressionFormData.perm_city_municipality || ''} onChange={handleProgressionChange} disabled={!progressionFormData.perm_province} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select City...</option>
                            {permanentCities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_barangay" className="text-sm font-semibold">Barangay <span className="text-red-500">*</span></Label>
                          <select name="perm_barangay" value={progressionFormData.perm_barangay || ''} onChange={handleProgressionChange} disabled={!progressionFormData.perm_city_municipality} className="flex h-10 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium">
                            <option value="">Select Barangay...</option>
                            {permanentBarangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="perm_zip_code" className="text-sm font-semibold">ZIP Code <span className="text-red-500">*</span></Label>
                          <Input id="perm_zip_code" name="perm_zip_code" value={progressionFormData.perm_zip_code || ''} onChange={handleProgressionChange} className="font-medium" />
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <Separator />

                  {/* Navigation Footer */}
                  <CardContent className="py-6 font-sans">
                    <div className="flex justify-between items-center">
                      <Button
                        onClick={prevBatch}
                        disabled={currentBatch === 1}
                        variant="outline"
                        className="h-11 px-6 font-bold uppercase tracking-widest text-[10px] border-slate-200 hover:bg-slate-50 transition-all rounded-xl shadow-sm"
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous Batch
                      </Button>

                      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                        {batches.map((b) => (
                          <div 
                            key={b.id} 
                            className={`h-2 transition-all duration-300 rounded-full ${currentBatch === b.id ? 'bg-[#A4163A] w-12 shadow-[0_0_10px_rgba(164,22,58,0.3)]' : b.id < currentBatch ? 'bg-emerald-500 w-3' : 'bg-slate-300 w-3'}`} 
                          />
                        ))}
                      </div>

                      {currentBatch === 7 ? (
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => confirmSaveProgress('partial')}
                            disabled={isSaving}
                            variant="outline"
                            className="h-11 px-6 font-bold uppercase tracking-widest text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all active:scale-95 rounded-xl"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <LucideSave className="h-4 w-4 mr-2" />
                            )}
                            Save Progress
                          </Button>
                          <Button 
                            onClick={handleProgressionSave}
                            disabled={isSaving || !isCurrentBatchValid()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-200/50 active:scale-95 transition-all rounded-xl disabled:opacity-50"
                          >
                            {isSaving ? 'COMPLETING...' : 'COMPLETE & FINISH'}
                            {!isSaving && <LucideSave className="h-4 w-4 ml-2" />}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => confirmSaveProgress('partial')}
                            disabled={isSaving}
                            variant="outline"
                            className="h-11 px-6 font-bold uppercase tracking-widest text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm transition-all active:scale-95 rounded-xl"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <LucideSave className="h-4 w-4 mr-2" />
                            )}
                            Save Progress
                          </Button>
                          <Button 
                            onClick={nextBatch}
                            disabled={!isCurrentBatchValid()}
                            className="bg-[#A4163A] hover:bg-[#800020] text-white h-11 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-200/50 active:scale-95 transition-all rounded-xl disabled:opacity-50"
                          >
                            Next Batch
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        isLoading={isSaving || isActionLoading}
      />
    </div>
  )
}
