"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Save, ChevronDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiUrl } from "@/lib/api";

type InterviewStatus = "PENDING" | "CONFIRMED" | "PASSED" | "FAILED";

type InterviewRow = {
  id: number | string;
  name: string;
  position: string;
  date: string;
  time: string;
  status: InterviewStatus;
  stage: "initial" | "final";
  initialInterviewId: number | null;
  isNew?: boolean;
};

type FinalCandidate = {
  id: number;
  applicant_name: string;
  position: string;
};

const INTERVIEW_STATUSES: InterviewStatus[] = ["PENDING", "CONFIRMED", "PASSED", "FAILED"];

function toRow(item: Record<string, unknown>): InterviewRow {
  const rawDate = (item.date as string) ?? "";
  const normalizedDate = rawDate.includes("T") ? rawDate.split("T")[0] : rawDate;

  return {
    id: (item.id as number) ?? "",
    name: (item.name as string) ?? "",
    position: (item.position as string) ?? "",
    date: normalizedDate,
    time: (item.time as string) ?? "",
    status: ((item.status as InterviewStatus) ?? "PENDING"),
    stage: ((item.stage as "initial" | "final") ?? "initial"),
    initialInterviewId: (item.initialInterviewId as number | null) ?? null,
  };
}

export default function ApplicantsForInterviewPage() {
  const [editingInitialId, setEditingInitialId] = useState<number | string | null>(null);
  const [editingFinalId, setEditingFinalId] = useState<number | string | null>(null);

  const [isInitialOpen, setIsInitialOpen] = useState(true);
  const [isFinalOpen, setIsFinalOpen] = useState(true);

  const [initialRows, setInitialRows] = useState<InterviewRow[]>([]);
  const [finalRows, setFinalRows] = useState<InterviewRow[]>([]);
  const [finalCandidates, setFinalCandidates] = useState<FinalCandidate[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>([""]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const apiUrl = getApiUrl();

    const [initialRes, finalRes, finalCandidatesRes, summariesRes] = await Promise.all([
      fetch(`${apiUrl}/api/hiring/interviews?stage=initial`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/interviews?stage=final`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/interviews/final-candidates`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/summaries`, { headers: { Accept: "application/json" } }),
    ]);

    const initialJson = await initialRes.json();
    const finalJson = await finalRes.json();
    const finalCandidatesJson = await finalCandidatesRes.json();
    const summariesJson = await summariesRes.json();

    const summaryRows = Array.isArray(summariesJson?.data)
      ? summariesJson.data
      : Array.isArray(summariesJson)
      ? summariesJson
      : [];

    const uniquePositions = Array.from<string>(
      new Set<string>(
        summaryRows
          .map((row: { position?: unknown }) => (typeof row.position === "string" ? row.position.trim() : ""))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    setInitialRows(Array.isArray(initialJson?.data) ? initialJson.data.map(toRow) : []);
    setFinalRows(Array.isArray(finalJson?.data) ? finalJson.data.map(toRow) : []);
    setFinalCandidates(Array.isArray(finalCandidatesJson?.data) ? finalCandidatesJson.data : []);
    setPositionOptions(["", ...uniquePositions]);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const addInitialRow = () => {
    const tempId = `tmp-initial-${Date.now()}`;
    setInitialRows((prev) => [
      ...prev,
      {
        id: tempId,
        name: "",
        position: "",
        date: "",
        time: "",
        status: "PENDING",
        stage: "initial",
        initialInterviewId: null,
        isNew: true,
      },
    ]);
    setEditingInitialId(tempId);
    setIsInitialOpen(true);
  };

  const addFinalRow = () => {
    const tempId = `tmp-final-${Date.now()}`;
    const fallbackCandidate = finalCandidates[0];
    setFinalRows((prev) => [
      ...prev,
      {
        id: tempId,
        name: fallbackCandidate?.applicant_name ?? "",
        position: fallbackCandidate?.position ?? "",
        date: "",
        time: "",
        status: "PENDING",
        stage: "final",
        initialInterviewId: fallbackCandidate?.id ?? null,
        isNew: true,
      },
    ]);
    setEditingFinalId(tempId);
    setIsFinalOpen(true);
  };

  const handleInitialChange = (id: number | string, field: keyof InterviewRow, value: string) => {
    setInitialRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleFinalChange = (id: number | string, field: keyof InterviewRow, value: string) => {
    setFinalRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === "initialInterviewId") {
          const candidate = finalCandidates.find((item) => item.id === Number(value));
          return {
            ...row,
            initialInterviewId: candidate?.id ?? null,
            name: candidate?.applicant_name ?? "",
            position: candidate?.position ?? "",
          };
        }

        return { ...row, [field]: value };
      })
    );
  };

  const saveInitial = async (row: InterviewRow) => {
    const apiUrl = getApiUrl();
    const payload = {
      stage: "initial",
      applicant_name: row.name,
      position: row.position || null,
      interview_date: row.date || null,
      interview_time: row.time || null,
      status: row.status,
    };

    const response = row.isNew
      ? await fetch(`${apiUrl}/api/hiring/interviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`${apiUrl}/api/hiring/interviews/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

    if (!response.ok) {
      return;
    }

    const json = await response.json();
    const saved = toRow(json.data ?? {});

    setInitialRows((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
    setEditingInitialId(null);

    const finalCandidatesRes = await fetch(`${apiUrl}/api/hiring/interviews/final-candidates`, {
      headers: { Accept: "application/json" },
    });
    const finalCandidatesJson = await finalCandidatesRes.json();
    setFinalCandidates(Array.isArray(finalCandidatesJson?.data) ? finalCandidatesJson.data : []);
  };

  const saveFinal = async (row: InterviewRow) => {
    const apiUrl = getApiUrl();
    const payload = {
      stage: "final",
      initial_interview_id: row.initialInterviewId,
      interview_date: row.date || null,
      interview_time: row.time || null,
      status: row.status,
    };

    const response = row.isNew
      ? await fetch(`${apiUrl}/api/hiring/interviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch(`${apiUrl}/api/hiring/interviews/${row.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

    if (!response.ok) {
      return;
    }

    const json = await response.json();
    const saved = toRow(json.data ?? {});

    setFinalRows((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
    setEditingFinalId(null);

    await loadData();
  };

  const filteredInitialRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return initialRows;
    return initialRows.filter((row) => `${row.name} ${row.position}`.toLowerCase().includes(needle));
  }, [initialRows, searchTerm]);

  const filteredFinalRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return finalRows;
    return finalRows.filter((row) => `${row.name} ${row.position}`.toLowerCase().includes(needle));
  }, [finalRows, searchTerm]);

  const isInitialEditable = (row: InterviewRow) => row.isNew || editingInitialId === row.id;
  const isFinalEditable = (row: InterviewRow) => row.isNew || editingFinalId === row.id;

  return (
    <div className="flex flex-col h-full bg-white text-black">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border border-white/60 rounded-sm py-1.5 px-3 pr-10 text-white text-sm focus:outline-none focus:border-white w-80 h-8"
              placeholder="Search..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
          </div>
        </div>
      </div>
      <div className="h-3 bg-[#E5E7EB]" />

      <main className="flex-1 overflow-y-auto p-10 space-y-12 bg-white font-sans text-black">
        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1200px]">
          <div
            onClick={() => setIsInitialOpen(!isInitialOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors"
          >
            <div className="flex items-center gap-3">
              {isInitialOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">For Initial Interview</h2>
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
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[25%]">Applicant Name</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[20%]">Position</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">Interview Date</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">Interview Time</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-[10px] uppercase px-4 w-[15%] leading-tight">Status</TableHead>
                  <TableHead className="text-center font-bold text-black text-xs uppercase px-4 w-[10%]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInitialRows.map((row) => {
                  const editable = isInitialEditable(row);
                  return (
                    <TableRow
                      key={row.id}
                      className={`h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0 ${editable ? "bg-amber-50/50" : ""}`}
                    >
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="text"
                          value={row.name}
                          readOnly={!editable}
                          onChange={(e) => handleInitialChange(row.id, "name", e.target.value)}
                          className="w-full h-full bg-transparent border-none px-4 font-bold text-black focus:outline-none placeholder:text-stone-300 read-only:cursor-default"
                          placeholder="Name..."
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <select
                          value={row.position}
                          disabled={!editable}
                          onChange={(e) => handleInitialChange(row.id, "position", e.target.value)}
                          className="w-full h-full bg-transparent border-none appearance-none px-4 font-bold text-black focus:outline-none disabled:opacity-80"
                        >
                          {positionOptions.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="date"
                          value={row.date || ""}
                          readOnly={!editable}
                          onChange={(e) => handleInitialChange(row.id, "date", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="time"
                          value={row.time || ""}
                          readOnly={!editable}
                          onChange={(e) => handleInitialChange(row.id, "time", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <select
                          value={row.status}
                          disabled={!editable}
                          onChange={(e) => handleInitialChange(row.id, "status", e.target.value as InterviewStatus)}
                          className={`w-full h-full bg-transparent border-none appearance-none text-center font-bold focus:outline-none disabled:opacity-80 ${
                            row.status === "PASSED"
                              ? "text-green-700"
                              : row.status === "CONFIRMED"
                              ? "text-blue-700"
                              : row.status === "FAILED"
                              ? "text-red-700"
                              : "text-amber-600"
                          }`}
                        >
                          {INTERVIEW_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-center">
                        {editable ? (
                          <button
                            onClick={() => saveInitial(row)}
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
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filteredInitialRows.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center py-6" colSpan={6}>
                      No initial interview rows yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1200px]">
          <div
            onClick={() => setIsFinalOpen(!isFinalOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors"
          >
            <div className="flex items-center gap-3">
              {isFinalOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">For Final Interview</h2>
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
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[25%]">Applicant Name</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[20%]">Position</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">Interview Date</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-xs uppercase px-4 w-[15%]">Interview Time</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black text-[10px] uppercase px-4 w-[15%] leading-tight">Status</TableHead>
                  <TableHead className="text-center font-bold text-black text-xs uppercase px-4 w-[10%]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFinalRows.map((row) => {
                  const editable = isFinalEditable(row);
                  return (
                    <TableRow
                      key={row.id}
                      className={`h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0 ${editable ? "bg-amber-50/50" : ""}`}
                    >
                      <TableCell className="border-r-[3px] border-black p-0">
                        <select
                          value={row.initialInterviewId ?? ""}
                          disabled={!editable}
                          onChange={(e) => handleFinalChange(row.id, "initialInterviewId", e.target.value)}
                          className="w-full h-full bg-transparent border-none appearance-none px-4 font-bold text-black focus:outline-none disabled:opacity-80"
                        >
                          <option value="">Select passed initial interview</option>
                          {finalCandidates.map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.applicant_name}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black px-4 font-bold text-black">
                        {row.position || "-"}
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="date"
                          value={row.date || ""}
                          readOnly={!editable}
                          onChange={(e) => handleFinalChange(row.id, "date", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="time"
                          value={row.time || ""}
                          readOnly={!editable}
                          onChange={(e) => handleFinalChange(row.id, "time", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <select
                          value={row.status}
                          disabled={!editable}
                          onChange={(e) => handleFinalChange(row.id, "status", e.target.value as InterviewStatus)}
                          className={`w-full h-full bg-transparent border-none appearance-none text-center font-bold focus:outline-none disabled:opacity-80 ${
                            row.status === "PASSED"
                              ? "text-green-700"
                              : row.status === "CONFIRMED"
                              ? "text-blue-700"
                              : row.status === "FAILED"
                              ? "text-red-700"
                              : "text-amber-600"
                          }`}
                        >
                          {INTERVIEW_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="text-center">
                        {editable ? (
                          <button
                            onClick={() => saveFinal(row)}
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
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loading && filteredFinalRows.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center py-6" colSpan={6}>
                      No final interview rows yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
