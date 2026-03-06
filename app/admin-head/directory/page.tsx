//directory


"use client"


import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TextFieldStatus } from '@/components/ui/text-field-status'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'
import { ensureOkResponse } from '@/lib/api/error-message'
import { VALIDATION_CONSTRAINTS } from '@/lib/validation/constraints'
import { directoryDraftSchema, generalContactsSchema } from '@/lib/validation/schemas'
import { buttonTokens, modalTokens } from '@/lib/ui/tokens'
import { PageEmptyState, PageErrorState } from '@/components/state/page-feedback'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Building2,
  Fingerprint,
  Landmark,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
  MessageCircle,
  UserPlus,
  UserMinus,
  ImageUp,
  Images,
  Loader2,
  X,
  Edit3,
  Save,
  Plus,
  Trash2,
  Copy,
  Clock,
  ArrowRight,
  Users,
  Eye,
  Image as ImageIcon,
  MoreVertical,
  TriangleAlert
} from 'lucide-react'


type ProcessType = 'Adding' | 'Removing'


type BackendContact = {
  id: number
  type: string
  label: string | null
  value: string
  sort_order: number
}


type BackendProcess = {
  id: number
  process_type: string
  process: string
  step_number: number
}


type BackendAgency = {
  id: number
  code: string
  name: string
  full_name: string | null
  summary: string | null
  image_url: string | null
  image_public_id: string | null
  updated_at?: string | null
  contacts: BackendContact[]
  processes: BackendProcess[]
}


type CloudinaryAsset = {
  public_id: string
  secure_url: string
  format: string
  bytes: number
  width: number | null
  height: number | null
  created_at: string | null
}


type EditableContact = {
  id?: number
  type: string
  label: string
  value: string
  sort_order: number
}


type EditableProcess = {
  id?: number
  process_type: ProcessType
  process: string
  step_number: number
}


type EditDraft = {
  name: string
  full_name: string
  summary: string
  contacts: EditableContact[]
  processes: EditableProcess[]
}

type GeneralContact = {
  id: number
  type: string
  label: string | null
  establishment_name: string
  services: string | null
  contact_person: string | null
  value: string
  sort_order: number
  avatar_url: string | null
  avatar_public_id: string | null
  created_at?: string | null
  updated_at?: string | null
}

type EditableGeneralContact = {
  id?: number
  type: string
  label: string
  establishment_name: string
  services: string
  contact_person: string
  value: string
  sort_order: number
  avatar_url: string
  avatar_public_id: string
}


type PortalLink = {
  code: string
  label: string
  url: string
}


const ALLOWED_UPLOAD_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'] as const
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const CLOUDINARY_PAGE_SIZE = 9
const GENERAL_CONTACTS_PAGE_SIZE = 12
const OFFICIAL_PORTALS: PortalLink[] = [
  { code: 'sss', label: 'SSS', url: 'https://member.sss.gov.ph/' },
  { code: 'pagibig', label: 'PAG-IBIG', url: 'https://www.pagibigfundservices.com/' },
  { code: 'philhealth', label: 'PhilHealth', url: 'https://www.philhealth.gov.ph/' },
  { code: 'tin', label: 'TIN (BIR)', url: 'https://www.bir.gov.ph/eServices' },
]
const GENERAL_CONTACTS_KEY = 'general-contacts'
type CloudinaryPickerTarget = { type: 'agency'; agencyCode: string } | { type: 'general-contact'; index: number }
const DIRECTORY_FOLDER_ALIASES: Record<string, string> = {
  sss: 'sss',
  philhealth: 'philhealth',
  tin: 'bir',
  pagibig: 'pag-ibig',
  'pag-ibig': 'pag-ibig',
  [GENERAL_CONTACTS_KEY]: 'general-contacts',
}

const getDirectorySectionFolder = (sectionCode: string): string => {
  const normalized = normalizeCode(sectionCode)
  const mapped = DIRECTORY_FOLDER_ALIASES[normalized] || normalized || 'misc'
  return mapped
}

const getDirectoryFolderPath = (sectionCode: string): string => `backend/storage/uploads/images/${getDirectorySectionFolder(sectionCode)}`


const normalizeCode = (value: string): string => String(value || '').trim().toLowerCase()
const normalizeDuplicateValue = (value: string): string => String(value || '').trim().toLowerCase()


const getAgencyIcon = (code: string) => {
  switch (normalizeCode(code)) {
    case 'philhealth':
      return ShieldCheck
    case 'sss':
      return Building2
    case 'pagibig':
      return Landmark
    case 'tin':
      return Fingerprint
    default:
      return Building2
  }
}


const getDetailIcon = (type: string, label: string) => {
  const normalizedType = String(type || '').toLowerCase()
  const normalizedLabel = String(label || '').toLowerCase()


  if (normalizedType.includes('email')) return Mail
  if (normalizedType.includes('website')) return Globe
  if (normalizedType.includes('address')) return MapPin
  if (normalizedType.includes('social')) return MessageCircle
  if (normalizedType.includes('mobile') || normalizedType.includes('hotline')) return Phone
  if (normalizedLabel.includes('email')) return Mail
  if (normalizedLabel.includes('website') || normalizedLabel.includes('official page')) return Globe
  if (normalizedLabel.includes('address') || normalizedLabel.includes('office')) return MapPin
  return Phone
}

const getLabelInitials = (label: string | null | undefined): string => {
  const normalized = String(label || '').trim()
  if (!normalized) return '?'
  const parts = normalized.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

const parseBackendDateMs = (value: string | null | undefined): number => {
  const raw = String(value || '').trim()
  if (!raw) return NaN
  const normalized = raw.replace(' ', 'T')

  // Fast path for standard ISO values.
  const directMs = new Date(normalized).getTime()
  if (!Number.isNaN(directMs)) return directMs

  // Fallback for MySQL/Laravel timestamp variants (with optional microseconds/timezone).
  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-]\d{2}:\d{2}))?$/
  )
  if (!match) return NaN

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const milli = match[7] ? Number(match[7].slice(0, 3).padEnd(3, '0')) : 0

  // If timezone is explicit (or Z), parse in UTC; otherwise treat as local time.
  if (normalized.endsWith('Z') || match[8]) {
    const utcMs = Date.UTC(year, month, day, hour, minute, second, milli)
    if (match[8]) {
      const [tzHour, tzMinute] = match[8].slice(1).split(':').map(Number)
      const offsetMinutes = tzHour * 60 + tzMinute
      const sign = match[8].startsWith('+') ? 1 : -1
      return utcMs - sign * offsetMinutes * 60_000
    }
    return utcMs
  }

  return new Date(year, month, day, hour, minute, second, milli).getTime()
}


