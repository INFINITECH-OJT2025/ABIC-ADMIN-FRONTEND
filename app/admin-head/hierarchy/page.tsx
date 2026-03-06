"use client"

import { useMemo, useState, useEffect } from "react"
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, GitBranch, Plus, ShieldCheck, Users, Clock, X, Save, Edit2 } from "lucide-react"
import { getApiUrl } from "@/lib/api"
import { toast } from "sonner"

type Office = {
  id: string
  name: string
}

type Department = {
  id: string
  name: string
  color: string
  officeId: string
}

type OfficeShiftSchedule = {
  id?: number
  office_name: string
  shift_options: string[]
}

type PositionNode = {
  id: string
  title: string
  departmentId: string
  parentId: string
  createdAt: number
  positionId?: string
  color?: string
}

function titleToId(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

function NodePill({
  label,
  variant = "staff",
  color,
  onEdit
}: {
  label: string;
  variant?: "staff" | "dept" | "exec" | "admin";
  color?: string;
  onEdit?: () => void
}) {
  const styles = {
    staff: "bg-white text-slate-700 border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300",
    dept: "bg-white text-slate-700 border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300",
    exec: "bg-gradient-to-r from-violet-600 to-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20",
    admin: "bg-gradient-to-r from-rose-500 to-orange-400 text-white border-transparent shadow-lg shadow-rose-500/20",
  }

  const isHighRank = variant === 'exec' || variant === 'admin'

  return (
    <div
      className={`group relative rounded-xl border-2 px-6 py-2.5 text-center text-xs font-bold tracking-wide transition-all duration-200 ${styles[variant]}`}
      style={!isHighRank && color ? { borderLeftColor: color, borderLeftWidth: '4px' } : {}}
    >
      {label}
      {onEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:bg-slate-900"
        >
          <Edit2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function HierarchyBranch({ node, allNodes, onEdit, execId, adminId }: { node: PositionNode; allNodes: PositionNode[]; onEdit: (node: PositionNode) => void; execId?: string; adminId?: string }) {
  const children = allNodes.filter((item) => item.parentId === node.id)

  const getVariant = (title: string, deptId: string, nodeId?: string) => {
    if (nodeId && nodeId === execId) return "exec"
    if (nodeId && nodeId === adminId) return "admin"
    const lowTitle = title.toLowerCase()
    if (lowTitle.includes("admin head")) return "admin"
    if (lowTitle.includes("executive")) return "exec"
    if (deptId === 'core') return "staff"
    if (lowTitle.includes("manager") || lowTitle.includes("supervisor") || lowTitle.includes("head") || lowTitle.includes("senior")) {
      return "dept"
    }
    return "staff"
  }

  return (
    <div className="space-y-3">
      <NodePill
        label={node.title}
        variant={getVariant(node.title, node.departmentId, node.id)}
        color={node.color}
        onEdit={() => onEdit(node)}
      />
      {children.length > 0 && (
        <div className="relative ml-6 border-l-[1.5px] border-slate-200 pl-6">
          <div className="space-y-4 py-1">
            {children.map((child) => (
              <div key={child.id} className="relative">
                <div className="absolute -left-6 top-5 h-[1.5px] w-6 bg-slate-200" />
                 <HierarchyBranch node={child} allNodes={allNodes} onEdit={onEdit} execId={execId} adminId={adminId} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminHeadHierarchyPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<PositionNode[]>([])
  const [availablePositions, setAvailablePositions] = useState<string[]>([])

  const [departmentName, setDepartmentName] = useState("")
  const [departmentColor, setDepartmentColor] = useState("#59D2DE")

  const [positionTitle, setPositionTitle] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("")
  const [selectedParent, setSelectedParent] = useState("root")
  const [selectedChildren, setSelectedChildren] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PositionNode | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDepartment, setEditDepartment] = useState("")
  const [editParent, setEditParent] = useState("")

  useEffect(() => {
    if (editingPosition) {
      setEditTitle(editingPosition.title)
      setEditDepartment(editingPosition.departmentId)
      setEditParent(editingPosition.parentId)
    }
  }, [editingPosition])

  const handleUpdatePosition = async () => {
    if (!editingPosition) return
    setLoading(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/hierarchies/${editingPosition.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: editTitle,
          department_id: editDepartment === 'core' ? null : Number(editDepartment),
          parent_id: editParent === 'root' ? null : Number(editParent)
        })
      })
      if (!res.ok) throw new Error('Failed to update position')

      await fetchData()
      setEditingPosition(null)
      toast.success("Position updated successfully")
    } catch (err) {
      console.error(err)
      toast.error("Failed to update position")
    } finally {
      setLoading(false)
    }
  }

  // Office States
  const [offices, setOffices] = useState<Office[]>([])
  const [officeName, setOfficeName] = useState("")
  const [selectedOffice, setSelectedOffice] = useState("")

  // Shift Schedule States
  const [schedules, setSchedules] = useState<OfficeShiftSchedule[]>([])
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<OfficeShiftSchedule | null>(null)
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null)
  const [newShiftStart, setNewShiftStart] = useState("08:00")
  const [newShiftEnd, setNewShiftEnd] = useState("12:00")

  const fetchData = async () => {
    try {
      const [deptRes, hierRes, schedRes, officeRes] = await Promise.all([
        fetch(getApiUrl() + '/api/departments', { headers: { Accept: 'application/json' } }),
        fetch(getApiUrl() + '/api/hierarchies', { headers: { Accept: 'application/json' } }),
        fetch(getApiUrl() + '/api/office-shift-schedules', { headers: { Accept: 'application/json' } }),
        fetch(getApiUrl() + '/api/offices', { headers: { Accept: 'application/json' } })
      ])
      const deptData = await deptRes.json()
      const hierData = await hierRes.json()
      const schedData = await schedRes.json()
      const officeData = await officeRes.json()

      const mappedDeps = (Array.isArray(deptData?.data) ? deptData.data : (Array.isArray(deptData) ? deptData : [])).map((d: any) => ({
        id: d.id.toString(),
        name: d.name,
        color: d.color || '#59D2DE',
        officeId: d.office_id?.toString() || ""
      }))
      setDepartments(mappedDeps)

      if (officeData.success) {
        setOffices(officeData.data.map((o: any) => ({ id: o.id.toString(), name: o.name })))
      }

      const hierArray = (Array.isArray(hierData?.data) ? hierData.data : (Array.isArray(hierData) ? hierData : []))
      setAvailablePositions(hierArray.map((p: any) => p.name))

      // 1. Map explicit hierarchy records from database
      const mappedPos = hierArray.map((h: any) => ({
        id: h.id.toString(),
        title: h.name || 'Unknown',
        departmentId: h.department_id ? h.department_id.toString() : 'core',
        parentId: h.parent_id ? h.parent_id.toString() : 'root',
        createdAt: new Date(h.created_at || h.updated_at).getTime(),
        color: h.department?.color || (mappedDeps.find((d: any) => d.id === h.department_id?.toString())?.color) || '#59D2DE'
      }))

      setPositions(mappedPos)

      if (schedData.success) {
        setSchedules(schedData.data)
      }

    } catch (err) {
      console.error("Failed to load hierarchy data", err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const { execNode, adminNode } = useMemo(() => {
    const coreRoots = positions.filter(p => p.parentId === 'root' && p.departmentId === 'core')
    const exec = coreRoots[0]
    const admin = exec ? positions.find(p => p.parentId === exec.id && p.departmentId === 'core') : (coreRoots[1] || null)
    return { execNode: exec, adminNode: admin }
  }, [positions])

  const parentOptions = useMemo(() => {
    if (!selectedDepartment) return []
    return positions
      .filter((item) => item.departmentId === selectedDepartment)
      .sort((a, b) => a.title.localeCompare(b.title))
  }, [positions, selectedDepartment])

  const recentlyAdded = useMemo(() => {
    return [...positions]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
  }, [positions])

  const handleOpenShiftModal = (office: Office) => {
    const existing = schedules.find(s => s.office_name === office.name)
    setEditingSchedule(existing || { office_name: office.name, shift_options: [] })
    setEditingOptionIndex(null)
    setIsShiftModalOpen(true)
  }

  const handleSaveShiftSchedule = async () => {
    if (!editingSchedule) return
    setLoading(true)
    try {
      const res = await fetch(getApiUrl() + '/api/office-shift-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(editingSchedule)
      })
      const result = await res.json()
      if (result.success) {
        setSchedules(prev => {
          const idx = prev.findIndex(s => s.office_name === result.data.office_name)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = result.data
            return next
          }
          return [...prev, result.data]
        })
        setIsShiftModalOpen(false)
        toast.success("Office shift schedule updated successfully!")
      } else {
        throw new Error(result.message || "Failed to update schedule")
      }
    } catch (err) {
      console.error(err)
      toast.error("Error saving shift schedule.")
    } finally {
      setLoading(false)
    }
  }

  const addShiftOption = () => {
    if (!editingSchedule) return

    if (editingOptionIndex === null && editingSchedule.shift_options.length >= 2) {
      toast.error("You can only have a maximum of 2 shift options.")
      return
    }

    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':')
      const h = parseInt(hours)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${h12}:${minutes} ${ampm}`
    }

    const formattedOption = `${formatTime(newShiftStart)} – ${formatTime(newShiftEnd)}`

    if (editingOptionIndex !== null) {
      const nextOptions = [...editingSchedule.shift_options]
      nextOptions[editingOptionIndex] = formattedOption
      setEditingSchedule({
        ...editingSchedule,
        shift_options: nextOptions
      })
      setEditingOptionIndex(null)
    } else {
      setEditingSchedule({
        ...editingSchedule,
        shift_options: [...editingSchedule.shift_options, formattedOption]
      })
    }
  }

  const startEditingOption = (idx: number) => {
    if (!editingSchedule) return
    const option = editingSchedule.shift_options[idx]
    // Example: "08:00 AM – 12:00 PM"
    const parts = option.split(' – ')
    if (parts.length !== 2) return

    const parseTime = (timeStr: string) => {
      const [time, ampm] = timeStr.split(' ')
      let [h, m] = time.split(':').map(Number)
      if (ampm === 'PM' && h < 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }

    setNewShiftStart(parseTime(parts[0]))
    setNewShiftEnd(parseTime(parts[1]))
    setEditingOptionIndex(idx)
  }

  const removeShiftOption = (idx: number) => {
    if (!editingSchedule) return
    setEditingSchedule({
      ...editingSchedule,
      shift_options: editingSchedule.shift_options.filter((_, i) => i !== idx)
    })
    if (editingOptionIndex === idx) setEditingOptionIndex(null)
    else if (editingOptionIndex !== null && editingOptionIndex > idx) setEditingOptionIndex(editingOptionIndex - 1)
  }

  const handleAddDepartment = async () => {
    const cleanName = departmentName.trim()
    if (!cleanName || !selectedOffice) {
      toast.error("Please provide department name and select an office.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(getApiUrl() + '/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: cleanName,
          office_id: Number(selectedOffice),
          is_custom: true,
          color: departmentColor
        })
      })
      if (!res.ok) throw new Error('Failed to create department')
      const result = await res.json()
      const d = result.data || result

      setDepartments((prev) => [...prev, {
        id: d.id.toString(),
        name: d.name,
        color: d.color || '#59D2DE',
        officeId: d.office_id?.toString() || ""
      }])
      setDepartmentName("")
      setDepartmentColor("#59D2DE")
      setSelectedOffice("")
      toast?.success("Department created and saved.")
    } catch (err) {
      console.error(err)
      toast?.error("Failed to create department.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddOffice = async () => {
    const cleanName = officeName.trim()
    if (!cleanName) return

    setLoading(true)
    try {
      const res = await fetch(getApiUrl() + '/api/offices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ name: cleanName })
      })
      if (!res.ok) throw new Error('Failed to create office')
      const result = await res.json()
      const o = result.data

      setOffices((prev) => [...prev, { id: o.id.toString(), name: o.name }])
      setOfficeName("")
      toast?.success("Office created successfully.")
    } catch (err) {
      console.error(err)
      toast?.error("Failed to create office.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPosition = async () => {
    const cleanTitle = positionTitle.trim()

    if (!cleanTitle || !selectedDepartment) return

    setLoading(true)
    try {
      const hierRes = await fetch(getApiUrl() + '/api/hierarchies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: cleanTitle,
          department_id: selectedDepartment === 'core' ? null : Number(selectedDepartment),
          parent_id: selectedParent === 'root' ? null : Number(selectedParent),
          is_custom: true
        })
      })
      if (!hierRes.ok) throw new Error('Failed to create hierarchy link')

      // Refresh the entire data to ensure local state is perfectly in sync with DB
      await fetchData()

      setPositionTitle("")
      setSelectedParent("admin-head")
      setSelectedChildren([])
      toast?.success("Position successfully added to hierarchy.")
    } catch (err) {
      console.error(err)
      toast?.error("Failed to add position.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Hierarchy Management</h1>
              <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                Add departments, positions, and roles following your organization flow.
              </p>
            </div>

          </div>
        </div>

        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs font-bold uppercase tracking-wider text-white/85">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <Building2 className="h-4 w-4" />
                Departments: {departments.length}
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <Users className="h-4 w-4" />
                Staff Positions: {positions.length}
              </div>
               <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                <ShieldCheck className="h-4 w-4" />
                Top Hierarchy: {execNode ? execNode.title : '---'} {adminNode ? ` > ${adminNode.title}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 border-2 border-[#FFE5EC]">
          <CardHeader>
            <CardTitle className="text-[#630C22]">Setup Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Office</Label>
              <div className="flex gap-2">
                <Input
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="Office Name (e.g. ABIC)"
                  className="h-10"
                />
                <Button onClick={handleAddOffice} disabled={loading} className="bg-slate-700 hover:bg-slate-800">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="h-px w-full bg-slate-200" />

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Department</Label>
              <div className="grid grid-cols-1 gap-3">
                <Input
                  value={departmentName}
                  onChange={(event) => setDepartmentName(event.target.value)}
                  placeholder="Department name"
                  className="h-10"
                />
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Assign Office" />
                  </SelectTrigger>
                  <SelectContent>
                    {offices.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="dept-color" className="text-xs font-bold uppercase tracking-wider text-slate-500">Color</Label>
                <Input
                  id="dept-color"
                  type="color"
                  value={departmentColor}
                  onChange={(event) => setDepartmentColor(event.target.value)}
                  className="h-10 w-20 p-1"
                />
                <Button onClick={handleAddDepartment} disabled={loading} className="ml-auto bg-[#A4163A] hover:bg-[#7B0F2B]">
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? 'Adding...' : 'Add'}
                </Button>
              </div>
            </div>

            <div className="h-px w-full bg-slate-200" />

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Position / Role</Label>
              <Input
                value={positionTitle}
                onChange={(event) => setPositionTitle(event.target.value)}
                placeholder="Position title"
                className="h-10"
                list="available-positions"
              />
              <datalist id="available-positions">
                {availablePositions.map((posName) => (
                  <option key={posName} value={posName} />
                ))}
              </datalist>
              <Select
                value={selectedDepartment}
                onValueChange={(value) => {
                  setSelectedDepartment(value)
                   setSelectedParent("root")
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core Position / Staff</SelectItem>
                  {departments.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Reports to" />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="root">{adminNode ? adminNode.title : (execNode ? execNode.title : "Root (Top Level)")}</SelectItem>
                  {parentOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Subordinates (Children)</Label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                  {parentOptions.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-2">No existing positions in this department.</p>
                  ) : (
                    parentOptions.map((item) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`child-${item.id}`}
                          checked={selectedChildren.includes(item.id)}
                          disabled={selectedChildren.length > 0 && !selectedChildren.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (parentOptions.length === 1) {
                                toast.error("You cannot select all positions in a department as subordinates.")
                                return
                              }
                              if (selectedChildren.length >= 1) {
                                toast.error("Selection limited to one subordinate.")
                                return
                              }
                              setSelectedChildren([item.id])
                            } else {
                              setSelectedChildren([])
                            }
                          }}
                        />
                        <label
                          htmlFor={`child-${item.id}`}
                          className={`text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${selectedChildren.length > 0 && !selectedChildren.includes(item.id)
                            ? "text-slate-300"
                            : "text-slate-600"
                            }`}
                        >
                          {item.title}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button onClick={handleAddPosition} disabled={loading} className="w-full bg-[#630C22] hover:bg-[#4A081A]">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add Position to Hierarchy'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-2 border-[#FFE5EC]">
          <CardHeader>
            <CardTitle className="text-[#630C22]">Organization Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 overflow-x-auto">
            <div className="min-w-[940px] space-y-6">
               <div className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-4">
                  {execNode && (
                    <NodePill
                      label={execNode.title}
                      variant="exec"
                      onEdit={() => setEditingPosition(execNode)}
                    />
                  )}
                  {execNode && adminNode && <div className="h-6 w-px bg-slate-300" />}
                  {adminNode && (
                    <NodePill
                      label={adminNode.title}
                      variant="admin"
                      onEdit={() => setEditingPosition(adminNode)}
                    />
                  )}
                  {!execNode && !adminNode && (
                    <div className="text-slate-400 italic text-sm py-4">No top-level positions defined</div>
                  )}
                </div>
                {(execNode || adminNode) && (
                  <div className="h-12 w-px bg-slate-300 relative mt-4">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-6">
                {positions.filter((item) => 
                  item.departmentId === "core" && 
                  [execNode?.id, adminNode?.id, "root"].includes(item.parentId) && 
                  item.id !== adminNode?.id && 
                  item.id !== execNode?.id
                ).map((item) => (
                  <HierarchyBranch key={item.id} node={item} allNodes={positions} onEdit={setEditingPosition} execId={execNode?.id} adminId={adminNode?.id} />
                ))}
              </div>

              <div className="space-y-12">
                {offices.map((office) => {
                  const officeDepts = departments.filter(d => d.officeId === office.id)

                  return (
                    <div key={office.id} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-[2px] flex-1 bg-slate-200" />
                        <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-slate-100 border border-slate-200 shadow-sm">
                          <span className="text-sm font-black uppercase tracking-widest text-slate-600">{office.name} OFFICE</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-400 hover:text-[#A4163A] hover:bg-white transition-colors"
                            onClick={() => handleOpenShiftModal(office)}
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="h-[2px] flex-1 bg-slate-200" />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {officeDepts.map((department) => {
                          const roots = positions.filter((item) => {
                            if (item.departmentId !== department.id) return false
                             if (adminNode && item.parentId === adminNode.id) return true
                             if (execNode && item.parentId === execNode.id) return true
                            // If parent belongs to a different department OR is core, show as root here
                            const parent = positions.find((pos) => pos.id === item.parentId)
                            return !parent || parent.departmentId !== department.id
                          })

                          const headerBg = department.color || '#59D2DE'

                          return (
                            <div key={department.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col">
                              <div
                                className="px-6 py-4 border-b border-black/5 flex items-center gap-3 relative overflow-hidden"
                                style={{ backgroundColor: headerBg }}
                              >
                                <div className="absolute inset-0 bg-white/20" />
                                <Building2 className="w-5 h-5 text-black/60 relative z-10" />
                                <span className="font-bold text-black/80 tracking-wide relative z-10 flex-1">
                                  {department.name}
                                </span>
                              </div>

                              <div className="p-6 flex-1 bg-slate-50/30">
                                <div className="space-y-4 relative">
                                  {roots.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                                      <Users className="w-8 h-8 mb-2 opacity-20" />
                                      <p className="text-sm font-medium">No positions assigned</p>
                                    </div>
                                  ) : (
                                     roots.map((root) => <HierarchyBranch key={root.id} node={root} allNodes={positions} onEdit={setEditingPosition} execId={execNode?.id} adminId={adminNode?.id} />)
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {officeDepts.length === 0 && (
                          <div className="col-span-full py-10 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                            <Building2 className="w-10 h-10 mb-2 opacity-10" />
                            <p className="text-sm font-medium italic">No departments under {office.name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 mt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Staff =</span>
                <div className="h-9 w-24 rounded-xl border-2 border-slate-200 bg-white shadow-sm" />
              </div>
               <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-500">Heads =</span>
                <div className="h-9 w-24 rounded-xl border-2 border-slate-200 bg-white shadow-sm border-l-4 border-l-[#59D2DE]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 md:px-8 mt-6">
        <Card className="border-2 border-[#FFE5EC]">
          <CardHeader>
            <CardTitle className="text-[#630C22]">Recently Added Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {recentlyAdded.map((item) => {
                const department = departments.find((dep) => dep.id === item.departmentId)
                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3 bg-white">
                    <p className="font-bold text-slate-900 uppercase text-xs tracking-wider">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-2 font-semibold uppercase tracking-wider">
                      {department?.name || "Core Position"}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#A4163A]" />
              Shift Schedule: {editingSchedule?.office_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Add Shift Option</Label>
              <div className="flex flex-col gap-3 p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Start Time</Label>
                    <Input
                      type="time"
                      value={newShiftStart}
                      onChange={(e) => setNewShiftStart(e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase">End Time</Label>
                    <Input
                      type="time"
                      value={newShiftEnd}
                      onChange={(e) => setNewShiftEnd(e.target.value)}
                      className="h-9 bg-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 h-9 border-dashed border-[#A4163A]/30 text-[#A4163A] hover:bg-[#A4163A]/5 hover:border-[#A4163A]"
                    onClick={addShiftOption}
                    disabled={editingOptionIndex === null && (editingSchedule?.shift_options?.length ?? 0) >= 2}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingOptionIndex !== null ? 'Update Option' : 'Add to Options'}
                  </Button>
                  {editingOptionIndex !== null && (
                    <Button
                      variant="outline"
                      title="Cancel Edit"
                      className="h-9 w-9 p-0 border-slate-200 text-slate-500 hover:bg-slate-100"
                      onClick={() => {
                        setEditingOptionIndex(null)
                        setNewShiftStart("08:00")
                        setNewShiftEnd("12:00")
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {editingOptionIndex === null && (editingSchedule?.shift_options?.length ?? 0) >= 2 && (
                  <p className="text-[10px] text-amber-600 font-semibold text-center italic">Max 2 shift options reached.</p>
                )}
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                {editingSchedule?.shift_options.map((option, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-sm font-medium text-slate-600">{option}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Edit Option"
                        className="h-6 w-6 text-slate-400 hover:text-[#A4163A]"
                        onClick={() => startEditingOption(idx)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove Option"
                        className="h-6 w-6 text-slate-400 hover:text-rose-500"
                        onClick={() => removeShiftOption(idx)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {editingSchedule?.shift_options.length === 0 && (
                  <p className="text-center py-4 text-xs text-slate-400 italic border-2 border-dashed border-slate-100 rounded-xl">
                    No individual shift options added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShiftModalOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="bg-[#A4163A] hover:bg-[#7B0F2B] text-white"
              onClick={handleSaveShiftSchedule}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPosition} onOpenChange={(open) => !open && setEditingPosition(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-[#A4163A]" />
              Edit Position: {editingPosition?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Position Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Manager, Assistant, etc."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</Label>
              <Select value={editDepartment} onValueChange={setEditDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core Position / Staff</SelectItem>
                  {departments.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Reports To (Parent)</Label>
              <Select value={editParent} onValueChange={setEditParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin-head">Admin Head</SelectItem>
                  {positions
                    .filter(p => p.id !== editingPosition?.id && (editDepartment === 'core' || p.departmentId === editDepartment || p.departmentId === 'core'))
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPosition(null)} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="bg-[#A4163A] hover:bg-[#7B0F2B] text-white"
              onClick={handleUpdatePosition}
              disabled={loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Updating...' : 'Update Position'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
