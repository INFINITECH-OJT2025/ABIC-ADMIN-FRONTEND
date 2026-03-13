"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  calendarProps?: Omit<React.ComponentProps<typeof Calendar>, "mode" | "selected" | "onSelect">;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "mm/dd/yyyy",
  calendarProps,
}: DatePickerProps) {
  const parsedDate: Date | undefined = (() => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    // value is a string like "2026-03-09"
    const d = new Date(value);
    // Avoid timezone shift: parse as local date
    const parts = (value as string).split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return isNaN(d.getTime()) ? undefined : d;
  })();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-left font-normal transition-colors",
            "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#a0153e]/30 focus:border-[#a0153e]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !parsedDate && "text-slate-400",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="flex-1">
            {parsedDate ? format(parsedDate, "MM/dd/yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-xl border border-slate-200 rounded-xl overflow-hidden"
        align="start"
      >
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={onChange}
          initialFocus
          {...calendarProps}
        />
      </PopoverContent>
    </Popover>
  );
}
