"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit2,
  Save,
  ChevronUp,
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
const OFFER_STATUSES = ["", "Pending", "Accepted"];

export default function HiringReportPage() {
  // --- Edit states for tables ---
  const [editingSummaryId, setEditingSummaryId] = useState<number | null>(null);
  const [editingJobOfferId, setEditingJobOfferId] = useState<number | null>(null);
  const [editingOnboardedId, setEditingOnboardedId] = useState<number | null>(null);

  // --- Accordion states ---
  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isJobOffersOpen, setIsJobOffersOpen] = useState(true);
  const [isOnboardedOpen, setIsOnboardedOpen] = useState(true);

  // --- States for tables ---

  // 1. Hiring Requirement Summary
  const [summaryRows, setSummaryRows] = useState([
    {
      id: Date.now(),
      position: "Accounting Staff",
      requiredHeadcount: 2,
      hired: 1,
      remaining: 1,
      lastUpdate: "2024-03-10",
    },
    {
      id: Date.now() + 1,
      position: "Junior Accountant",
      requiredHeadcount: 1,
      hired: 0,
      remaining: 1,
      lastUpdate: "2024-03-11",
    },
  ]);

  // 2. Job Offers Sent
  const [jobOffers, setJobOffers] = useState([
    {
      id: Date.now() + 2,
      name: "Juana Dela Cruz",
      position: "Accounting Staff",
      salary: null,
      offerSent: "2024-03-01",
      responseDate: "2024-03-05",
      status: "Accepted",
      startDate: "2024-04-01",
    },
    {
      id: Date.now() + 3,
      name: "John Doe",
      position: "Junior Accountant",
      salary: null,
      offerSent: "2024-03-10",
      responseDate: "",
      status: "Pending",
      startDate: "",
    },
  ]);

  // 3. Onboarded
  const [onboardedRows, setOnboardedRows] = useState([
    {
      id: Date.now() + 4,
      name: "Juana Dela Cruz",
      position: "Accounting Staff",
      salary: null,
      startDate: "2024-04-01",
    },
  ]);

  // --- Handlers ---

  // Add row functions
  const addSummaryRow = () => {
    const newId = Date.now();
    setSummaryRows([
      ...summaryRows,
      {
        id: newId,
        position: "",
        requiredHeadcount: 0,
        hired: 0,
        remaining: 0,
        lastUpdate: new Date().toISOString().split('T')[0],
      },
    ]);
    setEditingSummaryId(newId);
  };

  const addJobOfferRow = () => {
    const newId = Date.now();
    setJobOffers([
      ...jobOffers,
      {
        id: newId,
        name: "",
        position: "",
        salary: null,
        offerSent: "",
        responseDate: "",
        status: "",
        startDate: "",
      },
    ]);
    setEditingJobOfferId(newId);
  };

  const addOnboardedRow = () => {
    const newId = Date.now();
    setOnboardedRows([
      ...onboardedRows,
      { id: newId, name: "", position: "", salary: null, startDate: "" },
    ]);
    setEditingOnboardedId(newId);
  };

  // Change handlers for Excel-like feel
  const handleSummaryChange = (id: number, field: string, value: any) => {
    setSummaryRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          if (field === "requiredHeadcount" || field === "hired") {
            updatedRow.remaining =
              (updatedRow.requiredHeadcount || 0) - (updatedRow.hired || 0);
          }
          return updatedRow;
        }
        return row;
      }),
    );
  };

  const handleJobOfferChange = (id: number, field: string, value: any) => {
    setJobOffers((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const handleOnboardedChange = (id: number, field: string, value: any) => {
    setOnboardedRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  // Save functions
  const saveSummary = (id: number) => {
    setSummaryRows(prev => prev.map(row => 
      row.id === id ? { ...row, lastUpdate: new Date().toISOString().split('T')[0] } : row
    ));
    setEditingSummaryId(null);
  };

  const saveJobOffer = (id: number) => {
    setEditingJobOfferId(null);
  };

  const saveOnboarded = (id: number) => {
    setEditingOnboardedId(null);
  };

  // Headcount increment/decrement
  const adjustHeadcount = (id: number, amount: number) => {
    if (editingSummaryId !== id) return;
    setSummaryRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const newHC = Math.max(0, row.requiredHeadcount + amount);
          return {
            ...row,
            requiredHeadcount: newHC,
            remaining: newHC - row.hired,
          };
        }
        return row;
      }),
    );
  };

  // Calculations for totals
  const totalSummaryHC = summaryRows.reduce(
    (sum, r) => sum + (r.requiredHeadcount || 0),
    0,
  );
  const totalSummaryHired = summaryRows.reduce(
    (sum, r) => sum + (r.hired || 0),
    0,
  );
  const totalSummaryRemaining = summaryRows.reduce(
    (sum, r) => sum + (r.remaining || 0),
    0,
  );

  // Formatting helper
  const formatSalary = (val: any) => {
    if (val === null || val === undefined || val === "") return "";
    const num = parseFloat(val.toString().replace(/,/g, ""));
    if (isNaN(num)) return val;
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const parseSalary = (val: string) => {
    // Allow digits, one decimal point, and remove commas
    let clean = val.replace(/,/g, "");
    if (clean === "") return null;
    
    // Limit to 1,000,000,000 (enough for most cases, but user suggested 0,000,000.00)
    // Let's cap it at 9,999,999.99 based on the placeholder request "0,000,000.00"
    const num = parseFloat(clean);
    if (num > 9999999.99) clean = "9999999.99";
    
    return clean;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Section */}
      <div className="bg-[#800020] text-white pt-6 px-8 pb-0">
        <h1 className="text-3xl font-bold mb-4">Hiring Report</h1>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button className="bg-white text-[#800020] px-6 py-2 font-bold rounded-t-md text-xs uppercase">
              Hiring
            </button>
            <Link href="/admin-head/hiring/applicants">
              <button className="text-white/90 px-6 py-2 font-bold text-xs hover:bg-white/10 transition-colors uppercase">
                Applicants for Interview
              </button>
            </Link>
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
      <main className="flex-1 overflow-y-auto p-10 space-y-12 bg-white font-sans">
        {/* 1. Hiring Requirement Summary */}
        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1100px]">
          <div 
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors group"
          >
            <div className="flex items-center gap-3">
              {isSummaryOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">
                Hiring Requirement Summary
              </h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addSummaryRow();
              }}
              className="bg-white text-[#800020] border-2 border-[#800020] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm active:scale-95 group-hover:scale-105"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isSummaryOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
            <TableHeader>
              <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[30%] text-sm px-4 uppercase">
                  Position
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">
                  Required
                  <br />
                  Headcount
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">
                  Hired
                  <br />
                  (Onboarded)
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">
                  Remaining
                  <br />
                  Slots
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">
                  Last
                  <br />
                  Update
                </TableHead>
                <TableHead className="text-center font-bold text-black w-[10%] text-sm uppercase">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaryRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0"
                >
                  <TableCell className="border-r-[3px] border-black relative p-0 overflow-hidden">
                    <select
                      value={row.position}
                      disabled={editingSummaryId !== row.id}
                      onChange={(e) =>
                        handleSummaryChange(row.id, "position", e.target.value)
                      }
                      className="w-full h-full bg-transparent border-none appearance-none px-4 font-semibold text-black focus:outline-none disabled:opacity-80"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0 text-center bg-white">
                    <div className="flex items-center justify-center h-full gap-4">
                      <span className="font-bold text-lg min-w-[2ch]">
                        {row.requiredHeadcount}
                      </span>
                      <div className="flex flex-col items-center justify-center -space-y-1">
                        <button
                          disabled={editingSummaryId !== row.id}
                          onClick={() => adjustHeadcount(row.id, 1)}
                          className="hover:bg-slate-100 rounded-sm p-0.5 transition-colors disabled:opacity-20"
                        >
                          <ChevronUp
                            size={22}
                            className="text-black stroke-[3]"
                          />
                        </button>
                        <button
                          disabled={editingSummaryId !== row.id}
                          onClick={() => adjustHeadcount(row.id, -1)}
                          className="hover:bg-slate-100 rounded-sm p-0.5 transition-colors disabled:opacity-20"
                        >
                          <ChevronDown
                            size={22}
                            className="text-black stroke-[3]"
                          />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0">
                    <input
                      type="number"
                      value={row.hired}
                      readOnly={editingSummaryId !== row.id}
                      onChange={(e) =>
                        handleSummaryChange(
                          row.id,
                          "hired",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full h-full bg-transparent border-none text-center font-semibold text-black focus:outline-none read-only:opacity-80"
                    />
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black text-center font-bold text-black text-lg">
                    {row.remaining}
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black text-center font-semibold text-black text-xs">
                    {row.lastUpdate}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-4">
                      {editingSummaryId === row.id ? (
                        <button 
                          onClick={() => saveSummary(row.id)}
                          className="text-green-700 hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Save size={24} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setEditingSummaryId(row.id)}
                          className="text-black hover:scale-110 active:scale-95 transition-transform"
                        >
                          <Edit2 size={24} strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="h-10 font-bold bg-slate-50 border-t-[3px] border-black">
                <TableCell className="text-right border-r-[3px] border-black uppercase px-6 text-[10px] tracking-widest text-[#800020]">
                  TOTAL
                </TableCell>
                <TableCell className="border-r-[3px] border-black text-center text-lg">
                  {totalSummaryHC}
                </TableCell>
                <TableCell className="border-r-[3px] border-black text-center text-lg">
                  {totalSummaryHired}
                </TableCell>
                <TableCell className="border-r-[3px] border-black text-center text-lg">
                  {totalSummaryRemaining}
                </TableCell>
                <TableCell className="border-r-[3px] border-black text-center text-lg"></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
          </div>
        </div>

        {/* 2. Job Offers Sent */}
        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden">
          <div 
            onClick={() => setIsJobOffersOpen(!isJobOffersOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors group"
          >
            <div className="flex items-center gap-3">
              {isJobOffersOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">
                Job Offers Sent
              </h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addJobOfferRow();
              }}
              className="bg-white text-[#800020] border-2 border-[#800020] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm active:scale-95 group-hover:scale-105"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isJobOffersOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
            <TableHeader>
              <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[18%] text-xs px-2 uppercase leading-tight">
                  Applicant Name
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-xs px-2 uppercase leading-tight">
                  Position
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[12%] text-xs px-2 uppercase leading-tight">
                  Salary
                  <br />
                  Offer
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[11%] text-[10px] px-1 uppercase leading-tight">
                  Date Offer
                  <br />
                  Sent
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[11%] text-[10px] px-1 uppercase leading-tight">
                  Date of
                  <br />
                  Response
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[13%] text-[9px] uppercase leading-tight px-1">
                  Offer Status
                  <br />
                  (Pending/Accepted)
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[10%] text-[10px] uppercase leading-tight">
                  Start
                  <br />
                  Date
                </TableHead>
                <TableHead className="text-center font-bold text-black w-[10%] text-sm uppercase">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobOffers.map((row) => (
                <TableRow
                  key={row.id}
                  className={`h-20 border-b-[2px] border-black transition-colors last:border-b-0 ${
                    editingJobOfferId === row.id ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <TableCell className="border-r-[3px] border-black p-0">
                    <input
                      type="text"
                      value={row.name}
                      readOnly={editingJobOfferId !== row.id}
                      onChange={(e) =>
                        handleJobOfferChange(row.id, "name", e.target.value)
                      }
                      className="w-full h-full bg-transparent border-none px-3 font-semibold text-black focus:outline-none read-only:opacity-70"
                    />
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black relative p-0">
                    <select
                      value={row.position}
                      disabled={editingJobOfferId !== row.id}
                      onChange={(e) =>
                        handleJobOfferChange(row.id, "position", e.target.value)
                      }
                      className="w-full h-full bg-transparent border-none appearance-none px-3 font-semibold text-sm text-black focus:outline-none disabled:opacity-70"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0 relative">
                    <div className="flex items-center h-full px-3 w-full">
                      <span className="font-bold text-black text-xl mr-2 select-none">
                        ₱
                      </span>
                      <input
                        type="text"
                        placeholder="0,000,000.00"
                        value={editingJobOfferId === row.id ? (row.salary ?? "") : formatSalary(row.salary)}
                        readOnly={editingJobOfferId !== row.id}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          // Allow only one decimal point
                          const parts = val.split('.');
                          const cleanVal = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
                          handleJobOfferChange(
                            row.id,
                            "salary",
                            parseSalary(cleanVal),
                          );
                        }}
                        className={`w-full h-12 bg-transparent border-none font-bold text-lg text-black focus:outline-none transition-all rounded px-2 ${
                          editingJobOfferId === row.id ? 'cursor-text ring-1 ring-black/10' : 'cursor-default text-right pr-4'
                        }`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0">
                    <input
                      type="date"
                      value={row.offerSent}
                      readOnly={editingJobOfferId !== row.id}
                      onChange={(e) =>
                        handleJobOfferChange(
                          row.id,
                          "offerSent",
                          e.target.value,
                        )
                      }
                      className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                    />
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0">
                    <input
                      type="date"
                      value={row.responseDate}
                      readOnly={editingJobOfferId !== row.id}
                      onChange={(e) =>
                        handleJobOfferChange(
                          row.id,
                          "responseDate",
                          e.target.value,
                        )
                      }
                      className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                    />
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black relative p-0">
                    <select
                      value={row.status}
                      disabled={editingJobOfferId !== row.id}
                      onChange={(e) =>
                        handleJobOfferChange(row.id, "status", e.target.value)
                      }
                      className="w-full h-full bg-transparent border-none appearance-none px-2 font-semibold text-xs text-black focus:outline-none disabled:opacity-70"
                    >
                      {OFFER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0">
                    <input
                      type="date"
                      value={row.startDate}
                      readOnly={editingJobOfferId !== row.id}
                      onChange={(e) =>
                        handleJobOfferChange(
                          row.id,
                          "startDate",
                          e.target.value,
                        )
                      }
                      className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      {editingJobOfferId === row.id ? (
                        <button 
                          onClick={() => saveJobOffer(row.id)}
                          className="text-green-700 p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Save size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setEditingJobOfferId(row.id)}
                          className="text-black p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Edit2 size={18} />
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

        {/* 3. Onboarded */}
        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1000px]">
          <div 
            onClick={() => setIsOnboardedOpen(!isOnboardedOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors group"
          >
            <div className="flex items-center gap-3">
              {isOnboardedOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">
                Onboarded
              </h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addOnboardedRow();
              }}
              className="bg-white text-[#800020] border-2 border-[#800020] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm active:scale-95 group-hover:scale-105"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isOnboardedOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
            <TableHeader>
              <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[25%] text-sm px-4 uppercase">
                  Applicant Name
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[25%] text-sm px-4 uppercase">
                  Position
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[18%] text-sm px-4 uppercase">
                  Salary
                </TableHead>
                <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[17%] text-sm px-4 uppercase leading-tight">
                  Start Date
                </TableHead>
                <TableHead className="text-center font-bold text-black w-[15%] text-sm uppercase">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {onboardedRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0"
                >
                  <TableCell className="border-r-[3px] border-black p-0">
                    <input
                      type="text"
                      value={row.name}
                      readOnly={editingOnboardedId !== row.id}
                      onChange={(e) =>
                        handleOnboardedChange(row.id, "name", e.target.value)
                      }
                      className="w-full h-full bg-transparent border-none px-4 font-bold text-black focus:outline-none read-only:opacity-70"
                    />
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black relative p-0">
                    <select
                      value={row.position}
                      disabled={editingOnboardedId !== row.id}
                      onChange={(e) =>
                        handleOnboardedChange(
                          row.id,
                          "position",
                          e.target.value,
                        )
                      }
                      className="w-full h-full bg-transparent border-none appearance-none px-4 font-bold text-black focus:outline-none cursor-pointer disabled:opacity-70"
                    >
                      {POSITIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0 relative">
                    <div className={`flex items-center h-full px-4 ${editingOnboardedId === row.id ? 'bg-slate-50' : ''}`}>
                      <span className="font-bold text-black text-xl mr-2 select-none">₱</span>
                      <input
                        type="text"
                        placeholder="0,000,000.00"
                        value={editingOnboardedId === row.id ? (row.salary ?? "") : formatSalary(row.salary)}
                        readOnly={editingOnboardedId !== row.id}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          const cleanVal = parts[0] + (parts.length > 1 ? '.' + parts[1].slice(0, 2) : '');
                          handleOnboardedChange(
                            row.id,
                            "salary",
                            parseSalary(cleanVal),
                          );
                        }}
                        className={`w-full h-full bg-transparent border-none font-bold text-black focus:outline-none transition-all rounded py-4 ${
                          editingOnboardedId === row.id ? 'cursor-text ring-1 ring-black/10 px-2' : 'cursor-default text-right pr-4'
                        }`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="border-r-[3px] border-black p-0">
                    <input
                      type="date"
                      value={row.startDate}
                      readOnly={editingOnboardedId !== row.id}
                      onChange={(e) =>
                        handleOnboardedChange(
                          row.id,
                          "startDate",
                          e.target.value,
                        )
                      }
                      className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-70"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-4">
                      {editingOnboardedId === row.id ? (
                        <button 
                          onClick={() => saveOnboarded(row.id)}
                          className="text-green-700 hover:scale-110 transition-transform"
                        >
                          <Save size={24} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setEditingOnboardedId(row.id)}
                          className="text-black hover:scale-110 transition-transform"
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
