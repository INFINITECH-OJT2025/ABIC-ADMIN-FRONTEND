"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Save, ChevronDown, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";

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

type OnboardedRow = {
  position: string;
};

const INTERVIEW_STATUSES: InterviewStatus[] = ["PENDING", "CONFIRMED", "PASSED", "FAILED"];

const ApplicantsPageSkeleton = () => (
  <div className="flex-1 flex flex-col animate-pulse">
    <div className="bg-white border-b border-slate-200 shadow-sm mb-6 overflow-hidden">
      <div className="w-full px-4 md:px-8 py-6">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 bg-slate-200" />
          <Skeleton className="h-4 w-96 bg-slate-100" />
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="w-full px-4 md:px-8 py-3">
          <div className="flex flex-wrap items-center gap-8">
            <Skeleton className="h-8 w-64 rounded-lg bg-slate-200" />
            <Skeleton className="h-10 w-80 rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>

    <div className="px-3 md:px-6 lg:px-8 pb-8 md:pb-12 space-y-10">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
        <Skeleton className="h-6 w-72 bg-slate-200" />
        <Skeleton className="h-44 w-full rounded-lg bg-slate-100" />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
        <Skeleton className="h-6 w-64 bg-slate-200" />
        <Skeleton className="h-36 w-full rounded-lg bg-slate-100" />
      </div>
    </div>
  </div>
);

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

