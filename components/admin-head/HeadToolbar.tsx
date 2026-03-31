"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, RotateCw, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface HeadToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  statusOptions: Option[];
  onRefresh?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function HeadToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusFilter,
  onStatusChange,
  statusOptions,
  onRefresh,
  onReset,
  isLoading,
  children,
}: HeadToolbarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback(() => {
    onSearchChange(localQuery);
  }, [onSearchChange, localQuery]);

  const handleReset = useCallback(() => {
    setLocalQuery("");
    onSearchChange("");
    onStatusChange("all");
    onReset?.();
    onRefresh?.();
  }, [onSearchChange, onStatusChange, onReset, onRefresh]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 pb-4">
      <div className="relative flex-1 w-full flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50/50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all uppercase font-medium"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-4 py-2 bg-[#7a0f1f] text-white rounded-lg text-sm font-semibold hover:bg-[#5a0b17] transition-all shadow-sm shrink-0 active:scale-95"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:flex-none">
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none block w-full sm:w-40 pl-3 pr-10 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all cursor-pointer font-bold uppercase tracking-wider text-slate-700"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        {children}
        
        {onRefresh && (
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-[#7a0f1f] hover:bg-rose-50 border border-slate-200 rounded-lg transition-all disabled:opacity-50 active:scale-95 shadow-sm whitespace-nowrap bg-white"
            title="Refresh Data & Clear Filters"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Sync</span>
          </button>
        )}
      </div>
    </div>
  );
}
