"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Save, ChevronUp, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiUrl } from "@/lib/api";
import { Toaster } from "@/components/ui";
import { toast } from "sonner";

type SummaryRow = {
  id: number | string;
  position: string;
  requiredHeadcount: number;
  hired: number;
  remaining: number;
  lastUpdate: string;
  isNew?: boolean;
};

type JobOfferRow = {
  id: number | string;
  finalInterviewId: number | null;
  name: string;
  position: string;
  salary: string | null;
  offerSent: string;
  responseDate: string;
  status: "Pending" | "Accepted" | "Declined";
  startDate: string;
  isNew?: boolean;
};

type JobOfferCandidate = {
  final_interview_id: number;
  applicant_name: string;
  position: string;
};

type OnboardedRow = {
  id: number;
  name: string;
  position: string;
  salary: string | null;
  startDate: string;
  jobOfferId?: number | null;
};

function normalizePosition(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function toOnboardedRow(item: Record<string, unknown>): OnboardedRow {
  return {
    id: Number(item.id ?? 0),
    name: String(item.name ?? item.applicant_name ?? ""),
    position: String(item.position ?? ""),
    salary: item.salary ? String(item.salary) : null,
    startDate: String(item.startDate ?? item.start_date ?? ""),
    jobOfferId: item.job_offer_id !== undefined && item.job_offer_id !== null ? Number(item.job_offer_id) : null,
  };
}

const OFFER_STATUSES: Array<"Pending" | "Accepted" | "Declined"> = ["Pending", "Accepted", "Declined"];
const MAX_SALARY_INTEGER_DIGITS = 10;

const HiringPageSkeleton = () => (
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
        <Skeleton className="h-6 w-56 bg-slate-200" />
        <Skeleton className="h-36 w-full rounded-lg bg-slate-100" />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4">
        <Skeleton className="h-6 w-40 bg-slate-200" />
        <Skeleton className="h-24 w-full rounded-lg bg-slate-100" />
      </div>
    </div>
  </div>
);

function toSummaryRow(item: Record<string, unknown>): SummaryRow {
  return {
    id: (item.id as number) ?? "",
    position: (item.position as string) ?? "",
    requiredHeadcount: Number(item.required_headcount ?? 0),
    hired: Number(item.hired ?? 0),
    remaining: Number(item.remaining ?? 0),
    lastUpdate: (item.last_update as string) ?? "",
  };
}

function toJobOfferRow(item: Record<string, unknown>): JobOfferRow {
  return {
    id: (item.id as number) ?? "",
    finalInterviewId: (item.final_interview_id as number | null) ?? null,
    name: (item.applicant_name as string) ?? "",
    position: (item.position as string) ?? "",
    salary: item.salary ? String(item.salary) : null,
    offerSent: (item.offer_sent as string) ?? "",
    responseDate: (item.response_date as string) ?? "",
    status: ((item.status as "Pending" | "Accepted" | "Declined") ?? "Pending"),
    startDate: (item.start_date as string) ?? "",
  };
}

function buildOnboardHref(row: JobOfferRow): string {
  const params = new URLSearchParams({
    view: "onboard",
    job_offer_id: String(row.id ?? ""),
    name: row.name || "",
    position: row.position || "",
    onboarding_date: row.startDate || "",
  });

  return `/admin-head/employee/onboard?${params.toString()}`;
}

export default function HiringReportPage() {
  const [loading, setLoading] = useState(true);
  const [editingSummaryId, setEditingSummaryId] = useState<number | string | null>(null);
  const [editingJobOfferId, setEditingJobOfferId] = useState<number | string | null>(null);
  const [savingSummaryId, setSavingSummaryId] = useState<number | string | null>(null);
  const [savingJobOfferId, setSavingJobOfferId] = useState<number | string | null>(null);

  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isJobOffersOpen, setIsJobOffersOpen] = useState(true);
  const [isOnboardedOpen, setIsOnboardedOpen] = useState(true);

  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOfferRow[]>([]);
  const [jobOfferCandidates, setJobOfferCandidates] = useState<JobOfferCandidate[]>([]);
  const [onboardedRows, setOnboardedRows] = useState<OnboardedRow[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>([""]);

  const [searchTerm, setSearchTerm] = useState("");

  const applyOnboardedCountsToSummary = (rows: SummaryRow[], onboarded: OnboardedRow[]): SummaryRow[] => {
    const onboardedByPosition = onboarded.reduce<Map<string, number>>((acc, item) => {
      const key = normalizePosition(item.position || "");
      if (!key) return acc;
      acc.set(key, (acc.get(key) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

    return rows.map((row) => {
      const hired = onboardedByPosition.get(normalizePosition(row.position || "")) ?? 0;
      return {
        ...row,
        hired,
        remaining: Math.max((row.requiredHeadcount || 0) - hired, 0),
      };
    });
  };

  const loadData = async () => {
    const apiUrl = getApiUrl();

    const [summaryRes, jobOfferRes, candidatesRes, onboardedRes, hierarchyRes] = await Promise.all([
      fetch(`${apiUrl}/api/hiring/summaries`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/job-offers`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/job-offer-candidates`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hiring/onboarded`, { headers: { Accept: "application/json" } }),
      fetch(`${apiUrl}/api/hierarchies`, { headers: { Accept: "application/json" } }),
    ]);

    const summaryJson = await summaryRes.json();
    const jobOfferJson = await jobOfferRes.json();
    const candidatesJson = await candidatesRes.json();
    const onboardedJson = await onboardedRes.json();
    const hierarchyJson = await hierarchyRes.json();

    const hierarchyRows = Array.isArray(hierarchyJson?.data)
      ? hierarchyJson.data
      : Array.isArray(hierarchyJson)
      ? hierarchyJson
      : [];

    const uniquePositions = Array.from<string>(
      new Set<string>(
        hierarchyRows
          .map((row: { name?: unknown }) => (typeof row.name === "string" ? row.name.trim() : ""))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    const nextOnboardedRows = Array.isArray(onboardedJson?.data) ? onboardedJson.data.map(toOnboardedRow) : [];
    const baseSummaryRows = Array.isArray(summaryJson?.data) ? summaryJson.data.map(toSummaryRow) : [];

    setSummaryRows(applyOnboardedCountsToSummary(baseSummaryRows, nextOnboardedRows));
    setJobOffers(Array.isArray(jobOfferJson?.data) ? jobOfferJson.data.map(toJobOfferRow) : []);
    setJobOfferCandidates(Array.isArray(candidatesJson?.data) ? candidatesJson.data : []);
    setOnboardedRows(nextOnboardedRows);
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

  const addSummaryRow = () => {
    const tempId = `tmp-summary-${Date.now()}`;
    setSummaryRows((prev) => [
      ...prev,
      {
        id: tempId,
        position: "",
        requiredHeadcount: 0,
        hired: 0,
        remaining: 0,
        lastUpdate: new Date().toISOString().split("T")[0],
        isNew: true,
      },
    ]);
    setEditingSummaryId(tempId);
  };

  const addJobOfferRow = () => {
    if (jobOfferCandidates.length === 0) {
      toast.error("No passed final interview candidates available.");
      return;
    }

    const tempId = `tmp-job-offer-${Date.now()}`;
    const fallback = jobOfferCandidates[0];

    setJobOffers((prev) => [
      ...prev,
      {
        id: tempId,
        finalInterviewId: fallback?.final_interview_id ?? null,
        name: fallback?.applicant_name ?? "",
        position: fallback?.position ?? "",
        salary: null,
        offerSent: "",
        responseDate: "",
        status: "Pending",
        startDate: "",
        isNew: true,
      },
    ]);

    setEditingJobOfferId(tempId);
  };

  const handleSummaryChange = (id: number | string, field: keyof SummaryRow, value: string | number) => {
    setSummaryRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value } as SummaryRow;
        updated.remaining = Math.max((updated.requiredHeadcount || 0) - (updated.hired || 0), 0);
        return updated;
      })
    );
  };

  const handleJobOfferChange = (id: number | string, field: keyof JobOfferRow, value: string) => {
    setJobOffers((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;

        if (field === "finalInterviewId") {
          const candidate = jobOfferCandidates.find((item) => item.final_interview_id === Number(value));
          return {
            ...row,
            finalInterviewId: candidate?.final_interview_id ?? null,
            name: candidate?.applicant_name ?? "",
            position: candidate?.position ?? "",
          };
        }

        return { ...row, [field]: value } as JobOfferRow;
      })
    );
  };

  const saveSummary = async (row: SummaryRow) => {
    if (savingSummaryId === row.id) return;
    const apiUrl = getApiUrl();
    const payload = {
      position: row.position,
      required_headcount: row.requiredHeadcount,
      hired: onboardedRows.filter((item) => normalizePosition(item.position || "") === normalizePosition(row.position || "")).length,
      last_update: new Date().toISOString().split("T")[0],
    };

    try {
      setSavingSummaryId(row.id);
      const response = row.isNew
        ? await fetch(`${apiUrl}/api/hiring/summaries`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`${apiUrl}/api/hiring/summaries/${row.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        toast.error("Failed to save summary.");
        return;
      }

      const json = await response.json();
      const saved = toSummaryRow(json.data ?? {});
      setSummaryRows((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
      setEditingSummaryId(null);
      await loadData();
      toast.success("Summary updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save summary.");
    } finally {
      setSavingSummaryId(null);
    }
  };

  const saveJobOffer = async (row: JobOfferRow) => {
    if (savingJobOfferId === row.id) return;
    const apiUrl = getApiUrl();
    const needsResponseDate = row.status !== "Pending";
    if (
      !row.finalInterviewId ||
      !row.name ||
      !row.position ||
      !row.salary ||
      !row.offerSent ||
      !row.startDate ||
      (needsResponseDate && !row.responseDate)
    ) {
      toast.error("Complete all required fields before saving.");
      return;
    }

    const normalizedSalary = row.salary === null || row.salary === "" ? null : row.salary.replace(/,/g, "");
    if (normalizedSalary !== null) {
      const [intPartRaw] = normalizedSalary.split(".");
      const intPart = (intPartRaw || "").replace(/\D/g, "");
      if (intPart.length > MAX_SALARY_INTEGER_DIGITS) {
        toast.error("Salary is too large. Use up to 10 digits before the decimal point.");
        return;
      }
    }

    const payload = {
      final_interview_id: row.finalInterviewId,
      salary: normalizedSalary,
      offer_sent: row.offerSent || null,
      response_date: row.responseDate || null,
      status: row.status,
      start_date: row.startDate || null,
    };

    try {
      setSavingJobOfferId(row.id);
      const response = row.isNew
        ? await fetch(`${apiUrl}/api/hiring/job-offers`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`${apiUrl}/api/hiring/job-offers/${row.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        let message = "Failed to save job offer.";
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
      const saved = toJobOfferRow(json.data ?? {});

      setJobOffers((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
      setEditingJobOfferId(null);
      await loadData();
      toast.success("Job offer updated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save job offer.");
    } finally {
      setSavingJobOfferId(null);
    }
  };

  const adjustHeadcount = (id: number | string, amount: number) => {
    if (editingSummaryId !== id) return;

    setSummaryRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const newHeadcount = Math.max(0, row.requiredHeadcount + amount);
        return {
          ...row,
          requiredHeadcount: newHeadcount,
          remaining: Math.max(newHeadcount - row.hired, 0),
        };
      })
    );
  };

  const filteredSummaryRows = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return summaryRows;
    return summaryRows.filter((row) => row.position.toLowerCase().includes(needle));
  }, [summaryRows, searchTerm]);

  const filteredJobOffers = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return jobOffers;
    return jobOffers.filter((row) => `${row.name} ${row.position}`.toLowerCase().includes(needle));
  }, [jobOffers, searchTerm]);

  const onboardedLookup = useMemo(() => {
    const set = new Set<string>();
    onboardedRows.forEach((row) => {
      if (row.jobOfferId !== null && row.jobOfferId !== undefined) {
        set.add(`offer:${row.jobOfferId}`);
      }

      const key = `${normalizeText(row.name)}|${normalizePosition(row.position)}`;
      if (normalizeText(row.name) && normalizePosition(row.position)) {
        set.add(`np:${key}`);
      }
    });
    return set;
  }, [onboardedRows]);

  const isAlreadyOnboarded = (row: JobOfferRow): boolean => {
    const byOfferId = typeof row.id === "number" ? onboardedLookup.has(`offer:${row.id}`) : false;
    if (byOfferId) return true;

    const name = normalizeText(row.name);
    const position = normalizePosition(row.position);
    if (!name || !position) return false;

    return onboardedLookup.has(`np:${name}|${position}`);
  };

  const remainingSlotsByPosition = useMemo(() => {
    const map = new Map<string, number>();
    summaryRows.forEach((row) => {
      const key = normalizePosition(row.position || "");
      if (!key) return;
      map.set(key, Number(row.remaining ?? 0));
    });
    return map;
  }, [summaryRows]);

  const getRemainingSlots = (position: string): number => {
    if (!position) return 0;
    return remainingSlotsByPosition.get(normalizePosition(position)) ?? 0;
  };

  const totalSummaryHC = filteredSummaryRows.reduce((sum, r) => sum + (r.requiredHeadcount || 0), 0);
  const totalSummaryHired = filteredSummaryRows.reduce((sum, r) => sum + (r.hired || 0), 0);
  const totalSummaryRemaining = filteredSummaryRows.reduce((sum, r) => sum + (r.remaining || 0), 0);

  const formatSalary = (val: string | null) => {
    if (val === null || val === "") return "";
    const num = parseFloat(String(val).replace(/,/g, ""));
    if (Number.isNaN(num)) return val;
    return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatSalaryInput = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const hasTrailingDot = cleaned.endsWith(".");
    const parts = cleaned.split(".");
    const integerRaw = (parts[0] || "").replace(/^0+(?=\d)/, "");
    const integerLimited = integerRaw.slice(0, MAX_SALARY_INTEGER_DIGITS);
    const integerFormatted = integerLimited ? Number(integerLimited).toLocaleString("en-US") : "";
    const decimalPart = (parts[1] || "").replace(/\D/g, "").slice(0, 2);

    if (cleaned.includes(".")) {
      return `${integerFormatted || "0"}.${decimalPart}${hasTrailingDot && decimalPart.length === 0 ? "" : ""}`;
    }

    return integerFormatted;
  };

  if (loading) {
    return <HiringPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans flex flex-col">
      <Toaster />
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
        <div className="w-full px-4 md:px-8 py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Hiring Report</h1>
          <p className="text-white/80 text-sm md:text-base">Manage requirements, offers, and onboarding progress.</p>
        </div>

        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex flex-wrap items-center gap-4 lg:gap-8">
              <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                <button className="cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider bg-white text-[#A4163A] shadow-md">
                  Hiring
                </button>
                <Link href="/admin-head/hiring/applicants">
                  <button className="cursor-pointer px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider text-white/70 hover:text-white hover:bg-white/5">
                    Applicants for Interview
                  </button>
                </Link>
              </div>

              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative w-full md:w-[350px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-10 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                    placeholder="Search hiring data..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-3 md:px-6 lg:px-8 pb-8 md:pb-12 space-y-10">
        <div className="w-full bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
          <div
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            className="bg-gradient-to-r from-[#4A081A]/10 to-transparent p-4 border-b-2 border-[#630C22] flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 text-[#4A081A]">
              {isSummaryOpen ? <ChevronDown size={20} className="text-[#4A081A]" /> : <ChevronRight size={20} className="text-[#4A081A]" />}
              <h2 className="text-xl text-[#4A081A] font-bold select-none">Hiring Requirement Summary</h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addSummaryRow();
              }}
              className="bg-white text-[#A4163A] border-2 border-[#A4163A] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-[#A4163A] hover:text-white transition-colors shadow-sm active:scale-95"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isSummaryOpen ? "block" : "hidden"}>
            <Table className="border-collapse w-full text-sm table-fixed">
              <TableHeader>
                <TableRow className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC] hover:bg-[#FFE5EC]/30">
                  <TableHead className="w-[34%] px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Position</TableHead>
                  <TableHead className="w-[14%] px-6 py-4 text-center font-bold text-[#800020] text-sm uppercase tracking-wider">Required Headcount</TableHead>
                  <TableHead className="w-[14%] px-6 py-4 text-center font-bold text-[#800020] text-sm uppercase tracking-wider">Hired (Onboarded)</TableHead>
                  <TableHead className="w-[14%] px-6 py-4 text-center font-bold text-[#800020] text-sm uppercase tracking-wider">Remaining Slots</TableHead>
                  <TableHead className="w-[14%] px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Last Update</TableHead>
                  <TableHead className="w-[10%] px-6 py-4 text-right font-bold text-[#800020] text-sm uppercase tracking-wider">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-stone-100">
                {filteredSummaryRows.map((row) => {
                  const editable = row.isNew || editingSummaryId === row.id;
                  const isSaving = savingSummaryId === row.id;
                  return (
                    <TableRow key={row.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200 group">
                      <TableCell className="px-6 py-4 relative overflow-hidden">
                        <div className="relative">
                          <select
                            value={row.position}
                            disabled={!editable}
                            onChange={(e) => handleSummaryChange(row.id, "position", e.target.value)}
                            className="w-full h-10 bg-white border border-[#E9C8D0] rounded-lg appearance-none px-3 pr-9 font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#A0153E]/20 disabled:opacity-80 disabled:bg-white"
                          >
                            {positionOptions.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B0F2B] pointer-events-none" />
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center bg-white">
                        <div className="relative flex items-center justify-center h-full">
                          <span className="font-bold text-lg">{row.requiredHeadcount}</span>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center -space-y-1">
                            <button
                              disabled={!editable}
                              onClick={() => adjustHeadcount(row.id, 1)}
                              className="hover:bg-slate-100 rounded-sm p-0.5 transition-colors disabled:opacity-20"
                            >
                              <ChevronUp size={22} className="text-black stroke-[3]" />
                            </button>
                            <button
                              disabled={!editable}
                              onClick={() => adjustHeadcount(row.id, -1)}
                              className="hover:bg-slate-100 rounded-sm p-0.5 transition-colors disabled:opacity-20"
                            >
                              <ChevronDown size={22} className="text-black stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <input
                          type="number"
                          value={row.hired}
                          readOnly
                          className="w-full h-full bg-transparent border-none text-center font-semibold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center font-bold text-black text-lg">{row.remaining}</TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-black text-xs">{row.lastUpdate}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {editable ? (
                          <button
                            onClick={() => saveSummary(row)}
                            disabled={isSaving}
                            className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-xs font-bold uppercase tracking-wider h-9 px-3 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Save</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingSummaryId(row.id)}
                            className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-xs font-bold uppercase tracking-wider h-9 px-3 rounded-lg inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="h-10 font-bold bg-[#FFE5EC]/30 border-t border-[#FFE5EC]">
                  <TableCell className="text-right uppercase px-6 text-[10px] tracking-widest text-[#800020]">TOTAL</TableCell>
                  <TableCell className="text-center text-lg px-6">{totalSummaryHC}</TableCell>
                  <TableCell className="text-center text-lg px-6">{totalSummaryHired}</TableCell>
                  <TableCell className="text-center text-lg px-6">{totalSummaryRemaining}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="w-full bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
          <div
            onClick={() => setIsJobOffersOpen(!isJobOffersOpen)}
            className="bg-gradient-to-r from-[#4A081A]/10 to-transparent p-4 border-b-2 border-[#630C22] flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 text-[#4A081A]">
              {isJobOffersOpen ? <ChevronDown size={20} className="text-[#4A081A]" /> : <ChevronRight size={20} className="text-[#4A081A]" />}
              <h2 className="text-xl text-[#4A081A] font-bold select-none">Job Offers Sent</h2>
            </div>
            <div className="w-7 h-7" />
          </div>
          <div className={isJobOffersOpen ? "block" : "hidden"}>
            <Table className="border-collapse w-full text-sm">
              <TableHeader>
                <TableRow className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC] hover:bg-[#FFE5EC]/30">
                  <TableHead className="px-3 py-4 text-left font-bold text-[#800020] text-xs uppercase tracking-wider leading-tight">Applicant Name</TableHead>
                  <TableHead className="px-3 py-4 text-left font-bold text-[#800020] text-xs uppercase tracking-wider leading-tight">Position</TableHead>
                  <TableHead className="px-3 py-4 text-left font-bold text-[#800020] text-xs uppercase tracking-wider leading-tight">Salary Offer</TableHead>
                  <TableHead className="px-3 py-4 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider leading-tight">Date Offer Sent</TableHead>
                  <TableHead className="px-3 py-4 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider leading-tight">Date of Response</TableHead>
                  <TableHead className="px-3 py-4 text-left font-bold text-[#800020] text-[9px] uppercase tracking-wider leading-tight">Offer Status (Pending/Accepted)</TableHead>
                  <TableHead className="px-3 py-4 text-left font-bold text-[#800020] text-[10px] uppercase tracking-wider leading-tight">Start Date</TableHead>
                  <TableHead className="px-3 py-4 text-right font-bold text-[#800020] text-sm uppercase tracking-wider">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-stone-100">
                {filteredJobOffers.map((row) => {
                  const editable = row.isNew || editingJobOfferId === row.id;
                  const onboarded = isAlreadyOnboarded(row);
                  const isSaving = savingJobOfferId === row.id;
                  const needsResponseDate = row.status !== "Pending";
                  const isMissingRequired =
                    !row.finalInterviewId ||
                    !row.name ||
                    !row.position ||
                    !row.salary ||
                    !row.offerSent ||
                    !row.startDate ||
                    (needsResponseDate && !row.responseDate);
                  const remainingSlots = getRemainingSlots(row.position);

                  return (
                    <TableRow
                      key={row.id}
                      className={`transition-colors duration-200 group border-b border-rose-50 ${editable ? "bg-amber-50/50" : "hover:bg-[#FFE5EC]"}`}
                    >
                      <TableCell className="px-3 py-4">
                        <div className="w-full h-full px-3 flex items-center font-semibold text-black">{row.name || "-"}</div>
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <div className="w-full h-full px-3 flex items-center font-semibold text-sm text-black">{row.position}</div>
                      </TableCell>
                      <TableCell className="px-3 py-4 relative">
                        {editable ? (
                          <div className="flex items-center h-full px-3 w-full gap-1.5">
                            <span className="font-bold text-black text-xl select-none">P</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={row.salary ?? ""}
                              onChange={(e) => {
                                const formatted = formatSalaryInput(e.target.value);
                                handleJobOfferChange(row.id, "salary", formatted);
                              }}
                              className="w-full h-12 bg-transparent border-none font-bold text-lg text-black focus:outline-none transition-all rounded px-2 cursor-text ring-1 ring-black/10"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 font-bold text-black text-3 leading-none">
                            <span className="text-xl select-none">P</span>
                            <span className="text-lg">{formatSalary(row.salary) || "0"}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <input
                          type="date"
                          value={row.offerSent}
                          readOnly={!editable}
                          onChange={(e) => handleJobOfferChange(row.id, "offerSent", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <input
                          type="date"
                          value={row.responseDate}
                          readOnly={!editable}
                          onChange={(e) => handleJobOfferChange(row.id, "responseDate", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <div className="relative">
                          <select
                            value={row.status}
                            disabled={!editable}
                            onChange={(e) => handleJobOfferChange(row.id, "status", e.target.value)}
                            className="w-full h-9 bg-white border border-[#E9C8D0] rounded-lg appearance-none px-3 pr-8 font-semibold text-xs text-black focus:outline-none focus:ring-2 focus:ring-[#A0153E]/20 disabled:opacity-70 disabled:bg-white"
                          >
                            {OFFER_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7B0F2B] pointer-events-none" />
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-4">
                        <input
                          type="date"
                          value={row.startDate}
                          readOnly={!editable}
                          onChange={(e) => handleJobOfferChange(row.id, "startDate", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                        />
                      </TableCell>
                      <TableCell className="px-3 py-4 text-right">
                        {editable ? (
                          <button
                            onClick={() => saveJobOffer(row)}
                            disabled={isSaving || isMissingRequired}
                            className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-[10px] font-bold uppercase tracking-wider h-8 px-3 rounded-lg inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            <span>Save</span>
                          </button>
                        ) : onboarded ? (
                          <span className="text-green-700 text-[11px] font-bold uppercase tracking-wide">Onboarded</span>
                        ) : row.status === "Accepted" ? (
                          row.startDate && remainingSlots > 0 ? (
                            <Link href={buildOnboardHref(row)}>
                              <button
                                title="Onboard this applicant"
                                className="px-2 py-1 text-[10px] font-bold uppercase rounded border border-[#800020] text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
                              >
                                Onboard Applicant
                              </button>
                            </Link>
                          ) : remainingSlots <= 0 ? (
                            <button
                              disabled
                              title="No remaining slots for this position. Increase headcount to onboard."
                              className="px-2 py-1 text-[10px] font-bold uppercase rounded border border-[#800020] text-[#800020] opacity-50 cursor-not-allowed"
                            >
                              No Slots
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Set Start Date first before onboarding."
                              className="px-2 py-1 text-[10px] font-bold uppercase rounded border border-[#800020] text-[#800020] opacity-50 cursor-not-allowed"
                            >
                              Onboard Applicant
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => setEditingJobOfferId(row.id)}
                            className="bg-white text-[#7B0F2B] border border-[#7B0F2B] hover:bg-[#FDF2F5] transition-all duration-200 text-[10px] font-bold uppercase tracking-wider h-8 px-3 rounded-lg inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="w-full bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-lg">
          <div
            onClick={() => setIsOnboardedOpen(!isOnboardedOpen)}
            className="bg-gradient-to-r from-[#4A081A]/10 to-transparent p-4 border-b-2 border-[#630C22] flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 text-[#4A081A]">
              {isOnboardedOpen ? <ChevronDown size={20} className="text-[#4A081A]" /> : <ChevronRight size={20} className="text-[#4A081A]" />}
              <h2 className="text-xl text-[#4A081A] font-bold select-none">Onboarded</h2>
            </div>
          </div>
          <div className={isOnboardedOpen ? "block" : "hidden"}>
            <Table className="border-collapse w-full text-sm">
              <TableHeader>
                <TableRow className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC] hover:bg-[#FFE5EC]/30">
                  <TableHead className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Applicant Name</TableHead>
                  <TableHead className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Position</TableHead>
                  <TableHead className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Salary</TableHead>
                  <TableHead className="px-6 py-4 text-left font-bold text-[#800020] text-sm uppercase tracking-wider">Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-stone-100">
                {onboardedRows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200 group">
                    <TableCell className="px-6 py-4 font-bold text-black">{row.name}</TableCell>
                    <TableCell className="px-6 py-4 font-bold text-black">{row.position}</TableCell>
                    <TableCell className="px-6 py-4 font-bold text-black">P {formatSalary(row.salary)}</TableCell>
                    <TableCell className="px-6 py-4 font-bold text-black">{row.startDate || "-"}</TableCell>
                  </TableRow>
                ))}
                {onboardedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No onboarded records yet.
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
