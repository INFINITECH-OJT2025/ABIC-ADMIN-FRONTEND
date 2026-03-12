"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center h-9",
        caption_label: "text-sm font-semibold text-slate-800 hidden",
        caption_dropdowns: "flex justify-center gap-1 items-center",
        dropdown: "rdp-dropdown bg-white border border-slate-200 rounded-md text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-200 px-2 py-1 cursor-pointer hover:bg-slate-50 transition-colors",
        dropdown_month: "rdp-dropdown_month",
        dropdown_year: "rdp-dropdown_year",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 h-7 w-7 bg-transparent border border-slate-200 rounded-md flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-slate-100 transition-all z-10",
        ),
        button_next: cn(
          "absolute right-1 h-7 w-7 bg-transparent border border-slate-200 rounded-md flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-slate-100 transition-all z-10",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-slate-500 rounded-md w-9 font-medium text-[0.8rem] text-center",
        week: "flex w-full mt-1",
        day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-9 w-9 p-0 font-normal rounded-md aria-selected:opacity-100",
          "hover:bg-slate-100 hover:text-slate-900 transition-colors",
          "inline-flex items-center justify-center",
        ),
        range_end: "day-range-end",
        range_start: "day-range-start",
        selected:
          "bg-[#a0153e] text-white hover:bg-[#a0153e] hover:text-white focus:bg-[#a0153e] focus:text-white rounded-md",
        today: "bg-slate-100 text-slate-900 font-semibold rounded-md",
        outside:
          "day-outside text-slate-400 opacity-50 aria-selected:bg-accent/50 aria-selected:text-slate-400 aria-selected:opacity-30",
        disabled: "text-slate-400 opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }
          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
