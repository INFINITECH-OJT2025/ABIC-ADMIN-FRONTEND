"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Users,
  Check,
  ChevronDown,
  Pencil,
  Trash2,
  Eye,
  Search,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ConfirmationModal } from "@/components/ConfirmationModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Department {
  id: number;
  name: string;
  office_id?: number;
}
interface Office {
  id: number;
  name: string;
}
interface Hierarchy {
  id: number;
  name: string;
  is_custom: boolean;
  department_id: number | null;
  parent_id: number | null;
}
interface Employee {
  id: string;
  name: string;
  department?: string | null;
  department_id?: number;
  position?: string | null;
}

interface LeaveEntry {
  id: number;
  employee_id: string;
  employee_name: string;
  department: string;
  category: "half-day" | "whole-day";
  shift?: string;
  start_date: string;
  leave_end_date: string;
  number_of_days: number;
  approved_by: string;
  remarks: string;
  cite_reason: string;
}

interface OfficeShiftSchedule {
  id?: number;
  office_name: string;
  shift_options: string[];
}

// ─── Leave type remarks ────────────────────────────────────────────────────────
const LEAVE_REMARKS = [
  "Emergency Leave",
  "Sick Leave",
  "Personal Leave",
  "Vacation Leave",
  "Bereavement Leave",
  "Maternity Leave",
];

// ─── Approved-by options ───────────────────────────────────────────────────────
const APPROVAL_OPTIONS = [
  {
    label: "Pending",
    value: "Pending",
    color: "bg-[#FFF3C4] text-[#A67B00] border-2 border-[#FFE894] shadow-sm",
  },
  {
    label: "Declined",
    value: "Declined",
    color: "bg-[#FFEAEB] text-[#800020] border-2 border-[#FFD1D4] shadow-sm",
  },
];

const LEAVE_CATEGORY_OPTIONS = [
  {
    label: "HALF-DAY",
    value: "half-day",
    color: "bg-[#FFF3C4] text-[#A67B00] border-2 border-[#FFE894] shadow-sm",
  },
  {
    label: "WHOLE DAY",
    value: "whole-day",
    color: "bg-[#FFEAEB] text-[#800020] border-2 border-[#FFD1D4] shadow-sm",
  },
];
// HEAD_NAMES removed, now dynamic from employees

// ─── Calendar helpers ──────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
// Sunday-based grid: 0 = Sunday … 6 = Saturday
function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0=Sun … 6=Sat
}

// ─── Status colours ────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700 border border-amber-200 shadow-sm",
  "Approved/Completed":
    "bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm",
  Declined: "bg-rose-100 text-rose-700 border border-rose-200 shadow-sm",
};

// ─── Formatting Helpers ───────────────────────────────────────────────────────
function normalizeDate(dateStr: string) {
  if (!dateStr) return "";
  if (dateStr.includes("T")) {
    const date = new Date(dateStr);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + Math.abs(userTimezoneOffset));
    return localDate.toISOString().split("T")[0];
  }
  return dateStr.slice(0, 10);
}

function formatDisplayDate(dateStr: string) {
  const iso = normalizeDate(dateStr);
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDays(days: any, category: string) {
  if (
    typeof days === "string" &&
    (days.includes("hour") || days.includes("day"))
  ) {
    return days;
  }
  const d = parseFloat(days) || 0;
  if (category === "half-day") {
    return `${Math.round(d * 8)} hours`;
  }
  const roundedDays = Math.round(d);
  return roundedDays === 1 ? "1 day" : `${roundedDays} days`;
}

// ─── Combobox helper ───────────────────────────────────────────────────────────
function ComboSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  variant,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string; color?: string }[];
  placeholder: string;
  disabled?: boolean;
  variant?: "maroon" | "pink";
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-between w-full border rounded-lg px-4 py-3 text-sm bg-white text-left shadow-sm transition-all h-[46px]",
            variant === "pink" ? "border-[#FBDADD]" : "border-[#630C22]",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50",
            !disabled && "hover:border-[#4A081A] focus:outline-none",
          )}
        >
          {selected ? (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-semibold",
                selected.color ?? "",
              )}
            >
              {selected.label}
            </span>
          ) : (
            <span className="text-slate-400 italic">{placeholder}</span>
          )}
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-56">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options
                .filter((opt) => opt.value !== value)
                .map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4 opacity-0")} />
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        opt.color ?? "",
                      )}
                    >
                      {opt.label}
                    </span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Date Range Picker ────────────────────────────────────────────────────────