function normalizePosition(value: string): string {
  return value.trim().toLowerCase();
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
  const [initialNameErrors, setInitialNameErrors] = useState<Record<string, string>>({});
  const [savingInitialId, setSavingInitialId] = useState<number | string | null>(null);
  const [savingFinalId, setSavingFinalId] = useState<number | string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${getApiUrl()}/api/auth/me`, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.role) {
          setUserRole(data.data.role);
        }
      })
      .catch(err => console.error("Error fetching role:", err));
  }, []);

  const isViewer = userRole === 'super_admin_viewer';

  const loadData = async () => {
    const apiUrl = getApiUrl();

    const [initialRes, finalRes, finalCandidatesRes, summariesRes, onboardedRes] = await Promise.all([
      fetch(`${apiUrl}/api/hiring/interviews?stage=initial`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/interviews?stage=final`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/interviews/final-candidates`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/summaries`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/onboarded`, { headers: { Accept: "application/json" } }),
    ]);

    const initialJson = await initialRes.json();
    const finalJson = await finalRes.json();
    const finalCandidatesJson = await finalCandidatesRes.json();
    const summariesJson = await summariesRes.json();
    const onboardedJson = await onboardedRes.json();

    const summaryRows = Array.isArray(summariesJson?.data)
      ? summariesJson.data
      : Array.isArray(summariesJson)
      ? summariesJson
      : [];

    const onboardedRows: OnboardedRow[] = Array.isArray(onboardedJson?.data)
      ? onboardedJson.data
      : Array.isArray(onboardedJson)
      ? onboardedJson
      : [];

    const onboardedCountByPosition = onboardedRows.reduce<Map<string, number>>((acc, row) => {
      const key = normalizePosition(typeof row?.position === "string" ? row.position : "");
      if (!key) return acc;
      acc.set(key, (acc.get(key) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

    const uniquePositions = Array.from<string>(
      new Set<string>(
        summaryRows
          .filter((row: { position?: unknown; required_headcount?: unknown }) => {
            const position = typeof row.position === "string" ? row.position.trim() : "";
            if (!position) return false;

            const requiredHeadcount = Number(row.required_headcount ?? 0);
            const onboardedCount = onboardedCountByPosition.get(normalizePosition(position)) ?? 0;

            return requiredHeadcount - onboardedCount > 0;
          })
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
    const hasIncompleteDraft = initialRows.some(
      (row) =>
        row.isNew &&
        (!String(row.name ?? "").trim() ||
          !String(row.position ?? "").trim() ||
          !String(row.date ?? "").trim() ||
          !String(row.time ?? "").trim()),
    );

    if (hasIncompleteDraft) {
      toast.error("Complete the current initial interview draft before adding another row.");
      return;
    }

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

  const handleInitialChange = (id: number | string, field: keyof InterviewRow, value: string) => {
    if (field === "name") {
      setInitialNameErrors((prev) => {
        const key = String(id);
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

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
    if (savingInitialId === row.id) return;
    if (!row.date || !row.time) {
      toast.error("Interview date and time are required.");
      return;
    }
    const apiUrl = getApiUrl();
    const rowKey = String(row.id);
    setInitialNameErrors((prev) => {
      if (!prev[rowKey]) return prev;
      const next = { ...prev };
      delete next[rowKey];
      return next;
    });

    const payload = {
      stage: "initial",
      applicant_name: row.name,
      position: row.position || null,
      interview_date: row.date || null,
      interview_time: row.time || null,
      status: row.status,
    };

    try {
      setSavingInitialId(row.id);
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
        let message = "Failed to save initial interview row.";
        try {
          const errorJson = await response.json();
          if (typeof errorJson?.message === "string" && errorJson.message.trim()) {
            message = errorJson.message;
          } else if (errorJson?.errors && typeof errorJson.errors === "object") {
            const firstFieldErrors = Object.values(errorJson.errors)[0];
            if (Array.isArray(firstFieldErrors) && firstFieldErrors[0]) {
              message = String(firstFieldErrors[0]);
            }
          }
        } catch {
          // Keep generic message when response is not JSON.
        }

        const duplicateNamePattern = /name already exists|already exists in interviews|already exists in employee records/i;
        if (duplicateNamePattern.test(message)) {
          setInitialNameErrors((prev) => ({
            ...prev,
            [rowKey]: "Name already exists",
          }));
          return;
        }

        toast.error(message);
        return;
      }

      const json = await response.json();
      const saved = toRow(json.data ?? {});

      setInitialNameErrors((prev) => {
        if (!prev[rowKey]) return prev;
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });

      setInitialRows((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
      setEditingInitialId(null);
      await loadData();
    } finally {
      setSavingInitialId(null);
    }
  };

  const saveFinal = async (row: InterviewRow) => {
    if (savingFinalId === row.id) return;
    if (!row.date || !row.time) {
      toast.error("Interview date and time are required.");
      return;
    }
    const apiUrl = getApiUrl();
    const payload = {
      stage: "final",
      initial_interview_id: row.initialInterviewId,
      interview_date: row.date || null,
      interview_time: row.time || null,
      status: row.status,
    };

    try {
      setSavingFinalId(row.id);
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
        let message = "Failed to save final interview row.";
        try {
          const errorJson = await response.json();
          if (typeof errorJson?.message === "string" && errorJson.message.trim()) {
            message = errorJson.message;
          } else if (errorJson?.errors && typeof errorJson.errors === "object") {
            const firstFieldErrors = Object.values(errorJson.errors)[0];
            if (Array.isArray(firstFieldErrors) && firstFieldErrors[0]) {
              message = String(firstFieldErrors[0]);
            }
          }
        } catch {
          // Keep generic message when response is not JSON.
        }

        toast.error(message);
        return;
      }

      const json = await response.json();
      const saved = toRow(json.data ?? {});

      setFinalRows((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
      setEditingFinalId(null);

      await loadData();
    } finally {
      setSavingFinalId(null);
    }
  };

  const filteredInitialRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const visibleRows = initialRows.filter(
      (row) =>
        row.status !== "PASSED" ||
        row.id === editingInitialId ||
        row.id === savingInitialId,
    );
    if (!needle) return visibleRows;
    return visibleRows.filter((row) => `${row.name} ${row.position}`.toLowerCase().includes(needle));
  }, [initialRows, searchTerm, editingInitialId, savingInitialId]);

  const filteredFinalRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const visibleRows = finalRows.filter(
      (row) =>
        row.status !== "PASSED" ||
        row.id === editingFinalId ||
        row.id === savingFinalId,
    );
    if (!needle) return visibleRows;
    return visibleRows.filter((row) => `${row.name} ${row.position}`.toLowerCase().includes(needle));
  }, [finalRows, searchTerm, editingFinalId, savingFinalId]);

  const isInitialEditable = (row: InterviewRow) => !isViewer && (row.isNew || editingInitialId === row.id);
  const isFinalEditable = (row: InterviewRow) => !isViewer && (row.isNew || editingFinalId === row.id);

  if (loading) {
    return <ApplicantsPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans flex flex-col">
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
        <div className="w-full px-4 md:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Hiring Report</h1>
          <p className="text-white/80 text-sm md:text-base">Manage interview applicants and schedules.</p>
        </div>

        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
              <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                <Link href="/admin-head/hiring">
                  <button className="cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5">
                    Hiring
                  </button>
                </Link>
                <button className="cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider bg-white text-[#A4163A] shadow-md">
                  Applicants for Interview
                </button>
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative w-full md:w-[350px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                    placeholder="Search applicant..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-3 md:px-6 lg:px-8 pb-8 md:pb-12 space-y-10 text-black">
        <div className="w-full bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-xl">
          <div
            onClick={() => setIsInitialOpen(!isInitialOpen)}
            className="bg-gradient-to-r from-[#4A081A]/10 to-transparent p-4 border-b-2 border-[#630C22] flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 text-[#4A081A]">
              {isInitialOpen ? <ChevronDown size={20} className="text-[#4A081A]" /> : <ChevronRight size={20} className="text-[#4A081A]" />}
              <h2 className="text-xl text-[#4A081A] font-bold select-none">For Initial Interview</h2>
            </div>
            {!isViewer && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  addInitialRow();
                }}
                className="bg-white text-[#A4163A] border-2 border-[#A4163A] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-[#A4163A] hover:text-white transition-colors shadow-sm active:scale-95"
              >
                <Plus size={20} strokeWidth={4} />
              </div>
            )}
          </div>
          <div className={isInitialOpen ? "block" : "hidden"}>
            <Table className="border-collapse w-full text-[12px] table-fixed">
              <TableHeader>
                <TableRow className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC] hover:bg-[#FFE5EC]/30">
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Applicant Name</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Position</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Interview Date</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Interview Time</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Status</TableHead>
                  {!isViewer && <TableHead className="px-4 py-2 text-right font-bold text-[#800020] text-[10px] uppercase tracking-wider">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-stone-100">
                {filteredInitialRows.map((row) => {
                  const editable = isInitialEditable(row);
                  const isSaving = savingInitialId === row.id;
                  const isMissingDateTime = !row.date || !row.time;
                  const rowNameError = initialNameErrors[String(row.id)] ?? "";
                  const rowPositionOptions = row.position && !positionOptions.includes(row.position)
                    ? [...positionOptions, row.position].sort((a, b) => a.localeCompare(b))
                    : positionOptions;
                  return (
                    <TableRow
                      key={row.id}
                      className={`border-b border-rose-50 transition-colors duration-200 group ${editable ? "bg-amber-50/50 hover:bg-amber-50/50 hover:[&>td]:bg-amber-50/50" : "hover:bg-[#FFE5EC] hover:[&>td]:bg-[#FFE5EC]"}`}
                    >
                      <TableCell className="px-4 py-2 relative border-r border-rose-50/40">
                        {editable && rowNameError && (
                          <div className="absolute right-2 top-1 z-10 flex items-center gap-1 text-[11px] font-semibold text-[#ff2d55]">
                            <AlertCircle size={12} />
                            <span>{rowNameError}</span>
                          </div>
                        )}
                        <input
                          type="text"
                          value={row.name}
                          readOnly={!editable}
                          onChange={(e) => handleInitialChange(row.id, "name", e.target.value)}
                          className={`w-full h-10 bg-white px-3 font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#A0153E]/20 placeholder:text-stone-300 read-only:cursor-default rounded-lg border ${
                            editable && rowNameError ? "border-[#ff4d6d]" : "border-[#E9C8D0]"
                          }`}
                          placeholder="Name..."
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <div className="relative">
                          <select
                            value={row.position}
                            disabled={!editable}
                            onChange={(e) => handleInitialChange(row.id, "position", e.target.value)}
                            className="w-full h-10 bg-white border border-[#E9C8D0] rounded-lg appearance-none px-3 pr-9 font-bold text-black focus:outline-none focus:ring-2 focus:ring-[#A0153E]/20 disabled:opacity-80 disabled:bg-white"
                          >
                            {rowPositionOptions.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B0F2B] pointer-events-none" />
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <input
                          type="date"
                          value={row.date || ""}
                          readOnly={!editable}
                          onChange={(e) => handleInitialChange(row.id, "date", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <input
                          type="time"
                          value={row.time || ""}
                          readOnly={!editable}
                          onChange={(e) => handleInitialChange(row.id, "time", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <div className="relative">
                          <select
                            value={row.status}
                            disabled={!editable}
                            onChange={(e) => handleInitialChange(row.id, "status", e.target.value as InterviewStatus)}
                            className={`w-full h-9 bg-white border border-[#E9C8D0] rounded-lg appearance-none px-3 pr-8 font-bold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#A0153E]/20 disabled:opacity-80 disabled:bg-white ${
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
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B0F2B] pointer-events-none" />
                        </div>
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="px-4 py-2 text-right">
                          {editable ? (
                            <button
                              onClick={() => saveInitial(row)}
                              disabled={isSaving || isMissingDateTime}
                              className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-[10px] font-bold uppercase tracking-wider h-8 px-2.5 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              <span>Save</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingInitialId(row.id)}
                              className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-[10px] font-bold uppercase tracking-wider h-8 px-2.5 rounded-lg inline-flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          )}
                        </TableCell>
                      )}
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

        <div className="w-full bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-xl">
          <div
            onClick={() => setIsFinalOpen(!isFinalOpen)}
            className="bg-gradient-to-r from-[#4A081A]/10 to-transparent p-4 border-b-2 border-[#630C22] flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 text-[#4A081A]">
              {isFinalOpen ? <ChevronDown size={20} className="text-[#4A081A]" /> : <ChevronRight size={20} className="text-[#4A081A]" />}
              <h2 className="text-xl text-[#4A081A] font-bold select-none">For Final Interview</h2>
            </div>
            <div className="w-7 h-7" />
          </div>
          <div className={isFinalOpen ? "block" : "hidden"}>
            <Table className="border-collapse w-full text-[12px] table-fixed">
              <TableHeader>
                <TableRow className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC] hover:bg-[#FFE5EC]/30">
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Applicant Name</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Position</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Interview Date</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Interview Time</TableHead>
                  <TableHead className="px-4 py-2 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider border-r border-[#FFE5EC]/50">Status</TableHead>
                  {!isViewer && <TableHead className="px-4 py-2 text-right font-bold text-[#800020] text-[10px] uppercase tracking-wider">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-stone-100">
                {filteredFinalRows.map((row) => {
                  const editable = isFinalEditable(row);
                  const isSaving = savingFinalId === row.id;
                  const isMissingDateTime = !row.date || !row.time;
                  return (
                    <TableRow
                      key={row.id}
                      className={`border-b border-rose-50 transition-colors duration-200 group ${editable ? "bg-amber-50/50 hover:bg-amber-50/50 hover:[&>td]:bg-amber-50/50" : "hover:bg-[#FFE5EC] hover:[&>td]:bg-[#FFE5EC]"}`}
                    >
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <div className="w-full h-full px-4 flex items-center font-bold text-black">{row.name || "-"}</div>
                      </TableCell>
                      <TableCell className="px-4 py-2 font-bold text-black border-r border-rose-50/40">
                        {row.position || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <input
                          type="date"
                          value={row.date || ""}
                          readOnly={!editable}
                          onChange={(e) => handleFinalChange(row.id, "date", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <input
                          type="time"
                          value={row.time || ""}
                          readOnly={!editable}
                          onChange={(e) => handleFinalChange(row.id, "time", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center font-bold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 border-r border-rose-50/40">
                        <div className="relative">
                          <select
                            value={row.status}
                            disabled={!editable}
                            onChange={(e) => handleFinalChange(row.id, "status", e.target.value as InterviewStatus)}
                            className={`w-full h-9 bg-white border border-[#E9C8D0] rounded-lg appearance-none px-3 pr-8 font-bold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#A0153E]/20 disabled:opacity-80 disabled:bg-white ${
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
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B0F2B] pointer-events-none" />
                        </div>
                      </TableCell>
                      {!isViewer && (
                        <TableCell className="px-4 py-2 text-right">
                          {editable ? (
                            <button
                              onClick={() => saveFinal(row)}
                              disabled={isSaving || isMissingDateTime}
                              className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-[10px] font-bold uppercase tracking-wider h-8 px-2.5 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              <span>Save</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingFinalId(row.id)}
                              className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-[10px] font-bold uppercase tracking-wider h-8 px-2.5 rounded-lg inline-flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          )}
                        </TableCell>
                      )}
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
