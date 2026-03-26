"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  ArrowRight,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirmation } from "@/components/providers/confirmation-provider";

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
            "text-left bg-white border border-stone-300 text-[#800020] rounded-lg text-[10px] font-semibold uppercase tracking-widest focus-visible:ring-rose-100 shadow-sm px-4 h-10 w-full transition-all flex items-center gap-3",
            disabled && "opacity-50 cursor-not-allowed bg-stone-50",
            className,
          )}
        >
          <Clock className="w-3.5 h-3.5 text-[#A4163A] shrink-0" />
          <span className="truncate font-semibold uppercase tracking-[0.1em]">{value ? displayTime : "--:-- --"}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-4 bg-white border border-stone-100 shadow-2xl rounded-2xl"
        align="start"
      >
        <div className="flex items-start gap-4 h-56">
          <div className="flex flex-col gap-2 h-full">
            <span className="text-[10px] font-black text-stone-400 uppercase text-center tracking-[0.2em]">
              Hour
            </span>
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
                      "px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] transition-all shrink-0",
                      hour === h
                        ? "bg-rose-50 text-[#A4163A] shadow-sm"
                        : "hover:bg-stone-50 text-stone-500",
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 h-full">
            <span className="text-[10px] font-black text-stone-400 uppercase text-center tracking-[0.2em]">
              Min
            </span>
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
                      "px-2 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] transition-all shrink-0",
                      minute === m
                        ? "bg-rose-50 text-[#A4163A] shadow-sm"
                        : "hover:bg-stone-50 text-stone-500",
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
                "w-14 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border-2",
                ampm === "AM"
                  ? "bg-rose-50 border-rose-200 text-[#A4163A]"
                  : "bg-white border-transparent text-stone-400 hover:bg-stone-50",
              )}
            >
              AM
            </button>
            <button
              onClick={() => handleUpdate(hour, minute, "PM")}
              className={cn(
                "w-14 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border-2",
                ampm === "PM"
                  ? "bg-rose-50 border-rose-200 text-[#A4163A]"
                  : "bg-white border-transparent text-stone-400 hover:bg-stone-50",
              )}
            >
              PM
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// --- Types ---
interface DayOffSchedule {
  id: string;
  employee_id: string;
  employee_name: string;
  daily_scheds: Record<string, string>; // { "MON": "10 AM - 7 PM", "TUE": "Day Off", ... }
  day_offs: string[]; // Stays for compatibility and quick toggle
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  department?: string;
  position?: string;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const STORAGE_KEY = "abic_day_off_schedules";

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
);

