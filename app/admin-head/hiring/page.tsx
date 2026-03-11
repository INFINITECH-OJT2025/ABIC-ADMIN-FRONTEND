"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit2, Save, ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiUrl } from "@/lib/api";

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
};

const OFFER_STATUSES: Array<"Pending" | "Accepted" | "Declined"> = ["Pending", "Accepted", "Declined"];

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

export default function HiringReportPage() {
  const [editingSummaryId, setEditingSummaryId] = useState<number | string | null>(null);
  const [editingJobOfferId, setEditingJobOfferId] = useState<number | string | null>(null);

  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isJobOffersOpen, setIsJobOffersOpen] = useState(true);
  const [isOnboardedOpen, setIsOnboardedOpen] = useState(true);

  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const [jobOffers, setJobOffers] = useState<JobOfferRow[]>([]);
  const [jobOfferCandidates, setJobOfferCandidates] = useState<JobOfferCandidate[]>([]);
  const [onboardedRows, setOnboardedRows] = useState<OnboardedRow[]>([]);
  const [positionOptions, setPositionOptions] = useState<string[]>([""]);

  const [searchTerm, setSearchTerm] = useState("");

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

    setSummaryRows(Array.isArray(summaryJson?.data) ? summaryJson.data.map(toSummaryRow) : []);
    setJobOffers(Array.isArray(jobOfferJson?.data) ? jobOfferJson.data.map(toJobOfferRow) : []);
    setJobOfferCandidates(Array.isArray(candidatesJson?.data) ? candidatesJson.data : []);
    setOnboardedRows(Array.isArray(onboardedJson?.data) ? onboardedJson.data : []);
    setPositionOptions(["", ...uniquePositions]);
  };

  useEffect(() => {
    loadData();
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
    const apiUrl = getApiUrl();
    const payload = {
      position: row.position,
      required_headcount: row.requiredHeadcount,
      hired: row.hired,
      last_update: new Date().toISOString().split("T")[0],
    };

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

    if (!response.ok) return;

    const json = await response.json();
    const saved = toSummaryRow(json.data ?? {});
    setSummaryRows((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
    setEditingSummaryId(null);
  };

  const saveJobOffer = async (row: JobOfferRow) => {
    const apiUrl = getApiUrl();
    const payload = {
      final_interview_id: row.finalInterviewId,
      salary: row.salary === null || row.salary === "" ? null : row.salary,
      offer_sent: row.offerSent || null,
      response_date: row.responseDate || null,
      status: row.status,
      start_date: row.startDate || null,
    };

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

    if (!response.ok) return;

    const json = await response.json();
    const saved = toJobOfferRow(json.data ?? {});

    setJobOffers((prev) => prev.map((item) => (item.id === row.id ? saved : item)));
    setEditingJobOfferId(null);
    await loadData();
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

  const totalSummaryHC = filteredSummaryRows.reduce((sum, r) => sum + (r.requiredHeadcount || 0), 0);
  const totalSummaryHired = filteredSummaryRows.reduce((sum, r) => sum + (r.hired || 0), 0);
  const totalSummaryRemaining = filteredSummaryRows.reduce((sum, r) => sum + (r.remaining || 0), 0);

  const formatSalary = (val: string | null) => {
    if (val === null || val === "") return "";
    const num = parseFloat(String(val).replace(/,/g, ""));
    if (Number.isNaN(num)) return val;
    return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-[#800020] text-white pt-6 px-8 pb-0">
        <h1 className="text-3xl font-bold mb-4">Hiring Report</h1>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button className="bg-white text-[#800020] px-6 py-2 font-bold rounded-t-md text-xs uppercase">Hiring</button>
            <Link href="/admin-head/hiring/applicants">
              <button className="text-white/90 px-6 py-2 font-bold text-xs hover:bg-white/10 transition-colors uppercase">
                Applicants for Interview
              </button>
            </Link>
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

      <main className="flex-1 overflow-y-auto p-10 space-y-12 bg-white font-sans">
        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1100px]">
          <div
            onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors"
          >
            <div className="flex items-center gap-3">
              {isSummaryOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">Hiring Requirement Summary</h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addSummaryRow();
              }}
              className="bg-white text-[#800020] border-2 border-[#800020] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isSummaryOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[30%] text-sm px-4 uppercase">Position</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">Required Headcount</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">Hired</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">Remaining Slots</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-[10px] leading-tight uppercase px-2">Last Update</TableHead>
                  <TableHead className="text-center font-bold text-black w-[10%] text-sm uppercase">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaryRows.map((row) => {
                  const editable = row.isNew || editingSummaryId === row.id;
                  return (
                    <TableRow key={row.id} className="h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0">
                      <TableCell className="border-r-[3px] border-black relative p-0 overflow-hidden">
                        <select
                          value={row.position}
                          disabled={!editable}
                          onChange={(e) => handleSummaryChange(row.id, "position", e.target.value)}
                          className="w-full h-full bg-transparent border-none appearance-none px-4 font-semibold text-black focus:outline-none disabled:opacity-80"
                        >
                          {positionOptions.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0 text-center bg-white">
                        <div className="flex items-center justify-center h-full gap-4">
                          <span className="font-bold text-lg min-w-[2ch]">{row.requiredHeadcount}</span>
                          <div className="flex flex-col items-center justify-center -space-y-1">
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
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="number"
                          value={row.hired}
                          readOnly={!editable}
                          onChange={(e) => handleSummaryChange(row.id, "hired", Math.max(parseInt(e.target.value || "0", 10), 0))}
                          className="w-full h-full bg-transparent border-none text-center font-semibold text-black focus:outline-none read-only:opacity-80"
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black text-center font-bold text-black text-lg">{row.remaining}</TableCell>
                      <TableCell className="border-r-[3px] border-black text-center font-semibold text-black text-xs">{row.lastUpdate}</TableCell>
                      <TableCell className="text-center">
                        {editable ? (
                          <button onClick={() => saveSummary(row)} className="text-green-700 hover:scale-110 active:scale-95 transition-transform">
                            <Save size={24} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <button onClick={() => setEditingSummaryId(row.id)} className="text-black hover:scale-110 active:scale-95 transition-transform">
                            <Edit2 size={24} strokeWidth={2.5} />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="h-10 font-bold bg-slate-50 border-t-[3px] border-black">
                  <TableCell className="text-right border-r-[3px] border-black uppercase px-6 text-[10px] tracking-widest text-[#800020]">TOTAL</TableCell>
                  <TableCell className="border-r-[3px] border-black text-center text-lg">{totalSummaryHC}</TableCell>
                  <TableCell className="border-r-[3px] border-black text-center text-lg">{totalSummaryHired}</TableCell>
                  <TableCell className="border-r-[3px] border-black text-center text-lg">{totalSummaryRemaining}</TableCell>
                  <TableCell className="border-r-[3px] border-black" />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden">
          <div
            onClick={() => setIsJobOffersOpen(!isJobOffersOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors"
          >
            <div className="flex items-center gap-3">
              {isJobOffersOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">Job Offers Sent</h2>
            </div>
            <div
              onClick={(e) => {
                e.stopPropagation();
                addJobOfferRow();
              }}
              className="bg-white text-[#800020] border-2 border-[#800020] rounded-full p-0.5 w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-sm active:scale-95"
            >
              <Plus size={20} strokeWidth={4} />
            </div>
          </div>
          <div className={isJobOffersOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[18%] text-xs px-2 uppercase leading-tight">Applicant Name</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[15%] text-xs px-2 uppercase leading-tight">Position</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[12%] text-xs px-2 uppercase leading-tight">Salary Offer</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[11%] text-[10px] px-1 uppercase leading-tight">Date Offer Sent</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[11%] text-[10px] px-1 uppercase leading-tight">Date of Response</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[13%] text-[9px] uppercase leading-tight px-1">Offer Status</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[10%] text-[10px] uppercase leading-tight">Start Date</TableHead>
                  <TableHead className="text-center font-bold text-black w-[10%] text-sm uppercase">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobOffers.map((row) => {
                  const editable = row.isNew || editingJobOfferId === row.id;

                  return (
                    <TableRow
                      key={row.id}
                      className={`h-20 border-b-[2px] border-black transition-colors last:border-b-0 ${editable ? "bg-amber-50/50" : "hover:bg-slate-50/50"}`}
                    >
                      <TableCell className="border-r-[3px] border-black p-0">
                        {row.isNew ? (
                          <select
                            value={row.finalInterviewId ?? ""}
                            disabled={!editable}
                            onChange={(e) => handleJobOfferChange(row.id, "finalInterviewId", e.target.value)}
                            className="w-full h-full bg-transparent border-none appearance-none px-3 font-semibold text-black focus:outline-none disabled:opacity-70"
                          >
                            <option value="">Select passed final interview</option>
                            {jobOfferCandidates.map((candidate) => (
                              <option key={candidate.final_interview_id} value={candidate.final_interview_id}>
                                {candidate.applicant_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="w-full h-full px-3 flex items-center font-semibold text-black">{row.name}</div>
                        )}
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <div className="w-full h-full px-3 flex items-center font-semibold text-sm text-black">{row.position}</div>
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0 relative">
                        <div className="flex items-center h-full px-3 w-full">
                          <span className="font-bold text-black text-xl mr-2 select-none">P</span>
                          <input
                            type="text"
                            placeholder="0,000,000.00"
                            value={editable ? (row.salary ?? "") : formatSalary(row.salary)}
                            readOnly={!editable}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9.]/g, "");
                              const parts = val.split(".");
                              const clean = parts[0] + (parts.length > 1 ? "." + parts[1].slice(0, 2) : "");
                              handleJobOfferChange(row.id, "salary", clean);
                            }}
                            className={`w-full h-12 bg-transparent border-none font-bold text-lg text-black focus:outline-none transition-all rounded px-2 ${
                              editable ? "cursor-text ring-1 ring-black/10" : "cursor-default text-right pr-4"
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="date"
                          value={row.offerSent}
                          readOnly={!editable}
                          onChange={(e) => handleJobOfferChange(row.id, "offerSent", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <input
                          type="date"
                          value={row.responseDate}
                          readOnly={!editable}
                          onChange={(e) => handleJobOfferChange(row.id, "responseDate", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                        />
                      </TableCell>
                      <TableCell className="border-r-[3px] border-black p-0">
                        <select
                          value={row.status}
                          disabled={!editable}
                          onChange={(e) => handleJobOfferChange(row.id, "status", e.target.value)}
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
                          readOnly={!editable}
                          onChange={(e) => handleJobOfferChange(row.id, "startDate", e.target.value)}
                          className="w-full h-full bg-transparent border-none text-center text-xs text-black focus:outline-none px-1 read-only:opacity-70"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {editable ? (
                          <button onClick={() => saveJobOffer(row)} className="text-green-700 p-1 hover:bg-slate-100 rounded transition-colors">
                            <Save size={18} />
                          </button>
                        ) : (
                          <button onClick={() => setEditingJobOfferId(row.id)} className="text-black p-1 hover:bg-slate-100 rounded transition-colors">
                            <Edit2 size={18} />
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

        <div className="border-[3px] border-black rounded-sm shadow-sm overflow-hidden max-w-[1000px]">
          <div
            onClick={() => setIsOnboardedOpen(!isOnboardedOpen)}
            className="bg-[#800020] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black cursor-pointer hover:bg-[#900025] transition-colors"
          >
            <div className="flex items-center gap-3">
              {isOnboardedOpen ? <ChevronDown size={20} className="text-white" /> : <ChevronRight size={20} className="text-white" />}
              <h2 className="font-bold text-sm uppercase tracking-tight select-none">Onboarded</h2>
            </div>
          </div>
          <div className={isOnboardedOpen ? "block" : "hidden"}>
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="border-b-[3px] border-black hover:bg-transparent bg-slate-50">
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[25%] text-sm px-4 uppercase">Applicant Name</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[25%] text-sm px-4 uppercase">Position</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[18%] text-sm px-4 uppercase">Salary</TableHead>
                  <TableHead className="text-center font-bold text-black border-r-[3px] border-black w-[17%] text-sm px-4 uppercase leading-tight">Start Date</TableHead>
                  <TableHead className="text-center font-bold text-black w-[15%] text-sm uppercase">Status Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboardedRows.map((row) => (
                  <TableRow key={row.id} className="h-20 border-b-[2px] border-black hover:bg-slate-50/50 last:border-b-0">
                    <TableCell className="border-r-[3px] border-black px-4 font-bold text-black">{row.name}</TableCell>
                    <TableCell className="border-r-[3px] border-black px-4 font-bold text-black">{row.position}</TableCell>
                    <TableCell className="border-r-[3px] border-black px-4 font-bold text-black">P {formatSalary(row.salary)}</TableCell>
                    <TableCell className="border-r-[3px] border-black px-4 text-center font-bold text-black">{row.startDate || "-"}</TableCell>
                    <TableCell className="text-center text-xs font-bold text-green-700">Accepted Job Offer</TableCell>
                  </TableRow>
                ))}
                {onboardedRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
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
