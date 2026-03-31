"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  from: number;
  to: number;
}

export interface HeadColumn<T> {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  width?: string;
  flex?: boolean;
  renderCell: (row: T) => React.ReactNode;
}

interface HeadDataTableProps<T> {
  columns: HeadColumn<T>[];
  rows: T[];
  loading?: boolean;
  pagination?: PaginationMeta | null;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  onSort?: (key: string, direction: "asc" | "desc" | null) => void;
  sortKey?: string | null;
  sortDirection?: "asc" | "desc" | null;
  resetKey?: number | string;
  skeletonCount?: number;
}

export default function HeadDataTable<T extends { id: number | string }>({
  columns,
  rows,
  loading,
  pagination,
  onPageChange,
  onRowClick,
  onSort,
  sortKey: controlledSortKey,
  sortDirection: controlledSortDir,
  resetKey,
  skeletonCount = 5,
}: HeadDataTableProps<T>) {

  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<"asc" | "desc" | null>(null);

  useEffect(() => {
    if (resetKey !== undefined) {
      setInternalSortKey(null);
      setInternalSortDir(null);
    }
  }, [resetKey]);

  const sortKey = controlledSortKey !== undefined ? controlledSortKey : internalSortKey;
  const sortDirection = controlledSortDir !== undefined ? controlledSortDir : internalSortDir;

  const handleHeaderClick = (col: HeadColumn<T>) => {
    if (!col.sortable) return;

    let nextDir: "asc" | "desc" | null = null;
    if (sortKey !== col.key) {
      nextDir = "asc";
    } else if (sortDirection === "asc") {
      nextDir = "desc";
    } else if (sortDirection === "desc") {
      nextDir = null;
    }

    if (onSort) {
      onSort(col.key, nextDir);
    } else {
      setInternalSortKey(nextDir ? col.key : null);
      setInternalSortDir(nextDir);
    }
  };

  const sortedRows = useMemo(() => {
    if (!sortKey || !sortDirection || onSort) return rows;

    return [...rows].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const factor = sortDirection === "asc" ? 1 : -1;
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * factor;
      }

      return String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' }) * factor;
    });
  }, [rows, sortKey, sortDirection, onSort]);

  const [hoveredId, setHoveredId] = useState<number | string | null>(null);

  return (
    <div className="w-full space-y-0 mt-6 overflow-hidden font-sans">
      {pagination && (
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-x border-t border-slate-200 rounded-t-3xl border-b transition-colors shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 flex items-center gap-2">
            REGISTRY INDEX{" "}
            <span className="text-slate-900 bg-slate-200/50 px-2 py-0.5 rounded ml-1 tabular-nums">
              {pagination.from ?? 0} — {pagination.to ?? 0}
            </span>
            <span className="opacity-20 ml-1">|</span>
            <span className="text-slate-500 font-bold ml-1 tabular-nums">{pagination.total} TOTAL RECORDS</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onPageChange?.(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="p-1.5 text-slate-400 hover:text-[#7a0f1f] disabled:opacity-20 transition-all rounded-full hover:bg-rose-50 border border-transparent hover:border-rose-100 active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[12px] font-black text-slate-900 min-w-[40px] text-center bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm tabular-nums">
              {pagination.current_page}
              <span className="text-slate-300 font-extrabold mx-1">/</span>
              <span className="text-slate-500">{pagination.last_page}</span>
            </span>
            <button 
              onClick={() => onPageChange?.(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.last_page}
              className="p-1.5 text-slate-400 hover:text-[#7a0f1f] disabled:opacity-20 transition-all rounded-full hover:bg-rose-50 border border-transparent hover:border-rose-100 active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className={`overflow-x-auto border-x border-b border-slate-200 bg-white ${pagination ? "rounded-b-3xl" : "border-t rounded-3xl"} shadow-2xl shadow-black/5`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#7B0F2B] via-[#5F0C18] to-[#450A13]">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th 
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    className={`
                      px-6 py-3 text-[10.5px] font-black uppercase tracking-[0.2em] text-rose-100/90 group first:pl-8
                      ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                      ${col.sortable ? "cursor-pointer select-none hover:text-white transition-colors" : ""}
                    `}
                    style={{ width: col.width }}
                  >
                    <div className={`flex items-center gap-2 ${
                      col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""
                    }`}>
                      {col.label}
                      {col.sortable && (
                        <div className="w-4 h-4 flex items-center justify-center">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 text-white animate-in zoom-in-50" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-white animate-in zoom-in-50" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-20 group-hover:opacity-60 transition-opacity" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [...Array(skeletonCount)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, idx) => (
                    <td key={idx} className="px-6 py-4 bg-white">
                      <div className={`h-4 bg-slate-100 rounded ${idx === 0 ? "w-1/2" : "w-full"}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                       <LayoutDashboard className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 leading-tight">
                        Registry empty
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                        No matches were found in the current buffer.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const isHovered = hoveredId === row.id;
                return (
                  <tr 
                    key={row.id}
                    onMouseEnter={() => setHoveredId(row.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onRowClick?.(row)}
                    className="relative transition-all duration-150 cursor-pointer"
                    style={{ 
                      backgroundColor: isHovered ? "rgba(255, 241, 242, 0.5)" : "transparent",
                    }}
                  >
                    {columns.map((col, idx) => (
                      <td 
                        key={col.key}
                        className={`
                          px-6 py-3 relative first:pl-8
                          ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                        `}
                      >
                        {idx === 0 && (
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-opacity duration-150"
                            style={{ 
                              backgroundColor: "#7a0f1f",
                              opacity: isHovered ? 1 : 0,
                            }} 
                          />
                        )}
                        
                        <div 
                          className="text-sm font-semibold transition-colors duration-150"
                          style={{ color: isHovered ? "#0f172a" : "#475569" }}
                        >
                          {col.renderCell(row)}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
