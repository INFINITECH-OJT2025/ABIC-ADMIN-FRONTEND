"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface HeadStatPillProps {
  icon: LucideIcon;
  label: string;
  value: string | number | null;
  colorScheme?: "rose" | "emerald" | "amber" | "sky" | "slate";
}

export function HeadStatPill({
  icon: Icon,
  label,
  value,
  colorScheme = "slate",
}: HeadStatPillProps) {
  const themes = {
    rose: "bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/20 shadow-rose-500/5",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/20 shadow-emerald-500/5",
    amber: "bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/20 shadow-amber-500/5",
    sky: "bg-sky-50 text-sky-600 border-sky-100 ring-sky-500/20 shadow-sky-500/5",
    slate: "bg-slate-50 text-slate-600 border-slate-100 ring-slate-500/20 shadow-slate-500/5",
  };

  const theme = themes[colorScheme];

  return (
    <div className="group relative w-full sm:w-auto flex-1 sm:flex-initial">
      <div className={`absolute -inset-0.5 rounded-2xl opacity-0 blur group-hover:opacity-40 transition duration-500 ${theme} hidden sm:block`} />
      
      <div className="relative flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 sm:group-hover:-translate-y-1 h-full font-sans">
        
        <div className={`flex items-center justify-center shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-[12px] sm:rounded-[14px] transition-transform duration-500 sm:group-hover:rotate-[10deg] ${theme} border`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.05em] sm:tracking-[0.1em] text-slate-400 leading-none truncate">
            {label}
          </span>
          
          <div className="mt-1 sm:mt-1.5 flex items-baseline gap-1">
            {value === null ? (
              <div className="w-8 h-4 sm:w-10 sm:h-5 rounded bg-slate-100 animate-pulse" />
            ) : (
              <>
                <span className="text-lg sm:text-xl font-black text-slate-900 tabular-nums">
                  {value}
                </span>
                {colorScheme === 'emerald' && (
                  <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 ml-1 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeadSummaryBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-20 -mt-10 sm:-mt-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 p-2 sm:p-2 rounded-[26px] sm:rounded-[22px] bg-white/30 backdrop-blur-xl border border-white/40 shadow-2xl shadow-black/5">
        {children}
      </div>
    </div>
  );
}
