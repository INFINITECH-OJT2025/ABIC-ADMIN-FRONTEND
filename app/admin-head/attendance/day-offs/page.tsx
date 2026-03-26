"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  User,
  Filter,
  Clock,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getApiUrl } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { useConfirmation } from "@/components/providers/confirmation-provider"

// ---------- CUSTOM TIME PICKER ----------
const HOURS = Array.from({ length: 12 }, (_, i) =>
  (i + 1).toString().padStart(2, "0"),
);
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const INFINITE_HOURS = [...HOURS, ...HOURS, ...HOURS];
const INFINITE_MINUTES = [...MINUTES, ...MINUTES, ...MINUTES];

const CustomTimePicker = ({
  value,
  onChange,
  className,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  disabled?: boolean;
}) => {
  const displayTime = value
    ? new Date(`2000-01-01T${value}`).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:-- --";

  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [ampm, setAmpm] = useState("AM");
  const [isOpen, setIsOpen] = useState(false);

  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      let h = parseInt(value.split(":")[0]);
      let m = value.split(":")[1] || "00";
      let ap = h >= 12 ? "PM" : "AM";
      if (h === 0) h = 12;
      else if (h > 12) h -= 12;

      setHour(h.toString().padStart(2, "0"));
      setMinute(m);
      setAmpm(ap);
    } else {
      setHour("12");
      setMinute("00");
      setAmpm("AM");
    }
  }, [value]);

  const scrollToValue = (
    container: HTMLDivElement | null,
    val: string,
    items: string[],
    offset: number,
  ) => {
    if (!container) return;
    const index = items.indexOf(val) + offset;
    const target = container.children[index] as HTMLElement;
    if (target) {
      container.scrollTop =
        target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2;
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        scrollToValue(hourScrollRef.current, hour, HOURS, 12);
        scrollToValue(minuteScrollRef.current, minute, MINUTES, 60);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hour, minute]);

  const handleInfiniteScroll = (
    e: React.UIEvent<HTMLDivElement>,
    totalItems: number,
  ) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const singleSetHeight = scrollHeight / 3;

    if (scrollTop < 10) {
      container.scrollTop = scrollTop + singleSetHeight;
    } else if (scrollTop + clientHeight > scrollHeight - 10) {
      container.scrollTop = scrollTop - singleSetHeight;
    }
  };

  const handleUpdate = (h: string, m: string, ap: string) => {
    setHour(h);
    setMinute(m);
    setAmpm(ap);

    let hours = parseInt(h);
    if (ap === "PM" && hours !== 12) hours += 12;
    if (ap === "AM" && hours === 12) hours = 0;

    onChange(`${hours.toString().padStart(2, "0")}:${m}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "text-left bg-white border border-stone-200 text-stone-800 rounded-xl text-xs font-bold focus:border-[#A4163A] focus:ring-1 focus:ring-rose-100 shadow-sm transition-all flex items-center gap-2 px-3 h-10 w-full",
            disabled && "opacity-50 cursor-not-allowed bg-stone-50",
            className,
          )}
        >
          <Clock className="w-3.5 h-3.5 text-[#A4163A] shrink-0" />
          <span className="truncate">{value ? displayTime : "--:-- --"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-4 bg-white border border-stone-100 shadow-2xl rounded-2xl"
        align="start"
      >
        <div className="flex items-start gap-4 h-56">
          <div className="flex flex-col gap-2 h-full">
            <span className="text-[10px] font-black text-stone-400 uppercase text-center tracking-widest">Hour</span>
            <div className="relative grow overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
              <div
                ref={hourScrollRef}
                onScroll={(e) => handleInfiniteScroll(e, 36)}
                className="h-full overflow-y-auto w-16 no-scrollbar flex flex-col gap-1 px-1 py-12 scroll-smooth"
              >
                {INFINITE_HOURS.map((h, idx) => (
                  <button
                    key={`${h}-${idx}`}
                    onClick={() => handleUpdate(h, minute, ampm)}
                    className={cn(
                      "px-2 py-1.5 rounded-md text-xs font-bold transition-all shrink-0",
                      hour === h ? "bg-rose-50 text-[#A4163A] shadow-sm" : "hover:bg-stone-50 text-stone-500",
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 h-full">
            <span className="text-[10px] font-black text-stone-400 uppercase text-center tracking-widest">Min</span>
            <div className="relative grow overflow-hidden rounded-lg">
              <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
              <div
                ref={minuteScrollRef}
                onScroll={(e) => handleInfiniteScroll(e, 180)}
                className="h-full overflow-y-auto w-16 no-scrollbar flex flex-col gap-1 px-1 py-12 scroll-smooth"
              >
                {INFINITE_MINUTES.map((m, idx) => (
                  <button
                    key={`${m}-${idx}`}
                    onClick={() => handleUpdate(hour, m, ampm)}
                    className={cn(
                      "px-2 py-1.5 rounded-md text-xs font-bold transition-all shrink-0",
                      minute === m ? "bg-rose-50 text-[#A4163A] shadow-sm" : "hover:bg-stone-50 text-stone-500",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 justify-center h-full pt-6">
            <button
              onClick={() => handleUpdate(hour, minute, "AM")}
              className={cn(
                "w-12 py-3 rounded-xl text-[10px] font-black transition-all border-2",
                ampm === "AM" ? "bg-rose-50 border-rose-200 text-[#A4163A]" : "bg-white border-transparent text-stone-400 hover:bg-stone-50",
              )}
            >AM</button>
            <button
              onClick={() => handleUpdate(hour, minute, "PM")}
              className={cn(
                "w-12 py-3 rounded-xl text-[10px] font-black transition-all border-2",
                ampm === "PM" ? "bg-rose-50 border-rose-200 text-[#A4163A]" : "bg-white border-transparent text-stone-400 hover:bg-stone-50",
              )}
            >PM</button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// --- Types ---
interface DayOffSchedule {
  id: string
  employee_id: string
  employee_name: string
  daily_scheds: Record<string, string> // { "MON": "10 AM - 7 PM", "TUE": "Day Off", ... }
  day_offs: string[] // Stays for compatibility and quick toggle
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  name?: string
  department?: string
  position?: string
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

const STORAGE_KEY = "abic_day_off_schedules"

const DayOffsSkeleton = () => (
  <div className="min-h-screen bg-stone-50/50">
    <div className="bg-stone-200/50 h-[88px] w-full animate-pulse mb-8" />
    <div className="px-4 md:px-8 w-full space-y-8">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="p-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 p-6 border-b border-stone-50">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default function DayOffsPage() {
  const [schedules, setSchedules] = useState<DayOffSchedule[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<Partial<DayOffSchedule>>({
    day_offs: [],
    daily_scheds: DAYS.reduce((acc, day) => ({ ...acc, [day]: "10:00-19:00" }), {}),
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false)

  const { confirm } = useConfirmation()

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load from database if exists
        try {
          const apiResponse = await fetch(`${getApiUrl()}/api/day_offs`, { headers: { Accept: "application/json" } })
          const dbData = await apiResponse.json()
          if (apiResponse.ok && dbData.success) {
            setSchedules(dbData.data)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData.data))
          }
        } catch (e) {
          console.error("Failed to fetch from DB:", e)
        }

        // Load data from multiple sources to determine G-LIMIT membership
        const [empRes, deptRes, officeRes, hierRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/employees`, { headers: { Accept: "application/json" } }),
          fetch(`${getApiUrl()}/api/departments`, { headers: { Accept: "application/json" } }),
          fetch(`${getApiUrl()}/api/offices`, { headers: { Accept: "application/json" } }),
          fetch(`${getApiUrl()}/api/hierarchies`, { headers: { Accept: "application/json" } }),
        ])

        const empData = await empRes.json()
        const deptData = await deptRes.json()
        const officeData = await officeRes.json()
        const hierData = await hierRes.json()

        if (empRes.ok && empData.success) {
          const allEmps = empData.data.map((emp: any) => ({
            ...emp,
            name: `${emp.first_name} ${emp.last_name}`,
          }))

          // Determine G-LIMIT Office ID
          const offices = officeData.success ? officeData.data : []
          const gLimitOffice = offices.find(
            (o: any) => o.name?.toUpperCase().includes("G-LIMIT") || o.name?.toUpperCase() === "G-LIMIT",
          )

          if (gLimitOffice) {
            const officeId = String(gLimitOffice.id)

            // Get Departments in G-LIMIT
            const depts = Array.isArray(deptData?.data)
              ? deptData.data
              : Array.isArray(deptData)
                ? deptData
                : []
            const gLimitDepts = depts.filter((d: any) => String(d.office_id) === officeId)
            const gLimitDeptIds = new Set(gLimitDepts.map((d: any) => String(d.id)))
            const gLimitDeptNames = new Set(gLimitDepts.map((d: any) => d.name?.toUpperCase().trim()))

            // Get Positions in G-LIMIT Departments
            const hierarchies = Array.isArray(hierData?.data)
              ? hierData.data
              : Array.isArray(hierData)
                ? hierData
                : []
            const gLimitPositions = new Set(
              hierarchies
                .filter((h: any) => gLimitDeptIds.has(String(h.department_id)))
                .map((h: any) => h.name?.toUpperCase().trim()),
            )

            // Final filter
            const gLimitEmps = allEmps.filter((emp: any) => {
              // 1. Explicit office mapping
              if (
                String(emp.office_id) === officeId ||
                emp.office_name?.toUpperCase().includes("G-LIMIT")
              ) {
                return true
              }

              // 2. Department mapping (ID or Name)
              if (emp.department_id && gLimitDeptIds.has(String(emp.department_id))) {
                return true
              }
              if (emp.department && gLimitDeptNames.has(emp.department.toUpperCase().trim())) {
                return true
              }

              // 3. Position mapping
              if (emp.position && gLimitPositions.has(emp.position.toUpperCase().trim())) {
                return true
              }

              return false
            })

            setEmployees(gLimitEmps.length > 0 ? gLimitEmps : allEmps)
          } else {
            setEmployees(allEmps)
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        toast.error("Failed to load employees")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])



  // Save to localStorage
  const saveSchedules = useCallback((newSchedules: DayOffSchedule[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedules))
    setSchedules(newSchedules)
  }, [])

  const handleOpenAddDialog = () => {
    setCurrentSchedule({
      id: Math.random().toString(36).substr(2, 9),
      day_offs: [],
      daily_scheds: DAYS.reduce((acc, day) => ({ ...acc, [day]: "10:00-19:00" }), {}),
    })
    setIsFormOpen(true)
  }

  const handleOpenEditDialog = (schedule: DayOffSchedule) => {
    setCurrentSchedule({ ...schedule })
    setIsFormOpen(true)
  }

  const handleDeleteSchedule = (id: string) => {
    confirm({
      title: "Delete Schedule?",
      description: "Are you sure you want to delete this day-off schedule? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          // Attempt to delete from database
          await fetch(`${getApiUrl()}/api/day_offs/${id}`, { method: 'DELETE' })
        } catch (e) {
          console.error("Database delete failed, removing locally", e)
        }
        const newSchedules = schedules.filter((s) => s.id !== id)
        saveSchedules(newSchedules)
        toast.success("Schedule removed")
      },
    })
  }

  const handleSaveSchedule = async () => {
    if (!currentSchedule.employee_id) {
      toast.error("Please select an employee")
      return
    }

    const scheduleData: DayOffSchedule = {
      id: currentSchedule.id!,
      employee_id: currentSchedule.employee_id!,
      employee_name: currentSchedule.employee_name!,
      daily_scheds: currentSchedule.daily_scheds || DAYS.reduce((acc, d) => ({ ...acc, [d]: "" }), {}),
      day_offs: currentSchedule.day_offs || [],
    }

    const alreadyHas = schedules.some(s => String(s.employee_id) === String(scheduleData.employee_id) && s.id !== scheduleData.id)
    if (alreadyHas) {
      toast.error("This employee already has an assigned schedule.")
      return
    }

    setIsLoading(true)

    try {
      // Save to database named 'day_offs'
      const response = await fetch(`${getApiUrl()}/api/day_offs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      })

      const existingIndex = schedules.findIndex((s) => s.id === scheduleData.id)
      let newSchedules = [...schedules]

      if (existingIndex >= 0) {
        newSchedules[existingIndex] = scheduleData
      } else {
        newSchedules.push(scheduleData)
      }

      saveSchedules(newSchedules)
      setIsFormOpen(false)
      toast.success(response.ok ? "Saved to database" : "Saved locally (pending sync)")
    } catch (error) {
      console.error("Save to DB failed:", error)
      const existingIndex = schedules.findIndex((s) => s.id === scheduleData.id)
      let newSchedules = [...schedules]
      if (existingIndex >= 0) {
        newSchedules[existingIndex] = scheduleData
      } else {
        if (schedules.some(s => s.employee_id === scheduleData.employee_id)) {
          toast.error("This employee already has an assigned schedule.")
          setIsLoading(false)
          return
        }
        newSchedules.push(scheduleData)
      }
      saveSchedules(newSchedules)
      setIsFormOpen(false)
      toast.warning("Saved locally. Connection to 'day_offs' database failed.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleDayOff = (day: string) => {
    const currentDays = currentSchedule.day_offs || []
    if (currentDays.includes(day)) {
      setCurrentSchedule({
        ...currentSchedule,
        day_offs: currentDays.filter((d) => d !== day),
      })
    } else {
      setCurrentSchedule({
        ...currentSchedule,
        day_offs: [...currentDays, day],
      })
    }
  }

  const filteredSchedules = schedules.filter(s => 
    s.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading && schedules.length === 0) {
    return <DayOffsSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 pb-12">
      {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-8 sticky top-0 z-50">
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Day-Offs Monitoring</h1>
              <p className="text-white/80 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                G-LIMIT STAFF SCHEDULES
              </p>
            </div>

            <Button 
              onClick={() => isFormOpen ? setIsFormOpen(false) : handleOpenAddDialog()}
              className={cn(
                "bg-white border-white/20 text-[#7B0F2B] hover:bg-rose-50 shadow-sm transition-all duration-200 text-[10px] font-black uppercase tracking-wider h-10 px-6 rounded-lg flex items-center gap-2",
                isFormOpen && "bg-rose-100 text-[#4A081A] border-rose-200"
              )}
            >
              {isFormOpen ? (
                <>
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>CLOSE FORM</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>ASSIGN SCHEDULE</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Secondary Toolbar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto no-scrollbar">
          <div className="w-full px-4 md:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest whitespace-nowrap">Filter by</span>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 group-focus-within:text-white transition-colors" />
                  <Input 
                    placeholder="Search name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48 md:w-64 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 transition-all rounded-lg h-9 border text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[9px] font-black text-white/70 tracking-[0.2em] uppercase whitespace-nowrap">
              {filteredSchedules.length} Records found
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 md:px-8 w-full">
        <div className={cn(
          "overflow-hidden transition-all duration-500 ease-in-out",
          isFormOpen ? "max-h-[1200px] opacity-100 mb-8" : "max-h-0 opacity-0 pointer-events-none mb-0"
        )}>
          <Card className="border-2 border-rose-100 shadow-xl rounded-2xl overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-[#800020] to-[#A4163A] px-8 py-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <Pencil className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-2xl font-black tracking-tight uppercase">
                    {currentSchedule.employee_name ? "Modify Schedule" : "New Assignment"}
                  </h2>
                  <p className="text-rose-100/60 text-[10px] font-black uppercase mt-1 tracking-[0.2em]">Configure daily working hours & day-offs</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Employee Selection */}
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">Select Employee</Label>
                    <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-14 px-5 rounded-2xl border-stone-200 bg-stone-50/50 hover:bg-white hover:border-[#A4163A] transition-all font-bold text-stone-700 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-[#A4163A]" />
                            {currentSchedule.employee_name || "Find an employee..."}
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 border-stone-100 shadow-2xl rounded-2xl overflow-hidden">
                        <Command>
                          <CommandInput placeholder="Search employee..." className="h-14 font-medium" />
                          <CommandList className="max-h-[300px]">
                            <CommandEmpty>No employee found.</CommandEmpty>
                            <CommandGroup heading="G-LIMIT STAFF">
                              {employees.map((emp) => (
                                <CommandItem
                                  key={emp.id}
                                  onSelect={() => {
                                    setCurrentSchedule({
                                      ...currentSchedule,
                                      employee_id: emp.id,
                                      employee_name: `${emp.first_name} ${emp.last_name}`,
                                    })
                                    setEmployeeSearchOpen(false)
                                  }}
                                  className="py-3 px-4 cursor-pointer hover:bg-rose-50 hover:text-[#A4163A] font-bold m-1 rounded-xl"
                                >
                                  <div className="flex flex-col">
                                    <span>{emp.first_name} {emp.last_name}</span>
                                    <span className="text-[10px] font-medium text-stone-400 uppercase tracking-tighter">{emp.position || "Staff"}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>



                  {/* Quick Toggle Day Offs */}
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">Quick Day-Off Toggle</Label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDayOff(day)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200",
                            currentSchedule.day_offs?.includes(day)
                              ? "bg-[#4A081A] border-[#4A081A] text-white shadow-lg shadow-red-900/10 scale-105"
                              : "bg-white border-stone-100 text-stone-400 hover:border-rose-200 hover:text-[#A4163A]"
                          )}
                        >
                          <span className="text-[10px] font-black tracking-widest">{day}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">Daily Customization</Label>
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200">
                    {DAYS.map((day) => {
                      const isDayOff = currentSchedule.day_offs?.includes(day);
                      const [start, end] = (currentSchedule.daily_scheds?.[day] || "10:00-19:00").split("-");

                      return (
                        <div key={day} className="flex items-center gap-4 bg-stone-50/50 px-4 py-3 rounded-2xl border border-stone-100 shadow-sm">
                          <div className="min-w-[50px] font-black text-xs text-stone-400">{day}</div>
                          
                          <div className="flex-1 flex items-center gap-3">
                            {isDayOff ? (
                              <div 
                                onClick={() => toggleDayOff(day)}
                                className="flex-1 h-10 flex items-center justify-center bg-[#4A081A] text-white text-[10px] font-black tracking-widest rounded-xl shadow-md cursor-pointer hover:scale-105 transition-all"
                              >
                                DAY OFF
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center gap-2">
                                <CustomTimePicker
                                  value={start}
                                  onChange={(s) => {
                                    const nextDaily = { ...currentSchedule.daily_scheds, [day]: `${s}-${end}` };
                                    setCurrentSchedule({ ...currentSchedule, daily_scheds: nextDaily });
                                  }}
                                />
                                <span className="text-[10px] font-black text-stone-300">TO</span>
                                <CustomTimePicker
                                  value={end}
                                  onChange={(e) => {
                                    const nextDaily = { ...currentSchedule.daily_scheds, [day]: `${start}-${e}` };
                                    setCurrentSchedule({ ...currentSchedule, daily_scheds: nextDaily });
                                  }}
                                />
                                <Button 
                                  variant="ghost" 
                                  onClick={() => toggleDayOff(day)}
                                  className="h-10 w-10 p-0 rounded-xl text-stone-300 hover:text-white hover:bg-[#4A081A] transition-all"
                                >
                                  OFF
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-100 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 h-12 rounded-xl font-bold border-stone-200 hover:bg-stone-50 transition-all"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveSchedule}
                  disabled={isLoading}
                  className="px-8 h-12 rounded-xl font-bold bg-[#A4163A] hover:bg-[#800020] text-white shadow-lg shadow-red-900/10 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Schedule
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 w-full mt-4">
        <div className="mt-4">
          {filteredSchedules.length > 0 && <div className="h-px bg-stone-200 w-full mb-8 opacity-50" />}
        </div>
          <Card className="border-0 shadow-xl shadow-stone-200/50 rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
            <CardHeader className="bg-white border-b border-stone-100 px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 shadow-sm">
                    <Users className="w-5 h-5 text-[#A4163A]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-stone-800 tracking-tight tracking-tight">Active Schedules</CardTitle>
                    <CardDescription className="text-stone-400 font-medium">Monitoring weekly working hours and day-offs</CardDescription>
                  </div>
                </div>
                <div className="px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-black text-[#A4163A] tracking-[0.2em] uppercase">
                  {filteredSchedules.length} Records
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-4">
                  <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-stone-100">
                    <Calendar className="w-10 h-10 opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-stone-500">No schedules found</p>
                    <p className="text-xs text-stone-400 mt-1">Try searching for another name or create a new assignment.</p>
                  </div>
                  <Button onClick={handleOpenAddDialog} variant="outline" className="rounded-xl border-stone-200 mt-2 font-bold hover:bg-[#A4163A] hover:text-white transition-all">
                    Create your first schedule
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-[#A4163A]/5 to-transparent hover:bg-gradient-to-r border-stone-200/60">
                        <TableHead className="w-[200px] text-[11px] font-black text-[#800020] uppercase tracking-[0.25em] px-8 py-6">Employee Name</TableHead>
                        {DAYS.map(day => (
                          <TableHead key={day} className="text-center text-[11px] font-black text-[#800020] uppercase tracking-[0.25em] py-6">{day}</TableHead>
                        ))}
                        <TableHead className="w-[80px] text-right px-8 py-6"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSchedules.map((schedule) => (
                        <TableRow key={schedule.id} className="group hover:bg-[#A4163A]/[0.02] transition-all duration-300 border-stone-100/50">
                          <TableCell className="px-8 py-7">
                            <span className="font-extrabold text-stone-900 text-[15px] tracking-tight group-hover:text-[#A4163A] transition-colors whitespace-nowrap">{schedule.employee_name}</span>
                          </TableCell>

                          {DAYS.map(day => {
                            const dailySched = schedule.daily_scheds?.[day];
                            const isDayOff = schedule.day_offs?.includes(day);
                            
                            const formatTime = (t: string) => {
                              if (!t) return "";
                              return new Date(`2000-01-01T${t}`).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              });
                            };

                            const displaySched = dailySched?.includes("-") 
                              ? dailySched.split("-").map(formatTime).join(" - ")
                              : dailySched;
                            
                            return (
                              <TableCell key={day} className="text-center py-7">
                                {isDayOff ? (
                                  <span className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-br from-[#4A081A] to-[#800020] text-white text-[11px] font-black tracking-widest rounded-xl shadow-md border border-white/10 group-hover:scale-105 transition-transform uppercase">
                                    DAY OFF
                                  </span>
                                ) : (
                                  <span className="text-xs md:text-[13px] font-bold text-stone-600 whitespace-nowrap tracking-tight">
                                    {displaySched || "—"}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right px-8 py-7">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white hover:shadow-md rounded-full transition-all">
                                  <MoreVertical className="h-4 w-4 text-stone-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 rounded-xl border-stone-100 shadow-xl p-1.5">
                                <DropdownMenuItem 
                                  onClick={() => handleOpenEditDialog(schedule)}
                                  className="flex items-center gap-2 rounded-lg py-2 cursor-pointer focus:bg-rose-50 focus:text-[#A4163A]"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span className="font-bold text-sm">Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="flex items-center gap-2 rounded-lg py-2 cursor-pointer focus:bg-red-50 text-red-500 focus:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="font-bold text-sm">Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>


    </div>
  )
}
