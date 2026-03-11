"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit2,
  Save,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Constants for dropdowns
const POSITIONS = [
  "",
  "Accounting Staff",
  "Junior Accountant",
  "Senior Accountant",
  "Accounting Manager",
  "HR Assistant",
  "Auditor",
];

const INTERVIEW_STATUSES = ["", "PENDING", "CONFIRMED"];

export default function ApplicantsForInterviewPage() {
  // --- Edit states for tables ---
  const [editingInitialId, setEditingInitialId] = useState<number | null>(null);
  const [editingFinalId, setEditingFinalId] = useState<number | null>(null);

  // --- Accordion states ---
  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [isFinalOpen, setIsFinalOpen] = useState(true);

  // --- States for tables ---

  // 1. For Initial Interview
  const [initialRows, setInitialRows] = useState([
    {
      id: Date.now(),
      name: "Juan Luna",
      position: "Accounting Staff",
      date: "2024-03-15",
      time: "10:00",
      status: "CONFIRMED",
    },
  ]);

  // 2. For Final Interview
  const [finalRows, setFinalRows] = useState([
    {
      id: Date.now() + 1,
      name: "Maria Clara",
      position: "Senior Accountant",
      date: "2024-03-20",
      time: "14:00",
      status: "PENDING",
    },
  ]);

  // --- Handlers ---

  // Add row functions
  const addInitialRow = () => {
    const newId = Date.now();
    setInitialRows([
      ...initialRows,
      {
        id: newId,
        name: "",
        position: "",
        date: "",
        time: "",
        status: "PENDING",
      },
    ]);
    setEditingInitialId(newId);
    setIsInitialOpen(true);
  };

  const addFinalRow = () => {
    const newId = Date.now();
    setFinalRows([
      ...finalRows,
      {
        id: newId,
        name: "",
        position: "",
        date: "",
        time: "",
        status: "PENDING",
      },
    ]);
    setEditingFinalId(newId);
    setIsFinalOpen(true);
  };

  // Change handlers
  const handleInitialChange = (id: number, field: string, value: any) => {
    setInitialRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleFinalChange = (id: number, field: string, value: any) => {
    setFinalRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Save functions
  const saveInitial = (id: number) => {
    setEditingInitialId(null);
  };

  const saveFinal = (id: number) => {
    setEditingFinalId(null);
  };

  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Header Section */}
        <div className="bg-[#800020] text-white pt-6 px-8 pb-0">
        <h1 className="text-3xl font-bold mb-4">Hiring Report</h1>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <Link href="/admin-head/hiring">
              <button className="text-white/90 px-6 py-2 font-bold text-xs hover:bg-white/10 transition-colors uppercase">
                Hiring
              </button>
            </Link>
            <button className="bg-white text-[#800020] px-6 py-2 font-bold rounded-t-md text-xs uppercase">
              Applicants for Interview
            </button>
          </div>
          <div className="relative mb-2">
            <input
              type="text"
              className="bg-transparent border border-white/60 rounded-sm py-1.5 px-3 pr-10 text-white text-sm focus:outline-none focus:border-white w-80 h-8"
              placeholder="Search..."
            />
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60"
              size={18}
            />
          </div>
        </div>
      </div>
      <div className="h-3 bg-[#E5E7EB]"></div>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-10 space-y-12 bg-white font-sans text-black">
        {/* 1. For Initial Interview */}
        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1200px]">
          <div
            onClick={() => setIsInitialOpen(!isInitialOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors group"
          >
            <div className="flex items-center gap-3">
              {isInitialOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">
                For Initial Interview
              </h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addInitialRow();
              }}
              className="bg-white text-[#800020] border-2 border-[#800020] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isInitialOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[25%]">
                    Applicant Name
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[20%]">
                    Position
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">
                    Interview Date
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">
                    Interview Time
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-[10px] uppercase px-4 w-[15%] leading-tight">
                    Status
                    <br />
                    (PENDING/CONFIRMED)
                  </TableHead>
                  <TableHead className="text-center font-bold text-black text-xs uppercase px-4 w-[10%]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0 ${
                      editingInitialId === row.id ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <TableCell className="border-r-[3px] border-black p-0">
                      <input
                        type="text"
                        value={row.name}
                        readOnly={editingInitialId !== row.id}
                        onChange={(e) => handleInitialChange(row.id, "name", e.target.value)}
                        className="w-full h-full bg-transparent border-none px-4 font-bold text-black focus:outline-none placeholder:text-stone-300 read-only:cursor-default"
                        placeholder="Name..."
                      />
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0 relative">
                      <select
                        value={row.position}
                        disabled={editingInitialId !== row.id}
                        onChange={(e) => handleInitialChange(row.id, "position", e.target.value)}
                        className="w-full h-full bg-transparent border-none appearance-none px-4 font-bold text-black focus:outline-none disabled:opacity-80"
                      >
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0">
                      <input
                        type="date"
                        value={row.date}
                        readOnly={editingInitialId !== row.id}
                        onChange={(e) => handleInitialChange(row.id, "date", e.target.value)}
                        className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                      />
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0">
                      <input
                        type="time"
                        value={row.time}
                        readOnly={editingInitialId !== row.id}
                        onChange={(e) => handleInitialChange(row.id, "time", e.target.value)}
                        className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none placeholder:text-stone-300 read-only:opacity-80"
                      />
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0 relative">
                      <select
                        value={row.status}
                        disabled={editingInitialId !== row.id}
                        onChange={(e) => handleInitialChange(row.id, "status", e.target.value)}
                        className={`w-full h-full bg-transparent border-none appearance-none text-center font-bold focus:outline-none disabled:opacity-80 ${
                          row.status === "CONFIRMED" ? "text-green-700" : "text-amber-600"
                        }`}
                      >
                        {INTERVIEW_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-4">
                        {editingInitialId === row.id ? (
                          <button
                            onClick={() => saveInitial(row.id)}
                            className="text-green-700 hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Save size={24} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingInitialId(row.id)}
                            className="text-black hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Edit2 size={24} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 2. For Final Interview */}
        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1200px]">
          <div
            onClick={() => setIsFinalOpen(!isFinalOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors group"
          >
            <div className="flex items-center gap-3">
              {isFinalOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">
                For Final Interview
              </h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addFinalRow();
              }}
              className="bg-white text-[#800020] border-2 border-[#800020] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isFinalOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[25%]">
                    Applicant Name
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[20%]">
                    Position
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">
                    Interview Date
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">
                    Interview Time
                  </TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-[10px] uppercase px-4 w-[15%] leading-tight">
                    Status
                    <br />
                    (PENDING/CONFIRMED)
                  </TableHead>
                  <TableHead className="text-center font-bold text-black text-xs uppercase px-4 w-[10%]">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={`h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0 ${
                      editingFinalId === row.id ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <TableCell className="border-r-[3px] border-black p-0">
                      <input
                        type="text"
                        value={row.name}
                        readOnly={editingFinalId !== row.id}
                        onChange={(e) => handleFinalChange(row.id, "name", e.target.value)}
                        className="w-full h-full bg-transparent border-none px-4 font-bold text-black focus:outline-none placeholder:text-stone-300 read-only:cursor-default"
                        placeholder="Name..."
                      />
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0 relative">
                      <select
                        value={row.position}
                        disabled={editingFinalId !== row.id}
                        onChange={(e) => handleFinalChange(row.id, "position", e.target.value)}
                        className="w-full h-full bg-transparent border-none appearance-none px-4 font-bold text-black focus:outline-none disabled:opacity-80"
                      >
                        {POSITIONS.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0">
                      <input
                        type="date"
                        value={row.date}
                        readOnly={editingFinalId !== row.id}
                        onChange={(e) => handleFinalChange(row.id, "date", e.target.value)}
                        className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                      />
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0">
                      <input
                        type="time"
                        value={row.time}
                        readOnly={editingFinalId !== row.id}
                        onChange={(e) => handleFinalChange(row.id, "time", e.target.value)}
                        className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none placeholder:text-stone-300 read-only:opacity-80"
                      />
                    </TableCell>
                    <TableCell className="border-r-[3px] border-black p-0 relative">
                      <select
                        value={row.status}
                        disabled={editingFinalId !== row.id}
                        onChange={(e) => handleFinalChange(row.id, "status", e.target.value)}
                        className={`w-full h-full bg-transparent border-none appearance-none text-center font-bold focus:outline-none disabled:opacity-80 ${
                          row.status === "CONFIRMED" ? "text-green-700" : "text-amber-600"
                        }`}
                      >
                        {INTERVIEW_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-4">
                        {editingFinalId === row.id ? (
                          <button
                            onClick={() => saveFinal(row.id)}
                            className="text-green-700 hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Save size={24} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingFinalId(row.id)}
                            className="text-black hover:scale-110 active:scale-95 transition-transform"
                          >
                            <Edit2 size={24} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
