"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Sparkles, UserCircle } from "lucide-react";

type CurrentUser = {
  name: string;
  role: string;
};

function formatToday() {
  const now = new Date();
  return now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AdminWelcomePage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    name: "User",
    role: "user",
  });
  const [todayLabel, setTodayLabel] = useState(formatToday());

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      const result = await response.json();

      if (response.ok && result?.success && result?.user) {
        setCurrentUser({
          name: String(result.user.name || "User"),
          role: String(result.user.role || "user"),
        });
        return;
      }
    } catch {
      // Fallback to cookie below.
    }

    try {
      const cookieValue = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("user_info="))
        ?.split("=")[1];

      if (!cookieValue) return;

      const parsed = JSON.parse(decodeURIComponent(cookieValue));
      setCurrentUser({
        name: String(parsed?.name || "User"),
        role: String(parsed?.role || "user"),
      });
    } catch {
      // Keep defaults when cookies are missing or malformed.
    }
  }, []);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    setTodayLabel(formatToday());
  }, []);

  const displayRole = currentUser.role.replace(/_/g, " ").toUpperCase();

  return (
    <section className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md">
        <div className="w-full px-4 md:px-8 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                Admin Home
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                Welcome, {currentUser.name}
              </h1>
              <p className="text-white/80 text-sm md:text-base mt-2">
                You are signed in as {displayRole}.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white border border-white/20 backdrop-blur-md shadow-inner">
                <CalendarDays className="h-3.5 w-3.5 text-white/80" />
                {todayLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white border border-white/20 backdrop-blur-md shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Ready to manage the day
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 md:px-8 py-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-[#9d1238]/10 text-[#9d1238] flex items-center justify-center">
                <UserCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Welcome :user
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  {currentUser.name}
                </h2>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed">
              This is your admin home. Use the navigation on the left to manage
              employees, forms, attendance, hiring, and more. If you need to
              pick up where you left off, start with the module that matters
              most today.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <h3 className="text-lg font-black text-slate-900 mb-4">
              Quick Reminders
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#9d1238]" />
                Review pending employee updates and approvals.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#9d1238]" />
                Check attendance summaries before end-of-day cutoffs.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#9d1238]" />
                Keep forms and templates aligned with current policies.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