export default function GovernmentDirectoryPage() {
  const deleteDialogTitleRef = useRef<HTMLHeadingElement | null>(null)
  const agencyUploadInputRef = useRef<HTMLInputElement | null>(null)
  const agencyUploadTargetRef = useRef<string>('')
  const generalContactUploadInputRef = useRef<HTMLInputElement | null>(null)
  const generalContactUploadTargetRef = useRef<number | null>(null)
  const [activeAgency, setActiveAgency] = useState<string>('')
  const [activeProcess, setActiveProcess] = useState<ProcessType>('Adding')
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [agenciesByCode, setAgenciesByCode] = useState<Record<string, BackendAgency>>({})
  const [updatingImage, setUpdatingImage] = useState(false)
  const [cloudinaryPickerOpen, setCloudinaryPickerOpen] = useState(false)
  const [cloudinaryPickerTarget, setCloudinaryPickerTarget] = useState<CloudinaryPickerTarget | null>(null)
  const [cloudinaryImages, setCloudinaryImages] = useState<CloudinaryAsset[]>([])
  const [cloudinaryPage, setCloudinaryPage] = useState(1)
  const [loadingCloudinaryImages, setLoadingCloudinaryImages] = useState(false)
  const [deleteCandidate, setDeleteCandidate] = useState<CloudinaryAsset | null>(null)
  const [deletingCloudinaryImage, setDeletingCloudinaryImage] = useState(false)
  const [agencyImageRefreshKey, setAgencyImageRefreshKey] = useState<Record<string, number>>({})
  const [agencyImageRetryCount, setAgencyImageRetryCount] = useState<Record<string, number>>({})
  const [generalContacts, setGeneralContacts] = useState<GeneralContact[]>([])
  const [generalContactsDraft, setGeneralContactsDraft] = useState<EditableGeneralContact[]>([])
  const [generalContactsSearch, setGeneralContactsSearch] = useState('')
  const [generalContactsPage, setGeneralContactsPage] = useState(1)
  const [loadingGeneralContacts, setLoadingGeneralContacts] = useState(false)
  const [savingGeneralContacts, setSavingGeneralContacts] = useState(false)
  const [editingGeneralContacts, setEditingGeneralContacts] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<{ url: string; title: string } | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [savingChanges, setSavingChanges] = useState(false)
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [showValidation, setShowValidation] = useState(false)
  const filteredGeneralContacts = useMemo(() => {
    const term = generalContactsSearch.trim().toLowerCase()
    const filtered = !term ? generalContacts : generalContacts.filter((row) => {
      const establishment = String(row.establishment_name || '').toLowerCase()
      const services = String(row.services || '').toLowerCase()
      const contactPerson = String(row.contact_person || '').toLowerCase()
      return establishment.includes(term) || services.includes(term) || contactPerson.includes(term)
    })
    return [...filtered].sort((a, b) => {
      const left = String(a.establishment_name || '').toLowerCase()
      const right = String(b.establishment_name || '').toLowerCase()
      return left.localeCompare(right)
    })
  }, [generalContacts, generalContactsSearch])

  const filteredGeneralContactsDraft = useMemo(() => {
    const term = generalContactsSearch.trim().toLowerCase()
    const indexed = generalContactsDraft.map((row, index) => ({ row, index }))
    const filtered = !term
      ? indexed
      : indexed.filter(({ row }) => {
          const establishment = String(row.establishment_name || '').toLowerCase()
          const services = String(row.services || '').toLowerCase()
          const contactPerson = String(row.contact_person || '').toLowerCase()
          return establishment.includes(term) || services.includes(term) || contactPerson.includes(term)
        })

    return [...filtered].sort((a, b) => {
      const left = String(a.row.establishment_name || '').toLowerCase()
      const right = String(b.row.establishment_name || '').toLowerCase()
      return left.localeCompare(right)
    })
  }, [generalContactsDraft, generalContactsSearch])

  const generalContactsTotalPages = useMemo(() => {
    const totalRows = editingGeneralContacts ? filteredGeneralContactsDraft.length : filteredGeneralContacts.length
    return Math.max(1, Math.ceil(totalRows / GENERAL_CONTACTS_PAGE_SIZE))
  }, [editingGeneralContacts, filteredGeneralContactsDraft.length, filteredGeneralContacts.length])

  const paginatedFilteredGeneralContacts = useMemo(() => {
    const start = (generalContactsPage - 1) * GENERAL_CONTACTS_PAGE_SIZE
    return filteredGeneralContacts.slice(start, start + GENERAL_CONTACTS_PAGE_SIZE)
  }, [filteredGeneralContacts, generalContactsPage])

  const paginatedFilteredGeneralContactsDraft = useMemo(() => {
    const start = (generalContactsPage - 1) * GENERAL_CONTACTS_PAGE_SIZE
    return filteredGeneralContactsDraft.slice(start, start + GENERAL_CONTACTS_PAGE_SIZE)
  }, [filteredGeneralContactsDraft, generalContactsPage])

  const cloudinaryTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(cloudinaryImages.length / CLOUDINARY_PAGE_SIZE))
  }, [cloudinaryImages.length])

  const paginatedCloudinaryImages = useMemo(() => {
    const start = (cloudinaryPage - 1) * CLOUDINARY_PAGE_SIZE
    return cloudinaryImages.slice(start, start + CLOUDINARY_PAGE_SIZE)
  }, [cloudinaryImages, cloudinaryPage])

  const cloudinaryPickerFolderPath = useMemo(() => {
    const sectionCode = cloudinaryPickerTarget?.type === 'general-contact'
      ? GENERAL_CONTACTS_KEY
      : cloudinaryPickerTarget?.agencyCode ?? activeAgency
    return getDirectoryFolderPath(sectionCode)
  }, [cloudinaryPickerTarget, activeAgency])

  useEffect(() => {
    setCloudinaryPage((prev) => Math.min(prev, cloudinaryTotalPages))
  }, [cloudinaryTotalPages])

  useEffect(() => {
    setGeneralContactsPage((prev) => Math.min(prev, generalContactsTotalPages))
  }, [generalContactsTotalPages])

  useEffect(() => {
    if (activeAgency !== GENERAL_CONTACTS_KEY) return
    setGeneralContactsPage(1)
  }, [generalContactsSearch, editingGeneralContacts, activeAgency])

  const directoryQuery = useQuery({
    queryKey: ['directory-agencies'],
    queryFn: async (): Promise<Record<string, BackendAgency>> => {
      const response = await fetch(`${getApiUrl()}/api/directory/agencies`, {
        headers: { Accept: 'application/json' },
      })
      await ensureOkResponse(response, 'Unable to load directory data right now.')
      const result = await response.json()
      const rows = Array.isArray(result?.data) ? result.data : []
      const mapped: Record<string, BackendAgency> = {}
      rows.forEach((row: BackendAgency) => {
        const code = normalizeCode(row?.code)
        if (code) mapped[code] = row
      })
      return mapped
    },
  })

  useEffect(() => {
    if (!directoryQuery.data) return
    setAgenciesByCode(directoryQuery.data)
  }, [directoryQuery.data])

  useEffect(() => {
    if (!directoryQuery.data) return
    if (activeAgency === GENERAL_CONTACTS_KEY) return
    if (activeAgency && directoryQuery.data[activeAgency]) return
    if (directoryQuery.data['philhealth']) {
      setActiveAgency('philhealth')
      return
    }
    const firstCode = Object.keys(directoryQuery.data)[0] ?? ''
    if (firstCode) setActiveAgency(firstCode)
  }, [directoryQuery.data, activeAgency])


  const mergedAgencies = useMemo(() => {
    return Object.values(agenciesByCode)
      .sort((a, b) => {
        // Enforce order: BIR (tin), PAG IBIG, PHILHEALTH, SSS if possible
        const order = ['tin', 'pagibig', 'philhealth', 'sss']
        const indexA = order.indexOf(normalizeCode(a.code))
        const indexB = order.indexOf(normalizeCode(b.code))
        if (indexA !== -1 && indexB !== -1) return indexA - indexB
        if (indexA !== -1) return -1
        if (indexB !== -1) return 1
        return String(a.name || '').localeCompare(String(b.name || ''))
      })
      .map((backend) => {
        const code = normalizeCode(backend.code)
        const backendDetails = Array.isArray(backend?.contacts)
          ? [...backend.contacts]
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((contact) => ({
              icon: getDetailIcon(contact.type, contact.label ?? ''),
              label: contact.label?.trim() || contact.type,
              value: contact.value,
              type: contact.type,
            }))
          : []


        return {
          key: code,
          shortName: backend?.name?.trim() || code.toUpperCase(),
          fullName: backend?.full_name?.trim() || backend?.name?.trim() || code.toUpperCase(),
          summary: backend?.summary?.trim() || '',
          image: (() => {
            const raw = backend?.image_url?.trim() || ''
            if (!raw) return ''
            const refreshKey = agencyImageRefreshKey[code]
            if (!refreshKey) return raw
            const joiner = raw.includes('?') ? '&' : '?'
            return `${raw}${joiner}r=${refreshKey}`
          })(),
          icon: getAgencyIcon(code),
          details: backendDetails,
        }
      })
  }, [agenciesByCode, agencyImageRefreshKey])


  const agency = useMemo(
    () => mergedAgencies.find((item) => item.key === activeAgency) ?? mergedAgencies[0] ?? null,
    [activeAgency, mergedAgencies]
  )
  const isGeneralContactsView = activeAgency === GENERAL_CONTACTS_KEY

  useEffect(() => {
    if (!agency?.key || !agency?.image) return
    setImageError((prev) => ({ ...prev, [agency.key]: false }))
    setAgencyImageRetryCount((prev) => ({ ...prev, [agency.key]: 0 }))
  }, [agency?.key, agency?.image])


  const currentSteps = useMemo(() => {
    const backend = agenciesByCode[activeAgency]
    const fromBackend = Array.isArray(backend?.processes)
      ? backend.processes
        .filter((row) => String(row.process_type || '').toLowerCase() === activeProcess.toLowerCase())
        .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
        .map((row) => row.process)
      : []
    return fromBackend
  }, [activeAgency, activeProcess, agenciesByCode])


  const activeBackendAgency = useMemo(() => agenciesByCode[activeAgency], [agenciesByCode, activeAgency])


  const snapshot = useMemo(() => {
    const contactsCount = editMode && draft
      ? draft.contacts.filter((row) => row.value.trim().length > 0).length
      : (activeBackendAgency?.contacts?.length ?? 0)


    const addingStepsCount = editMode && draft
      ? draft.processes.filter((row) => row.process_type === 'Adding' && row.process.trim().length > 0).length
      : (activeBackendAgency?.processes?.filter((row) => String(row.process_type).toLowerCase() === 'adding').length ?? 0)


    const removingStepsCount = editMode && draft
      ? draft.processes.filter((row) => row.process_type === 'Removing' && row.process.trim().length > 0).length
      : (activeBackendAgency?.processes?.filter((row) => String(row.process_type).toLowerCase() === 'removing').length ?? 0)


    const updatedAtMs = parseBackendDateMs(activeBackendAgency?.updated_at || null)
    const updatedAtText = !Number.isNaN(updatedAtMs)
      ? new Date(updatedAtMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'N/A'


    // Find active portal link
    const activeLink = OFFICIAL_PORTALS.find(p => normalizeCode(p.code) === activeAgency)?.url || 'N/A'


    return { contactsCount, addingStepsCount, removingStepsCount, updatedAtText, activeLink }
  }, [activeBackendAgency, editMode, draft, activeAgency])

  const generalContactsUpdatedAtText = useMemo(() => {
    const latestMs = generalContacts.reduce<number>((max, row) => {
      const ms = parseBackendDateMs(row.updated_at || row.created_at || null)
      if (Number.isNaN(ms)) return max
      return ms > max ? ms : max
    }, NaN)
    if (Number.isNaN(latestMs)) return 'N/A'
    return new Date(latestMs).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [generalContacts])


  const currentProcessDraftRows = useMemo(() => {
    if (!editMode || !draft) return []
    return draft.processes
      .filter((row) => row.process_type === activeProcess)
      .sort((a, b) => a.step_number - b.step_number)
  }, [editMode, draft, activeProcess])

  const duplicateContactIndices = useMemo(() => {
    const duplicates = new Set<number>()
    if (!draft) return duplicates
    const counts = new Map<string, number>()
    draft.contacts.forEach((row) => {
      const normalized = normalizeDuplicateValue(row.value)
      if (!normalized) return
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    })
    draft.contacts.forEach((row, index) => {
      const normalized = normalizeDuplicateValue(row.value)
      if (!normalized) return
      if ((counts.get(normalized) ?? 0) > 1) duplicates.add(index)
    })
    return duplicates
  }, [draft])

  const duplicateProcessKeys = useMemo(() => {
    const duplicates = new Set<string>()
    if (!draft) return duplicates
    const counts = new Map<string, number>()
    draft.processes.forEach((row) => {
      const normalized = normalizeDuplicateValue(row.process)
      if (!normalized) return
      const key = `${row.process_type}|${normalized}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })
    counts.forEach((count, key) => {
      if (count > 1) duplicates.add(key)
    })
    return duplicates
  }, [draft])

  const duplicateProcessCount = useMemo(() => {
    if (!draft) return 0
    return draft.processes.filter((row) => {
      const normalized = normalizeDuplicateValue(row.process)
      if (!normalized) return false
      return duplicateProcessKeys.has(`${row.process_type}|${normalized}`)
    }).length
  }, [draft, duplicateProcessKeys])

  const duplicateGeneralContactIndices = useMemo(() => {
    const duplicates = new Set<number>()
    const counts = new Map<string, number>()
    generalContactsDraft.forEach((row) => {
      const normalized = normalizeDuplicateValue(row.value)
      if (!normalized) return
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
    })
    generalContactsDraft.forEach((row, index) => {
      const normalized = normalizeDuplicateValue(row.value)
      if (!normalized) return
      if ((counts.get(normalized) ?? 0) > 1) duplicates.add(index)
    })
    return duplicates
  }, [generalContactsDraft])

  const startEditMode = () => {
    const backend = agenciesByCode[activeAgency]
    if (!backend) return


    const contacts = Array.isArray(backend.contacts)
      ? [...backend.contacts]
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((row, index) => ({
          id: row.id,
          type: row.type || 'note',
          label: row.label || '',
          value: row.value || '',
          sort_order: row.sort_order ?? (index + 1),
        }))
      : []


    const processes = Array.isArray(backend.processes)
      ? [...backend.processes]
        .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
        .map((row) => ({
          id: row.id,
          process_type: (String(row.process_type).toLowerCase() === 'removing' ? 'Removing' : 'Adding') as ProcessType,
          process: row.process || '',
          step_number: row.step_number || 1,
        }))
      : []


    setDraft({
      name: backend.name || '',
      full_name: backend.full_name || '',
      summary: backend.summary || '',
      contacts,
      processes,
    })
    setShowValidation(false)
    setEditMode(true)
  }


  const cancelEditMode = () => {
    setEditMode(false)
    setDraft(null)
    setShowValidation(false)
  }


  const updateContactAt = (index: number, field: keyof EditableContact, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const contacts = [...prev.contacts]
      const target = contacts[index]
      if (!target) return prev
      contacts[index] = { ...target, [field]: value }
      return { ...prev, contacts }
    })
  }


  const addContact = () => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        contacts: [
          ...prev.contacts,
          { type: 'note', label: '', value: '', sort_order: prev.contacts.length + 1 },
        ],
      }
    })
  }


  const removeContactAt = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      const contacts = prev.contacts.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i + 1 }))
      return { ...prev, contacts }
    })
  }


  const addProcessStep = () => {
    setDraft((prev) => {
      if (!prev) return prev
      const count = prev.processes.filter((row) => row.process_type === activeProcess).length
      return {
        ...prev,
        processes: [...prev.processes, { process_type: activeProcess, process: '', step_number: count + 1 }],
      }
    })
  }


  const updateProcessTextAt = (indexWithinType: number, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      let seen = -1
      const processes = prev.processes.map((row) => {
        if (row.process_type !== activeProcess) return row
        seen += 1
        if (seen !== indexWithinType) return row
        return { ...row, process: value }
      })
      return { ...prev, processes }
    })
  }


  const removeProcessAt = (indexWithinType: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      let seen = -1
      const filtered = prev.processes.filter((row) => {
        if (row.process_type !== activeProcess) return true
        seen += 1
        return seen !== indexWithinType
      })
      const reindexed = filtered.map((row) => row)
        ; (['Adding', 'Removing'] as ProcessType[]).forEach((type) => {
          let step = 1
          reindexed.forEach((row) => {
            if (row.process_type === type) {
              row.step_number = step
              step += 1
            }
          })
        })
      return { ...prev, processes: reindexed }
    })
  }


  const saveDirectoryChanges = async () => {
    if (!draft) return
    try {
      setSavingChanges(true)
      setShowValidation(true)

      const draftValidation = directoryDraftSchema.safeParse(draft)
      if (!draftValidation.success) {
        const message = draftValidation.error.issues[0]?.message || 'Please review your directory entries.'
        toast.error('Validation Failed', {
          description: message,
        })
        return
      }

      if (duplicateContactIndices.size > 0 || duplicateProcessCount > 0) {
        toast.warning('Duplicate Entries Detected', {
          description: 'Rows highlighted in red are duplicates. Resolve them before saving directory changes.',
        })
        return
      }


      const contacts = draft.contacts
        .filter((row) => row.value.trim().length > 0)
        .map((row, index) => ({
          id: row.id,
          type: row.type.trim() || 'note',
          label: row.label.trim() || null,
          value: row.value.trim(),
          sort_order: index + 1,
        }))


      const processes = (['Adding', 'Removing'] as ProcessType[]).flatMap((type) => {
        const rows = draft.processes.filter((row) => row.process_type === type && row.process.trim().length > 0)
        return rows.map((row, index) => ({
          id: row.id,
          process_type: type,
          process: row.process.trim(),
          step_number: index + 1,
        }))
      })


      const response = await fetch(`${getApiUrl()}/api/directory/agencies/${activeAgency}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: draft.name.trim(),
          full_name: draft.full_name.trim() || null,
          summary: draft.summary.trim() || null,
          contacts,
          processes,
        }),
      })


      await ensureOkResponse(response, 'Unable to save directory changes.')


      const result = await response.json()
      const updated = result?.data as BackendAgency | undefined
      const code = normalizeCode(updated?.code ?? '')
      if (updated && code) {
        setAgenciesByCode((prev) => ({ ...prev, [code]: updated }))
      }
      setEditMode(false)
      setDraft(null)
      setShowValidation(false)
      toast.success('Directory changes saved successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save directory changes'
      toast.error('Save Failed', { description: message })
    } finally {
      setSavingChanges(false)
    }
  }


  const persistAgencyImage = async (params: {
    agencyCode?: string
    imageUrl: string
    publicId?: string | null
    format?: string | null
    bytes?: number | null
  }) => {
    const targetAgencyCode = normalizeCode(params.agencyCode || activeAgency)
    if (!targetAgencyCode) {
      throw new Error('Please select a valid agency before updating its picture.')
    }

    const response = await fetch(`${getApiUrl()}/api/directory/agencies/${targetAgencyCode}/image`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        image_url: params.imageUrl,
        image_public_id: params.publicId ?? null,
        format: params.format ? String(params.format).toLowerCase() : null,
        bytes: params.bytes ?? null,
      }),
    })


    await ensureOkResponse(response, 'Unable to update agency image.')


    const result = await response.json()
    const updated = result?.data as Partial<BackendAgency> | undefined
    const code = normalizeCode(String(updated?.code ?? targetAgencyCode))

    setAgenciesByCode((prev) => {
      const existing = prev[code] ?? prev[targetAgencyCode]
      const fallback: BackendAgency = existing ?? {
        id: Number(updated?.id ?? 0),
        code,
        name: String(updated?.name ?? code.toUpperCase()),
        full_name: (updated?.full_name as string | null | undefined) ?? null,
        summary: (updated?.summary as string | null | undefined) ?? null,
        image_url: null,
        image_public_id: null,
        updated_at: null,
        contacts: [],
        processes: [],
      }

      const merged: BackendAgency = {
        ...fallback,
        ...(updated as Partial<BackendAgency>),
        code,
        image_url: params.imageUrl,
        image_public_id: params.publicId ?? null,
        updated_at:
          typeof updated?.updated_at === 'string' || updated?.updated_at === null
            ? (updated?.updated_at ?? new Date().toISOString())
            : new Date().toISOString(),
        contacts: Array.isArray(updated?.contacts) ? (updated.contacts as BackendContact[]) : fallback.contacts,
        processes: Array.isArray(updated?.processes) ? (updated.processes as BackendProcess[]) : fallback.processes,
      }

      return { ...prev, [code]: merged }
    })
    setImageError((prev) => ({ ...prev, [code]: false }))
    setAgencyImageRetryCount((prev) => ({ ...prev, [code]: 0 }))
    setAgencyImageRefreshKey((prev) => ({ ...prev, [code]: Date.now() }))
  }

  const handleAgencyImageLoad = (agencyCode: string) => {
    setImageError((prev) => ({ ...prev, [agencyCode]: false }))
    setAgencyImageRetryCount((prev) => ({ ...prev, [agencyCode]: 0 }))
  }

  const handleAgencyImageError = (agencyCode: string) => {
    const attempts = agencyImageRetryCount[agencyCode] ?? 0
    if (attempts < 3) {
      setAgencyImageRetryCount((prev) => ({ ...prev, [agencyCode]: attempts + 1 }))
      setAgencyImageRefreshKey((prev) => ({ ...prev, [agencyCode]: Date.now() }))
      return
    }
    setImageError((prev) => ({ ...prev, [agencyCode]: true }))
  }


  const loadCloudinaryImages = async (target: CloudinaryPickerTarget) => {
    try {
      setLoadingCloudinaryImages(true)
      setCloudinaryPickerTarget(target)
      const sectionCode = target.type === 'general-contact' ? GENERAL_CONTACTS_KEY : target.agencyCode
      const folder = getDirectorySectionFolder(sectionCode)
      const response = await fetch(
        `${getApiUrl()}/api/directory/images?folder=${encodeURIComponent(folder)}&max_results=60`,
        {
        headers: { Accept: 'application/json' },
        }
      )
      await ensureOkResponse(response, 'Unable to load uploaded images from backend storage.')
      const result = await response.json()
      const rows = Array.isArray(result?.data) ? result.data : []
      setCloudinaryImages(rows)
      setCloudinaryPage(1)
      setCloudinaryPickerOpen(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load uploaded images'
      toast.error('Image Load Failed', { description: message })
    } finally {
      setLoadingCloudinaryImages(false)
    }
  }

  const loadGeneralContacts = async () => {
    try {
      setLoadingGeneralContacts(true)
      const response = await fetch(`${getApiUrl()}/api/directory/general-contacts`, {
        headers: { Accept: 'application/json' },
      })

      await ensureOkResponse(response, 'Unable to load general contacts.')

      const result = await response.json()
      const rows = Array.isArray(result?.data) ? result.data : []
      const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      setGeneralContacts(sorted)
      if (!editingGeneralContacts) {
        setGeneralContactsDraft(sorted.map((row) => ({
          id: row.id,
          type: row.type || 'phone',
          label: row.label || '',
          establishment_name: row.establishment_name || row.label || '',
          services: row.services || '',
          contact_person: row.contact_person || '',
          value: row.value || '',
          sort_order: row.sort_order || 0,
          avatar_url: row.avatar_url || '',
          avatar_public_id: row.avatar_public_id || '',
        })))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load general contacts'
      toast.error('General Contacts Load Failed', { description: message })
    } finally {
      setLoadingGeneralContacts(false)
    }
  }

  const openGeneralContactsView = () => {
    if (editMode) {
      toast.warning('Save or cancel changes first.')
      return
    }
    setActiveAgency(GENERAL_CONTACTS_KEY)
    void loadGeneralContacts()
  }

  const startGeneralContactsEdit = () => {
    setGeneralContactsDraft(
      generalContacts.map((row, index) => ({
        id: row.id,
        type: row.type || 'phone',
        label: row.label || '',
        establishment_name: row.establishment_name || row.label || '',
        services: row.services || '',
        contact_person: row.contact_person || '',
        value: row.value || '',
        sort_order: row.sort_order || (index + 1),
        avatar_url: row.avatar_url || '',
        avatar_public_id: row.avatar_public_id || '',
      }))
    )
    setEditingGeneralContacts(true)
  }

  const cancelGeneralContactsEdit = () => {
    setEditingGeneralContacts(false)
    setGeneralContactsDraft(
      generalContacts.map((row, index) => ({
        id: row.id,
        type: row.type || 'phone',
        label: row.label || '',
        establishment_name: row.establishment_name || row.label || '',
        services: row.services || '',
        contact_person: row.contact_person || '',
        value: row.value || '',
        sort_order: row.sort_order || (index + 1),
        avatar_url: row.avatar_url || '',
        avatar_public_id: row.avatar_public_id || '',
      }))
    )
  }

  const addGeneralContactRow = () => {
    setGeneralContactsDraft((prev) => [
      ...prev,
      {
        type: 'phone',
        label: '',
        establishment_name: '',
        services: '',
        contact_person: '',
        value: '',
        sort_order: prev.length + 1,
        avatar_url: '',
        avatar_public_id: '',
      },
    ])
  }

  const removeGeneralContactRow = (index: number) => {
    setGeneralContactsDraft((prev) => (
      prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i + 1 }))
    ))
  }

  const updateGeneralContactField = (
    index: number,
    field: 'type' | 'label' | 'establishment_name' | 'services' | 'contact_person' | 'value' | 'avatar_url' | 'avatar_public_id',
    value: string
  ) => {
    setGeneralContactsDraft((prev) => {
      const next = [...prev]
      const target = next[index]
      if (!target) return prev
      next[index] = { ...target, [field]: value }
      return next
    })
  }

  const validateImageRestrictions = (formatValue: string, bytesValue: number) => {
    const format = String(formatValue || '').toLowerCase()
    const bytes = Number(bytesValue || 0)
    if (!ALLOWED_UPLOAD_FORMATS.includes(format as (typeof ALLOWED_UPLOAD_FORMATS)[number])) {
      throw new Error('Only JPEG/JPG, PNG, GIF, WebP, and HEIC/HEIF are allowed.')
    }
    if (bytes > MAX_IMAGE_BYTES) {
      throw new Error('File exceeds the 20MB upload limit.')
    }
  }

  const setGeneralContactAvatarAt = (index: number, imageUrl: string, publicId: string) => {
    setGeneralContactsDraft((prev) => {
      const next = [...prev]
      const target = next[index]
      if (!target) return prev
      next[index] = {
        ...target,
        avatar_url: imageUrl,
        avatar_public_id: publicId,
      }
      return next
    })
  }

  const openGeneralContactCloudinaryPicker = (index: number) => {
    void loadCloudinaryImages({ type: 'general-contact', index })
  }

  const uploadDirectoryImage = async (file: File, sectionCode: string) => {
    const payload = new FormData()
    payload.set('file', file)
    payload.set('sectionCode', sectionCode)

    const response = await fetch('/api/directory/upload-image', {
      method: 'POST',
      body: payload,
    })
    const data = await response.json().catch(() => null)
    if (!response.ok) {
      const message = data?.message || 'Unable to upload image.'
      throw new Error(message)
    }
    const secureUrl = String(data?.secure_url || '')
    const publicId = String(data?.public_id || '')
    const format = String(data?.format || '')
    const bytes = Number(data?.bytes || 0)
    if (!secureUrl || !publicId) {
      throw new Error('Upload did not return image details.')
    }
    validateImageRestrictions(format, bytes)
    return { secureUrl, publicId, format, bytes }
  }

  const startGeneralContactUpload = (index: number) => {
    generalContactUploadTargetRef.current = index
    generalContactUploadInputRef.current?.click()
  }

  const uploadGeneralContactAvatar = async (index: number, file: File) => {
    try {
      const rawName = String(file?.name || '')
      const dotIndex = rawName.lastIndexOf('.')
      const format = dotIndex >= 0 ? rawName.slice(dotIndex + 1).toLowerCase() : ''
      const bytes = Number(file?.size || 0)
      validateImageRestrictions(format, bytes)
      setUpdatingImage(true)
      const uploaded = await uploadDirectoryImage(file, GENERAL_CONTACTS_KEY)
      setGeneralContactAvatarAt(index, uploaded.secureUrl, uploaded.publicId)
      toast.success('Avatar selected. Save contacts to apply changes.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set avatar'
      toast.error('Avatar Upload Failed', { description: message })
    } finally {
      setUpdatingImage(false)
    }
  }

  const handleGeneralContactUploadInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetIndex = generalContactUploadTargetRef.current
    const file = event.target.files?.[0]
    event.target.value = ''
    generalContactUploadTargetRef.current = null
    if (targetIndex === null || targetIndex < 0 || !file) return
    void uploadGeneralContactAvatar(targetIndex, file)
  }

  const isGeneralContactUploadAvailable = true

  const saveGeneralContacts = async () => {
    try {
      const contactsValidation = generalContactsSchema.safeParse(generalContactsDraft)
      if (!contactsValidation.success) {
        const message = contactsValidation.error.issues[0]?.message || 'Please review all general contact fields.'
        toast.error('Validation Failed', {
          description: message,
        })
        return
      }

      if (duplicateGeneralContactIndices.size > 0) {
        toast.warning('Duplicate Entries Detected', {
          description: 'Rows highlighted in red are duplicates. Resolve them before saving general contacts.',
        })
        return
      }

      setSavingGeneralContacts(true)
      const payload = generalContactsDraft.map((row, index) => ({
        id: row.id ?? null,
        type: row.type.trim() || 'phone',
        label: row.label.trim() || row.establishment_name.trim() || null,
        establishment_name: row.establishment_name.trim(),
        services: row.services.trim() || null,
        contact_person: row.contact_person.trim() || null,
        value: row.value.trim(),
        sort_order: index + 1,
        avatar_url: row.avatar_url.trim() || null,
        avatar_public_id: row.avatar_public_id.trim() || null,
      }))

      const response = await fetch(`${getApiUrl()}/api/directory/general-contacts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ contacts: payload }),
      })

      await ensureOkResponse(response, 'Unable to save general contacts.')

      const result = await response.json()
      const rows = Array.isArray(result?.data) ? result.data : []
      const sorted = [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      setGeneralContacts(sorted)
      setGeneralContactsDraft(sorted.map((row, index) => ({
        id: row.id,
        type: row.type || 'phone',
        label: row.label || '',
        establishment_name: row.establishment_name || row.label || '',
        services: row.services || '',
        contact_person: row.contact_person || '',
        value: row.value || '',
        sort_order: row.sort_order || (index + 1),
        avatar_url: row.avatar_url || '',
        avatar_public_id: row.avatar_public_id || '',
      })))
      setEditingGeneralContacts(false)
      toast.success('General contacts updated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save general contacts'
      toast.error('Save Failed', { description: message })
    } finally {
      setSavingGeneralContacts(false)
    }
  }

  const startAgencyUpload = (agencyCode: string) => {
    agencyUploadTargetRef.current = normalizeCode(agencyCode || activeAgency)
    agencyUploadInputRef.current?.click()
  }

  const uploadAgencyImage = async (agencyCode: string, file: File) => {
    try {
      const rawName = String(file?.name || '')
      const dotIndex = rawName.lastIndexOf('.')
      const format = dotIndex >= 0 ? rawName.slice(dotIndex + 1).toLowerCase() : ''
      const bytes = Number(file?.size || 0)
      validateImageRestrictions(format, bytes)
      setUpdatingImage(true)
      const uploaded = await uploadDirectoryImage(file, agencyCode)
      await persistAgencyImage({
        agencyCode,
        imageUrl: uploaded.secureUrl,
        publicId: uploaded.publicId,
        format: uploaded.format,
        bytes: uploaded.bytes,
      })
      toast.success('Agency picture updated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update picture'
      toast.error('Image Update Failed', { description: message })
    } finally {
      setUpdatingImage(false)
    }
  }

  const handleAgencyUploadInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const targetAgencyCode = normalizeCode(agencyUploadTargetRef.current || activeAgency)
    const file = event.target.files?.[0]
    event.target.value = ''
    agencyUploadTargetRef.current = ''
    if (!targetAgencyCode || !file) return
    void uploadAgencyImage(targetAgencyCode, file)
  }


  const handleCopyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Copy failed', { description: 'Clipboard access was denied.' })
    }
  }


  // --- RENDERING ---


  if (directoryQuery.isLoading && !agency) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] p-6 md:p-8">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
          <div className="p-6 bg-gradient-to-r from-[#A4163A] to-[#7B0F2B]">
            <Skeleton className="h-8 w-64 bg-white/25" />
            <Skeleton className="h-4 w-80 mt-3 bg-white/20" />
            <div className="flex gap-4 mt-6">
              <Skeleton className="h-7 w-24 bg-white/25" />
              <Skeleton className="h-7 w-24 bg-white/20" />
              <Skeleton className="h-7 w-24 bg-white/20" />
              <Skeleton className="h-7 w-24 bg-white/20" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-[260px] w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (directoryQuery.error) {
    const message = directoryQuery.error instanceof Error ? directoryQuery.error.message : 'Failed to load directory data.'
    return (
      <PageErrorState
        title="Directory Load Failed"
        description={message}
        onRetry={() => void directoryQuery.refetch()}
      />
    )
  }


  if (!directoryQuery.isLoading && !agency) {
    return (
      <PageEmptyState
        title="No agencies found"
        description="The directory database is empty. Seed agencies or create records in the backend."
        actionLabel="Reload"
        onAction={() => void directoryQuery.refetch()}
      />
    )
  }


  return (
    <div className="min-h-screen bg-[#F5F6F8] font-sans flex flex-col">
      <input
        ref={agencyUploadInputRef}
        type="file"
        accept={ALLOWED_UPLOAD_FORMATS.map((format) => `.${format}`).join(',')}
        className="hidden"
        onChange={handleAgencyUploadInputChange}
      />
      <input
        ref={generalContactUploadInputRef}
        type="file"
        accept={ALLOWED_UPLOAD_FORMATS.map((format) => `.${format}`).join(',')}
        className="hidden"
        onChange={handleGeneralContactUploadInputChange}
      />
      {/* ----- HEADER AREA ----- */}
      <header className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-xl relative overflow-hidden">
        {/* Top Pattern Effect (Optional) */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent" />


        <div className="w-full px-4 md:px-8 py-7 md:py-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                <Building2 className="w-8 h-8 opacity-80" />
                Government Directory
              </h1>
              <p className="text-xs md:text-sm font-semibold tracking-wide opacity-70 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                ABIC Realty & Consultancy - Process Reference
              </p>
            </div>


            {/* EDIT MODE TOGGLE */}
            <div className="flex items-center gap-2">
              {!isGeneralContactsView && (
                <>
                  {editMode ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={cancelEditMode}
                        className="text-white hover:bg-white/20 hover:text-white"
                      >
                        CANCEL
                      </Button>
                      <Button
                        onClick={saveDirectoryChanges}
                        disabled={savingChanges || !draft}
                        variant="default"
                        className="font-bold text-[#A4163A] bg-white hover:bg-stone-100"
                      >
                        {savingChanges ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        SAVE CHANGES
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={startEditMode}
                      variant="outline"
                      className="border-white/30 rounded-lg text-white hover:bg-white/20 hover:text-white bg-transparent backdrop-blur-sm"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      UPDATE MODE
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>


          {/* AGENCY NAVIGATION */}
          <div className="flex items-center gap-8 overflow-x-auto pb-4 scrollbar-hide mt-6">
            {mergedAgencies.map((item) => {
              const isActive = item.key === activeAgency
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    if (editMode) {
                      toast.warning('Save or cancel changes first.')
                      return
                    }
                    if (editingGeneralContacts) {
                      toast.warning('Save or cancel general contacts first.')
                      return
                    }
                    setActiveAgency(item.key)
                  }}
                  className={cn(
                    "relative py-3 transition-all duration-300 whitespace-nowrap group flex items-center gap-3 outline-none",
                    isActive
                      ? "text-white scale-110"
                      : "text-white/60 hover:text-white hover:scale-105"
                  )}
                >
                  <Icon className={cn("transition-all duration-300", isActive ? "w-6 h-6 stroke-[3]" : "w-5 h-5 stroke-2")} />
                  <span className={cn(
                    "uppercase tracking-[0.12em] transition-all duration-300",
                    isActive ? "font-black text-xl shadow-sm" : "font-bold text-lg"
                  )}>
                    {item.shortName}
                  </span>


                  {/* Active Indicator Underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}
                </button>
              )
            })}
            <button
              onClick={openGeneralContactsView}
              className={cn(
                "relative py-3 transition-all duration-300 whitespace-nowrap group flex items-center gap-3 outline-none",
                isGeneralContactsView
                  ? "text-white scale-110"
                  : "text-white/60 hover:text-white hover:scale-105"
              )}
            >
              <Users className={cn("transition-all duration-300", isGeneralContactsView ? "w-6 h-6 stroke-[3]" : "w-5 h-5 stroke-2")} />
              <span
                className={cn(
                  "uppercase tracking-[0.12em] transition-all duration-300",
                  isGeneralContactsView ? "font-black text-xl shadow-sm" : "font-bold text-lg"
                )}
              >
                General Contacts
              </span>
              {isGeneralContactsView && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              )}
            </button>
          </div>
        </div>
      </header>


      {/* ----- MAIN CONTENT ----- */}
      <main className="w-full px-4 md:px-8 py-8 -mt-2 flex-grow">
        {isGeneralContactsView ? (
          <Card className="border border-slate-200 shadow-xl rounded-sm overflow-hidden">
            <div className="px-6 md:px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-white to-rose-50/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-black tracking-[0.22em] text-[#A4163A] uppercase">Directory Group</p>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">General Contacts</h2>
                  <p className="text-sm text-slate-600 mt-1">Shared contact information not tied to a specific agency.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={generalContactsSearch}
                    onChange={(e) => setGeneralContactsSearch(e.target.value)}
                    placeholder="Search establishment, services, contact person..."
                    className="w-[360px] max-w-full h-10 rounded-sm"
                  />
                  <Button
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => void loadGeneralContacts()}
                    disabled={loadingGeneralContacts || savingGeneralContacts}
                  >
                    {loadingGeneralContacts ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Refresh
                  </Button>
                  {editingGeneralContacts ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={cancelGeneralContactsEdit}
                        disabled={savingGeneralContacts}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => void saveGeneralContacts()}
                        className="bg-[#A4163A] hover:bg-[#8D1332] text-white"
                        disabled={savingGeneralContacts}
                      >
                        {savingGeneralContacts ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={startGeneralContactsEdit}
                      className="bg-[#A4163A] hover:bg-[#8D1332] text-white"
                      disabled={loadingGeneralContacts}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Contacts
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 md:px-8 py-6">
              {loadingGeneralContacts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={`general-contact-skeleton-${idx}`} className="border border-slate-100 rounded-md p-3">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0 space-y-2">
                          <Skeleton className="h-3 w-3/4" />
                          <Skeleton className="h-3 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : editingGeneralContacts ? (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[#A4163A] border-[#A4163A]/30"
                      onClick={addGeneralContactRow}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Row
                    </Button>
                  </div>
                  {duplicateGeneralContactIndices.size > 0 && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-700 flex items-center gap-2">
                      <TriangleAlert className="h-4 w-4 shrink-0" />
                      {duplicateGeneralContactIndices.size} duplicate contact value{duplicateGeneralContactIndices.size > 1 ? 's are' : ' is'} highlighted in red. Resolve duplicates before saving.
                    </div>
                  )}
                  {generalContactsDraft.length === 0 ? (
                    <p className="text-sm text-slate-500">No rows yet. Click Add Row to create one.</p>
                  ) : (
                    <>
                    {paginatedFilteredGeneralContactsDraft.map(({ row, index }) => {
                      const isDuplicateGeneralContact = duplicateGeneralContactIndices.has(index)
                      return (
                      <div
                        key={`general-contact-draft-${index}`}
                        className={cn(
                          "border border-slate-200 rounded-md p-3 space-y-2",
                          isDuplicateGeneralContact ? "bg-rose-50/70 ring-1 ring-rose-300/90 border-rose-300" : ""
                        )}
                      >
                        {isDuplicateGeneralContact && (
                          <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 inline-flex items-center gap-1">
                            <TriangleAlert className="h-3 w-3" />
                            Duplicate
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
                              {row.avatar_url ? (
                                <img src={row.avatar_url} alt={row.establishment_name || 'Avatar'} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-black text-slate-600">
                                  {getLabelInitials(row.establishment_name)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-slate-500 truncate">
                              {row.avatar_url ? 'Avatar selected' : 'No avatar selected'}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline" className="h-8 px-2">
                                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                                Avatar
                                <MoreVertical className="h-3.5 w-3.5 ml-1.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                disabled={!row.avatar_url}
                                onSelect={(e) => {
                                  e.preventDefault()
                                  if (!row.avatar_url) return
                                  setAvatarPreview({
                                    url: row.avatar_url,
                                    title: row.establishment_name || 'General Contact Avatar',
                                  })
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                See avatar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault()
                                  openGeneralContactCloudinaryPicker(index)
                                }}
                              >
                                <Images className="h-4 w-4 mr-2" />
                                Select from uploaded images
                              </DropdownMenuItem>
                              {isGeneralContactUploadAvailable ? (
                                <DropdownMenuItem
                                  disabled={updatingImage}
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    startGeneralContactUpload(index)
                                  }}
                                >
                                  <ImageUp className="h-4 w-4 mr-2" />
                                  Upload image
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled>
                                  <ImageUp className="h-4 w-4 mr-2" />
                                  Upload image
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                disabled={!row.avatar_url}
                                onSelect={(e) => {
                                  e.preventDefault()
                                  updateGeneralContactField(index, 'avatar_url', '')
                                  updateGeneralContactField(index, 'avatar_public_id', '')
                                  toast.success('Avatar cleared. Save contacts to apply changes.')
                                }}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Clear avatar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={row.establishment_name}
                            onChange={(e) => updateGeneralContactField(index, 'establishment_name', e.target.value)}
                            minLength={VALIDATION_CONSTRAINTS.directory.generalEstablishment.min}
                            maxLength={VALIDATION_CONSTRAINTS.directory.generalEstablishment.max}
                            title={`Establishment name must be ${VALIDATION_CONSTRAINTS.directory.generalEstablishment.min} to ${VALIDATION_CONSTRAINTS.directory.generalEstablishment.max} characters.`}
                            placeholder="Establishment Name (Required)"
                            className="h-9 rounded-sm"
                          />
                          <Input
                            value={row.services}
                            onChange={(e) => updateGeneralContactField(index, 'services', e.target.value)}
                            maxLength={VALIDATION_CONSTRAINTS.directory.generalServices.max}
                            title={`Services can be up to ${VALIDATION_CONSTRAINTS.directory.generalServices.max} characters.`}
                            placeholder="Services (Optional)"
                            className="h-9 rounded-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={row.contact_person}
                            onChange={(e) => updateGeneralContactField(index, 'contact_person', e.target.value)}
                            maxLength={VALIDATION_CONSTRAINTS.directory.generalContactPerson.max}
                            title={`Contact person can be up to ${VALIDATION_CONSTRAINTS.directory.generalContactPerson.max} characters.`}
                            placeholder="Contact Person (Optional)"
                            className="h-9 rounded-sm"
                          />
                          <Input
                            value={row.value}
                            onChange={(e) => updateGeneralContactField(index, 'value', e.target.value)}
                            minLength={VALIDATION_CONSTRAINTS.directory.generalValue.min}
                            maxLength={VALIDATION_CONSTRAINTS.directory.generalValue.max}
                            title={`Contact value must be ${VALIDATION_CONSTRAINTS.directory.generalValue.min} to ${VALIDATION_CONSTRAINTS.directory.generalValue.max} characters.`}
                            placeholder="Contact Number / Value (Required)"
                            className="h-9 rounded-sm"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeGeneralContactRow(index)}
                            className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 h-9 w-9 rounded-lg"
                            aria-label="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <TextFieldStatus value={row.establishment_name} min={VALIDATION_CONSTRAINTS.directory.generalEstablishment.min} max={VALIDATION_CONSTRAINTS.directory.generalEstablishment.max} />
                        <TextFieldStatus value={row.services} max={VALIDATION_CONSTRAINTS.directory.generalServices.max} />
                        <TextFieldStatus value={row.contact_person} max={VALIDATION_CONSTRAINTS.directory.generalContactPerson.max} />
                        <TextFieldStatus value={row.value} min={VALIDATION_CONSTRAINTS.directory.generalValue.min} max={VALIDATION_CONSTRAINTS.directory.generalValue.max} />
                      </div>
                    )})}
                    </>
                  )}
                </div>
              ) : filteredGeneralContacts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {generalContacts.length === 0 ? 'No general contacts yet.' : 'No contacts match your search.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {paginatedFilteredGeneralContacts.map((contact) => {
                    return (
                      <div key={contact.id} className="flex items-start gap-3 rounded-md border border-slate-100 p-3 min-w-0">
                        {contact.avatar_url ? (
                          <div className="mt-0.5 h-8 w-8 rounded-full overflow-hidden border border-slate-200 shrink-0">
                            <img src={contact.avatar_url} alt={contact.establishment_name || contact.label || contact.type} className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="mt-0.5 h-8 w-8 rounded-full bg-slate-100 text-[#A4163A] flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-slate-700">
                              {getLabelInitials(contact.establishment_name)}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">{contact.establishment_name || contact.label || contact.type}</p>
                          {contact.services ? (
                            <p className="text-[11px] text-slate-500 mt-0.5 break-words">{contact.services}</p>
                          ) : null}
                          {contact.contact_person ? (
                            <p className="text-[11px] text-slate-500 break-words">Contact: {contact.contact_person}</p>
                          ) : null}
                          <p className="text-sm font-semibold text-slate-800 break-words">{contact.value}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-slate-500 hover:text-[#A4163A] hover:bg-rose-50"
                          onClick={() => void handleCopyText(contact.establishment_name || contact.label || contact.type, contact.value)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              {!loadingGeneralContacts && (editingGeneralContacts ? filteredGeneralContactsDraft.length > 0 : filteredGeneralContacts.length > 0) ? (
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Showing {(generalContactsPage - 1) * GENERAL_CONTACTS_PAGE_SIZE + 1}
                    -
                    {(generalContactsPage - 1) * GENERAL_CONTACTS_PAGE_SIZE + (editingGeneralContacts ? paginatedFilteredGeneralContactsDraft.length : paginatedFilteredGeneralContacts.length)} of {editingGeneralContacts ? filteredGeneralContactsDraft.length : filteredGeneralContacts.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3"
                      disabled={generalContactsPage <= 1}
                      onClick={() => setGeneralContactsPage((prev) => Math.max(1, prev - 1))}
                    >
                      <ArrowRight className="mr-1 h-3.5 w-3.5 rotate-180" />
                      Previous
                    </Button>
                    <span className="text-xs font-bold text-slate-600 px-2">
                      Page {generalContactsPage} of {generalContactsTotalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3"
                      disabled={generalContactsPage >= generalContactsTotalPages}
                      onClick={() => setGeneralContactsPage((prev) => Math.min(generalContactsTotalPages, prev + 1))}
                    >
                      Next
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        ) : (
          <>
        {/* COMBINED HERO & PROCESS SECTION */}
        <div className="flex flex-col shadow-xl border border-slate-200 rounded-sm overflow-hidden mb-8">


          {/* 1. HERO BANNER */}
          <div className="relative w-full h-[400px] bg-white group">
            {!imageError[agency.key] ? (
              <img
                src={agency.image}
                alt={agency.shortName}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onLoad={() => handleAgencyImageLoad(agency.key)}
                onError={() => handleAgencyImageError(agency.key)}
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                <agency.icon className="w-24 h-24 text-slate-400" />
              </div>
            )}


            {/* Banner Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />


            <div className="absolute top-6 right-6 flex flex-col gap-3">
              {/* Upload Buttons */}
              <Button
                onClick={() => startAgencyUpload(activeAgency)}
                disabled={updatingImage}
                className="bg-[#A4163A] hover:bg-[#8a1230] text-white border-none rounded-lg px-6 shadow-lg shadow-red-900/20 font-bold"
              >
                {updatingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                Update Picture
              </Button>


              <Button
                onClick={() => void loadCloudinaryImages({ type: 'agency', agencyCode: activeAgency })}
                disabled={loadingCloudinaryImages || updatingImage}
                className="bg-[#A4163A] hover:bg-[#8a1230] text-white border-none rounded-lg px-6 shadow-lg shadow-red-900/20 font-bold"
              >
                {loadingCloudinaryImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Images className="mr-2 h-4 w-4" />}
                Select from Image uploads
              </Button>
              <p className="text-[10px] font-bold text-white/80 text-right mt-1 drop-shadow-md">
                Max 20MB - JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF
              </p>
            </div>


            <div className="absolute bottom-0 left-0 p-10 w-full max-w-4xl">
              <div className="flex items-center gap-3 mb-3">
                <p className="text-xs md:text-sm font-black text-white/80 tracking-[0.3em] uppercase bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-sm inline-block border border-white/20 shadow-sm">
                  AGENCY DIRECTORY
                </p>
              </div>


              {editMode && draft ? (
                <div className="space-y-3">
                  <Input
                    value={draft.name}
                    onChange={e => setDraft({ ...draft, name: e.target.value })}
                    minLength={VALIDATION_CONSTRAINTS.directory.agencyName.min}
                    maxLength={VALIDATION_CONSTRAINTS.directory.agencyName.max}
                    title={`Short name must be ${VALIDATION_CONSTRAINTS.directory.agencyName.min} to ${VALIDATION_CONSTRAINTS.directory.agencyName.max} characters.`}
                    className="text-4xl md:text-6xl font-black text-white bg-transparent border-b border-white/40 rounded-none px-0 h-auto focus-visible:ring-0 focus-visible:border-white placeholder:text-white/30"
                    placeholder="SHORT NAME"
                  />
                  <TextFieldStatus value={draft.name} min={VALIDATION_CONSTRAINTS.directory.agencyName.min} max={VALIDATION_CONSTRAINTS.directory.agencyName.max} className="border-amber-200/80 bg-amber-50/95 text-amber-900" />
                  <Input
                    value={draft.full_name}
                    onChange={e => setDraft({ ...draft, full_name: e.target.value })}
                    maxLength={VALIDATION_CONSTRAINTS.directory.agencyFullName.max}
                    title={`Full name can be up to ${VALIDATION_CONSTRAINTS.directory.agencyFullName.max} characters.`}
                    className="text-xl md:text-2xl font-medium text-white/90 bg-transparent border-b border-white/40 rounded-none px-0 h-auto focus-visible:ring-0 focus-visible:border-white placeholder:text-white/30"
                    placeholder="Agency Full Business Name"
                  />
                  <TextFieldStatus value={draft.full_name} max={VALIDATION_CONSTRAINTS.directory.agencyFullName.max} className="border-amber-200/80 bg-amber-50/95 text-amber-900" />
                </div>
              ) : (
                <>
                  <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-sm mb-2">
                    {agency.shortName}
                  </h2>
                  <p className="text-lg md:text-2xl font-medium text-white/90 leading-snug max-w-2xl drop-shadow-sm">
                    {agency.fullName}
                  </p>
                </>
              )}
            </div>
          </div>


          {/* 2. PROCESS STEPS */}
          <div className="bg-white p-8 md:p-10 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 pointer-events-none" />


            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 relative z-10">
              <div>
                <p className="text-lg font-black text-[#A4163A] uppercase tracking-[0.25em] mb-2">GOVERNMENT CONTRIBUTION</p>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Process Steps</h3>
                {editMode && draft && (
                  <>
                    <p className="text-[11px] font-semibold text-slate-500 mt-3">Summary: up to {VALIDATION_CONSTRAINTS.directory.agencySummary.max} characters.</p>
                    <Textarea
                      value={draft.summary}
                      onChange={e => {
                        setDraft({ ...draft, summary: e.target.value })
                      }}
                      maxLength={VALIDATION_CONSTRAINTS.directory.agencySummary.max}
                      title={`Summary can be up to ${VALIDATION_CONSTRAINTS.directory.agencySummary.max} characters.`}
                      className="mt-2 max-w-2xl rounded-sm"
                      placeholder="Agency summary or additional notes..."
                    />
                    <TextFieldStatus value={draft.summary} max={VALIDATION_CONSTRAINTS.directory.agencySummary.max} />
                  </>
                )}
              </div>


              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1.5 rounded-sm border border-slate-200">
                  {(['Adding', 'Removing'] as ProcessType[]).map((type) => {
                    const isActive = activeProcess === type
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveProcess(type)}
                        className={cn(
                          "px-6 py-2.5 rounded-lg text-sm font-black transition-all flex items-center gap-2",
                          isActive ? "bg-[#A4163A] text-white shadow-md transform scale-105" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                        )}
                      >
                        {type === 'Adding' ? <UserPlus className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                        <span>{type}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>


            {/* TABLE / LIST */}
            <div className="relative z-10">
              {editMode && duplicateProcessCount > 0 && (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-700 flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 shrink-0" />
                  {duplicateProcessCount} duplicate process step{duplicateProcessCount > 1 ? 's are' : ' is'} highlighted in red. Resolve duplicates before saving.
                </div>
              )}
              <div className="border rounded-sm overflow-hidden border-slate-100 shadow-sm">
                {editMode && (
                  <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-end">
                    <Button onClick={addProcessStep} size="sm" variant="outline" className="text-[#A4163A] border-[#A4163A]/20 bg-[#A4163A]/5 hover:bg-[#A4163A]/10 rounded-lg">
                      <Plus className="mr-2 h-4 w-4" /> Add Step
                    </Button>
                  </div>
                )}


                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-slate-50/50 border-slate-100">
                      <TableHead className="w-[80px] text-center font-black text-slate-400 uppercase text-[20px] tracking-widest py-4">Step</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[20px] tracking-widest py-4">Process Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editMode ? (
                      currentProcessDraftRows.length > 0 ? (
                        currentProcessDraftRows.map((step, index) => {
                          const normalizedProcess = normalizeDuplicateValue(step.process)
                          const isDuplicateProcess = normalizedProcess.length > 0 && duplicateProcessKeys.has(`${step.process_type}|${normalizedProcess}`)
                          return (
                          <TableRow
                            key={index}
                            className={cn(
                              "border-slate-100 hover:bg-slate-50/50",
                              isDuplicateProcess ? "bg-rose-50/70 ring-1 ring-rose-300/90" : ""
                            )}
                          >
                            <TableCell className="text-center align-top py-6">
                              <div className="h-8 w-8 rounded-sm bg-[#A4163A]/10 text-[#A4163A] font-black text-sm flex items-center justify-center mx-auto">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="py-6 align-top">
                              {isDuplicateProcess && (
                                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-rose-700 inline-flex items-center gap-1">
                                  <TriangleAlert className="h-3 w-3" />
                                  Duplicate
                                </p>
                              )}
                              <div className="flex gap-2">
                                <Textarea
                                  value={step.process}
                                  onChange={(e) => updateProcessTextAt(index, e.target.value)}
                                  minLength={VALIDATION_CONSTRAINTS.directory.processStep.min}
                                  maxLength={VALIDATION_CONSTRAINTS.directory.processStep.max}
                                  title={`Process description must be ${VALIDATION_CONSTRAINTS.directory.processStep.min} to ${VALIDATION_CONSTRAINTS.directory.processStep.max} characters.`}
                                  className="min-h-[60px] resize-y rounded-sm"
                                />
                                <TextFieldStatus value={step.process} min={VALIDATION_CONSTRAINTS.directory.processStep.min} max={VALIDATION_CONSTRAINTS.directory.processStep.max} />
                                <Button size="icon" variant="ghost" onClick={() => removeProcessAt(index)} className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 shrink-0 h-9 w-9 rounded-lg">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )})
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-slate-400 italic">No draft steps yet.</TableCell>
                        </TableRow>
                      )
                    ) : (
                      currentSteps.length > 0 ? (
                        currentSteps.map((step, index) => (
                          <TableRow key={index} className="border-slate-100 hover:bg-slate-50/30 transition-colors">
                            <TableCell className="text-center align-top py-6">
                              <div className="h-10 w-10 rounded-sm bg-slate-100 text-slate-600 font-black text-base flex items-center justify-center mx-auto shadow-sm">
                                {index + 1}
                              </div>
                            </TableCell>
                            <TableCell className="py-6 align-top">
                              <p className="text-xl font-medium text-slate-800 leading-relaxed pt-1.5">{step}</p>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="h-32 text-center text-slate-400 italic">No process steps found for this category.</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
        {/* 3. CONTACT GRIDS */}
        <div>
          <div className="mt-8 mb-4 border-b border-slate-200 pb-2">
            <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Phone className="w-5 h-5 text-[#A4163A]" />
              Contact Information
            </h3>
            <p className="text-slate-500 font-medium text-sm mt-1">
              24/7 hotline, mobile support, callback service, and main office details.
            </p>
          </div>
          {editMode && (
            <div className="mb-4 flex justify-end">
              <Button onClick={addContact} variant="outline" className="text-[#A4163A] border-[#A4163A]/20 bg-white shadow-sm rounded-lg">
                <Plus className="mr-2 h-4 w-4" /> Add Contact Field
              </Button>
            </div>
          )}
          {editMode && duplicateContactIndices.size > 0 && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-700 flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {duplicateContactIndices.size} duplicate contact value{duplicateContactIndices.size > 1 ? 's are' : ' is'} highlighted in red. Resolve duplicates before saving.
            </div>
          )}


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(editMode && draft
              ? draft.contacts
              : agency.details
            ).filter(row => {
              if (editMode) return true
              // In view mode, only show if value exists
              return row.value && row.value.trim().length > 0
            })
              .map((row, idx) => {
                const isEditable = editMode && draft
                const actualRow = isEditable ? row : row
                const isDuplicateContact = isEditable && duplicateContactIndices.has(idx)
                // Note: agency.details already has icon, but draft doesn't.
                const Icon = isEditable
                  ? getDetailIcon(row.type, row.label)
                  : (row as any).icon


                return (
                  <div
                    key={idx}
                    className={cn(
                      "group bg-white rounded-sm p-3 border border-slate-200 hover:border-[#A4163A] transition-colors flex items-center justify-between gap-4 shadow-sm hover:shadow-md",
                      isDuplicateContact ? "bg-rose-50/70 ring-1 ring-rose-300/90 border-rose-300" : ""
                    )}
                  >
                    {isEditable ? (
                      <div className="flex-1 space-y-2 relative z-10 w-full">
                        {isDuplicateContact && (
                          <p className="text-[10px] font-black uppercase tracking-wider text-rose-700 inline-flex items-center gap-1">
                            <TriangleAlert className="h-3 w-3" />
                            Duplicate
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Input
                            value={row.type}
                            onChange={(e) => updateContactAt(idx, 'type', e.target.value)}
                            maxLength={VALIDATION_CONSTRAINTS.directory.contactType.max}
                            title={`Type can be up to ${VALIDATION_CONSTRAINTS.directory.contactType.max} characters.`}
                            placeholder="Type (e.g. Hotline)"
                            className="font-bold text-xs uppercase rounded-sm h-8"
                          />
                          <Input
                            value={row.label}
                            onChange={(e) => updateContactAt(idx, 'label', e.target.value)}
                            maxLength={VALIDATION_CONSTRAINTS.directory.contactLabel.max}
                            title={`Label can be up to ${VALIDATION_CONSTRAINTS.directory.contactLabel.max} characters.`}
                            placeholder="Label"
                            className="font-bold text-xs uppercase rounded-sm h-8"
                          />
                        </div>
                        <Input
                          value={row.value}
                          onChange={(e) => updateContactAt(idx, 'value', e.target.value)}
                          minLength={VALIDATION_CONSTRAINTS.directory.contactValue.min}
                          maxLength={VALIDATION_CONSTRAINTS.directory.contactValue.max}
                          title={`Value must be ${VALIDATION_CONSTRAINTS.directory.contactValue.min} to ${VALIDATION_CONSTRAINTS.directory.contactValue.max} characters.`}
                          placeholder="Value"
                          className="rounded-sm h-9"
                        />
                        <TextFieldStatus value={row.type} max={VALIDATION_CONSTRAINTS.directory.contactType.max} />
                        <TextFieldStatus value={row.label} max={VALIDATION_CONSTRAINTS.directory.contactLabel.max} />
                        <TextFieldStatus value={row.value} min={VALIDATION_CONSTRAINTS.directory.contactValue.min} max={VALIDATION_CONSTRAINTS.directory.contactValue.max} />
                        <Button size="sm" variant="ghost" onClick={() => removeContactAt(idx)} className="text-rose-500 w-full hover:bg-rose-50 rounded-lg h-8">
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="h-10 w-10 rounded-full bg-slate-50 text-[#A4163A] flex items-center justify-center shrink-0 border border-slate-100">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                              {row.label || row.type}
                            </p>
                            <p className="text-sm md:text-base font-bold text-slate-800 truncate leading-none pb-0.5">
                              {row.value}
                            </p>
                          </div>
                        </div>


                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 text-slate-400 hover:text-[#A4163A] hover:bg-rose-50 rounded-lg font-bold text-xs tracking-wider"
                          onClick={() => void handleCopyText(row.label || row.type, row.value)}
                        >
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          COPY
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
          </>
        )}
      </main>


      {/* 4. FOOTER */}
      <footer className="w-full bg-[#A4163A] text-white py-4 px-8 mt-auto sticky bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs md:text-sm font-bold uppercase tracking-widest">
          {!isGeneralContactsView ? (
            <div className="flex items-center gap-2">
              <span className="opacity-70">OFFICIAL ONLINE PORTAL:</span>
              {snapshot.activeLink !== 'N/A' ? (
                <a href={snapshot.activeLink} target="_blank" rel="noreferrer" className="hover:underline hover:text-white text-white/90">
                  {snapshot.activeLink}
                </a>
              ) : (
                <span className="text-white/70">(LINK UNAVAILABLE)</span>
              )}
            </div>
          ) : <div />}


          <div className="flex items-center gap-2">
            <span className="opacity-70">LAST UPDATED:</span>
            <span className="text-white/90">{isGeneralContactsView ? generalContactsUpdatedAtText : snapshot.updatedAtText}</span>
          </div>
        </div>
      </footer>


      {/* ----- MODALS ----- */}
      <Dialog open={avatarPreview !== null} onOpenChange={(open) => { if (!open) setAvatarPreview(null) }}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{avatarPreview?.title || 'Avatar Preview'}</DialogTitle>
            <DialogDescription>General contact avatar preview.</DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            {avatarPreview?.url ? (
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                <img src={avatarPreview.url} alt={avatarPreview.title} className="w-full h-auto object-cover" />
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={loadingCloudinaryImages && !cloudinaryPickerOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#A4163A]" />
              Loading Uploaded Images
            </DialogTitle>
            <DialogDescription>
              Fetching your uploaded images from backend storage. Please wait...
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              This may take a few seconds depending on network speed.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cloudinaryPickerOpen}
        onOpenChange={(open) => {
          setCloudinaryPickerOpen(open)
          if (!open) setCloudinaryPickerTarget(null)
          if (open) setCloudinaryPage(1)
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>
              {cloudinaryPickerTarget?.type === 'general-contact' ? 'Select Avatar Image' : 'Select Agency Image'}
            </DialogTitle>
            <DialogDescription>
              Choose an existing image from your uploads in <span className="font-mono">{cloudinaryPickerFolderPath}</span>. Max 20MB and allowed formats: JPG, JPEG, PNG, GIF, WebP, HEIC, HEIF.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(85vh-10rem)]">
            {cloudinaryImages.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                No uploaded images found in <span className="font-mono">{cloudinaryPickerFolderPath}</span>.
              </div>
            ) : (
              <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {paginatedCloudinaryImages.map((asset) => (
                  <div
                    key={asset.public_id}
                    role="button"
                    tabIndex={0}
                    className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden text-left hover:border-[#A4163A]/50"
                    onClick={async () => {
                      try {
                        validateImageRestrictions(asset.format, Number(asset.bytes || 0))
                        setUpdatingImage(true)
                        if (cloudinaryPickerTarget?.type === 'general-contact') {
                          setGeneralContactAvatarAt(cloudinaryPickerTarget.index, asset.secure_url, asset.public_id)
                          toast.success('Avatar selected. Save contacts to apply changes.')
                        } else {
                          await persistAgencyImage({
                            agencyCode: cloudinaryPickerTarget?.agencyCode,
                            imageUrl: asset.secure_url,
                            publicId: asset.public_id,
                            format: asset.format,
                            bytes: asset.bytes,
                          })
                          toast.success('Agency picture updated successfully!')
                        }
                        setCloudinaryPickerOpen(false)
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Failed to update picture'
                        toast.error('Image Selection Failed', { description: message })
                      } finally {
                        setUpdatingImage(false)
                      }
                    }}
                    onKeyDown={async (e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return
                      e.preventDefault()
                      try {
                        validateImageRestrictions(asset.format, Number(asset.bytes || 0))
                        setUpdatingImage(true)
                        if (cloudinaryPickerTarget?.type === 'general-contact') {
                          setGeneralContactAvatarAt(cloudinaryPickerTarget.index, asset.secure_url, asset.public_id)
                          toast.success('Avatar selected. Save contacts to apply changes.')
                        } else {
                          await persistAgencyImage({
                            agencyCode: cloudinaryPickerTarget?.agencyCode,
                            imageUrl: asset.secure_url,
                            publicId: asset.public_id,
                            format: asset.format,
                            bytes: asset.bytes,
                          })
                          toast.success('Agency picture updated successfully!')
                        }
                        setCloudinaryPickerOpen(false)
                      } catch (err) {
                        const message = err instanceof Error ? err.message : 'Failed to update picture'
                        toast.error('Image Selection Failed', { description: message })
                      } finally {
                        setUpdatingImage(false)
                      }
                    }}
                  >
                    <button
                      type="button"
                      aria-label={`Delete ${asset.public_id} image`}
                      className="absolute top-2 right-2 z-10 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-black shadow-sm hover:bg-rose-700"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteCandidate(asset)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img src={asset.secure_url} alt={asset.public_id} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-slate-700 truncate">{asset.public_id}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {String(asset.format || '').toUpperCase()} - {Math.round((Number(asset.bytes || 0) / (1024 * 1024)) * 10) / 10} MB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Page {cloudinaryPage} of {cloudinaryTotalPages} • {cloudinaryImages.length} uploaded image{cloudinaryImages.length === 1 ? '' : 's'}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={cloudinaryPage <= 1}
                    onClick={() => setCloudinaryPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={cloudinaryPage >= cloudinaryTotalPages}
                    onClick={() => setCloudinaryPage((prev) => Math.min(cloudinaryTotalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>


      <AlertDialog open={deleteCandidate !== null} onOpenChange={(open) => { if (!open) setDeleteCandidate(null) }}>
        <AlertDialogContent
          className={modalTokens.container}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            deleteDialogTitleRef.current?.focus()
          }}
          onEscapeKeyDown={() => setDeleteCandidate(null)}
        >
          <AlertDialogHeader>
            <div className={modalTokens.iconWrap}>
              <TriangleAlert className="h-6 w-6" />
            </div>
            <AlertDialogTitle ref={deleteDialogTitleRef} tabIndex={-1} className={modalTokens.title}>
              Delete this uploaded image?
            </AlertDialogTitle>
            <AlertDialogDescription className={modalTokens.description}>
              This will permanently delete the selected image file from backend storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={modalTokens.footer}>
            <AlertDialogCancel onClick={() => setDeleteCandidate(null)} className={buttonTokens.neutral}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonTokens.danger}
              onClick={async () => {
                if (!deleteCandidate) return
                try {
                  setDeletingCloudinaryImage(true)
                  const response = await fetch(`${getApiUrl()}/api/directory/images`, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                    },
                    body: JSON.stringify({ public_id: deleteCandidate.public_id }),
                  })


                  await ensureOkResponse(response, 'Unable to delete the selected image.')


                  setCloudinaryImages((prev) => prev.filter((item) => item.public_id !== deleteCandidate.public_id))
                  toast.success('Image deleted successfully!')
                } catch (err) {
                  const message = err instanceof Error ? err.message : 'Failed to delete image'
                  toast.error('Delete Failed', { description: message })
                } finally {
                  setDeleteCandidate(null)
                  setDeletingCloudinaryImage(false)
                }
              }}
            >
              {deletingCloudinaryImage ? 'Deleting...' : 'Delete Image'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