export default function DayOffsPage() {
  const [schedules, setSchedules] = useState<DayOffSchedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<
    Partial<DayOffSchedule>
  >({
    day_offs: [],
    daily_scheds: DAYS.reduce(
      (acc, day) => ({ ...acc, [day]: "10:00-19:00" }),
      {},
    ),
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { confirm } = useConfirmation();

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load from database if exists
        try {
          const apiResponse = await fetch(`${getApiUrl()}/api/day_offs`, {
            headers: { Accept: "application/json" },
          });
          const dbData = await apiResponse.json();
          if (apiResponse.ok && dbData.success) {
            setSchedules(dbData.data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData.data));
          }
        } catch (e) {
          console.error("Failed to fetch from DB:", e);
        }

        // Load data from multiple sources to determine G-LIMIT membership
        const [empRes, deptRes, officeRes, hierRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/employees`, {
            headers: { Accept: "application/json" },
          }),
          fetch(`${getApiUrl()}/api/departments`, {
            headers: { Accept: "application/json" },
          }),
          fetch(`${getApiUrl()}/api/offices`, {
            headers: { Accept: "application/json" },
          }),
          fetch(`${getApiUrl()}/api/hierarchies`, {
            headers: { Accept: "application/json" },
          }),
        ]);

        const empData = await empRes.json();
        const deptData = await deptRes.json();
        const officeData = await officeRes.json();
        const hierData = await hierRes.json();

        if (empRes.ok && empData.success) {
          const allEmps = empData.data.map((emp: any) => ({
            ...emp,
            name: `${emp.first_name} ${emp.last_name}`,
          }));

          // Determine G-LIMIT Office ID
          const offices = officeData.success ? officeData.data : [];
          const gLimitOffice = offices.find(
            (o: any) =>
              o.name?.toUpperCase().includes("G-LIMIT") ||
              o.name?.toUpperCase() === "G-LIMIT",
          );

          if (gLimitOffice) {
            const officeId = String(gLimitOffice.id);

            // Get Departments in G-LIMIT
            const depts = Array.isArray(deptData?.data)
              ? deptData.data
              : Array.isArray(deptData)
                ? deptData
                : [];
            const gLimitDepts = depts.filter(
              (d: any) => String(d.office_id) === officeId,
            );
            const gLimitDeptIds = new Set(
              gLimitDepts.map((d: any) => String(d.id)),
            );
            const gLimitDeptNames = new Set(
              gLimitDepts.map((d: any) => d.name?.toUpperCase().trim()),
            );

            // Get Positions in G-LIMIT Departments
            const hierarchies = Array.isArray(hierData?.data)
              ? hierData.data
              : Array.isArray(hierData)
                ? hierData
                : [];
            const gLimitPositions = new Set(
              hierarchies
                .filter((h: any) => gLimitDeptIds.has(String(h.department_id)))
                .map((h: any) => h.name?.toUpperCase().trim()),
            );

            // Final filter
            const gLimitEmps = allEmps.filter((emp: any) => {
              // 1. Explicit office mapping
              if (
                String(emp.office_id) === officeId ||
                emp.office_name?.toUpperCase().includes("G-LIMIT")
              ) {
                return true;
              }

              // 2. Department mapping (ID or Name)
              if (
                emp.department_id &&
                gLimitDeptIds.has(String(emp.department_id))
              ) {
                return true;
              }
              if (
                emp.department &&
                gLimitDeptNames.has(emp.department.toUpperCase().trim())
              ) {
                return true;
              }

              // 3. Position mapping
              if (
                emp.position &&
                gLimitPositions.has(emp.position.toUpperCase().trim())
              ) {
                return true;
              }

              return false;
            });

            setEmployees(gLimitEmps.length > 0 ? gLimitEmps : allEmps);
          } else {
            setEmployees(allEmps);
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load employees");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save to localStorage
  const saveSchedules = useCallback((newSchedules: DayOffSchedule[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedules));
    setSchedules(newSchedules);
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentSchedule({
      id: Math.random().toString(36).substr(2, 9),
      day_offs: [],
      daily_scheds: DAYS.reduce(
        (acc, day) => ({ ...acc, [day]: "10:00-19:00" }),
        {},
      ),
    });
    setIsFormOpen(true);
  };

  const handleOpenEditDialog = (schedule: DayOffSchedule) => {
    setCurrentSchedule({ ...schedule });
    setIsFormOpen(true);
  };

  const handleDeleteSchedule = (id: string) => {
    confirm({
      title: "Delete Schedule?",
      description:
        "Are you sure you want to delete this day-off schedule? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        try {
          // Attempt to delete from database
          await fetch(`${getApiUrl()}/api/day_offs/${id}`, {
            method: "DELETE",
          });
        } catch (e) {
          console.error("Database delete failed, removing locally", e);
        }
        const newSchedules = schedules.filter((s) => s.id !== id);
        saveSchedules(newSchedules);
        toast.success("Schedule removed");
      },
    });
  };

  const handleSaveSchedule = async () => {
    if (!currentSchedule.employee_id) {
      toast.error("Please select an employee");
      return;
    }

    const scheduleData: DayOffSchedule = {
      id: currentSchedule.id!,
      employee_id: currentSchedule.employee_id!,
      employee_name: currentSchedule.employee_name!,
      daily_scheds:
        currentSchedule.daily_scheds ||
        DAYS.reduce((acc, d) => ({ ...acc, [d]: "" }), {}),
      day_offs: currentSchedule.day_offs || [],
    };

    const alreadyHas = schedules.some(
      (s) =>
        String(s.employee_id) === String(scheduleData.employee_id) &&
        s.id !== scheduleData.id,
    );
    if (alreadyHas) {
      toast.error("This employee already has an assigned schedule.");
      return;
    }

    setIsLoading(true);

    try {
      // Save to database named 'day_offs'
      const response = await fetch(`${getApiUrl()}/api/day_offs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(scheduleData),
      });

      const existingIndex = schedules.findIndex(
        (s) => s.id === scheduleData.id,
      );
      let newSchedules = [...schedules];

      if (existingIndex >= 0) {
        newSchedules[existingIndex] = scheduleData;
      } else {
        newSchedules.push(scheduleData);
      }

      saveSchedules(newSchedules);
      setIsFormOpen(false);
      toast.success(
        response.ok ? "Saved to database" : "Saved locally (pending sync)",
      );
    } catch (error) {
      console.error("Save to DB failed:", error);
      const existingIndex = schedules.findIndex(
        (s) => s.id === scheduleData.id,
      );
      let newSchedules = [...schedules];
      if (existingIndex >= 0) {
        newSchedules[existingIndex] = scheduleData;
      } else {
        if (schedules.some((s) => s.employee_id === scheduleData.employee_id)) {
          toast.error("This employee already has an assigned schedule.");
          setIsLoading(false);
          return;
        }
        newSchedules.push(scheduleData);
      }
      saveSchedules(newSchedules);
      setIsFormOpen(false);
      toast.warning("Saved locally. Connection to 'day_offs' database failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDayOff = (day: string) => {
    const currentDays = currentSchedule.day_offs || [];
    if (currentDays.includes(day)) {
      setCurrentSchedule({
        ...currentSchedule,
        day_offs: currentDays.filter((d) => d !== day),
      });
    } else {
      setCurrentSchedule({
        ...currentSchedule,
        day_offs: [...currentDays, day],
      });
    }
  };

  // Navigation Guard: Prevent accidental data loss
  useEffect(() => {
    // Only warn if an employee is selected and the form is active
    const hasActiveDraft =
      isFormOpen && currentSchedule.employee_id && !isLoading;

    // 1. Internal Navigation (Sidebar buttons, Footer links)
    const handleInternalNavigation = (e: MouseEvent) => {
      if (!hasActiveDraft) return;

      const target = e.target as HTMLElement;
      const anchorNode = target.closest("a");

      if (anchorNode) {
        // Exit if it's not a real page change
        const href = anchorNode.getAttribute("href");
        if (!href || href === "#" || href.startsWith("javascript:")) return;
        if (anchorNode.target === "_blank") return;

        e.preventDefault();
        e.stopPropagation();

        confirm({
          title: "Abandon Assignment?",
          description: (
            <>
              You have an unsaved schedule for{" "}
              <span className="text-[#800020] font-black underline decoration-red-200 decoration-2">
                {currentSchedule.employee_name}
              </span>
              . Leaving this page now will discard your current progress.
            </>
          ),
          confirmText: "Discard & Leave",
          cancelText: "Stay on Page",
          variant: "warning",
          onConfirm: () => {
            window.location.href = href;
          },
        });
      }
    };

    // 2. External Navigation (Browser Back, Refresh, Close Tab)
    const handleExternalNavigation = (e: BeforeUnloadEvent) => {
      if (hasActiveDraft) {
        e.preventDefault();
        e.returnValue = "Changes you made may not be saved.";
      }
    };

    document.addEventListener("click", handleInternalNavigation, true);
    window.addEventListener("beforeunload", handleExternalNavigation);

    return () => {
      document.removeEventListener("click", handleInternalNavigation, true);
      window.removeEventListener("beforeunload", handleExternalNavigation);
    };
  }, [isFormOpen, currentSchedule, isLoading, confirm]);

  const filteredSchedules = schedules.filter((s) =>
    s.employee_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading && schedules.length === 0) {
    return <DayOffsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 pb-12">
      {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-8 sticky top-0 z-50">
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Day-Offs Monitoring
              </h1>
              <p className="text-white/80 text-[10px] font-semibold uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                G-LIMIT STAFF SCHEDULES
              </p>
            </div>

            <Button
              onClick={() =>
                isFormOpen ? setIsFormOpen(false) : handleOpenAddDialog()
              }
              variant="outline"
              size="sm"
              className={cn(
                "px-6 font-semibold uppercase tracking-widest flex items-center gap-2 bg-white text-[#7B0F2B] hover:bg-rose-50 border-transparent",
                isFormOpen && "bg-white text-[#7B0F2B] border-white/20 shadow-inner translate-y-[1px]",
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
              {/* Global Search Input */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-[400px]">
                <span className="text-[11px] font-semibold text-white/70 uppercase tracking-[0.2em] hidden 2xl:block">
                  Search
                </span>
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="SEARCH EMPLOYEE..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 w-full bg-white border-2 border-[#FFE5EC] text-[#800020] placeholder:text-slate-400 font-semibold uppercase tracking-[0.1em] rounded-lg shadow-sm focus-visible:ring-rose-200 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[10px] font-semibold text-white/70 tracking-[0.2em] uppercase whitespace-nowrap">
              {filteredSchedules.length} Records found
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 w-full">
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            isFormOpen
              ? "max-h-[1200px] opacity-100 mb-8"
              : "max-h-0 opacity-0 pointer-events-none mb-0",
          )}
        >
          <Card className="border-2 border-rose-100 shadow-xl rounded-2xl overflow-hidden bg-white">
            <div className="bg-[#800020] px-8 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                  {currentSchedule.employee_name ? (
                    <Pencil className="w-5 h-5 text-white" />
                  ) : (
                    <Plus className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold tracking-tight uppercase leading-none">
                    {currentSchedule.employee_name
                      ? "Modify Assignment"
                      : "New Assignment"}
                  </h2>
                  <p className="text-rose-100/40 text-[8px] font-bold uppercase mt-1 tracking-[0.2em] flex items-center gap-1.5">
                    <Clock className="w-2.5 h-2.5" />
                    Work Schedule Configuration
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
                  Active Session
                </span>
              </div>
            </div>

            <div className="p-8 space-y-10 bg-gradient-to-b from-stone-50/50 to-white">
              {/* --- TOP SECTION: EMPLOYEE & DEFAULTS --- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                <div className="lg:col-span-5 space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600 ml-1">
                    Assign to Staff Member
                  </Label>
                  <Popover
                    open={employeeSearchOpen}
                    onOpenChange={setEmployeeSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between h-11 px-5 rounded-lg border-stone-300 bg-white hover:border-[#7B0F2B] transition-all font-semibold text-stone-800 shadow-sm ring-offset-white focus:ring-2 focus:ring-[#7B0F2B]/20 uppercase text-[11px] tracking-widest"
                      >
                        <div className="flex items-center gap-3">
                          <Search className="h-4 w-4 text-[#7B0F2B]" />
                          {currentSchedule.employee_name ||
                            "SEARCH AND SELECT STAFF..."}
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-stone-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[450px] p-0 border-stone-100 shadow-2xl rounded-2xl overflow-hidden"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Type a name to search..."
                          className="h-14 font-medium"
                        />
                        <CommandList className="max-h-[350px] scrollbar-thin scrollbar-thumb-stone-100">
                          <CommandEmpty className="py-6 text-center text-stone-400 font-medium">
                            No results found.
                          </CommandEmpty>
                          <CommandGroup heading="G-LIMIT STAFF DIRECTORY">
                            {employees.map((emp) => (
                              <CommandItem
                                key={emp.id}
                                onSelect={() => {
                                  setCurrentSchedule({
                                    ...currentSchedule,
                                    employee_id: emp.id,
                                    employee_name: `${emp.first_name} ${emp.last_name}`,
                                  });
                                  setEmployeeSearchOpen(false);
                                }}
                                className="py-4 px-5 cursor-pointer hover:bg-rose-50/80 hover:text-[#A4163A] font-bold m-1 rounded-xl transition-all border border-transparent hover:border-rose-100"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <span className="text-[15px]">
                                      {emp.first_name} {emp.last_name}
                                    </span>
                                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">
                                      {emp.position || "Staff"}
                                    </span>
                                  </div>
                                  <div className="px-2 py-1 bg-stone-100 rounded-md text-[9px] font-black text-stone-500 uppercase">
                                    Select
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-600">
                      Dynamic Shift Presets
                    </Label>
                  </div>
                  <div className="bg-stone-100 border border-stone-300 rounded-xl p-2.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-[10px] font-semibold text-white uppercase tracking-widest bg-[#7B0F2B] px-3 py-1.5 rounded-lg shadow-sm">
                        Batch Apply
                      </span>
                      <span className="text-[10px] font-black text-stone-700 uppercase tracking-[0.1em]">
                        Apply standard shift to all working days:
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          const nextDaily = DAYS.reduce(
                            (acc, day) => ({ ...acc, [day]: "10:00-19:00" }),
                            {},
                          );
                          setCurrentSchedule({
                            ...currentSchedule,
                            daily_scheds: nextDaily,
                          });
                          setActivePreset("10-7");
                          toast.success("Shift set to 10AM-7PM");
                        }}
                        variant={activePreset === "10-7" ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "w-36 font-semibold uppercase tracking-widest text-center",
                        )}
                      >
                        10AM - 7PM
                      </Button>
                      <Button
                        onClick={() => {
                          const nextDaily = DAYS.reduce(
                            (acc, day) => ({ ...acc, [day]: "09:00-18:00" }),
                            {},
                          );
                          setCurrentSchedule({
                            ...currentSchedule,
                            daily_scheds: nextDaily,
                          });
                          setActivePreset("9-6");
                          toast.success("Shift set to 9AM-6PM");
                        }}
                        variant={activePreset === "9-6" ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "w-36 font-semibold uppercase tracking-widest text-center",
                        )}
                      >
                        9AM - 6PM
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- MIDDLE SECTION: DAY-OFF QUICK SELECT --- */}
              <div className="bg-white p-5 rounded-2xl border border-stone-300 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-[#A4163A]" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-800 underline decoration-rose-200 decoration-2 underline-offset-4">
                    Weekly Day-Off Configuration
                  </h3>
                  <div className="h-px flex-1 bg-stone-200" />
                </div>

                <div className="grid grid-cols-7 gap-3">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOff(day)}
                      className={cn(
                        "h-12 flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-300",
                        currentSchedule.day_offs?.includes(day)
                          ? "bg-[#4A081A] border-[#4A081A] text-white shadow-xl scale-[1.02]"
                          : "bg-stone-50 border-stone-200 text-stone-600 font-black hover:border-[#A4163A] hover:text-[#A4163A]",
                      )}
                    >
                      <span className="text-[11px] font-black tracking-widest">
                        {day}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* --- BOTTOM SECTION: COMPACT GRID CUSTOMIZATION --- */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-stone-700 ml-1">
                      Iterative Schedule Adjustments
                    </Label>
                    <div className="h-px w-10 bg-rose-200" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DAYS.map((day) => {
                    const isDayOff = currentSchedule.day_offs?.includes(day);
                    const [start, end] = (
                      currentSchedule.daily_scheds?.[day] || "10:00-19:00"
                    ).split("-");

                    return (
                      <div
                        key={day}
                        className={cn(
                          "relative p-5 rounded-2xl border-2 transition-all duration-300 shadow-sm",
                          isDayOff
                            ? "bg-stone-100/50 border-stone-200 opacity-80"
                            : "bg-white border-stone-200 hover:border-[#A4163A] hover:shadow-md",
                        )}
                      >
                        <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-3">
                          <span
                            className={cn(
                              "text-[13px] font-black tracking-[0.2em] uppercase",
                              isDayOff ? "text-stone-400" : "text-[#800020]",
                            )}
                          >
                            {day}
                          </span>

                          <button
                            onClick={() => toggleDayOff(day)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg font-black uppercase tracking-[0.2em] transition-all text-[9px] shadow-sm",
                              isDayOff
                                ? "bg-[#4A081A] text-white"
                                : "bg-white border border-stone-300 text-stone-800 hover:bg-[#A4163A] hover:text-white hover:border-[#A4163A]",
                            )}
                          >
                            {isDayOff ? "REST DAY" : "SET OFF"}
                          </button>
                        </div>

                        {isDayOff ? (
                          <div className="h-[64px] flex flex-col items-center justify-center gap-1">
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] opacity-60">
                              Non-Operational
                            </span>
                            <div className="w-6 h-0.5 bg-rose-200 rounded-full" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <CustomTimePicker
                                  value={start}
                                  onChange={(s) => {
                                    const nextDaily = {
                                      ...currentSchedule.daily_scheds,
                                      [day]: `${s}-${end}`,
                                    };
                                    setCurrentSchedule({
                                      ...currentSchedule,
                                      daily_scheds: nextDaily,
                                    });
                                    setActivePreset(null);
                                  }}
                                />
                              </div>
                              <ArrowRight className="w-4 h-4 text-[#A4163A] shrink-0" />
                              <div className="flex-1">
                                <CustomTimePicker
                                  value={end}
                                  onChange={(e) => {
                                    const nextDaily = {
                                      ...currentSchedule.daily_scheds,
                                      [day]: `${start}-${e}`,
                                    };
                                    setCurrentSchedule({
                                      ...currentSchedule,
                                      daily_scheds: nextDaily,
                                    });
                                    setActivePreset(null);
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Summary Card */}
                  <div className="p-5 rounded-2xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-center space-y-3 bg-stone-50">
                    <Check className="w-6 h-6 text-[#A4163A]" />
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-stone-800 uppercase tracking-[0.2em] block">
                        Review & Confirm
                      </span>
                      <p className="text-[9px] text-stone-500 max-w-[140px] leading-tight font-bold">
                        Please verify accuracy of all hours before saving.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-stone-50 border-t border-stone-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-stone-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {currentSchedule.day_offs?.length || 0} Day Offs
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {7 - (currentSchedule.day_offs?.length || 0)} Work Days
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setIsFormOpen(false)}
                  className="w-full md:w-56 font-semibold uppercase tracking-widest text-center border-stone-300 hover:border-[#7B0F2B]/40"
                >
                  Discard Changes
                </Button>
                <Button
                  variant="default"
                  size="default"
                  onClick={handleSaveSchedule}
                  disabled={isLoading}
                  className="w-full md:w-56 font-semibold uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Confirm Assignment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 w-full mt-4">
        <div className="mt-4">
          {filteredSchedules.length > 0 && (
            <div className="h-px bg-stone-200 w-full mb-8 opacity-50" />
          )}
        </div>
        <Card className="border-0 shadow-xl shadow-stone-200/50 rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm">
          <CardHeader className="p-8 border-b-2 border-stone-100/50 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-rose-50/50 rounded-2xl flex items-center justify-center border border-rose-100/50 shadow-inner">
                  <Users className="w-6 h-6 text-[#A4163A]" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-stone-900 uppercase tracking-[0.2em]">
                    Active Schedules
                  </CardTitle>
                  <CardDescription className="text-stone-400 font-semibold uppercase text-[10px] tracking-[0.2em] mt-1.5">
                    Strategic Workforce Configuration • Weekly Cycle
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-semibold text-[#A4163A] tracking-[0.2em] uppercase">
                  {filteredSchedules.length} Records Accessed
                </div>
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
                  <p className="text-xs text-stone-400 mt-1">
                    Try searching for another name or create a new assignment.
                  </p>
                </div>
                <Button
                  onClick={handleOpenAddDialog}
                  variant="outline"
                  className="rounded-xl border-stone-200 mt-2 font-bold hover:bg-[#A4163A] hover:text-white transition-all"
                >
                  Create your first schedule
                </Button>
              </div>
            ) : (
              <div className="">
                {/* Mobile View: Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-6 p-6">
                  {filteredSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="bg-white border-2 border-stone-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="font-semibold text-stone-800 text-lg leading-tight uppercase tracking-[0.1em]">
                              {schedule.employee_name}
                            </h3>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mt-1.5">
                              Weekly Schedule
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-10 w-10 p-0 hover:bg-stone-50 rounded-xl"
                            >
                              <MoreVertical className="h-5 w-5 text-stone-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 rounded-2xl p-2 shadow-xl border-stone-100"
                          >
                            <DropdownMenuItem
                              onClick={() => handleOpenEditDialog(schedule)}
                              className="flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer focus:bg-rose-50 focus:text-[#A4163A]"
                            >
                              <Pencil className="w-4 h-4" />
                              <span className="font-bold text-sm">Modify</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="font-bold text-sm">Remove</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {DAYS.map((day) => {
                          const dailySched = schedule.daily_scheds?.[day];
                          const isDayOff = schedule.day_offs?.includes(day);
                          const formatTime = (t: string) => {
                            if (!t) return "";
                            return new Date(
                              `2000-01-01T${t}`,
                            ).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            });
                          };
                          const displaySched = dailySched?.includes("-")
                            ? dailySched.split("-").map(formatTime).join(" - ")
                            : dailySched;

                          return (
                            <div
                              key={day}
                              className={cn(
                                "flex flex-col items-center justify-center py-3 px-1 rounded-2xl border transition-all duration-300",
                                isDayOff
                                  ? "bg-rose-50/50 border-rose-100 overflow-hidden"
                                  : "bg-stone-50/50 border-stone-100",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-[10px] font-black tracking-[0.2em] uppercase mb-1",
                                  isDayOff ? "text-[#A4163A]" : "text-stone-400",
                                )}
                              >
                                {day}
                              </span>
                              {isDayOff ? (
                                <span className="text-[8px] font-black bg-[#A4163A] text-white px-2 py-0.5 rounded-md">
                                  OFF
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-stone-700 whitespace-nowrap text-center uppercase tracking-[0.1em]">
                                  {displaySched || "—"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table className="w-full border-collapse">
                    <TableHeader>
                      <TableRow className="bg-stone-50/80 border-b-2 border-stone-100">
                        <TableHead className="w-[300px] text-left text-[11px] font-semibold text-stone-500 uppercase tracking-[0.2em] px-8 py-6">
                          Employee Name
                        </TableHead>
                        {DAYS.map((day) => (
                          <TableHead
                            key={day}
                            className="text-left text-[11px] font-semibold text-stone-500 uppercase tracking-[0.2em] px-4 py-6"
                          >
                            {day}
                          </TableHead>
                        ))}
                        <TableHead className="w-[100px] text-center text-[11px] font-black text-stone-500 uppercase tracking-[0.2em] px-8 py-6">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredSchedules.map((schedule) => (
                        <TableRow
                          key={schedule.id}
                          className="group hover:bg-rose-50/30 transition-all duration-300 border-b border-stone-100 last:border-0"
                        >
                          <TableCell className="px-8 py-8 text-left">
                            <div className="flex items-center justify-start">
                              <span className="font-semibold text-stone-800 text-[14px] uppercase tracking-[0.1em] group-hover:text-[#A4163A] transition-colors duration-300">
                                {schedule.employee_name}
                              </span>
                            </div>
                          </TableCell>

                          {DAYS.map((day) => {
                            const dailySched = schedule.daily_scheds?.[day];
                            const isDayOff = schedule.day_offs?.includes(day);

                            const formatTime = (t: string) => {
                              if (!t) return "";
                              return new Date(
                                `2000-01-01T${t}`,
                              ).toLocaleTimeString([], {
                                hour: "numeric",
                                minute: "2-digit",
                              });
                            };

                            const displaySched = dailySched?.includes("-")
                              ? dailySched
                                  .split("-")
                                  .map(formatTime)
                                  .join(" - ")
                              : dailySched;

                            return (
                              <TableCell
                                key={day}
                                className="text-left py-8 px-4"
                              >
                                {isDayOff ? (
                                  <div className="flex flex-col items-start gap-1">
                                    <span className="inline-flex items-center justify-center px-3 py-1 bg-rose-100 text-[#A4163A] text-[9px] font-black tracking-widest rounded-full border border-rose-200 uppercase">
                                      Day Off
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[12px] font-semibold text-stone-600 uppercase tracking-[0.1em] whitespace-nowrap text-left">
                                    {displaySched || "—"}
                                  </span>
                                )}
                              </TableCell>
                            );
                          })}

                          <TableCell className="text-center px-8 py-8">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-10 w-10 p-0 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-stone-200"
                                >
                                  <MoreVertical className="h-5 w-5 text-stone-400 group-hover:text-stone-600" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-48 rounded-2xl border-stone-100 shadow-2xl p-2"
                              >
                                <div className="px-3 py-2 text-[10px] font-black text-stone-400 uppercase tracking-widest border-b border-stone-50 mb-1">
                                  Options
                                </div>
                                <DropdownMenuItem
                                  onClick={() => handleOpenEditDialog(schedule)}
                                  className="flex items-center gap-3 rounded-xl py-3 px-4 cursor-pointer focus:bg-rose-50 focus:text-[#A4163A] font-bold"
                                >
                                  <Pencil className="w-4 h-4" />
                                  <span>Modify Schedule</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteSchedule(schedule.id)
                                  }
                                  className="flex items-center gap-3 rounded-xl py-3 px-4 cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 font-bold"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Remove Entry</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
