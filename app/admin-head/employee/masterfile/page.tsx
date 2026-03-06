"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ArrowUpDown, ListFilter, ArrowUpAZ, ArrowDownAZ, Clock3, History, Search, Plus, Users, ChevronDown, Check, Edit2, Save, Loader2, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
interface OnboardingChecklist {
  id: number
  name: string
  tasks: any[]
  status: string
  updated_at: string
}

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

interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  position: string
  status: 'pending' | 'employed' | 'terminated' | 'rehire_pending' | 'rehired_employee' | 'termination_pending' | 'resignation_pending'
  created_at: string
  updated_at?: string
  onboarding_tasks?: {
    done: number
    total: number
    isComplete: boolean
  }
  termination_date?: string
  termination_reason?: string
  rehire_started_at?: string | null
}

interface EmployeeDetails extends Employee {
  [key: string]: any
}

const statusBadgeColors = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  employed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  terminated: 'bg-rose-50 text-rose-700 border-rose-200',
  rehire_pending: 'bg-orange-50 text-orange-700 border-orange-200',
  rehired_employee: 'bg-blue-50 text-blue-700 border-blue-200',
  termination_pending: 'bg-rose-50 text-rose-700 border-rose-200 shadow-none uppercase tracking-wider',
  resignation_pending: 'bg-rose-50 text-rose-700 border-rose-200 shadow-none uppercase tracking-wider',
}

const statusLabels = {
  pending: 'Pending',
  employed: 'Employed',
  terminated: 'Terminated',
  rehire_pending: 'Rehire Pending',
  rehired_employee: 'Rehired Employee',
  termination_pending: 'Pending Termination',
  resignation_pending: 'Pending Resignation',
}

