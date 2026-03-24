"use client";


import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Briefcase,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


interface LeaveCredit {
  employee_name: string;
  department: string;
  regularization_date: string | null;
  has_one_year_regular: boolean;
  vl_total: number;
  sl_total: number;
  vl_used: number;
  sl_used: number;
  vl_balance: number;
  sl_balance: number;
}


export default function LeaveCreditsPage() {
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<LeaveCredit[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  useEffect(() => {
    fetchCredits();
  }, []);


  const fetchCredits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl()}/api/leaves/credits`);
      const result = await response.json();
      if (result.success) {
        setCredits(result.data);
      } else {
        toast.error("Failed to fetch leave credits");
      }
    } catch (error) {
      console.error("Error fetching leave credits:", error);
      toast.error("An error occurred while fetching leave credits");
    } finally {
      setLoading(false);
    }
  };


  const filteredCredits = credits
    .filter(
      (c) =>
        c.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        (c.department &&
          c.department.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => {
      // Sort by status: Qualified (true) on top
      if (a.has_one_year_regular && !b.has_one_year_regular) return -1;
      if (!a.has_one_year_regular && b.has_one_year_regular) return 1;


      // Within same status, sort by total leave balance (VL + SL) highest to lowest
      const totalA = a.vl_balance + a.sl_balance;
      const totalB = b.vl_balance + b.sl_balance;
      return totalB - totalA;
    });


  const totalPages = Math.ceil(filteredCredits.length / itemsPerPage);
  const paginatedCredits = filteredCredits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );


  const stats = {
    totalEmployees: credits.length,
    qualified: credits.filter((c) => c.has_one_year_regular).length,
    totalVLRemaining: credits.reduce((sum, c) => sum + c.vl_balance, 0),
    totalSLRemaining: credits.reduce((sum, c) => sum + c.sl_balance, 0),
  };


  if (loading) return <LeaveCreditsSkeleton />;


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans pb-12 animate-in fade-in duration-500">
      <div className="relative w-full">
        {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
        <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-8 sticky top-0 z-50">
          {/* Main Header Row */}
          <div className="w-full px-4 md:px-8 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-3xl font-black tracking-tight mb-1 uppercase">
                  Leave <span className="opacity-80">Credits</span>
                </h1>
                <p className="text-white/80 text-xs md:text-sm flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4" />
                  Manage and track employee vacation and sick leave entitlements
                </p>
              </div>
            </div>
          </div>


          {/* Secondary Toolbar with Pills, Search, and Refresh */}
          <div className="border-t border-white/10 bg-[#A4163A] backdrop-blur-sm">
            <div className="w-full px-4 md:px-8 py-3 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Stats Pills Area */}
              <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-[11px] font-black uppercase tracking-wider text-white/90">
                <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 shadow-sm">
                  <Users className="h-4 w-4" />
                  Total Employees: {stats.totalEmployees}
                </div>


                <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 shadow-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Qualified: {stats.qualified}
                </div>


                <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                  VL Balance: {stats.totalVLRemaining}
                </div>


                <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 shadow-sm">
                  <Briefcase className="h-4 w-4" />
                  SL Balance: {stats.totalSLRemaining}
                </div>
              </div>


              {/* Action Area (Search & Refresh) */}
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 !text-[#7B0F2B]/60" />
                  <Input
                    placeholder="Search employees..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 h-10 !bg-white !text-[#7B0F2B] !border-white placeholder:!text-[#7B0F2B]/40 font-black rounded-lg shadow-md transition-all border-2 focus:ring-rose-200"
                  />
                </div>


                <Button
                  onClick={fetchCredits}
                  className="bg-white text-[#7B0F2B] hover:bg-rose-50 px-6 h-10 rounded-lg font-black transition-all flex items-center gap-2 text-xs md:text-sm shadow-md uppercase tracking-wider border-none"
                >
                  <Clock className="w-4 h-4 text-[#7B0F2B]" />
                  REFRESH
                </Button>
              </div>
            </div>
          </div>
        </div>


        <div className="px-4 md:px-8 space-y-8">
          <Card className="bg-white border-2 border-[#FFE5EC] shadow-xl overflow-hidden rounded-2xl flex flex-col">
            <CardHeader className="bg-gradient-to-r from-[#4A081A]/10 to-transparent py-4 border-b-2 border-[#630C22] px-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-xl text-[#4A081A] font-black uppercase tracking-wider">
                  Employee Credits List
                </CardTitle>
                <CardDescription className="text-[#A0153E]/70 flex items-center gap-2 text-xs font-bold">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#C9184A]" />
                  Showing {filteredCredits.length} total employees
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FFE5EC]/30 border-b border-[#FFE5EC]">
                      <th className="px-4 py-3 text-[11px] font-black text-[#800020] uppercase tracking-widest">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black text-[#800020] uppercase tracking-widest">
                        Regularization
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black text-[#800020] uppercase tracking-widest text-center">
                        Status
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black text-[#800020] uppercase tracking-widest text-center">
                        Vacation Leave
                      </th>
                      <th className="px-4 py-3 text-[11px] font-black text-[#800020] uppercase tracking-widest text-center">
                        Sick Leave
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FFE5EC]/50 font-medium">
                    {paginatedCredits.length > 0 ? (
                      paginatedCredits.map((item) => (
                        <tr key={item.employee_name} className="hover:bg-rose-50/30 transition-colors group">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-black text-[#4A081A] text-sm group-hover:text-[#630C22] transition-colors leading-tight">
                                {item.employee_name}
                              </div>
                              <div className="text-[10px] text-stone-500 font-bold flex items-center gap-1 mt-0.5 uppercase tracking-wide">
                                <Briefcase className="w-3 h-3 opacity-70" />
                                {item.department || "No Department"}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-stone-600 text-xs">
                            {item.regularization_date
                              ? new Date(item.regularization_date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "Pending"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.has_one_year_regular ? (
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 py-0.5 px-2 rounded-md text-[9px] font-black uppercase tracking-wider">
                                Qualified
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-stone-400 border-stone-200 py-0.5 px-2 rounded-md text-[9px] font-black uppercase tracking-wider"
                              >
                                Ineligible
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center">
                              <div className="flex items-end gap-1">
                                <span className="text-base font-black text-[#4A081A]">
                                  {item.vl_balance}
                                </span>
                                <span className="text-[9px] font-black text-stone-400 uppercase mb-0.5">
                                  / {item.vl_total}
                                </span>
                              </div>
                              <div className="w-20 h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden border border-stone-100/50">
                                <div
                                  className="h-full bg-gradient-to-r from-[#A4163A] to-[#630C22] rounded-full"
                                  style={{
                                    width: `${item.vl_total > 0 ? (item.vl_balance / item.vl_total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[9px] text-stone-500 font-black uppercase mt-1 tracking-tight">
                                {item.vl_used} Used
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center">
                              <div className="flex items-end gap-1">
                                <span className="text-base font-black text-[#4A081A]">
                                  {item.sl_balance}
                                </span>
                                <span className="text-[9px] font-black text-stone-400 uppercase mb-0.5">
                                  / {item.sl_total}
                                </span>
                              </div>
                              <div className="w-20 h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden border border-stone-100/50">
                                <div
                                  className="h-full bg-orange-500 rounded-full"
                                  style={{
                                    width: `${item.sl_total > 0 ? (item.sl_balance / item.sl_total) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[9px] text-stone-500 font-black uppercase mt-1 tracking-tight">
                                {item.sl_used} Used
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-200">
                              <Users className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <div className="text-base font-black text-[#4A081A] uppercase tracking-wide">
                                No Results Found
                              </div>
                              <div className="text-stone-400 font-bold text-xs">
                                We couldn't find any match for "{search}"
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              className="text-[#630C22] font-black uppercase underline decoration-2 underline-offset-4 text-xs h-auto py-1"
                              onClick={() => setSearch("")}
                            >
                              Clear search
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>


              {totalPages > 1 && (
                <div className="px-6 py-4 bg-[#FFE5EC]/10 border-t-2 border-[#FFE5EC] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[10px] text-stone-500 font-black uppercase tracking-wider">
                    Showing{" "}
                    <span className="text-[#4A081A]">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{" "}
                    to{" "}
                    <span className="text-[#4A081A]">
                      {Math.min(
                        currentPage * itemsPerPage,
                        filteredCredits.length,
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="text-[#4A081A]">
                      {filteredCredits.length}
                    </span>{" "}
                    Employees
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-lg border border-stone-100 hover:border-[#FFE5EC] text-stone-600 transition-all"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "ghost"}
                            className={cn(
                              "w-8 h-8 rounded-lg p-0 font-black text-xs transition-all",
                              currentPage === page
                                ? "bg-[#800020] text-white shadow-sm scale-105"
                                : "text-stone-600 hover:bg-rose-50",
                            )}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ),
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8 rounded-lg border border-stone-100 hover:border-[#FFE5EC] text-stone-600 transition-all font-black"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-4 p-5 bg-white rounded-xl border-2 border-[#FFE5EC] shadow-sm relative overflow-hidden group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#630C22]" />
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-[#630C22]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-[#4A081A] uppercase tracking-wider">
                Credit Policy Briefing
              </h4>
              <p className="text-stone-600 leading-relaxed font-bold text-xs">
                Employees are granted{" "}
                <span className="text-[#630C22] underline decoration-rose-200">
                  15 days Vacation Leave
                </span>{" "}
                and{" "}
                <span className="text-orange-600 underline decoration-orange-100">
                  15 days Sick Leave
                </span>{" "}
                annually. Benefits are automatically enabled after{" "}
                <span className="font-black text-[#4A081A]">
                  one year of service following regularization
                </span>
                . New employees or those regularized for less than one year are
                ineligible for these credits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function LeaveCreditsSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Integrated Header Placeholder */}
      <div className="sticky top-0 z-50 bg-white px-6 py-4 flex items-center justify-between shadow-sm mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-48 rounded-lg" />
        </div>
      </div>


      <div className="px-8 space-y-8">
        <Card className="bg-white shadow-sm rounded-2xl">
          <CardHeader className="p-6">
            <Skeleton className="h-8 w-64 bg-stone-200/50" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6 space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-1/4 bg-stone-100" />
                  <Skeleton className="h-12 w-1/4 bg-stone-100" />
                  <Skeleton className="h-12 w-1/4 bg-stone-100" />
                  <Skeleton className="h-12 w-1/4 bg-stone-100" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}