function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // picking state: null = waiting for start, 'start' = start chosen
  const [picking, setPicking] = useState<"start" | null>(null);

  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const fmtDisplay = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };

  const label =
    startDate && endDate
      ? `${fmtDisplay(startDate)} – ${fmtDisplay(endDate)}`
      : startDate
        ? `${fmtDisplay(startDate)} – …`
        : "Select date range";

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = firstDayOfMonth(viewYear, viewMonth);
  const cells = Array.from({ length: startOffset + totalDays }, (_, i) => {
    const day = i - startOffset + 1;
    return day > 0 ? day : null;
  });
  while (cells.length % 7 !== 0) cells.push(null);

  const handleDayClick = (day: number) => {
    const clickedStr = toStr(new Date(viewYear, viewMonth, day));
    if (!startDate || picking === null) {
      // first click → set start, clear end
      onChange(clickedStr, "");
      setPicking("start");
    } else {
      // second click → set end (ensure start <= end)
      if (clickedStr < startDate) {
        onChange(clickedStr, startDate);
      } else {
        onChange(startDate, clickedStr);
      }
      setPicking(null);
      setOpen(false);
    }
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const s = toStr(new Date(viewYear, viewMonth, day));
    return s > startDate && s < endDate;
  };
  const isStart = (day: number) =>
    toStr(new Date(viewYear, viewMonth, day)) === startDate;
  const isEnd = (day: number) =>
    toStr(new Date(viewYear, viewMonth, day)) === endDate;

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full border border-[#630C22] rounded-lg px-4 py-3 text-sm bg-white hover:border-[#4A081A] focus:outline-none shadow-sm transition-all h-[46px]"
        >
          <span
            className={cn(
              "flex items-center gap-2",
              startDate
                ? "text-slate-800 font-medium"
                : "text-slate-400 italic",
            )}
          >
            <Calendar className="w-3.5 h-3.5 text-[#630C22] shrink-0" />
            {label}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-3 w-auto" align="start">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded hover:bg-rose-50 text-[#4A081A] transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-[#4A081A]">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded hover:bg-rose-50 text-[#4A081A] transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((w) => (
            <div
              key={w}
              className="text-center text-[10px] font-bold text-[#4A081A] py-1"
            >
              {w}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} className="w-8 h-8" />;
            const inRange = isInRange(day);
            const start = isStart(day);
            const end = isEnd(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayClick(day)}
                className={cn(
                  "w-8 h-8 text-sm font-medium rounded-full flex items-center justify-center transition",
                  start || end
                    ? "bg-[#630C22] text-white font-bold"
                    : inRange
                      ? "bg-rose-100 text-[#4A081A] rounded-none"
                      : "hover:bg-rose-50 text-slate-700",
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
        {/* hint */}
        <p className="text-[10px] text-slate-400 italic mt-2 text-center">
          {!startDate || picking === null
            ? "Click a start date"
            : "Now click the end date"}
        </p>
        {/* Clear */}
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              onChange("", "");
              setPicking(null);
            }}
            className="mt-1 w-full text-[10px] text-rose-400 hover:text-rose-600 transition text-center"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({
  year,
  month,
  entries,
  weekOnly = false,
}: {
  year: number;
  month: number;
  entries: LeaveEntry[];
  weekOnly?: boolean;
}) {
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const allCells = Array.from({ length: startOffset + totalDays }, (_, i) => {
    const day = i - startOffset + 1;
    return day > 0 ? day : null;
  });
  while (allCells.length % 7 !== 0) allCells.push(null);

  // For week mode, find the row containing today
  let cells = allCells;
  if (weekOnly) {
    const todayObj = new Date();
    const isSameMonth =
      todayObj.getFullYear() === year && todayObj.getMonth() === month;
    const todayDay = isSameMonth ? todayObj.getDate() : null;
    if (todayDay) {
      const todayFlatIdx = startOffset + todayDay - 1;
      const rowStart = Math.floor(todayFlatIdx / 7) * 7;
      cells = allCells.slice(rowStart, rowStart + 7);
    } else {
      cells = allCells.slice(0, 7);
    }
  }

  const entriesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return entries.filter((e) => {
      const s = normalizeDate(e.start_date);
      const ed = normalizeDate(e.leave_end_date);
      return dateStr >= s && dateStr <= ed;
    });
  };

  // Click-to-view state
  const [selectedEntry, setSelectedEntry] = useState<LeaveEntry | null>(null);
  const [viewAllForDay, setViewAllForDay] = useState<number | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl shadow border border-rose-100 overflow-hidden">
        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-rose-50 justify-end text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-1.5 rounded-sm bg-orange-200 border border-orange-300"></span>{" "}
            Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-1.5 rounded-sm bg-green-200 border border-green-300"></span>{" "}
            Approved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-1.5 rounded-sm bg-red-200 border border-red-300"></span>{" "}
            Declined
          </span>
        </div>
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-rose-50 border-b border-rose-100">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="py-1.5 text-center text-xs font-bold text-[#4A081A] uppercase tracking-wide"
            >
              {w.substring(0, 3)}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-rose-50">
          {cells.map((day, idx) => {
            if (!day)
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[100px] bg-white/50"
                />
              );
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayEntries = entriesForDay(day);
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;

            return (
              <div
                key={day}
                className={cn(
                  "min-h-[100px] p-1 bg-white",
                  isToday && "bg-rose-50/50",
                )}
              >
                <div
                  className={cn(
                    "text-xs font-semibold mb-1 ml-1 mt-0.5",
                    isToday ? "text-[#4A081A] font-bold" : "text-slate-500",
                  )}
                >
                  {day}
                </div>
                <div className="space-y-1">
                  {dayEntries.slice(0, 4).map((e, i) => {
                    const colInRow = idx % 7;
                    const isDeclined = e.approved_by === "Declined";
                    const isPending = e.approved_by === "Pending";
                    const barColor = isDeclined
                      ? "bg-red-200 border border-red-300"
                      : isPending
                        ? "bg-orange-200 border border-orange-300"
                        : "bg-green-200 border border-green-300";

                    // Rounded edges only at true entry start/end or week row boundary
                    const entryStartStr = e.start_date.slice(0, 10);
                    const entryEndStr = e.leave_end_date.slice(0, 10);
                    const isStart = entryStartStr === dateStr;

                    const isEnd = entryEndStr === dateStr;
                    const roundLeft = isStart || colInRow === 0;
                    const roundRight = isEnd || colInRow === 6;

                    return (
                      <div
                        key={i}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedEntry(e);
                        }}
                        title={`${e.employee_name} • ${e.remarks}${e.shift ? ` (${e.shift})` : ""}`}
                        style={{
                          marginLeft: roundLeft ? "2px" : "0px",
                          marginRight: roundRight ? "2px" : "-1px",
                          borderRadius: `${roundLeft ? 4 : 0}px ${roundRight ? 4 : 0}px ${roundRight ? 4 : 0}px ${roundLeft ? 4 : 0}px`,
                        }}
                        className={cn(
                          "h-[22px] px-1.5 text-[10px] leading-[22px] text-slate-800 font-bold truncate overflow-hidden select-none cursor-pointer hover:brightness-105 transition-[filter] shadow-sm",
                          barColor,
                        )}
                      >
                        {`${e.employee_name}${e.category === "half-day" && e.shift ? ` (${e.shift})` : ""}`}
                      </div>
                    );
                  })}
                </div>
                {dayEntries.length > 4 && (
                  <div
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setViewAllForDay(day);
                    }}
                    className="text-[9px] text-[#4A081A] text-center font-bold mt-1 cursor-pointer hover:text-[#630C22]"
                  >
                    + {dayEntries.length - 4} MORE
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── View All Entries for a Day Dialog ── */}
      <Dialog
        open={viewAllForDay !== null}
        onOpenChange={() => setViewAllForDay(null)}
      >
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl">
          <DialogHeader className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] px-6 py-5">
            <DialogTitle className="text-white text-xl font-bold flex items-center justify-between">
              <span>
                Leave Entries for {MONTHS[month]} {viewAllForDay}, {year}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto bg-slate-50">
            {viewAllForDay !== null &&
              entriesForDay(viewAllForDay).map((e, i) => (
                <div
                  key={e.id}
                  onClick={() => {
                    setSelectedEntry(e);
                    setViewAllForDay(null);
                  }}
                  className="group flex flex-col gap-2 p-4 rounded-xl border border-rose-200 bg-white hover:border-[#630C22] hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 text-base group-hover:text-[#A4163A] transition-colors">
                      {e.employee_name}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider",
                        e.approved_by === "Declined"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : e.approved_by === "Pending"
                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                            : "bg-green-100 text-green-700 border border-green-200",
                      )}
                    >
                      {e.approved_by === "Declined"
                        ? "Declined"
                        : e.approved_by === "Pending"
                          ? "Pending"
                          : "Approved/Completed"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-md">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          e.category === "half-day"
                            ? "bg-yellow-400"
                            : "bg-red-500",
                        )}
                      ></span>
                      {e.category === "half-day" ? "Half-Day" : "Whole-Day"}
                    </span>
                    <span className="bg-slate-100 px-2 py-1 rounded-md text-slate-700">
                      {e.remarks}
                    </span>
                    {e.shift && (
                      <span className="italic text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                        {e.shift}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Leave Detail Dialog ── */}
      {(() => {
        const se = selectedEntry;
        if (!se) return null;
        return (
          <Dialog open onOpenChange={() => setSelectedEntry(null)}>
            <DialogContent className="max-w-3xl w-[95vw] sm:w-full p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl [&>button]:text-white [&>button]:opacity-80 hover:[&>button]:opacity-100 [&>button>svg]:!w-6 [&>button>svg]:!h-6 [&>button]:top-6 [&>button]:right-6">
              <DialogHeader className="bg-gradient-to-r from-[#800020] to-[#4A081A] px-10 py-8 flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-white/80 text-sm font-bold uppercase tracking-widest mb-2">
                    Leave Details For
                  </h2>
                  <DialogTitle className="text-white text-3xl font-black tracking-wide">
                    {se.employee_name}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="px-10 py-8 bg-slate-50 space-y-8">
                {/* Details Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-sm">
                      Current Status
                    </span>
                    <span
                      className={cn(
                        "text-sm font-black px-4 py-2 rounded-full tracking-wide uppercase shadow-sm",
                        se.approved_by === "Declined"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : se.approved_by === "Pending"
                            ? "bg-orange-100 text-orange-700 border border-orange-200"
                            : "bg-green-100 text-green-700 border border-green-200",
                      )}
                    >
                      {se.approved_by === "Declined"
                        ? "Declined"
                        : se.approved_by === "Pending"
                          ? "Pending"
                          : "Approved/Completed"}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Department
                      </span>
                      <span className="font-bold text-slate-800 text-lg">
                        {se.department || "—"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Category
                      </span>
                      <div className="flex items-center">
                        <span
                          className={cn(
                            "font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider border",
                            se.category === "half-day"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                              : "bg-rose-100 text-rose-700 border-rose-200",
                          )}
                        >
                          {se.category === "half-day"
                            ? "Half Day"
                            : "Whole Day"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Start Date
                      </span>
                      <span className="font-bold text-slate-800 text-lg">
                        {formatDisplayDate(se.start_date)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        End Date
                      </span>
                      <span className="font-bold text-slate-800 text-lg">
                        {formatDisplayDate(se.leave_end_date)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Duration
                      </span>
                      <span className="font-black text-[#4A081A] text-lg">
                        {formatDays(se.number_of_days, se.category)}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Leave Type
                      </span>
                      <span className="font-bold text-slate-800 text-lg">
                        {se.remarks}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Approved By
                      </span>
                      <span className="font-bold text-slate-800 text-lg">
                        {se.approved_by}
                      </span>
                    </div>

                    {se.shift && (
                      <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
                        <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                          Shift
                        </span>
                        <span className="font-bold text-slate-800 text-lg">
                          {se.shift}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason Section */}
                {se.cite_reason && (
                  <div className="flex flex-col bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
                    <div className="bg-rose-50 px-6 py-5 border-b border-rose-100">
                      <span className="text-[#800020] font-black text-sm uppercase tracking-wider">
                        Leave Reason
                      </span>
                    </div>
                    <div className="p-6 bg-white overflow-hidden">
                      <div className="max-h-[110px] overflow-y-auto custom-scrollbar pr-2">
                        <p className="text-slate-700 text-base leading-relaxed break-all whitespace-pre-wrap font-medium">
                          {se.cite_reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </>
  );
}

// ─── Skeleton Components ───────────────────────────────────────────────────────
const LeaveSkeleton = () => (
  <div className="min-h-screen bg-slate-50/50">
    {/* Placeholder Header Bar */}
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
    </div>

    <div className="px-8 py-6 space-y-8">
      {/* Calendar Skeleton */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full rounded-xl" />
      </section>

      {/* Table Skeleton */}
      <section className="space-y-4">
        <Skeleton className="h-12 w-full rounded-t-xl" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </section>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LeavePage() {
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [showCalendar, setShowCalendar] = useState(true);
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (addModalOpen && formRef.current) {
      const headerOffset = 150; // Height of the sticky header + some padding
      const elementPosition = formRef.current.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, [addModalOpen]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [entries, setEntries] = useState<LeaveEntry[]>([]);

  // State for hierarchies
  const [hierarchies, setHierarchies] = useState<Hierarchy[]>([]);

  const emptyForm = {
    id: null as number | null,
    employee_id: "" as string, // registered DB id (e.g. "26-001")
    employee_name: "",
    department: "",
    category: "" as "" | "half-day" | "whole-day",
    shift: "",
    start_date: "",
    leave_end_date: "",
    number_of_days: 0,
    approved_by: "",
    remarks: "",
    cite_reason: "",
  };

  // ── Inline form state ──────────────────────────────────────────────────────
  const [inlineForm, setInlineForm] = useState({ ...emptyForm });
  const [empOpen, setEmpOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [remarksOpen, setRemarksOpen] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<LeaveEntry | null>(null);

  const [shiftSchedules, setShiftSchedules] = useState<OfficeShiftSchedule[]>(
    [],
  );
  const [offices, setOffices] = useState<Office[]>([]);

  // ── Data Fetching ──────────────────────────────────────────────────────────
  const fetchEntries = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/leaves`);
      const data = await res.json();
      if (data.success) setEntries(data.data ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (entry: Omit<LeaveEntry, "id">) => {
    try {
      console.log("Sending Save Request:", entry);
      const res = await fetch(`${getApiUrl()}/api/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      console.log("Save Response:", data);
      if (data.success) {
        toast.success("Leave entry saved successfully");
        fetchEntries();
      } else {
        toast.error(data.message || "Failed to save to database");
        // Fallback for local
        setEntries((prev) => [...prev, { ...entry, id: Date.now() }]);
      }
    } catch (e) {
      console.error("Save Error:", e);
      toast.error("Network error. Added locally only.");
      setEntries((prev) => [...prev, { ...entry, id: Date.now() }]);
    }
  };

  const handleUpdate = async (entry: LeaveEntry) => {
    try {
      console.log("Sending Update Request:", entry);
      const res = await fetch(`${getApiUrl()}/api/leaves/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      console.log("Update Response:", data);
      if (data.success) {
        toast.success("Leave entry updated successfully");
        fetchEntries();
      } else {
        toast.error(data.message || "Failed to update database");
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
      }
    } catch (e) {
      console.error("Update Error:", e);
      toast.error("Network error. Updated locally only.");
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchEntries(),
          fetch(`${getApiUrl()}/api/departments`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success) setDepartments(d.data);
            }),
          fetch(`${getApiUrl()}/api/employees?status=employed,rehired_employee`)
            .then((r) => r.json())
            .then((empJson) => {
              if (empJson.success) {
                const fetchedEmployees = empJson.data.map((e: any) => ({
                  id: e.id,
                  name: `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim(),
                  department: e.department ?? undefined,
                  department_id: e.department_id,
                  position: e.position ?? undefined,
                }));
                setEmployees(fetchedEmployees);
              }
            }),
          fetch(`${getApiUrl()}/api/hierarchies`)
            .then((r) => r.json())
            .then((hierJson) => {
              if (typeof hierJson === "object" && hierJson !== null) {
                const fetchedHierarchies = Array.isArray(hierJson.data)
                  ? hierJson.data
                  : Array.isArray(hierJson)
                    ? hierJson
                    : [];
                setHierarchies(fetchedHierarchies);
              }
            }),
          fetch(`${getApiUrl()}/api/offices`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success) setOffices(d.data);
            }),
          fetch(`${getApiUrl()}/api/office-shift-schedules`)
            .then((r) => r.json())
            .then((json) => {
              if (json.success) setShiftSchedules(json.data);
            }),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const resetInlineForm = () => setInlineForm({ ...emptyForm });

  const handleEdit = (entry: LeaveEntry) => {
    setEntryToEdit(entry);
    setShowEditConfirm(true);
  };

  const confirmEdit = () => {
    if (!entryToEdit) return;
    const entry = entryToEdit;
    setInlineForm({
      id: entry.id,
      employee_id: entry.employee_id,
      employee_name: entry.employee_name,
      department: entry.department,
      category: entry.category,
      shift: entry.shift || "",
      start_date: normalizeDate(entry.start_date),
      leave_end_date: normalizeDate(entry.leave_end_date),
      number_of_days: entry.number_of_days,
      approved_by: entry.approved_by,
      remarks: entry.remarks,
      cite_reason: entry.cite_reason,
    });
    setAddModalOpen(true);
    setShowEditConfirm(false);
    setEntryToEdit(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: number) => {
    setEntryToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete === null) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/leaves/${entryToDelete}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Leave entry deleted successfully");
        fetchEntries();
      } else {
        // Fallback for local
        setEntries((prev) => prev.filter((e) => e.id !== entryToDelete));
        toast.success("Leave entry deleted (local)");
      }
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== entryToDelete));
      toast.success("Leave entry deleted (local)");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setEntryToDelete(null);
    }
  };

  const handleInlineSelectEmployee = (emp: Employee) => {
    // Priority:
    // 1. Explicit department name from emp
    // 2. Department name looked up via ID
    // 3. Fallback to position name (often contains department info)
    const dept =
      (emp.department && emp.department.trim()) ||
      departments.find((d) => d.id === emp.department_id)?.name ||
      (emp.position && emp.position.trim()) ||
      "";
    setInlineForm((prev) => ({
      ...prev,
      employee_id: emp.id,
      employee_name: emp.name,
      department: dept,
      shift: "",
    }));
    setEmpOpen(false);
  };

  // Lookup shift info from DB data
  const _shiftRow = useMemo(() => {
    let matchingOfficeName = "";

    // Identify employee and their department ID
    const emp = employees.find(
      (e) => String(e.id) === String(inlineForm.employee_id),
    );
    let deptId = emp?.department_id;

    // If no deptId on employee, try to find it via their position in the hierarchy
    if (!deptId && emp?.position && hierarchies.length > 0) {
      // Find hierarchy entry for this position
      const hier = hierarchies.find(
        (h) => h.name.toLowerCase() === emp.position?.toLowerCase(),
      );
      if (hier && hier.department_id) {
        deptId = hier.department_id;
      }
    }

    // Trace deptId to office name
    if (deptId) {
      const d = departments.find((d) => String(d.id) === String(deptId));
      if (d && d.office_id) {
        const off = offices.find((o) => String(o.id) === String(d.office_id));
        if (off) matchingOfficeName = off.name;
      }
    }

    // Fallback: Use the department name string to find the office
    if (!matchingOfficeName && inlineForm.department) {
      const d = departments.find(
        (d) => d.name.toLowerCase() === inlineForm.department.toLowerCase(),
      );
      if (d && d.office_id) {
        const off = offices.find((o) => String(o.id) === String(d.office_id));
        if (off) matchingOfficeName = off.name;
      } else {
        // Direct text match on office names
        const off = offices.find(
          (o) =>
            inlineForm.department
              .toLowerCase()
              .includes(o.name.toLowerCase()) ||
            o.name.toLowerCase().includes(inlineForm.department.toLowerCase()),
        );
        if (off) matchingOfficeName = off.name;
      }
    }

    // Final matching to shift schedule
    if (matchingOfficeName) {
      const sched = shiftSchedules.find(
        (s) => s.office_name.toLowerCase() === matchingOfficeName.toLowerCase(),
      );
      if (sched) return sched;
    }

    // Last resort: attempt text match on office names via shift schedules
    return shiftSchedules.find((s) => {
      const words = s.office_name.toLowerCase().split(/\s+/);
      const deptLow = inlineForm.department.toLowerCase();
      return words.some((w) => w.length > 2 && deptLow.includes(w));
    });
  }, [
    inlineForm.employee_id,
    inlineForm.department,
    employees,
    departments,
    offices,
    shiftSchedules,
    hierarchies,
  ]);

  const inlineAvailableShifts: string[] = _shiftRow?.shift_options ?? [];
  const inlineShiftLabel: string = _shiftRow ? _shiftRow.office_name : "";

  // Auto-calc number of days for inline form
  useEffect(() => {
    if (inlineForm.start_date) {
      if (inlineForm.category === "half-day") {
        // Force end date to be same as start date for half-day
        const days = 0.5;
        setInlineForm((prev) => ({
          ...prev,
          leave_end_date: prev.start_date,
          number_of_days: days,
        }));
      } else if (inlineForm.leave_end_date) {
        const start = new Date(inlineForm.start_date);
        const end = new Date(inlineForm.leave_end_date);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
          const diff =
            Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
          setInlineForm((prev) => ({ ...prev, number_of_days: diff }));
        }
      }
    }

    // Ensure shift is cleared for whole-day leaves
    if (inlineForm.category === "whole-day" && inlineForm.shift) {
      setInlineForm((prev) => ({ ...prev, shift: "" }));
    }
  }, [inlineForm.start_date, inlineForm.leave_end_date, inlineForm.category]);

  const getSuperiorsForEmployee = (empId: string | number | undefined) => {
    if (!empId || employees.length === 0) return [];

    const emp = employees.find((e) => String(e.id) === String(empId));
    if (!emp) return [];

    const empDeptId = emp.department_id;
    const empPosName = String(emp.position || "")
      .toLowerCase()
      .trim();

    // 1. Find hierarchy node for the employee's position
    // Matches position name from hierarchy
    const node = hierarchies.find((h) => {
      const posName = String(h.name || "")
        .toLowerCase()
        .trim();
      return posName === empPosName;
    });

    const ancestorPositionNames = new Set<string>();

    // Broad defaults for company-wide authority figures
    const globalAuthorityNames = [
      "admin head",
      "admin supervisor",
      "executive officer",
      "acting executive officer",
      "hr head",
      "president",
      "v-p",
      "vp",
      "chief",
    ];
    globalAuthorityNames.forEach((name) => ancestorPositionNames.add(name));

    if (node) {
      let currentParentId = node.parent_id;
      let safety = 0;
      while (currentParentId && safety < 20) {
        const parentNode = hierarchies.find(
          (h) => String(h.id) === String(currentParentId),
        );
        if (parentNode) {
          const pName = String(parentNode.name || "")
            .toLowerCase()
            .trim();
          if (pName) ancestorPositionNames.add(pName);
          currentParentId = parentNode.parent_id;
        } else break;
        safety++;
      }
    }

    const highRoleKeywords = [
      "head",
      "manager",
      "director",
      "president",
      "v-p",
      "vp",
      "chief",
      "admin",
      "supervisor",
      "lead",
      "hr",
      "officer",
    ];

    // 3. Collect Match Results
    const superiorEmployees = employees.filter((e) => {
      if (String(e.id) === String(empId)) return false;

      const ePosName = String(e.position || "")
        .toLowerCase()
        .trim();
      const isSameDept =
        (empDeptId && String(e.department_id) === String(empDeptId)) ||
        (emp.department &&
          e.department &&
          emp.department.trim().toLowerCase() ===
            e.department.trim().toLowerCase());

      // Found via Hierarchy Tree or Global Authority
      if (ancestorPositionNames.has(ePosName)) return true;

      // Found via Same Dept + Role Keyword
      if (isSameDept && highRoleKeywords.some((kw) => ePosName.includes(kw)))
        return true;

      // Found via Cross-Dept Executive Status
      if (
        [
          "executive officer",
          "admin head",
          "president",
          "v-p",
          "vp",
          "chief",
        ].some((kw) => ePosName.includes(kw))
      )
        return true;

      return false;
    });

    // 4. Map and Sort
    return superiorEmployees
      .map((s) => {
        const ePosName = String(s.position || "")
          .toLowerCase()
          .trim();
        const isRecommended =
          ancestorPositionNames.has(ePosName) ||
          (highRoleKeywords.some((kw) => ePosName.includes(kw)) &&
            empDeptId &&
            String(s.department_id) === String(empDeptId));
        const sameDept =
          empDeptId && String(s.department_id) === String(empDeptId);

        return {
          label:
            isRecommended && sameDept
              ? `${s.name} (${s.position}) - Recommended`
              : `${s.name} (${s.position})`,
          value: s.name,
          isSupervisor: isRecommended && sameDept,
          isSameDept: sameDept,
          color:
            isRecommended && sameDept
              ? "bg-[#E1F7E1] text-[#006400] border-2 border-[#10B981] font-bold shadow-md ring-2 ring-[#D1FAE5]"
              : sameDept
                ? "bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] font-semibold"
                : "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-semibold", // Mint green for cross-dept superiors
        };
      })
      .sort((a, b) => {
        if (b.isSupervisor && !a.isSupervisor) return 1;
        if (!b.isSupervisor && a.isSupervisor) return -1;
        if (b.isSameDept && !a.isSameDept) return 1;
        if (!b.isSameDept && a.isSameDept) return -1;
        return a.label.localeCompare(b.label);
      });
  };

  const inlineApprovalOptions = useMemo(() => {
    return [
      ...APPROVAL_OPTIONS,
      ...getSuperiorsForEmployee(inlineForm.employee_id),
    ];
  }, [employees, hierarchies, inlineForm.employee_id]);

  const inlineRemarkOptions = LEAVE_REMARKS.map((r) => ({
    label: r,
    value: r,
  }));

  const handleInlineSave = async () => {
    if (!inlineForm.employee_name) {
      toast.error("Please select an employee");
      return;
    }
    if (!inlineForm.category) {
      toast.error("Please select a category");
      return;
    }
    if (!inlineForm.start_date) {
      toast.error("Please enter a start date");
      return;
    }
    if (!inlineForm.leave_end_date) {
      toast.error("Please enter a leave end date");
      return;
    }
    if (!inlineForm.approved_by) {
      toast.error("Please select approval status");
      return;
    }
    if (!inlineForm.remarks) {
      toast.error("Please select leave type");
      return;
    }

    const newStartStr = normalizeDate(inlineForm.start_date);
    const newEndStr = normalizeDate(inlineForm.leave_end_date);

    if (newStartStr > newEndStr) {
      toast.error("Start date cannot be after the leave end date.");
      return;
    }

    const isDoubleEntry = entries.some((e) => {
      if (inlineForm.id && String(e.id) === String(inlineForm.id)) return false; // Skip current entry on edit

      const isSameEmpId = Boolean(
        e.employee_id &&
        inlineForm.employee_id &&
        String(e.employee_id) === String(inlineForm.employee_id),
      );
      const isSameEmpName = Boolean(
        e.employee_name &&
        inlineForm.employee_name &&
        String(e.employee_name).trim().toLowerCase() ===
          String(inlineForm.employee_name).trim().toLowerCase(),
      );
      if (!isSameEmpId && !isSameEmpName) return false;

      const eStartStr = normalizeDate(e.start_date);
      const eEndStr = normalizeDate(e.leave_end_date);

      // Overlap condition using YYYY-MM-DD string comparison
      return newStartStr <= eEndStr && newEndStr >= eStartStr;
    });

    if (isDoubleEntry) {
      toast.error(
        `${inlineForm.employee_name} already has a leave entry during these dates.`,
      );
      return;
    }

    const payload = {
      ...inlineForm,
      id: inlineForm.id || undefined,
      start_date: inlineForm.start_date.split("T")[0],
      leave_end_date: inlineForm.leave_end_date.split("T")[0],
      number_of_days: inlineForm.number_of_days,
      category: inlineForm.category as "half-day" | "whole-day",
      shift:
        inlineForm.category === "whole-day" ? "" : (inlineForm.shift ?? ""),
    };
    setPendingPayload(payload);
    setShowConfirm(true);
  };

  const confirmInlineSave = async () => {
    if (!pendingPayload) return;
    setInlineSaving(true);
    try {
      if (pendingPayload && pendingPayload.id) {
        // Update logic
        await handleUpdate(pendingPayload as LeaveEntry);
      } else {
        await handleSave(pendingPayload as Omit<LeaveEntry, "id">);
      }
      resetInlineForm();
      // Do not hide the form after saving as requested
      // setAddModalOpen(false)
    } finally {
      setInlineSaving(false);
      setShowConfirm(false);
      setTimeout(() => setPendingPayload(null), 100);
    }
  };

  // Filters
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortOrder, setSortOrder] = useState("input-desc");
  const [searchQuery, setSearchQuery] = useState("");

  const sortOptions = [
    { label: "Ascending (Leave Date)", value: "date-asc" },
    { label: "Descending (Leave Date)", value: "date-desc" },
    { label: "Recent (Inputted)", value: "input-desc" },
    { label: "Oldest (Inputted)", value: "input-asc" },
  ];

  const calendarEntries = useMemo(
    () =>
      entries.filter((e) => {
        const s = normalizeDate(e.start_date);
        const ed = normalizeDate(e.leave_end_date);
        const mStart = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-01`;
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0).getDate();
        const mEnd = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
        return s <= mEnd && ed >= mStart;
      }),
    [entries, calendarYear, calendarMonth],
  );

  // Filtered entries
  const filtered = useMemo(() => {
    const list = calendarEntries.filter((e) => {
      if (filterDept) {
        // Find employee to get their current department if the entry itself has no department snapshot
        const emp = employees.find((emp) => emp.id === e.employee_id);
        const eDept = (e.department || emp?.department || "").toLowerCase();
        if (!eDept.includes(filterDept.toLowerCase())) return false;
      }
      if (filterType && e.remarks !== filterType) return false;
      if (filterStatus) {
        const isApproved = !["Pending", "Declined"].includes(e.approved_by);
        if (filterStatus === "Approved/Completed" && !isApproved) return false;
        if (
          filterStatus !== "Approved/Completed" &&
          e.approved_by !== filterStatus
        )
          return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = String(e.employee_name || "")
          .toLowerCase()
          .includes(query);
        const matchesId = String(e.employee_id || "")
          .toLowerCase()
          .includes(query);
        const matchesCategory = String(e.category || "")
          .toLowerCase()
          .includes(query);

        // Match dates - standard string and formatted versions
        const startDateStr = String(e.start_date || "").toLowerCase();
        const endDateStr = String(e.leave_end_date || "").toLowerCase();
        const formattedStart = formatDisplayDate(e.start_date).toLowerCase();
        const formattedEnd = formatDisplayDate(e.leave_end_date).toLowerCase();

        const matchesDate =
          startDateStr.includes(query) ||
          endDateStr.includes(query) ||
          formattedStart.includes(query) ||
          formattedEnd.includes(query);

        if (!matchesName && !matchesId && !matchesCategory && !matchesDate) {
          return false;
        }
      }

      return true;
    });

    list.sort((a, b) => {
      if (sortOrder === "date-asc") {
        return (
          new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
      }
      if (sortOrder === "date-desc") {
        return (
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      }
      if (sortOrder === "input-desc") {
        return b.id - a.id;
      }
      if (sortOrder === "input-asc") {
        return a.id - b.id;
      }
      return 0;
    });

    return list;
  }, [
    calendarEntries,
    employees,
    filterDept,
    filterType,
    filterStatus,
    sortOrder,
    searchQuery,
  ]);

  const deptOptions = [
    { label: "All Departments", value: "" },
    ...departments.map((d) => ({ label: d.name, value: d.name })),
  ];
  const typeOptions = [
    { label: "All Types", value: "" },
    ...LEAVE_REMARKS.map((r) => ({ label: r, value: r })),
  ];
  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "Pending" },
    { label: "Approved/Completed", value: "Approved/Completed" },
    { label: "Declined", value: "Declined" },
  ];

  if (isLoading) {
    return <LeaveSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f0f2] via-white to-[#fff0f3]">
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={confirmInlineSave}
        title="Confirm Save"
        description="Are you sure you want to save this leave monitoring entry?"
        confirmText="Save Leave"
        isLoading={inlineSaving}
      />

      <ConfirmationModal
        isOpen={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        onConfirm={confirmEdit}
        title="Confirm Edit"
        description={`Are you sure you want to edit the leave entry for ${entryToEdit?.employee_name || "this employee"}? This will populate the form at the top with this entry's details.`}
        confirmText="Edit Entry"
        variant="default"
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        description={`Are you sure you want to delete the leave entry for ${entries.find((e) => e.id === entryToDelete)?.employee_name || "this employee"}? This action cannot be undone.`}
        confirmText="Delete Entry"
        variant="destructive"
        isLoading={isDeleting}
      />
      {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6 sticky top-0 z-50">
        {/* Main Header Row */}
        <div className="w-full px-4 md:px-8 py-3">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                Leave Monitoring
              </h1>
              <p className="text-white/80 text-[10px] md:text-xs flex items-center gap-2 uppercase font-bold tracking-widest mt-0.5">
                <Calendar className="w-3 h-3" />
                ABIC REALTY &amp; CONSULTANCY
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowCalendar((v) => !v)}
                variant="outline"
                className={cn(
                  "bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-[10px] font-black uppercase tracking-wider h-8 px-3 rounded-md flex items-center gap-1.5",
                  !showCalendar && "bg-rose-100 text-[#4A081A]",
                )}
              >
                {showCalendar ? (
                  <>
                    <X className="w-3 h-3" />
                    <span>HIDE CALENDAR</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-3 h-3" />
                    <span>SHOW CALENDAR</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setAddModalOpen((v) => !v)}
                variant="outline"
                className={cn(
                  "bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-[10px] font-black uppercase tracking-wider h-8 px-3 rounded-md flex items-center gap-1.5",
                  addModalOpen && "bg-rose-100 text-[#4A081A]",
                )}
              >
                {addModalOpen ? (
                  <>
                    <X className="w-3 h-3" />
                    <span>CLOSE</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>ADD LEAVE</span>
                  </>
                )}
              </Button>
              <Link href="/admin-head/attendance/leave/leave-summary">
                <Button
                  variant="outline"
                  className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-[10px] font-black uppercase tracking-wider h-8 px-3 rounded-md flex items-center gap-1.5 whitespace-nowrap"
                >
                  <FileText className="w-3 h-3" />
                  <span>YEARLY SUMMARY</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary Toolbar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto no-scrollbar">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex items-center gap-3 md:gap-4 min-w-max md:min-w-0">
              {/* Department Filter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">
                  Department
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[200px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                      <span className="truncate max-w-[150px]">
                        {filterDept || "All Departments"}
                      </span>{" "}
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[240px] bg-white border-stone-200 shadow-xl rounded-xl p-1.5 max-h-[350px] overflow-y-auto"
                    align="start"
                  >
                    {deptOptions.map((o) => (
                      <DropdownMenuItem
                        key={o.value}
                        onClick={() => setFilterDept(o.value)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          filterDept === o.value
                            ? "bg-red-50 text-red-900 font-semibold"
                            : "text-stone-600 hover:bg-stone-50",
                        )}
                      >
                        <span className="truncate">{o.label}</span>
                        {filterDept === o.value && (
                          <Check className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Leave Type Filter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">
                  Leave Type
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[180px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                      <span className="truncate max-w-[130px]">
                        {filterType || "All Types"}
                      </span>{" "}
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-[200px] bg-white border-stone-200 shadow-xl rounded-xl p-1.5 max-h-[350px] overflow-y-auto"
                    align="start"
                  >
                    {typeOptions.map((o) => (
                      <DropdownMenuItem
                        key={o.value}
                        onClick={() => setFilterType(o.value)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          filterType === o.value
                            ? "bg-red-50 text-red-900 font-semibold"
                            : "text-stone-600 hover:bg-stone-50",
                        )}
                      >
                        {o.label}
                        {filterType === o.value && (
                          <Check className="w-4 h-4 text-red-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">
                  Status
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[180px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                      <span className="truncate max-w-[130px]">
                        {filterStatus || "All Status"}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-[200px] bg-white border-stone-200 shadow-xl rounded-xl p-1.5"
                    align="start"
                  >
                    {statusOptions.map((o) => (
                      <DropdownMenuItem
                        key={o.value}
                        onClick={() => setFilterStatus(o.value)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          filterStatus === o.value
                            ? "bg-red-50 text-red-900 font-semibold"
                            : "text-stone-600 hover:bg-stone-50",
                        )}
                      >
                        {o.label}
                        {filterStatus === o.value && (
                          <Check className="w-4 h-4 text-red-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider">
                  Sort By
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="bg-white border-[#FFE5EC] text-[#800020] hover:bg-[#FFE5EC] transition-all duration-200 text-sm h-10 px-4 min-w-[220px] justify-between shadow-sm font-bold inline-flex items-center whitespace-nowrap rounded-lg cursor-pointer group border-2">
                      <span className="truncate max-w-[170px]">
                        {sortOptions.find((o) => o.value === sortOrder)
                          ?.label || "Recent (Inputted)"}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-[240px] bg-white border-stone-200 shadow-xl rounded-xl p-1.5"
                    align="start"
                  >
                    {sortOptions.map((o) => (
                      <DropdownMenuItem
                        key={o.value}
                        onClick={() => setSortOrder(o.value)}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors",
                          sortOrder === o.value
                            ? "bg-red-50 text-red-900 font-semibold"
                            : "text-stone-600 hover:bg-stone-50",
                        )}
                      >
                        {o.label}
                        {sortOrder === o.value && (
                          <Check className="w-4 h-4 text-red-600" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-[400px]">
                <span className="text-sm font-bold text-white/70 uppercase tracking-wider hidden 2xl:block">
                  Search
                </span>
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ID, Name, Date..."
                    className="pl-9 h-10 w-full bg-white border-2 border-[#FFE5EC] text-[#800020] placeholder:text-slate-400 font-medium rounded-lg shadow-sm focus-visible:ring-rose-200 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* ── Inline Add Leave Form (toggleable) ── */}
        <div
          ref={formRef}
          className={cn(
            "transition-all duration-500 overflow-hidden",
            addModalOpen
              ? "max-h-[1200px] opacity-100 mb-8"
              : "max-h-0 opacity-0 overflow-hidden",
          )}
        >
          <div className="bg-white rounded-xl shadow-lg border border-rose-100 overflow-hidden ring-2 ring-rose-50/50">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-[#800020] to-[#4A081A] px-4 py-2 flex justify-between items-center">
              <h2 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-rose-300" />
                {inlineForm.id ? "Update Leave Record" : "Add Leave Record"}
              </h2>
              <div className="flex items-center gap-2">
                {inlineForm.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetInlineForm}
                    className="text-white hover:bg-white/10 h-6 px-2 text-[9px] font-bold uppercase tracking-widest rounded transition-all"
                  >
                    <Plus className="w-3 h-3 mr-1" /> New Entry
                  </Button>
                )}
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="text-white/40 hover:text-white transition-all p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                {/* Row 1: Employee Info */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Employee ID
                  </label>
                  <div className="h-8 border-b-2 border-slate-100 bg-slate-50/30 px-3 flex items-center text-[11px] text-slate-500 font-bold rounded-t-md">
                    {inlineForm.employee_id || "Auto-filled"}
                  </div>
                </div>

                <div className="flex flex-col gap-1 relative">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Employee Name
                  </label>
                  <Popover open={empOpen} onOpenChange={setEmpOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center justify-between h-8 border-b-2 border-slate-100 bg-white px-3 text-[11px] text-left group hover:border-[#800020] transition-colors rounded-t-md shadow-sm">
                        <span
                          className={cn(
                            "truncate",
                            inlineForm.employee_name
                              ? "text-slate-800 font-bold"
                              : "text-slate-400 italic",
                          )}
                        >
                          {inlineForm.employee_name || "Select Employee"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-[#800020] transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[400px]">
                      <Command>
                        <CommandInput
                          placeholder="Search employee..."
                          className="text-xs h-8"
                        />
                        <CommandList>
                          <CommandGroup>
                            {employees.map((emp) => (
                              <CommandItem
                                key={emp.id}
                                value={emp.name}
                                onSelect={() => handleInlineSelectEmployee(emp)}
                                className="text-xs py-1.5"
                              >
                                {emp.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Category
                  </label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center justify-between h-8 border-b-2 px-3 text-[11px] text-left group transition-colors rounded-t-md shadow-sm",
                          inlineForm.category
                            ? "bg-rose-50 border-rose-200"
                            : "bg-white border-slate-100 hover:border-[#800020]",
                        )}
                      >
                        <span
                          className={cn(
                            "font-black tracking-wider uppercase",
                            inlineForm.category
                              ? "text-[#800020]"
                              : "text-slate-400 italic font-medium",
                          )}
                        >
                          {inlineForm.category || "Select Type"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-[#800020] transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-1 w-[200px] border border-rose-50 shadow-xl rounded-lg">
                      {LEAVE_CATEGORY_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => {
                            setInlineForm((p) => ({
                              ...p,
                              category: o.value as "half-day" | "whole-day",
                              shift: "",
                            }));
                            setCategoryOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded text-[10px] font-black uppercase transition-all mb-1 last:mb-0",
                            o.color,
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Shift (if Half-day)
                  </label>
                  <Popover open={shiftOpen} onOpenChange={setShiftOpen}>
                    <PopoverTrigger asChild>
                      <button
                        disabled={inlineForm.category !== "half-day"}
                        className={cn(
                          "flex items-center justify-between h-8 border-b-2 px-3 text-[11px] text-left group transition-colors rounded-t-md shadow-sm",
                          inlineForm.category !== "half-day"
                            ? "bg-slate-50 border-slate-50 opacity-40 cursor-not-allowed"
                            : "bg-white border-slate-100 hover:border-[#800020]",
                        )}
                      >
                        <span
                          className={cn(
                            "truncate",
                            inlineForm.shift
                              ? "text-slate-800 font-bold"
                              : "text-slate-400 italic",
                          )}
                        >
                          {inlineForm.shift || "N/A"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-[#800020] transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-1 w-[300px]">
                      {inlineAvailableShifts.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setInlineForm((p) => ({ ...p, shift: s }));
                            setShiftOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded text-[10px] font-bold hover:bg-rose-50 text-slate-600 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Row 2: Dates & Details */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Start Date
                  </label>
                  <DatePicker
                    value={inlineForm.start_date}
                    onChange={(date) =>
                      setInlineForm((p) => ({
                        ...p,
                        start_date: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    className="h-8 border-b-2 border-slate-100 bg-white px-3 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-[#800020] transition-colors rounded-t-md shadow-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    End Date
                  </label>
                  <DatePicker
                    disabled={inlineForm.category === "half-day"}
                    value={
                      inlineForm.category === "half-day"
                        ? inlineForm.start_date
                        : inlineForm.leave_end_date
                    }
                    onChange={(date) =>
                      setInlineForm((p) => ({
                        ...p,
                        leave_end_date: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    className={cn(
                      "h-8 border-b-2 px-3 text-[11px] font-bold focus:outline-none transition-colors rounded-t-md shadow-sm",
                      inlineForm.category === "half-day"
                        ? "bg-slate-50 border-slate-50 opacity-40 cursor-not-allowed text-slate-400"
                        : "bg-white border-slate-100 text-slate-700 focus:border-[#800020]",
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Status/Approver
                  </label>
                  <Popover open={approvalOpen} onOpenChange={setApprovalOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center justify-between h-8 border-b-2 border-slate-100 bg-white px-3 text-[11px] text-left group hover:border-[#800020] transition-colors rounded-t-md shadow-sm">
                        <span
                          className={cn(
                            "truncate",
                            inlineForm.approved_by
                              ? "text-slate-800 font-bold"
                              : "text-slate-400 italic",
                          )}
                        >
                          {inlineForm.approved_by || "Pending..."}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-[#800020] transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-1 w-[300px]">
                      {inlineApprovalOptions.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => {
                            setInlineForm((p) => ({
                              ...p,
                              approved_by: o.value,
                            }));
                            setApprovalOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded text-[10px] font-bold hover:bg-rose-50 transition-all",
                            o.color,
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Leave Type
                  </label>
                  <Popover open={remarksOpen} onOpenChange={setRemarksOpen}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center justify-between h-8 border-b-2 border-slate-100 bg-white px-3 text-[11px] text-left group hover:border-[#800020] transition-colors rounded-t-md shadow-sm">
                        <span
                          className={cn(
                            "truncate",
                            inlineForm.remarks
                              ? "text-[#800020] font-black tracking-widest uppercase"
                              : "text-slate-400 italic font-medium",
                          )}
                        >
                          {inlineForm.remarks || "Select Type"}
                        </span>
                        <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-[#800020] transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="p-1 w-[300px]">
                      {inlineRemarkOptions.map((o) => (
                        <button
                          key={o.value}
                          onClick={() => {
                            setInlineForm((p) => ({ ...p, remarks: o.value }));
                            setRemarksOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded text-[10px] font-bold hover:bg-rose-50 text-slate-600 transition-all uppercase tracking-wider"
                        >
                          {o.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Row 3: Final Detail & Reason */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Days Counted
                  </label>
                  <div className="h-10 border-b-2 border-rose-100 bg-rose-50/20 px-3 flex items-center justify-center text-[18px] text-[#800020] font-black rounded-md shadow-inner">
                    {inlineForm.number_of_days > 0
                      ? formatDays(
                          inlineForm.number_of_days,
                          inlineForm.category,
                        )
                      : "—"}
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Detailed Reason
                  </label>
                  <div className="flex gap-3">
                    <textarea
                      rows={1}
                      value={inlineForm.cite_reason}
                      onChange={(e) =>
                        setInlineForm((p) => ({
                          ...p,
                          cite_reason: e.target.value,
                        }))
                      }
                      placeholder="Why is the employee taking leave?..."
                      className="flex-1 h-10 border-b-2 border-slate-100 bg-white px-3 py-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-[#800020] transition-all rounded-t-md shadow-sm resize-none"
                    />
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddModalOpen(false);
                          resetInlineForm();
                        }}
                        className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded shadow-sm border-2 hover:bg-rose-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleInlineSave}
                        disabled={inlineSaving}
                        className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded bg-[#800020] hover:bg-[#4A081A] shadow-lg shadow-rose-200 transition-all"
                      >
                        {inlineSaving
                          ? "..."
                          : inlineForm.id
                            ? "Update"
                            : "Save Record"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Calendar ── */}
        {showCalendar && (
          <section>
            {/* Calendar nav */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#4A081A]">
                  {calendarMode === "week"
                    ? `Week of ${MONTHS[calendarMonth]} ${calendarYear}`
                    : `${MONTHS[calendarMonth]} ${calendarYear}`}
                </span>
                {/* WEEK / MONTH toggle */}
                <div className="flex text-LG border border-rose-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setCalendarMode("week")}
                    className={cn(
                      "px-3 py-1 font-semibold transition",
                      calendarMode === "week"
                        ? "bg-[#4A081A] text-white"
                        : "bg-rose-50 text-[#4A081A] hover:bg-rose-100",
                    )}
                  >
                    WEEK
                  </button>
                  <button
                    onClick={() => setCalendarMode("month")}
                    className={cn(
                      "px-3 py-1 font-semibold transition",
                      calendarMode === "month"
                        ? "bg-[#4A081A] text-white"
                        : "bg-rose-50 text-[#4A081A] hover:bg-rose-100",
                    )}
                  >
                    MONTH
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((y) => y - 1);
                    } else setCalendarMonth((m) => m - 1);
                  }}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-[#4A081A] transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const now = new Date();
                    setCalendarYear(now.getFullYear());
                    setCalendarMonth(now.getMonth());
                    setCalendarMode("month");
                    setShowCalendar(true);
                  }}
                  className="text-LG px-3 py-1.5 border border-rose-300 rounded-md text-[#4A081A] hover:bg-rose-50 transition font-semibold"
                >
                  TODAY
                </button>
                <button
                  onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((y) => y + 1);
                    } else setCalendarMonth((m) => m + 1);
                  }}
                  className="p-1.5 rounded-full hover:bg-rose-100 text-[#4A081A] transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <CalendarView
              year={calendarYear}
              month={calendarMonth}
              entries={calendarEntries}
              weekOnly={calendarMode === "week"}
            />
          </section>
        )}

        {/* ── Leave Monitoring Table ── */}
        <section>
          <div className="rounded-xl overflow-hidden shadow border border-rose-100">
            {/* Table header banner */}
            <div className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] py-2 text-center text-white text-xs font-bold tracking-widest uppercase">
              Leave Records • {MONTHS[calendarMonth]} {calendarYear}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#c0143c] text-white">
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-20">
                      ID
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-left pl-4">
                      Name
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-24">
                      Category
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-20">
                      Shift
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-24">
                      Start
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-24">
                      End
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-16">
                      Days
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-20">
                      Status
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-24">
                      Type
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center">
                      Reason
                    </th>
                    <th className="border border-[#7B0F2B] px-2 py-2 font-bold uppercase text-center w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-3 py-6 text-center text-slate-400 italic text-xs"
                      >
                        No records found for this period.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={cn(
                          "border-b border-rose-50 hover:bg-rose-50/50 transition",
                          idx % 2 === 0 ? "bg-white" : "bg-rose-50/20",
                        )}
                      >
                        <td className="border border-rose-100 px-2 py-1.5 text-center text-slate-500 font-medium">
                          {entry.employee_id}
                        </td>
                        <td className="border border-rose-100 px-4 py-1.5 font-bold text-slate-700">
                          {entry.employee_name}
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all",
                              entry.category === "half-day"
                                ? "bg-amber-50 text-amber-600 border border-amber-100"
                                : "bg-rose-50 text-rose-600 border border-rose-100",
                            )}
                          >
                            {entry.category === "half-day" ? "Half" : "Whole"}
                          </span>
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center text-slate-500 italic">
                          {entry.category === "whole-day"
                            ? "—"
                            : entry.shift || "—"}
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center text-slate-600 font-medium whitespace-nowrap">
                          {formatDisplayDate(entry.start_date)}
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center text-slate-600 font-medium whitespace-nowrap">
                          {formatDisplayDate(entry.leave_end_date)}
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center font-bold text-[#4A081A]">
                          {formatDays(entry.number_of_days, entry.category)}
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase transition-all",
                              entry.approved_by === "Pending" &&
                                "bg-orange-50 text-orange-600 border border-orange-100",
                              entry.approved_by === "Declined" &&
                                "bg-red-50 text-red-600 border border-red-100",
                              !["Pending", "Declined"].includes(
                                entry.approved_by,
                              ) &&
                                "bg-green-50 text-green-600 border border-green-100",
                            )}
                          >
                            {entry.approved_by === "Pending"
                              ? "Pend"
                              : entry.approved_by === "Declined"
                                ? "Decl"
                                : "Appr"}
                          </span>
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center">
                          <span className="font-bold text-[#4A081A] text-[10px]">
                            {entry.remarks}
                          </span>
                        </td>
                        <td className="border border-rose-100 px-3 py-1.5 text-slate-500 max-w-[150px]">
                          {entry.cite_reason ? (
                            <div className="flex items-center gap-2">
                              <p
                                className="italic truncate flex-1 text-[11px]"
                                title={entry.cite_reason}
                              >
                                {entry.cite_reason}
                              </p>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="p-1 hover:bg-rose-100 text-[#7B0F2B] rounded transition-all shrink-0">
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[350px] p-0 border-0 shadow-xl rounded-xl bg-white overflow-hidden ring-1 ring-black/5"
                                  align="end"
                                >
                                  <div className="bg-[#7B0F2B] px-4 py-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-white" />
                                    <span className="text-white font-bold text-xs uppercase tracking-wider">
                                      Reason
                                    </span>
                                  </div>
                                  <div className="p-4 max-h-[250px] overflow-y-auto">
                                    <p className="text-slate-700 text-sm italic">
                                      "{entry.cite_reason}"
                                    </p>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic text-[10px] text-center block w-full">
                              —
                            </span>
                          )}
                        </td>
                        <td className="border border-rose-100 px-2 py-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-all"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 hover:bg-red-50 text-red-600 rounded transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