export default function MasterfilePage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetails | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list')
  const [activeTab, setActiveTab] = useState<'all' | 'employed' | 'terminated' | 'pending'>('all')
  const [isUpdating, setIsUpdating] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  
  // Editing States
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [isEditingCurrent, setIsEditingCurrent] = useState(false)
  const [isEditingPermanent, setIsEditingPermanent] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<EmployeeDetails>>({})

  // PSGC Dropdown States
  const [regions, setRegions] = useState<{ code: string; name: string }[]>([])
  const [provinces, setProvinces] = useState<{ code: string; name: string }[]>([])
  const [cities, setCities] = useState<{ code: string; name: string }[]>([])
  const [barangays, setBarangays] = useState<{ code: string; name: string }[]>([])
  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)
  const [checklists, setChecklists] = useState<OnboardingChecklist[]>([])
  const [rehireBatchProgress, setRehireBatchProgress] = useState<Record<string, number>>({})

  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'az' | 'za'>('recent')

  const loadRehireBatchProgress = () => {
    try {
      const raw = localStorage.getItem('rehire_batch_progress')
      const parsed = raw ? JSON.parse(raw) : {}
      const next: Record<string, number> = {}
      Object.entries(parsed || {}).forEach(([id, value]) => {
        const batch = Number(value)
        if (Number.isFinite(batch) && batch >= 1 && batch <= 7) {
          next[String(id)] = batch
        }
      })
      setRehireBatchProgress(next)
    } catch (error) {
      console.error('Failed to load rehire batch progress:', error)
      setRehireBatchProgress({})
    }
  }

  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    description: string
    onConfirm: () => void
    variant: "default" | "destructive" | "success" | "warning"
    confirmText?: string
    hideCancel?: boolean
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
    variant: 'default',
    confirmText: 'Confirm',
    hideCancel: false
  })

  useEffect(() => {
    fetchEmployees()
    fetchRegions()
    loadRehireBatchProgress()
  }, [])

  const fetchRegions = async () => {
    setLoadingRegions(true)
    try {
      const regionsArray = regionsData.map((region: any) => ({
        code: region.region_code || region.code,
        name: region.region_name || region.name
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

  const fetchProvinces = async (regionCode: string, isPermanent = false) => {
    if (!regionCode) {
      setProvinces([])
      setCities([])
      setBarangays([])
      return
    }
    setLoadingProvinces(true)
    try {
      const filteredProvinces = provincesData
        .filter((prov: any) => prov.region_code === regionCode)
        .map((prov: any) => ({
          code: prov.province_code || prov.code,
          name: prov.province_name || prov.name
        }))

      // Deduplicate by code
      const uniqueProvinces = Array.from(
        new Map(filteredProvinces.map(p => [p.code, p])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      setProvinces(uniqueProvinces)
    } catch (error) {
      console.error('Error filtering provinces:', error)
      setProvinces([])
    } finally {
      setLoadingProvinces(false)
    }
  }

  const fetchCities = async (provinceCode: string, isPermanent = false) => {
    if (!provinceCode) {
      setCities([])
      setBarangays([])
      return
    }
    setLoadingCities(true)
    try {
      const filteredCities = citiesData
        .filter((city: any) => city.province_code === provinceCode)
        .map((city: any) => ({
          code: city.city_code || city.code,
          name: city.city_name || city.name
        }))

      // Deduplicate by code
      const uniqueCities = Array.from(
        new Map(filteredCities.map(c => [c.code, c])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      setCities(uniqueCities)
    } catch (error) {
      console.error('Error filtering cities:', error)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  const fetchBarangays = async (cityCode: string, isPermanent = false) => {
    if (!cityCode) {
      setBarangays([])
      return
    }
    setLoadingBarangays(true)
    try {
      const filteredBarangays = barangaysData
        .filter((brgy: any) => brgy.city_code === cityCode)
        .map((brgy: any) => ({
          code: brgy.brgy_code || brgy.code,
          name: brgy.brgy_name || brgy.name
        }))

      // Deduplicate by code
      const uniqueBarangays = Array.from(
        new Map(filteredBarangays.map(b => [b.code, b])).values()
      ).sort((a, b) => a.name.localeCompare(b.name))

      setBarangays(uniqueBarangays)
    } catch (error) {
      console.error('Error filtering barangays:', error)
      setBarangays([])
    } finally {
      setLoadingBarangays(false)
    }
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Validation for mobile number: only numbers, max 10 digits
    if (name === 'mobile_number') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10)
      setEditFormData(prev => ({ ...prev, [name]: numericValue }))
      return
    }

    setEditFormData(prev => ({ ...prev, [name]: value }))

    // PSGC logic for Current Address
    if (name === 'region') {
      const selectedRegion = regions.find(r => r.name === value)
      if (selectedRegion) fetchProvinces(selectedRegion.code)
      setEditFormData(prev => ({ ...prev, province: '', city_municipality: '', barangay: '' }))
    } else if (name === 'province') {
      const selectedProvince = provinces.find(p => p.name === value)
      if (selectedProvince) fetchCities(selectedProvince.code)
      setEditFormData(prev => ({ ...prev, city_municipality: '', barangay: '' }))
    } else if (name === 'city_municipality') {
      const selectedCity = cities.find(c => c.name === value)
      if (selectedCity) fetchBarangays(selectedCity.code)
      setEditFormData(prev => ({ ...prev, barangay: '' }))
    }
    
    // PSGC logic for Permanent Address
    else if (name === 'perm_region') {
      const selectedRegion = regions.find(r => r.name === value)
      if (selectedRegion) fetchProvinces(selectedRegion.code, true)
      setEditFormData(prev => ({ ...prev, perm_province: '', perm_city_municipality: '', perm_barangay: '' }))
    } else if (name === 'perm_province') {
      const selectedProvince = provinces.find(p => p.name === value)
      if (selectedProvince) fetchCities(selectedProvince.code, true)
      setEditFormData(prev => ({ ...prev, perm_city_municipality: '', perm_barangay: '' }))
    } else if (name === 'perm_city_municipality') {
      const selectedCity = cities.find(c => c.name === value)
      if (selectedCity) fetchBarangays(selectedCity.code, true)
      setEditFormData(prev => ({ ...prev, perm_barangay: '' }))
    }
  }

  const toggleEditSection = async (section: 'contact' | 'current' | 'permanent') => {
    if (!selectedEmployee) return

    if (section === 'contact') {
      if (!isEditingContact) {
        setEditFormData({ ...selectedEmployee })
        setIsEditingCurrent(false)
        setIsEditingPermanent(false)
      }
      setIsEditingContact(!isEditingContact)
    } else if (section === 'current') {
      if (!isEditingCurrent) {
        setEditFormData({ ...selectedEmployee })
        setIsEditingContact(false)
        setIsEditingPermanent(false)
        // Pre-fetch PSGC data if possible
        if (selectedEmployee.region) {
          const region = regions.find(r => r.name === selectedEmployee.region)
          if (region) {
            await fetchProvinces(region.code)
            if (selectedEmployee.province) {
              const province = provinces.find(p => p.name === selectedEmployee.province)
              if (province) {
                await fetchCities(province.code)
                if (selectedEmployee.city_municipality) {
                  const city = cities.find(c => c.name === selectedEmployee.city_municipality)
                  if (city) await fetchBarangays(city.code)
                }
              }
            }
          }
        }
      }
      setIsEditingCurrent(!isEditingCurrent)
    } else if (section === 'permanent') {
      if (!isEditingPermanent) {
        setEditFormData({ ...selectedEmployee })
        setIsEditingContact(false)
        setIsEditingCurrent(false)
        if (selectedEmployee.perm_region) {
          const region = regions.find(r => r.name === selectedEmployee.perm_region)
          if (region) {
            await fetchProvinces(region.code, true)
            if (selectedEmployee.perm_province) {
              const province = provinces.find(p => p.name === selectedEmployee.perm_province)
              if (province) {
                await fetchCities(province.code, true)
                if (selectedEmployee.perm_city_municipality) {
                  const city = cities.find(c => c.name === selectedEmployee.perm_city_municipality)
                  if (city) await fetchBarangays(city.code, true)
                }
              }
            }
          }
        }
      }
      setIsEditingPermanent(!isEditingPermanent)
    }
  }

  const handleSaveSection = async (section: 'contact' | 'current' | 'permanent') => {
    if (!selectedEmployee) return
    setIsActionLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Section updated successfully')
        setSelectedEmployee({ ...selectedEmployee, ...editFormData })
        if (section === 'contact') setIsEditingContact(false)
        else if (section === 'current') setIsEditingCurrent(false)
        else if (section === 'permanent') setIsEditingPermanent(false)
        fetchEmployees() // Refresh list
      } else {
        toast.error(data.message || 'Failed to update section')
      }
    } catch (error) {
      console.error('Error saving section:', error)
      toast.error('Network Error')
    } finally {
      setIsActionLoading(false)
    }
  }

  const fetchEmployees = async () => {
    loadRehireBatchProgress()
    setFetchError(null)
    try {
      const apiUrl = getApiUrl()
      const employeesUrl = `${apiUrl}/api/employees`
      const checklistsUrl = `${apiUrl}/api/onboarding-checklist`

      const terminationsUrl = `${apiUrl}/api/terminations`

      const [empRes, checkRes, termRes] = await Promise.all([
        fetch(employeesUrl, { headers: { Accept: 'application/json' } }),
        fetch(checklistsUrl, { headers: { Accept: 'application/json' } }),
        fetch(terminationsUrl, { headers: { Accept: 'application/json' } })
      ])

      if (!empRes.ok || !checkRes.ok || !termRes.ok) {
        throw new Error(`HTTP Error: employees=${empRes.status}, checklists=${checkRes.status}, terminations=${termRes.status}`)
      }

      const empData = await empRes.json()
      const checkData = await checkRes.json()
      const termData = await termRes.json()

      if (empData.success) {
        const checklistsList = Array.isArray(checkData.data) ? checkData.data : []
        const terminationsList = termData.success && Array.isArray(termData.data) ? termData.data : []
        const normalizeName = (value: unknown) =>
          String(value ?? '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim()

        setChecklists(checklistsList)

        const enhancedEmployees = await Promise.all(empData.data.map(async (emp: Employee) => {
          const fullName = normalizeName(`${emp.first_name} ${emp.last_name}`)
          const empEmail = normalizeName(emp.email || '')
          const empId = String(emp.id ?? '').trim().toLowerCase()
          const nameParts = fullName.split(' ').filter(Boolean)
          const firstName = nameParts[0] || ''
          const lastName = nameParts[nameParts.length - 1] || ''
          const checklistMatches = checklistsList
            .filter((c: any) => {
              const checklistEmployeeId = String(c?.employeeId ?? c?.employee_id ?? '').trim().toLowerCase()
              if (empId && checklistEmployeeId && checklistEmployeeId === empId) return true
              const candidate = normalizeName(c?.name)
              if (!candidate) return false
              if (candidate === fullName) return true
              if (firstName && lastName) {
                return candidate.includes(firstName) && candidate.includes(lastName)
              }
              return false
            })
            .sort((a: any, b: any) => {
              const aTime = new Date(a?.updated_at ?? a?.created_at ?? 0).getTime()
              const bTime = new Date(b?.updated_at ?? b?.created_at ?? 0).getTime()
              return bTime - aTime
            })
          const checklist = checklistMatches[0]
          const termination = terminationsList
            .filter((t: any) => {
              const idMatch = String(t?.employee_id ?? '') === String(emp.id)
              const terminationEmail = normalizeName(t?.employee?.email ?? '')
              const emailMatch = Boolean(empEmail) && terminationEmail === empEmail
              return idMatch || emailMatch
            })
            .sort((a: any, b: any) => {
              const aTs = new Date(a?.rehired_at ?? a?.updated_at ?? a?.created_at ?? a?.termination_date ?? 0).getTime()
              const bTs = new Date(b?.rehired_at ?? b?.updated_at ?? b?.created_at ?? b?.termination_date ?? 0).getTime()
              return bTs - aTs
            })[0]

          let enhancedEmp: any = { ...emp }

          // For pending/rehire cards, pull full profile so batch detection is accurate.
          if (['pending', 'rehire_pending'].includes(String(emp.status))) {
            try {
              const detailsResponse = await fetch(`${apiUrl}/api/employees/${emp.id}`, {
                headers: { Accept: 'application/json' },
              })
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json()
                if (detailsData?.success && detailsData?.data) {
                  enhancedEmp = { ...enhancedEmp, ...detailsData.data }
                }
              }
            } catch (detailsError) {
              console.error(`Failed to fetch detailed profile for ${emp.id}:`, detailsError)
            }
          }

          if (termination) {
            enhancedEmp.termination_date = termination.termination_date
            enhancedEmp.termination_reason = termination.reason
            enhancedEmp.rehire_started_at = termination.rehired_at ?? null
          }

          if (checklist) {
            const tasks = Array.isArray(checklist.tasks) ? checklist.tasks : []
            const doneCount = tasks.filter((t: any) => String(t?.status ?? '').toUpperCase() === 'DONE').length
            const checklistStatus = String(checklist?.status ?? '').toUpperCase()
            const checklistUpdatedAt = new Date(checklist?.updated_at ?? checklist?.created_at ?? 0).getTime()
            const rehireStartedAt = new Date(enhancedEmp?.rehire_started_at ?? 0).getTime()
            const rehireCycleFallbackStart = new Date(enhancedEmp?.updated_at ?? 0).getTime()
            const rehireCycleStartAt = Number.isFinite(rehireStartedAt) && rehireStartedAt > 0
              ? rehireStartedAt
              : rehireCycleFallbackStart
            const checklistBelongsToCurrentRehire = enhancedEmp.status !== 'rehire_pending'
              ? true
              : Number.isFinite(rehireCycleStartAt) && rehireCycleStartAt > 0 && checklistUpdatedAt >= rehireCycleStartAt

            enhancedEmp = {
              ...enhancedEmp,
              onboarding_tasks: {
                done: checklistBelongsToCurrentRehire ? doneCount : 0,
                total: tasks.length,
                isComplete: checklistBelongsToCurrentRehire
                  && doneCount === tasks.length
                  && tasks.length > 0
                  && (
                    enhancedEmp.status !== 'rehire_pending'
                    || checklistStatus === 'DONE'
                  )
              }
            }
          }
          return enhancedEmp
        }))
        setEmployees(enhancedEmployees || [])
      } else {
        toast.error(empData.message || 'Failed to fetch employees')
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
      setFetchError('Network Error: Could not connect to the server.')
      toast.error('Network Error: Could not connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeDetails = async (employeeId: number) => {
    try {
      setIsDetailLoading(true)
      setViewMode('details')
      window.scrollTo(0, 0)

      const apiUrl = getApiUrl()
      const fullUrl = `${apiUrl}/api/employees/${employeeId}`

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Find existing onboarding tasks and termination details from the employees list to preserve state
        const existingEmp = employees.find(e => e.id === employeeId)
        const enhancedDetails = {
          ...data.data,
          onboarding_tasks: existingEmp?.onboarding_tasks,
          termination_date: existingEmp?.termination_date,
          termination_reason: existingEmp?.termination_reason,
          rehire_started_at: existingEmp?.rehire_started_at
        }
        setSelectedEmployee(enhancedDetails)
      } else {
        toast.error(data.message || 'Failed to load employee details')
        setViewMode('list')
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
      toast.error('Network Error: Could not connect to the server.')
      setViewMode('list')
    } finally {
      setIsDetailLoading(false)
    }
  }

  const checkCompleteness = (emp: any) => {
    if (!emp) return { isComplete: false, status: 'Incomplete', batchId: 1 }

    // Batch 1: Employee Details (Manual override for onboarding flow)
    // If the employee is still 'pending' and hasn't finished the profile,
    // we want them to go through Batch 1. We require date_hired to be explicitly set.
    if (!emp.position || emp.position.toString().trim() === '' || !emp.date_hired) {
      return { isComplete: false, status: 'Pending: Employee Details', batchId: 1 }
    }

    // Batch 2: Personal Information
    const personalFields = ['last_name', 'first_name', 'birthday', 'birthplace', 'civil_status', 'gender']
    for (const field of personalFields) {
      if (!emp[field] || emp[field].toString().trim() === '') {
        return { isComplete: false, status: 'Pending: Personal Information', batchId: 2 }
      }
    }

    // Batch 3: Contact Information
    if (!emp.mobile_number || emp.mobile_number.toString().trim() === '' || !emp.email) {
      return { isComplete: false, status: 'Pending: Contact Information', batchId: 3 }
    }

    // Batch 4: Government IDs (optional in onboarding flow)

    // Batch 5: Family Information
    if (!emp.mlast_name || emp.mlast_name.toString().trim() === '' || !emp.mfirst_name || emp.mfirst_name.toString().trim() === '') {
      return { isComplete: false, status: 'Pending: Family Information', batchId: 5 }
    }

    // Batch 6: Current Address Information
    const addressFields = ['street', 'barangay', 'region', 'province', 'city_municipality', 'zip_code']
    for (const field of addressFields) {
      if (!emp[field] || emp[field].toString().trim() === '') {
        return { isComplete: false, status: 'Pending: Current Address Information', batchId: 6 }
      }
    }

    // Batch 7: Permanent Address Information
    const permAddressFields = ['perm_street', 'perm_barangay', 'perm_region', 'perm_province', 'perm_city_municipality', 'perm_zip_code']
    for (const field of permAddressFields) {
      if (!emp[field] || emp[field].toString().trim() === '') {
        return { isComplete: false, status: 'Pending: Permanent Address Information', batchId: 7 }
      }
    }

    return { 
      isComplete: true, 
      status: emp.status === 'rehire_pending' ? 'PENDING: COMPLETE & FINISH REHIRE' : 'READY TO EMPLOY', 
      batchId: 1 
    }
  }

  const batchLabelById: Record<number, string> = {
    1: 'Employee Details',
    2: 'Personal Information',
    3: 'Contact Information',
    4: 'Government IDs',
    5: 'Family Information',
    6: 'Current Address',
    7: 'Permanent Address',
  }

  const handleSetAsEmployed = async () => {
    if (!selectedEmployee) return

    const { isComplete } = checkCompleteness(selectedEmployee)
    const isRehire = selectedEmployee.status === 'rehire_pending'
    
    if (!isComplete) {
      setConfirmModal({
        isOpen: true,
        title: 'Information Incomplete',
        description: `Cannot ${isRehire ? 're-hire' : 'employ'}: Missing required Information. Please complete the employee profile first.`,
        variant: 'warning',
        confirmText: 'Got it',
        hideCancel: true,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      })
      return
    }

    setConfirmModal({
      isOpen: true,
      title: isRehire ? 'Confirm Re-hire' : 'Confirm Employment',
      description: `Are you sure you want to ${isRehire ? 're-hire' : 'employ'} ${selectedEmployee.first_name} ${selectedEmployee.last_name}?`,
      variant: 'default',
      confirmText: isRehire ? 'Yes, Re-hire' : 'Yes, Employ',
      hideCancel: false,
      onConfirm: async () => {
        setIsUpdating(true)
        try {
          const apiUrl = getApiUrl()
          const finalStatus = isRehire ? 'rehired_employee' : 'employed'
          
          const response = await fetch(`${apiUrl}/api/employees/${selectedEmployee.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: finalStatus }),
          })

          const data = await response.json()
          if (data.success) {
            toast.success(`${selectedEmployee.first_name} ${isRehire ? 're-hired' : 'set as employed'} successfully`)
            await fetchEmployees()
            setViewMode('list')
            setSelectedEmployee(null)
          } else {
            // Parse validation errors if present
            if (data.errors) {
              const errorMessages = Object.values(data.errors).flat().join(' ')
              toast.error(errorMessages || data.message)
            } else {
              toast.error(data.message || 'Failed to update status')
            }
          }
        } catch (error) {
          console.error('Error updating status:', error)
          if (error instanceof TypeError && error.message === 'Failed to fetch') {
            toast.error('Could not connect to server. Please ensure the backend is running.')
          } else {
            toast.error('Failed to update status')
          }
        } finally {
          setIsUpdating(false)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        }
      }
    })
  }

  const filterEmployees = (list: Employee[]) => {
    let result = [...list]

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((emp) =>
        emp.first_name?.toLowerCase().includes(query) ||
        emp.last_name?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query)
      )
    }

    // Sort Logic
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'az':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        case 'za':
          return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`)
        default:
          return 0
      }
    })

    return result
  }

  const employedList = filterEmployees(
    employees.filter(e => e.status === 'employed' || e.status === 'rehired_employee')
  )
  const terminatedList = filterEmployees(employees.filter(e => e.status === 'terminated'))
  const pendingList = filterEmployees(
    employees.filter(e => ['pending', 'rehire_pending', 'termination_pending', 'resignation_pending'].includes(e.status))
  )
  const allList = filterEmployees(employees)

  // End filter derivation



  const EmployeeTable = ({ list, emptyMessage }: { list: Employee[], emptyMessage: string }) => (
    <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg flex flex-col">
      <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex justify-between items-center">
        <h3 className="text-xl text-[#4A081A] font-bold capitalize">
          {activeTab} Employees Master List
        </h3>
        <div className="text-[#A0153E]/70 flex items-center gap-2 text-xs font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C9184A]" />
          <span>{list.length} records shown</span>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-stone-50/30">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Email/Contact</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right font-bold text-[#800020] text-sm uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((employee) => (
                <tr key={employee.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200 group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-base group-hover:text-[#630C22] transition-colors">
                      {employee.first_name} {employee.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{employee.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-semibold">{employee.position || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${statusBadgeColors[employee.status]} border shadow-none font-bold px-3 py-1 uppercase text-[10px] pointer-events-none rounded-full`}>
                      {statusLabels[employee.status]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {employee.status === 'terminated' && employee.termination_date ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-rose-700">{new Date(employee.termination_date).toLocaleDateString()}</span>
                        <span className="text-[10px] uppercase font-bold text-rose-300">Terminated</span>
                      </div>
                    ) : (
                      <span className="font-medium">{new Date(employee.created_at).toLocaleDateString()}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => fetchEmployeeDetails(employee.id)}
                      className="px-6 py-2 bg-white border-2 border-[#A4163A] text-[#A4163A] font-bold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out hover:bg-[#A4163A] hover:text-white hover:border-[#A4163A] cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const DetailSkeleton = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200">
        <div className="bg-slate-50/50 p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="p-8 md:p-10 space-y-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-6">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex justify-end gap-3">
          <Skeleton className="h-12 w-32 rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans flex flex-col">
      {/* ----- GLOBAL LOADING OVERLAY (For Actions Only) ----- */}
      {isActionLoading && (
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

      {viewMode === 'list' ? (
        <div className="flex-1 flex flex-col">
          {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
          <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
            {/* Main Header Row */}
            <div className="w-full px-4 md:px-8 py-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Employee Records</h1>
                  <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Manage and monitor employee master data and records.
                  </p>
                </div>
              </div>
            </div>

            {/* Secondary Toolbar */}
            <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="w-full px-4 md:px-8 py-3">
                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                  {/* Status Tabs */}
                  <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'all'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      All ({employees.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('employed')}
                      className={`cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'employed'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Employed ({employees.filter(e => e.status === 'employed' || e.status === 'rehired_employee').length})
                    </button>
                    <button
                      onClick={() => setActiveTab('terminated')}
                      className={`cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'terminated'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Terminated ({employees.filter(e => e.status === 'terminated').length})
                    </button>
                    <button
                      onClick={() => setActiveTab('pending')}
                      className={`cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${activeTab === 'pending'
                        ? 'bg-white text-[#A4163A] shadow-md'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      Pending ({employees.filter(e => e.status === 'pending' || e.status === 'rehire_pending').length})
                    </button>
                  </div>

                  {/* Search and Sort */}
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-[350px]">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                      <Input
                        placeholder="Search employee..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                      />
                    </div>

                    <Select
                      value={sortOrder}
                      onValueChange={(value: any) => setSortOrder(value)}
                    >
                      <SelectTrigger
                        className="w-full sm:w-[180px] bg-white border-2 border-[#FFE5EC] h-10 rounded-lg shadow-sm focus:ring-[#A0153E] text-[#800020] font-bold select-none caret-transparent pr-4 [&>svg]:hidden"
                      >
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          <SelectValue placeholder="Sort by" />
                        </div>
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        side="bottom"
                        align="start"
                        sideOffset={6}
                        avoidCollisions={false}
                        className="rounded-xl border-stone-200 shadow-xl overflow-hidden"
                      >
                        <SelectItem value="recent" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <History className="h-4 w-4" />
                            <span>Recent First</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="oldest" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <Clock3 className="h-4 w-4" />
                            <span>Oldest First</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="az" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <ArrowUpAZ className="h-4 w-4" />
                            <span>Alphabet (A-Z)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="za" className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <ArrowDownAZ className="h-4 w-4" />
                            <span>Alphabet (Z-A)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-3 md:px-6 lg:px-8 pb-8 md:pb-12 overflow-y-auto">
            {fetchError ? (
              <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 group">
                  <Badge variant="outline" className="h-12 w-12 border-rose-200 bg-white shadow-sm flex items-center justify-center rounded-lg group-hover:scale-110 transition-transform duration-300">
                    <X className="w-6 h-6 text-rose-500" />
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Connection Failed</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  {fetchError} Please ensure the backend server is running and try again.
                </p>
                <Button
                  onClick={fetchEmployees}
                  className="bg-[#A4163A] hover:bg-[#80122D] text-white px-8 h-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Retry Connection
                </Button>
              </div>
            ) : loading ? (
              <div className="space-y-12">
                {/* Pending Skeletons */}
                <div className="bg-orange-50/50 rounded-lg p-4 md:p-6 border border-orange-200 mb-8 md:mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <Skeleton className="h-6 w-1.5 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-14 w-14 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-5 w-32" />
                          </div>
                        </div>
                        <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-6 w-6 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-64 rounded-xl" />
                  <Skeleton className="h-10 w-48 rounded-xl" />
                </div>
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex gap-4">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                  </div>
                  <div className="p-4 space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : employees.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <p>No employees found.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Persistent Pending Approval Section */}
                {pendingList.length > 0 && (
                  <div className="bg-orange-50/50 rounded-lg p-4 md:p-6 border border-orange-200">
                    <h3 className="text-base md:text-lg font-bold text-orange-900 mb-4 md:mb-6 flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-orange-400 rounded-full" />
                      Pending Approval
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                        {pendingList.length}
                      </Badge>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                      {pendingList.map((employee) => {
                        const isTerminationPending = employee.status === 'termination_pending' || employee.status === 'resignation_pending'
                        const isRehirePending = employee.status === 'rehire_pending'
                        const checklistTasksComplete =
                          !!employee.onboarding_tasks?.isComplete ||
                          (Number(employee.onboarding_tasks?.total ?? 0) > 0 &&
                          Number(employee.onboarding_tasks?.done ?? 0) === Number(employee.onboarding_tasks?.total ?? 0))
                        
                        // Use default logic if NOT termination pending
                        const { isComplete, status, batchId } = checkCompleteness(employee as any)
                        const isFullyComplete = isComplete && checklistTasksComplete
                        const savedBatchId = rehireBatchProgress[String(employee.id)]
                        const displayBatchId = isRehirePending && Number.isFinite(savedBatchId) ? savedBatchId : batchId
                        const batchLabel = batchLabelById[displayBatchId] || 'Employee Details'

                        // For termination, it's not complete until status changes to 'terminated' or 'resigned' in the db
                        const displayStatus = employee.status === 'resignation_pending' ? 'PENDING RESIGNATION' : 'PENDING TERMINATION'

                        return (
                          <div
                            key={employee.id}
                            onClick={() => fetchEmployeeDetails(employee.id)}
                            className={`group relative bg-white border rounded-lg p-4 md:p-5 shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden ${
                              isTerminationPending 
                              ? 'border-rose-200 hover:border-rose-300'
                              : isFullyComplete
                              ? 'border-emerald-200 hover:border-emerald-400 ring-1 ring-emerald-50'
                              : isRehirePending
                                ? 'border-blue-200 hover:border-blue-300'
                                : 'border-orange-200 hover:border-orange-300'
                            }`}
                          >
                            {/* Ready Indicator Strip */}
                            {isTerminationPending && <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500"></div>}
                            {(!isTerminationPending && isFullyComplete) && <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>}
                            {(!isTerminationPending && !isFullyComplete) && <div className={`absolute top-0 left-0 w-full h-1.5 ${isRehirePending ? 'bg-blue-500' : 'bg-orange-400'}`}></div>}

                            {/* Top Row: Employee Info + Review Button */}
                            <div className="flex justify-between items-start gap-3 mb-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-14 h-14 md:w-16 md:h-16 min-w-[3.5rem] md:min-w-[4rem] rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold transition-colors duration-200 shadow-sm ${
                                  isTerminationPending
                                  ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-500 group-hover:text-white'
                                  : isFullyComplete
                                  ? 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-white'
                                  : isRehirePending
                                    ? 'bg-blue-100 text-blue-700 group-hover:bg-blue-500 group-hover:text-white'
                                    : 'bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white'
                                }`}>
                                  {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                                </div>
                                <div className="overflow-hidden flex flex-col justify-center min-w-0 flex-1">
                                  <p className="font-semibold text-[#4A081A] text-[10px] uppercase tracking-wider mb-1 truncate opacity-60">
                                    {employee.position || 'No Position'}
                                  </p>
                                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight group-hover:text-[#630C22] transition-colors break-words">
                                    {employee.first_name} {employee.last_name}
                                  </h1>
                                </div>
                              </div>
                              {/* Review Button - Top Right */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  fetchEmployeeDetails(employee.id)
                                }}
                                className="h-7 px-3 text-[10px] font-bold rounded-md transition-all whitespace-nowrap flex-shrink-0 bg-white border border-[#A4163A]/20 text-[#A4163A] hover:bg-[#A4163A] hover:text-white hover:border-[#A4163A] shadow-sm hover:shadow-md"
                              >
                                Review
                              </button>
                            </div>
                            
                            {/* Action Buttons Row */}
                            {(isTerminationPending || isRehirePending || (employee.status === 'pending' && (!isComplete || !employee.onboarding_tasks?.isComplete))) && (
                              <div className="mb-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {isTerminationPending && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/admin-head/employee/terminate?view=history&action=checklist&employeeId=${employee.id}`)}
                                    className="h-8 px-3 text-[11px] font-bold border rounded-lg transition-all text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-100 animate-pulse hover:animate-none whitespace-nowrap"
                                  >
                                    Continue Clearance
                                  </Button>
                                )}
                                {isRehirePending && !isFullyComplete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        checklistTasksComplete
                                          ? `/admin-head/employee/onboard?id=${employee.id}&view=update-info&rehire=1&batch=${displayBatchId}`
                                          : `/admin-head/employee/onboard?id=${employee.id}&view=checklist&rehire=1&batch=${displayBatchId}`
                                      )
                                    }
                                    className={`h-8 px-3 text-[11px] font-bold border rounded-lg transition-all whitespace-nowrap ${
                                      isRehirePending
                                        ? 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 animate-pulse hover:animate-none'
                                        : employee.onboarding_tasks?.isComplete
                                          ? 'text-[#630C22] bg-rose-50 hover:bg-rose-100 border-rose-100'
                                          : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100 animate-pulse hover:animate-none'
                                    }`}
                                  >
                                    {isRehirePending ? 'Continue Rehire' : employee.onboarding_tasks?.isComplete ? 'Update Profile' : 'Continue Onboarding'}
                                  </Button>
                                )}
                                {(employee.status === 'pending') && (!isComplete || !employee.onboarding_tasks?.isComplete) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      router.push(
                                        employee.onboarding_tasks?.isComplete
                                          ? `/admin-head/employee/onboard?id=${employee.id}&batch=${checkCompleteness(employee as any).batchId}`
                                          : `/admin-head/employee/onboard?id=${employee.id}&view=checklist&batch=${checkCompleteness(employee as any).batchId}`
                                      )
                                    }
                                    className={`h-8 px-3 text-[11px] font-bold border rounded-lg transition-all whitespace-nowrap ${employee.onboarding_tasks?.isComplete
                                      ? 'text-[#630C22] bg-rose-50 hover:bg-rose-100 border-rose-100'
                                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100 animate-pulse hover:animate-none'
                                      }`}
                                  >
                                    {employee.onboarding_tasks?.isComplete ? 'Update Profile' : 'Continue Onboarding'}
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            {/* Bottom Row: Status Badges */}
                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                              {isTerminationPending ? (
                                <Badge variant="outline" className="text-[10px] font-bold text-rose-600 bg-rose-50 border-rose-200 shadow-none uppercase tracking-wider rounded-md">
                                  {displayStatus}
                                </Badge>
                              ) : isFullyComplete ? (
                                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border-emerald-100">
                                  {isRehirePending ? 'READY TO RE-HIRE' : status}
                                </Badge>
                              ) : (
                                <>
                                  <Badge variant="outline" className={`text-[10px] font-bold shadow-none uppercase tracking-wider rounded-md whitespace-nowrap ${isRehirePending ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}>
                                    {!checklistTasksComplete
                                      ? "PENDING: onboarding process"
                                      : (!isComplete ? status : (isRehirePending ? "PENDING: COMPLETE & FINISH REHIRE" : "PENDING: ONBOARDING CHECKLIST"))}
                                  </Badge>
                                  {employee.onboarding_tasks && (
                                    <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
                                      {checklistTasksComplete
                                        ? `Batch ${displayBatchId}: ${batchLabel}`
                                        : `Tasks: ${employee.onboarding_tasks.done}/${employee.onboarding_tasks.total}`}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="mt-12">
                  <EmployeeTable
                    list={
                      activeTab === 'all' ? allList :
                        activeTab === 'employed' ? employedList :
                          activeTab === 'terminated' ? terminatedList :
                            pendingList
                    }
                    emptyMessage={
                      searchQuery
                        ? `No ${activeTab} employees match your search.`
                        : `No ${activeTab} employees found.`
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DETAIL VIEW (Replaces Modal) */
        <div>
          {isDetailLoading ? (
            <DetailSkeleton />
          ) : (
            <>
{/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
<div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
  {/* Main Header Row */}
  <div className="w-full px-4 md:px-8 py-6">
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Employee Information</h1>
        <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
          <Users className="w-4 h-4" />
          View and manage employee profile information and records.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setViewMode('list')}
          disabled={isDetailLoading}
          className="border-2 border-white/40 text-white hover:bg-white/20 hover:border-white/60 bg-transparent backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <ChevronUp className="w-4 h-4 rotate-90" />
          <span>BACK TO LIST</span>
        </button>
      </div>
    </div>
  </div>

  {/* Secondary Toolbar - Employee Status Bar */}
  {selectedEmployee && (
    <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="w-full px-4 md:px-8 py-3">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {/* Employee Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center text-lg font-bold">
              {selectedEmployee?.first_name?.charAt(0)}{selectedEmployee?.last_name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-white/70 uppercase tracking-wider">Employee</p>
              <p className="text-white font-bold text-base">
                {selectedEmployee?.first_name} {selectedEmployee?.last_name}
              </p>
            </div>
          </div>

          {/* ID Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white/70 uppercase tracking-wider">ID</span>
            <div className="bg-white border-2 border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[100px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg">
              #{selectedEmployee?.id.toString().padStart(4, '0')}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Status</span>
            <div className="bg-white border-2 border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg">
              {(selectedEmployee?.status === 'pending' || selectedEmployee?.status === 'rehire_pending') ? (
                <div className="flex items-center gap-2">
                  {selectedEmployee.status === 'rehire_pending'
                    ? (
                        selectedEmployee.onboarding_tasks?.isComplete &&
                        checkCompleteness(selectedEmployee).isComplete &&
                        Boolean(selectedEmployee.rehire_started_at)
                          ? 'READY TO RE-HIRE'
                          : 'PENDING: COMPLETE & FINISH REHIRE'
                      )
                    : (
                        selectedEmployee.onboarding_tasks?.isComplete
                          ? checkCompleteness(selectedEmployee).status
                          : "PENDING: ONBOARDING CHECKLIST"
                      )}
                </div>
              ) : (
                statusLabels[selectedEmployee?.status || 'pending']
              )}
            </div>
          </div>

          {/* Position */}
          {selectedEmployee?.position && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white/70 uppercase tracking-wider">Position</span>
              <div className="bg-white border-2 border-[#FFE5EC] text-[#800020] text-sm h-10 px-4 shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg">
                {selectedEmployee.position}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>

<div className="px-4 md:px-8 py-6">
  <div className="bg-white p-3 md:p-6 rounded-lg shadow-lg border-b-2 md:border-2 border-[#FFE5EC]">
    {isDetailLoading ? (
      <div className="flex items-center justify-center p-12">
        <svg className="w-8 h-8 animate-spin text-[#A0153E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-500 font-medium">Loading employee details...</span>
      </div>
    ) : (
      <div className="space-y-6">
        {/* Header Info Card - using div */}
        <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
          <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-[#4A081A] font-bold">Employee Profile</h2>
              <p className="text-sm font-bold text-[#630C22]">
                {selectedEmployee?.first_name} {selectedEmployee?.last_name}
              </p>
            </div>
            <p className="text-[#630C22]/70 text-xs font-medium mt-1">
              Complete employee information and records
            </p>
          </div>
        </div>

        {selectedEmployee && (
          <>
            {/* EMPLOYMENT */}
            <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
              <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
                <h3 className="text-lg text-[#4A081A] font-bold flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#630C22] rounded-full"></span>
                  Employment Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <DetailItem label="Position" value={selectedEmployee.position} required />
                  <DetailItem label="Date Hired" value={selectedEmployee.date_hired ? new Date(selectedEmployee.date_hired).toLocaleDateString() : null} required />
                  <DetailItem label="Department" value={selectedEmployee.department} />
                  <DetailItem label="Employment Status" value={selectedEmployee.status} />
                </div>
              </div>
            </div>

            {/* PERSONAL */}
            <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
              <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
                <h3 className="text-lg text-[#4A081A] font-bold flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#630C22] rounded-full"></span>
                  Personal Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  <DetailItem label="First Name" value={selectedEmployee.first_name} required />
                  <DetailItem label="Last Name" value={selectedEmployee.last_name} required />
                  <DetailItem label="Middle Name" value={selectedEmployee.middle_name} />
                  <DetailItem label="Suffix" value={selectedEmployee.suffix} />
                  <DetailItem label="Birthday" value={selectedEmployee.birthday ? new Date(selectedEmployee.birthday).toLocaleDateString() : null} required />
                  <DetailItem label="Birthplace" value={selectedEmployee.birthplace} required />
                  <DetailItem label="Gender" value={selectedEmployee.gender} required />
                  <DetailItem label="Civil Status" value={selectedEmployee.civil_status} required />
                </div>
              </div>
            </div>

            {/* CONTACT */}
            <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
              <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex justify-between items-center">
                <h3 className="text-lg text-[#4A081A] font-bold flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#630C22] rounded-full"></span>
                  Contact Information
                </h3>
                <div className="flex gap-2">
                  {isEditingContact ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingContact(false)} className="h-8 text-slate-500 hover:text-slate-700">
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => handleSaveSection('contact')} disabled={isActionLoading} className="h-8 bg-[#630C22] hover:bg-[#800020] text-white">
                        {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Save
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => toggleEditSection('contact')} className="h-8 text-[#630C22] hover:bg-[#630C22]/10 font-bold">
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                  {isEditingContact ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                        <Input name="email" value={editFormData.email || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Mobile Number</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#630C22] pointer-events-none group-focus-within:text-[#800020] transition-colors">
                            +63
                          </div>
                          <Input 
                            name="mobile_number" 
                            value={editFormData.mobile_number || ''} 
                            onChange={handleEditChange} 
                            className="h-9 pl-11 font-bold" 
                            placeholder="9XXXXXXXXX"
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <DetailItem label="Email Address" value={selectedEmployee.email} required />
                      <DetailItem label="Mobile Number" value={selectedEmployee.mobile_number ? `+63 ${selectedEmployee.mobile_number}` : ''} required />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ADDRESS INFORMATION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CURRENT ADDRESS */}
              <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
                <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex justify-between items-center">
                  <h3 className="text-lg text-[#4A081A] font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#630C22] rounded-full"></span>
                    Current Address
                  </h3>
                  <div className="flex gap-2">
                    {isEditingCurrent ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingCurrent(false)} className="h-8 text-slate-500 hover:text-slate-700">
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveSection('current')} disabled={isActionLoading} className="h-8 bg-[#630C22] hover:bg-[#800020] text-white">
                          {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toggleEditSection('current')} className="h-8 text-[#630C22] hover:bg-[#630C22]/10 font-bold">
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {isEditingCurrent ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">House No.</label>
                        <Input name="house_number" value={editFormData.house_number || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Street <span className="text-red-500">*</span></label>
                        <Input name="street" value={editFormData.street || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Village</label>
                        <Input name="village" value={editFormData.village || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Subdivision</label>
                        <Input name="subdivision" value={editFormData.subdivision || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Region</label>
                        <select name="region" value={editFormData.region || ''} onChange={handleEditChange} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select Region...</option>
                          {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Province</label>
                        <select name="province" value={editFormData.province || ''} onChange={handleEditChange} disabled={!editFormData.region || loadingProvinces} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select Province...</option>
                          {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">City / Municipality</label>
                        <select name="city_municipality" value={editFormData.city_municipality || ''} onChange={handleEditChange} disabled={!editFormData.province || loadingCities} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select City...</option>
                          {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Barangay</label>
                        <select name="barangay" value={editFormData.barangay || ''} onChange={handleEditChange} disabled={!editFormData.city_municipality || loadingBarangays} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select Barangay...</option>
                          {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Zip Code</label>
                        <Input name="zip_code" value={editFormData.zip_code || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                      <DetailItem label="House No." value={selectedEmployee.house_number} />
                      <DetailItem label="Street" value={selectedEmployee.street} required />
                      <DetailItem label="Village" value={selectedEmployee.village} />
                      <DetailItem label="Subdivision" value={selectedEmployee.subdivision} />
                      <DetailItem label="Barangay" value={selectedEmployee.barangay} required />
                      <DetailItem label="City / Municipality" value={selectedEmployee.city_municipality} required />
                      <DetailItem label="Province" value={selectedEmployee.province} required />
                      <DetailItem label="Region" value={selectedEmployee.region} required />
                      <DetailItem label="Zip Code" value={selectedEmployee.zip_code} required />
                    </div>
                  )}
                </div>
              </div>

              {/* PERMANENT ADDRESS */}
              <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
                <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex justify-between items-center">
                  <h3 className="text-lg text-[#4A081A] font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#630C22] rounded-full"></span>
                    Permanent Address
                  </h3>
                  <div className="flex gap-2">
                    {isEditingPermanent ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingPermanent(false)} className="h-8 text-slate-500 hover:text-slate-700">
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveSection('permanent')} disabled={isActionLoading} className="h-8 bg-[#630C22] hover:bg-[#800020] text-white">
                          {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => toggleEditSection('permanent')} className="h-8 text-[#630C22] hover:bg-[#630C22]/10 font-bold">
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {isEditingPermanent ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">House No.</label>
                        <Input name="perm_house_number" value={editFormData.perm_house_number || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Street</label>
                        <Input name="perm_street" value={editFormData.perm_street || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Village</label>
                        <Input name="perm_village" value={editFormData.perm_village || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Subdivision</label>
                        <Input name="perm_subdivision" value={editFormData.perm_subdivision || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Region</label>
                        <select name="perm_region" value={editFormData.perm_region || ''} onChange={handleEditChange} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select Region...</option>
                          {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Province <span className="text-red-500">*</span></label>
                        <select name="perm_province" value={editFormData.perm_province || ''} onChange={handleEditChange} disabled={!editFormData.perm_region || loadingProvinces} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select Province...</option>
                          {provinces.map(p => <option key={p.code} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">City / Municipality <span className="text-red-500">*</span></label>
                        <select name="perm_city_municipality" value={editFormData.perm_city_municipality || ''} onChange={handleEditChange} disabled={!editFormData.perm_province || loadingCities} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select City...</option>
                          {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Barangay <span className="text-red-500">*</span></label>
                        <select name="perm_barangay" value={editFormData.perm_barangay || ''} onChange={handleEditChange} disabled={!editFormData.perm_city_municipality || loadingBarangays} className="flex h-9 w-full rounded-md border border-slate-200 px-3 py-1 text-sm font-medium">
                          <option value="">Select Barangay...</option>
                          {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">Zip Code <span className="text-red-500">*</span></label>
                        <Input name="perm_zip_code" value={editFormData.perm_zip_code || ''} onChange={handleEditChange} className="h-9" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                      <DetailItem label="House No." value={selectedEmployee.perm_house_number} />
                      <DetailItem label="Street" value={selectedEmployee.perm_street} required />
                      <DetailItem label="Village" value={selectedEmployee.perm_village} />
                      <DetailItem label="Subdivision" value={selectedEmployee.perm_subdivision} />
                      <DetailItem label="Barangay" value={selectedEmployee.perm_barangay} required />
                      <DetailItem label="City / Municipality" value={selectedEmployee.perm_city_municipality} required />
                      <DetailItem label="Province" value={selectedEmployee.perm_province} required />
                      <DetailItem label="Region" value={selectedEmployee.perm_region} required />
                      <DetailItem label="Zip Code" value={selectedEmployee.perm_zip_code} required />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TERMINATION DETAILS (If Terminated) */}
            {selectedEmployee.status === 'terminated' && (
              <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
                <div className="bg-gradient-to-r from-[#A4163A]/10 to-transparent pb-3 border-b-2 border-[#A4163A] p-4">
                  <h3 className="text-lg text-[#A4163A] font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#A4163A] rounded-full"></span>
                    Termination Details
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Termination Date</p>
                      <p className="font-semibold text-slate-800">
                        {selectedEmployee.termination_date ? new Date(selectedEmployee.termination_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-2 uppercase">Reason</p>
                      <p className="font-medium text-slate-700 italic">
                        "{selectedEmployee.termination_reason || 'No reason provided'}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FAMILY & GOV */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
                <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
                  <h3 className="text-lg text-[#4A081A] font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#630C22] rounded-full"></span>
                    Family Background
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-3 uppercase">Mother's Maiden Name</p>
                      <div className="grid grid-cols-2 gap-4 pl-3 border-l-2 border-[#FFE5EC]">
                        <DetailItem label="Last Name" value={selectedEmployee.mlast_name} required />
                        <DetailItem label="First Name" value={selectedEmployee.mfirst_name} required />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-3 uppercase">Father's Name</p>
                      <div className="grid grid-cols-2 gap-4 pl-3 border-l-2 border-[#FFE5EC]">
                        <DetailItem label="Last Name" value={selectedEmployee.flast_name} />
                        <DetailItem label="First Name" value={selectedEmployee.ffirst_name} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
                <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4">
                  <h3 className="text-lg text-[#4A081A] font-bold flex items-center gap-2">
                    <span className="w-1 h-5 bg-[#630C22] rounded-full"></span>
                    Government IDs
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    <DetailItem label="SSS No." value={selectedEmployee.sss_number} />
                    <DetailItem label="PhilHealth No." value={selectedEmployee.philhealth_number} />
                    <DetailItem label="Pag-IBIG No." value={selectedEmployee.pagibig_number} />
                    <DetailItem label="TIN" value={selectedEmployee.tin_number} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 rounded-lg border border-[#FFE5EC] flex justify-end gap-3">
          {(selectedEmployee?.status === 'pending' || selectedEmployee?.status === 'rehire_pending') ? (
            <>
              {selectedEmployee.onboarding_tasks?.isComplete && !checkCompleteness(selectedEmployee).isComplete && (
                <button
                  onClick={() => router.push(`/admin-head/employee/onboard?id=${selectedEmployee.id}&batch=${checkCompleteness(selectedEmployee).batchId}`)}
                  className="h-12 px-8 font-bold rounded-xl text-white transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E]"
                >
                  Update Profile
                </button>
              )}
              <button
                onClick={handleSetAsEmployed}
                disabled={!checkCompleteness(selectedEmployee).isComplete || !selectedEmployee.onboarding_tasks?.isComplete || isUpdating}
                className={`h-12 px-8 font-bold rounded-xl transition-all shadow-lg ${
                  (!checkCompleteness(selectedEmployee).isComplete || !selectedEmployee.onboarding_tasks?.isComplete)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#4A081A] via-[#630C22] to-[#800020] hover:from-[#630C22] hover:to-[#A0153E] text-white hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {selectedEmployee.status === 'rehire_pending' ? 'Approve & Re-hire' : 'Approve & Set as Employed'}
              </button>
            </>
          ) : (
            <button 
              onClick={() => setViewMode('list')} 
              className="h-11 px-8 border-2 border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] font-bold rounded-xl transition-all"
            >
              Back to List
            </button>
          )}
        </div>

        <div className="text-xs text-stone-500 space-y-1 text-right">
          <p>* Employee ID: #{selectedEmployee?.id.toString().padStart(4, '0')}</p>
          <p>* Complete profile ensures accurate record keeping</p>
        </div>
      </div>
    )}
  </div>
</div>
            </>
          )}
        </div>
      )
      }

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        hideCancel={confirmModal.hideCancel}
        isLoading={isUpdating}
      />
    </div >
  )
}

function DetailItem({ label, value, required }: { label: string, value: any, required?: boolean }) {
  const isEmpty = !value || value.toString().trim() === ''
  return (
    <div className="group">
      <p className="text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1 group-hover:text-[#630C22] transition-colors">
        {label}
      </p>
      <p className={`font-medium text-base ${isEmpty ? 'text-slate-300 italic' : 'text-slate-800'}`}>
        {isEmpty ? 'Not Provided' : value}
      </p>
    </div>
  )
}
