"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";
import { useUserRole } from "@/lib/hooks/useUserRole";
import {
  ChevronLeft,
  Printer,
  Mail,
  Loader2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Plus,
  Trash2,
  User,
  Edit3,
  Calendar,
  ShieldCheck,
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmation } from "@/components/providers/confirmation-provider";

// --- Skeleton Component ---
const LetterSkeleton = () => (
  <div className="min-h-screen bg-neutral-100 pb-20">
    <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
    </div>

    <div className="w-full max-w-none mx-auto py-10 px-6 flex flex-wrap justify-center gap-10">
      {[1, 2].map((i) => (
        <Card
          key={i}
          className="border-0 shadow-2xl rounded-none min-h-[1120px] w-[794px] bg-white p-16 space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rotate-45" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 ml-auto" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
          <div className="space-y-4 py-10">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="pt-20 space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// --- Helper Functions ---
const formatDateLong = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const numberToText = (n: number) => {
  const texts = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  return texts[n] || n.toString();
};

const formatEntriesListForTemplate = (
  templateBody: string,
  entriesList: string,
) => {
  const withIndent = (indent: string) =>
    entriesList
      .split(/\r?\n/)
      .map((line) => (line ? `${indent}${line}` : ""))
      .join("\n");

  let out = templateBody.replace(
    /(^|[\r\n])([ \t]*)\{\{\s*(entries_list|etr(?:i|ie)s_list)\s*\}\}[ \t]*$/gim,
    (_match, prefix: string, indent: string) => `${prefix}${withIndent(indent)}`,
  );

  out = out.replace(
    /([ \t]+)\{\{\s*(entries_list|etr(?:i|ie)s_list)\s*\}\}/gim,
    (_match, indent: string) => withIndent(indent),
  );

  return out.replace(
    /\{\{\s*(entries_list|etr(?:i|ie)s_list)\s*\}\}/gim,
    entriesList,
  );
};

// --- Dynamic Schedule Types & Helpers ---
interface ShiftInfo {
  startTimeMinutes: number;
  gracePeriodMinutes: number;
  displayName: string;
  allShifts?: {
    startTimeMinutes: number;
    displayName: string;
    shiftOption: string;
  }[];
}

interface OfficeShiftSchedule {
  id?: number;
  office_name: string;
  shift_options: string[];
}

const DEFAULT_SHIFT_SCHEDULES: Record<string, ShiftInfo> = {
  ABIC: {
    startTimeMinutes: 8 * 60,
    gracePeriodMinutes: 8 * 60 + 5,
    displayName: "8:00 AM",
  },
  INFINITECH: {
    startTimeMinutes: 9 * 60,
    gracePeriodMinutes: 9 * 60 + 5,
    displayName: "9:00 AM",
  },
  "G-LIMIT": {
    startTimeMinutes: 10 * 60,
    gracePeriodMinutes: 10 * 60 + 5,
    displayName: "10:00 AM",
  },
};

const getFriendlyErrorMessage = (msg: string) => {
  const lower = msg.toLowerCase();
  if (
    lower.includes("connection could not be established") ||
    lower.includes("stream_socket_client") ||
    lower.includes("unable to connect") ||
    lower.includes("failed to respond")
  ) {
    return "Server Connection Error: Could not connect to the email server. This is often caused by network issues or firewall blocks. Please try again later or contact your IT representative.";
  }
  if (
    lower.includes("authentication failed") ||
    lower.includes("username and password not accepted") ||
    lower.includes("5.7.8")
  ) {
    return "Email Login Error: The system was unable to log into the official email account. The password might have changed or expired. Please contact support.";
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return "Connection Timeout: The email server is taking too long to respond. Please check your connection and try again.";
  }
  return msg;
};

// ── Convert oklch/lab/lch values → real hex using browser canvas ────
const fixModernColors = (clonedDoc: Document) => {
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = 1;
  const ctx2d = cvs.getContext("2d")!;
  const cache = new Map<string, string>();

  const toHex = (raw: string): string => {
    if (cache.has(raw)) return cache.get(raw)!;
    try {
      ctx2d.clearRect(0, 0, 1, 1);
      ctx2d.fillStyle = "#000";
      ctx2d.fillStyle = raw;
      ctx2d.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx2d.getImageData(0, 0, 1, 1).data;
      const hex =
        a === 0
          ? "transparent"
          : "#" +
            [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
      cache.set(raw, hex);
      return hex;
    } catch {
      cache.set(raw, "#222222");
      return "#222222";
    }
  };

  const fixCss = (css: string): string => {
    const FN = /\b(?:oklch|lab|lch|color-mix|color)\s*\([^()]*\)/gi;
    let prev = "";
    let out = css;
    for (let pass = 0; pass < 8 && out !== prev; pass++) {
      prev = out;
      out = out.replace(FN, (m) => toHex(m));
    }
    return out;
  };

  clonedDoc.querySelectorAll("style").forEach((s) => {
    if (s.textContent) s.textContent = fixCss(s.textContent);
  });

  const cloneWin = clonedDoc.defaultView ?? window;
  const needsFix = (v: string | undefined) =>
    !!v && /\b(?:oklch|lab|lch|color-mix)\s*\(/i.test(v);

  (
    [
      "color",
      "backgroundColor",
      "borderTopColor",
      "borderRightColor",
      "borderBottomColor",
      "borderLeftColor",
      "outlineColor",
      "textDecorationColor",
    ] as const
  ).forEach((prop) => {
    clonedDoc.querySelectorAll<HTMLElement>("*").forEach((node) => {
      const val = cloneWin.getComputedStyle(node)[
        prop as keyof CSSStyleDeclaration
      ] as string | undefined;
      if (needsFix(val)) {
        const css = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
        node.style.setProperty(css, toHex(val!), "important");
      }
    });
  });
};

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  // Handle formats like "08:15:20", "08:15", "13:00"
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0]);
    const minutes = parts[1].padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  }
  return timeStr;
}

/* --- Rich Text Editor for Word-like experience --- */
const StandardRichTextEditor = ({ value, onChange, isViewOnly }: any) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (
      editorRef.current &&
      !isFocused &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, isFocused]);

  const execCommand = (command: string, arg: string | null = null) => {
    if (isViewOnly) return;
    document.execCommand(command, false, arg || undefined);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ command, icon: Icon, arg = null, title }: any) => (
    <Button
      size="sm"
      variant="ghost"
      type="button"
      className="h-8 w-8 p-0 rounded-md hover:bg-[#A4163A]/10 hover:text-[#A4163A] transition-colors"
      onClick={() => execCommand(command, arg)}
      disabled={isViewOnly}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );

  return (
    <div className="flex flex-col border-2 border-amber-100 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-amber-500/10 transition-all bg-white">
      {!isViewOnly && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-amber-50/50 border-b border-amber-100 sticky top-0 z-10">
          <ToolbarButton command="bold" icon={Bold} title="Bold (Ctrl+B)" />
          <ToolbarButton
            command="italic"
            icon={Italic}
            title="Italic (Ctrl+I)"
          />
          <ToolbarButton
            command="underline"
            icon={Underline}
            title="Underline (Ctrl+U)"
          />
          <Separator orientation="vertical" className="h-6 mx-1 bg-amber-200" />
          <ToolbarButton
            command="justifyLeft"
            icon={AlignLeft}
            title="Align Left"
          />
          <ToolbarButton
            command="justifyCenter"
            icon={AlignCenter}
            title="Align Center"
          />
          <ToolbarButton
            command="justifyRight"
            icon={AlignRight}
            title="Align Right"
          />
          <ToolbarButton
            command="justifyFull"
            icon={AlignJustify}
            title="Justify"
          />
          <Separator orientation="vertical" className="h-6 mx-1 bg-amber-200" />
          <ToolbarButton
            command="insertUnorderedList"
            icon={List}
            title="Bullet List"
          />
          <ToolbarButton
            command="insertOrderedList"
            icon={ListOrdered}
            title="Numbered List"
          />
          <Separator orientation="vertical" className="h-6 mx-1 bg-amber-200" />
          <ToolbarButton command="indent" icon={Indent} title="Indent" />
          <ToolbarButton command="outdent" icon={Outdent} title="Outdent" />
        </div>
      )}
      <div
        ref={editorRef}
        contentEditable={!isViewOnly}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        className={cn(
          "min-h-[400px] p-8 focus:outline-none font-serif text-[15px] leading-relaxed text-[#4A081A]",
          isViewOnly && "cursor-not-allowed opacity-80",
        )}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};

function extractStartTime(shiftOption: string): string {
  const parts = shiftOption.split(/\s*[–-]\s*/);
  return parts[0].trim();
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.trim().toUpperCase();
  const match12 = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
  if (match12) {
    let hours = parseInt(match12[1]);
    const minutes = parseInt(match12[2]);
    const period = match12[3];
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const match24 = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1]);
    const minutes = parseInt(match24[2]);
    return hours * 60 + minutes;
  }
  const dateStr = `2000-01-01 ${normalized}`;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.getHours() * 60 + d.getMinutes();
  }
  return 0;
}

function resolveWarningTitle(
  rawTitle: string | undefined,
  fallbackTitle: string,
  warningLevel: number,
) {
  const levelWord =
    warningLevel === 1 ? "FIRST" : warningLevel === 2 ? "SECOND" : "FINAL";

  if (!rawTitle) return fallbackTitle;

  let title = rawTitle.replace(/{{\s*Warning level\s*}}/gi, levelWord);

  if (!/{{\s*Warning level\s*}}/i.test(rawTitle)) {
    title = title.replace(
      /\b(FIRST|SECOND|FINAL)\s+WARNING(?:\s+LETTER)?\b/gi,
      fallbackTitle,
    );
  }

  return title;
}

function FormLetterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isViewOnly } = useUserRole();
  const { confirm } = useConfirmation();

  const employeeId = searchParams.get("employeeId");
  const type = searchParams.get("type"); // 'late' or 'leave'
  const normalizedType = type === "tardiness" ? "late" : type;
  const effectiveType = normalizedType === "leave" ? "leave" : "late";
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const cutoff = searchParams.get("cutoff");
  const warningLevelFromQuery = Math.max(
    0,
    Number(searchParams.get("warningLevel")) || 0,
  );
  const mode = searchParams.get("mode");
  const letterId = searchParams.get("letterId");
  const isReviewMode = mode === "review";

  const [employee, setEmployee] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedForms, setSelectedForms] = useState<string[]>([
    "form1",
    "form2",
  ]);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [selectedWarningLevel, setSelectedWarningLevel] = useState(1);
  const [recipients, setRecipients] = useState<
    { email: string; type: "employee" | "supervisor" | "custom" }[]
  >([]);
  const [dynamicSchedules, setDynamicSchedules] = useState<
    Record<string, ShiftInfo>
  >(DEFAULT_SHIFT_SCHEDULES);
  const [deptMap, setDeptMap] = useState<Record<string, string>>({});
  const [customTardinessTemplate, setCustomTardinessTemplate] =
    useState<any>(null);
  const [customLeaveTemplate, setCustomLeaveTemplate] = useState<any>(null);
  const [customSupervisorTemplate, setCustomSupervisorTemplate] =
    useState<any>(null);
  const [offices, setOffices] = useState<any[]>([]);
  const [isProbee, setIsProbee] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [f1Body, setF1Body] = useState("");
  const [f2Body, setF2Body] = useState("");
  const [supervisorFirstName, setSupervisorFirstName] = useState<string | null>(
    null,
  );
  const [supervisorSalutation, setSupervisorSalutation] = useState<
    string | null
  >(null);
  const [supervisorEmail, setSupervisorEmail] = useState<string>("");
  const [hasInitializedContent, setHasInitializedContent] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [hasSupervisor, setHasSupervisor] = useState(false);
  const [supervisorResolved, setSupervisorResolved] = useState(false);

  // --- Memoized Helpers ---
  const salutationPrefix = useMemo(
    () => (employee?.gender?.toLowerCase() === "male" ? "Mr." : "Ms."),
    [employee?.gender],
  );

  const lastName = useMemo(
    () => employee?.last_name || employee?.name?.split(" ").pop() || "",
    [employee?.name, employee?.last_name],
  );

  const { shiftTime, gracePeriod } = useMemo(() => {
    if (!employee) return { shiftTime: "", gracePeriod: "" };
    const department = employee?.department || employee?.office_name;
    let currentShift =
      dynamicSchedules["ABIC"] || DEFAULT_SHIFT_SCHEDULES["ABIC"];
    if (department) {
      const normalized = department.toUpperCase().trim();
      if (dynamicSchedules[normalized])
        currentShift = dynamicSchedules[normalized];
      else {
        const mappedOffice = deptMap[normalized];
        if (mappedOffice && dynamicSchedules[mappedOffice])
          currentShift = dynamicSchedules[mappedOffice];
      }
    }
    const st = currentShift.displayName;
    const gpMinutes = currentShift.gracePeriodMinutes;
    const gpHours = Math.floor(gpMinutes / 60);
    const gpMins = gpMinutes % 60;
    const gp = `${gpHours % 12 || 12}:${String(gpMins).padStart(2, "0")} ${gpHours >= 12 ? "PM" : "AM"}`;
    return { shiftTime: st, gracePeriod: gp };
  }, [employee, dynamicSchedules, deptMap]);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    [],
  );

  const cutoffText = useMemo(
    () => (cutoff === "cutoff1" ? "first cutoff" : "second cutoff"),
    [cutoff],
  );

  const deriveLateWarningLevel = (lateEntries: any[]) => {
    if (!lateEntries.length) return 1;
    const highestDbLevel = Math.max(
      0,
      ...lateEntries.map((e: any) => Number(e.warning_level) || 0),
    );
    if (highestDbLevel > 0) return highestDbLevel;
    const lateCount = lateEntries.filter(
      (e: any) => Number(e.minutes_late ?? e.minutesLate ?? 0) > 0,
    ).length;
    return Math.max(1, lateCount - 2);
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/warning-letter-templates`);
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const mapped: any = {};
          json.data.forEach((template: any) => {
            mapped[template.slug] = {
              title: template.title,
              subject: template.subject,
              headerLogoImage: template.header_logo_image,
              headerDetails: template.header_details,
              body:
                template.slug.startsWith("supervisor") &&
                template.body.includes("Dear Ma'am Angely,")
                  ? template.body.replace(
                      /Dear Ma'am Angely,/g,
                      "Dear {{salutation}} {{supervisor first name}},",
                    )
                  : template.body,
              footer: template.footer,
              signatoryName: template.signatory_name,
            };
          });
          setCustomLeaveTemplate(mapped["leave"]);
          setCustomSupervisorTemplate(
            effectiveType === "late"
              ? mapped["supervisor-tardiness"]
              : mapped["supervisor-leave"],
          );
          setCustomTardinessTemplate(mapped);
          setTemplatesLoaded(true);
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem("warning_letter_templates");
          if (saved) {
            const allTemplates = JSON.parse(saved);
            const mapped: any = {};
            Object.entries(allTemplates).forEach(([slug, t]: [string, any]) => {
              const body =
                slug.startsWith("supervisor") &&
                t.body.includes("Dear Ma'am Angely,")
                  ? t.body.replace(
                      "Dear {{salutation}} {{supervisor first name}},",
                    )
                  : t.body;

              mapped[slug] = {
                ...t,
                body,
                headerLogoImage: t.headerLogoImage || t.header_logo_image,
                headerDetails: t.headerDetails || t.header_details,
              };
            });
            setCustomLeaveTemplate(mapped["leave"]);
            setCustomSupervisorTemplate(
              effectiveType === "late"
                ? mapped["supervisor-tardiness"] || mapped["supervisor"]
                : mapped["supervisor-leave"] || mapped["supervisor"],
            );
            setCustomTardinessTemplate(mapped);
          }
        }
        setTemplatesLoaded(true);
      } catch (e) {
        console.error("Failed to fetch templates from API:", e);
        const saved = localStorage.getItem("warning_letter_templates");
        if (saved) {
          const allTemplates = JSON.parse(saved);
          setCustomLeaveTemplate(allTemplates["leave"]);
          setCustomSupervisorTemplate(allTemplates["supervisor"]);
          setCustomTardinessTemplate(allTemplates);
        }
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const [schedRes, deptRes, officeRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/office-shift-schedules`),
          fetch(`${getApiUrl()}/api/departments`),
          fetch(`${getApiUrl()}/api/offices`),
        ]);
        const schedData = await schedRes.json();
        const deptData = await deptRes.json();
        const officeData = await officeRes.json();

        if (schedData.success && Array.isArray(schedData.data)) {
          const newSchedules: Record<string, ShiftInfo> = {};
          schedData.data.forEach((schedule: OfficeShiftSchedule) => {
            if (schedule.shift_options && schedule.shift_options.length > 0) {
              const officeName = schedule.office_name.toUpperCase().trim();
              const shifts = schedule.shift_options.map((opt: string) => ({
                startTimeMinutes: parseTimeToMinutes(extractStartTime(opt)),
                displayName: extractStartTime(opt),
                shiftOption: opt,
              }));
              newSchedules[officeName] = {
                startTimeMinutes: shifts[0].startTimeMinutes,
                gracePeriodMinutes: shifts[0].startTimeMinutes + 5,
                displayName: shifts[0].displayName,
                allShifts: shifts,
              };
            }
          });
          if (Object.keys(newSchedules).length > 0) {
            setDynamicSchedules(newSchedules);
          }
          setOffices(officeData.data || []);
        }

        if (deptData.success && officeData.success) {
          const mapped: Record<string, string> = {};
          deptData.data.forEach((dept: any) => {
            const off = officeData.data.find(
              (o: any) => o.id === dept.office_id,
            );
            if (off) {
              mapped[dept.name.toUpperCase().trim()] = off.name
                .toUpperCase()
                .trim();
            }
          });
          setDeptMap(mapped);
        }
      } catch (error) {
        console.error("Failed to load shift schedules:", error);
      }
    };
    loadSchedules();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Employees and find specific one
      const empRes = await fetch(
        "/api/admin/employees?status=employed,rehired_employee",
      );
      const empData = await empRes.json();

      if (empData.success) {
        const found = empData.data.find(
          (e: any) => String(e.id) === String(employeeId),
        );
        if (found) {
          setEmployee(found);

          // Check for department to conditionally show Form 1
          const hasDept = Boolean(
            found.department || found.department_id || found.office_name,
          );
          if (!hasDept) {
            setSelectedForms(["form2"]);
            setSupervisorResolved(true); // No supervisor to resolve if no department
          }

          // Initial setup: If form1 is selected, don't add employee by default
          if (!selectedForms.includes("form1")) {
            setRecipients([{ email: found.email || "", type: "employee" }]);
          }

          // 1.1 Fetch Evaluations to determine status (Probee vs Regular)
          const evalRes = await fetch(`${getApiUrl()}/api/evaluations`);
          const evalDataArr = await evalRes.json();
          if (evalDataArr.success) {
            const employeeEval = evalDataArr.data.find(
              (ev: any) => String(ev.employee_id) === String(employeeId),
            );
            if (employeeEval) {
              const status = String(employeeEval.status || "").toLowerCase();
              setIsProbee(!(status === "regular" || status === "regularized"));
            } else {
              setIsProbee(true); // Default to Probee if no evaluation record
            }
          }

          // 1.2 Fetch Hierarchy to find supervisor
          try {
            const hierRes = await fetch(`${getApiUrl()}/api/hierarchies`);
            const hierData = await hierRes.json();
            const hierarchies = Array.isArray(hierData)
              ? hierData
              : hierData.success && Array.isArray(hierData.data)
                ? hierData.data
                : [];

            if (hierarchies.length > 0) {
              // Helper to find a position record by name and department
              const findPos = (
                posName: string,
                deptId: any,
                deptName?: string,
              ) => {
                if (!posName) return null;
                const pNameNorm = posName
                  .toLowerCase()
                  .replace(/\s+/g, " ")
                  .trim();
                const dNameNorm = deptName
                  ?.toLowerCase()
                  .replace(/\s+/g, " ")
                  .trim();

                // 1. Try strict match with department
                let foundNode = hierarchies.find((h: any) => {
                  const hNameNorm = h.name
                    ?.toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim();
                  if (hNameNorm !== pNameNorm) return false;

                  if (
                    h.department_id &&
                    String(h.department_id) === String(deptId)
                  )
                    return true;
                  if (
                    h.department_name &&
                    h.department_name.toLowerCase().trim() === dNameNorm
                  )
                    return true;
                  if (
                    (!h.department_id || String(h.department_id) === "0") &&
                    (!deptId || deptId === "core" || String(deptId) === "0")
                  )
                    return true;
                  return false;
                });

                // 2. Fallback to name-only match if department match fails
                if (!foundNode) {
                  foundNode = hierarchies.find((h: any) => {
                    const hNameNorm = h.name
                      ?.toLowerCase()
                      .replace(/\s+/g, " ")
                      .trim();
                    return hNameNorm === pNameNorm;
                  });
                }
                return foundNode;
              };

              let currentPos = findPos(
                found.position,
                found.department_id,
                found.department,
              );

              // Climb the hierarchy to find the first position that has an assigned employee
              let supervisorFound = false;
              while (currentPos && currentPos.parent_id) {
                const parent = hierarchies.find(
                  (h: any) => String(h.id) === String(currentPos.parent_id),
                );
                if (!parent) break;

                const parentNameNorm = parent.name
                  ?.toLowerCase()
                  .replace(/\s+/g, " ")
                  .trim();
                const supervisor = empData.data.find((e: any) => {
                  if (!e.position) return false;
                  const ePosNorm = e.position
                    .toLowerCase()
                    .replace(/\s+/g, " ")
                    .trim();
                  return ePosNorm === parentNameNorm;
                });

                if (supervisor) {
                  const prefix =
                    supervisor.gender?.toLowerCase() === "male"
                      ? "Sir"
                      : "Ma'am";
                  const nameToUse =
                    supervisor.first_name ||
                    supervisor.name?.split(" ")[0] ||
                    "";
                  if (nameToUse) {
                    setSupervisorFirstName(nameToUse);
                    setSupervisorSalutation(prefix);
                  } else {
                    setSupervisorFirstName("Supervisor");
                    setSupervisorSalutation(null);
                  }
                  setSupervisorEmail(supervisor.email || "");
                  supervisorFound = true;
                  setHasSupervisor(true);
                  break;
                }
                // Continue climbing if parent position is empty
                currentPos = parent;
              }

              if (!supervisorFound) {
                setSelectedForms(["form2"]);
              }
            } else {
              // No hierarchy context at all
              setSelectedForms(["form2"]);
            }
            setSupervisorResolved(true);
          } catch (hierErr) {
            console.error("Failed to resolve supervisor:", hierErr);
            setSupervisorResolved(true);
          }
        }
      }

      // 2. Fetch Entries
      if (effectiveType === "late") {
        const lateRes = await fetch(
          `${getApiUrl()}/api/admin/attendance/tardiness?month=${month}&year=${year}`,
        );
        const lateData = await lateRes.json();
        if (lateData.success) {
          // Filter by cutoff and employeeId
          const filtered = lateData.data.filter(
            (e: any) =>
              String(e.employee_id) === String(employeeId) &&
              (e.cutoff_period === cutoff ||
                (!e.cutoff_period &&
                  (new Date(e.date).getDate() <= 15 ? "cutoff1" : "cutoff2") ===
                    cutoff)),
          );
          // Sort by date ascending
          filtered.sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
          setEntries(filtered);
        }
      } else {
        const [leaveRes, creditsRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/leaves`),
          fetch(`${getApiUrl()}/api/leaves/credits`),
        ]);
        const leaveData = await leaveRes.json();
        const creditsData = await creditsRes.json();

        if (leaveData.success) {
          const empLeaves = leaveData.data.filter(
            (e: any) =>
              String(e.employee_id) === String(employeeId) &&
              e.approved_by !== "Pending" &&
              e.approved_by !== "Declined" &&
              new Date(e.start_date).getFullYear() === Number(year),
          );

          console.log(
            `[Leave Letter] Filtered leaves for emp ${employeeId}, year ${year}:`,
            {
              total: leaveData.data.length,
              filtered: empLeaves.length,
              month: month,
              cutoff: cutoff,
            },
          );

          const creditsMap = new Map<string, any>();
          if (creditsData.success) {
            creditsData.data.forEach((c: any) =>
              creditsMap.set(String(c.employee_id), c),
            );
          }

          const runningCredits = { vl: 15, sl: 15 };
          const creditInfo = creditsMap.get(String(employeeId));
          const isEligible = creditInfo?.has_one_year_regular;

          // Group by month and cutoff to identify qualifying incidents (>= 3 days)
          // WARNING SYSTEM: Count ACTUAL days, not deducted days
          // Credit deduction is for reporting, not for warning qualification
          const yearLeavesSorted = [...empLeaves].sort(
            (a, b) =>
              new Date(a.start_date).getTime() -
              new Date(b.start_date).getTime(),
          );

          console.log(
            `[Leave Letter] Processing ${yearLeavesSorted.length} leaves for emp ${employeeId}:`,
            {
              month: month,
              year: year,
              cutoff: cutoff,
              isEligible,
            },
          );

          const leaveGroups = new Map<string, any>();
          yearLeavesSorted.forEach((e: any) => {
            const date = new Date(e.start_date);
            const m = date.getMonth();
            const day = date.getDate();
            const co = day <= 15 ? "cutoff1" : "cutoff2";
            const key = `${MONTHS[m]}-${co}`;

            // Count ACTUAL days - no credit deduction for warning purposes
            let daysToCharge = Number(e.number_of_days);
            const remarks = String(e.remarks || "").toLowerCase();

            console.log(`[Leave Letter] Leave entry:`, {
              key,
              type: remarks,
              actualDays: daysToCharge,
            });

            if (!leaveGroups.has(key)) {
              leaveGroups.set(key, {
                ...e,
                month: MONTHS[m],
                cutoff: co,
                total_days: daysToCharge,
                actual_total_days: Number(e.number_of_days),
              });
            } else {
              const existing = leaveGroups.get(key);
              existing.total_days += daysToCharge;
              existing.actual_total_days += Number(e.number_of_days);
              if (new Date(e.start_date) < new Date(existing.start_date)) {
                existing.start_date = e.start_date;
              }
            }
          });

          // Sort qualifying incidents by date and assign warning levels
          const qualifyingIncidents = Array.from(leaveGroups.values())
            .filter((g) => g.total_days >= 3)
            .sort(
              (a, b) =>
                new Date(a.start_date).getTime() -
                new Date(b.start_date).getTime(),
            );

          console.log(
            `[Leave Letter] Qualifying incidents (>= 3 days):`,
            qualifyingIncidents.length,
            qualifyingIncidents.map((q: any) => ({
              month: q.month,
              cutoff: q.cutoff,
              days: q.total_days,
            })),
          );

          qualifyingIncidents.forEach((inst, idx) => {
            inst.warning_level = idx + 1;
          });

          // Filter for the specific month and cutoff requested
          const filtered = qualifyingIncidents.filter(
            (g) => g.month === month && g.cutoff === cutoff,
          );

          console.log(
            `[Leave Letter] Filtering by month='${month}' cutoff='${cutoff}', results:`,
            filtered.length,
          );
          if (filtered.length === 0) {
            console.warn(
              `[Leave Letter] No matching entries! Looking for month='${month}' (type: ${typeof month}), cutoff='${cutoff}'`,
            );
            console.log(
              `[Leave Letter] Available groups:`,
              Array.from(leaveGroups.values()).map((g: any) => ({
                month: g.month,
                cutoff: g.cutoff,
                days: g.total_days,
              })),
            );
          }

          setEntries(filtered);
        }
      }
      // --- Historical Data for Review ---
      if (isReviewMode && letterId) {
        try {
          const res = await fetch(`${getApiUrl()}/api/sent-warning-letters`);
          const data = await res.json();
          if (data.success) {
            const history = data.data.find(
              (h: any) => String(h.id) === String(letterId),
            );
            if (history) {
              if (history.form1_body) setF1Body(history.form1_body);
              if (history.form2_body) setF2Body(history.form2_body);
              if (history.recipients) setRecipients(history.recipients);
              if (history.forms_included)
                setSelectedForms(history.forms_included);
              if (history.warning_level) {
                setSelectedWarningLevel(
                  Math.max(1, Number(history.warning_level) || 1),
                );
              }
              setHasInitializedContent(true);
            }
          }
        } catch (e) {
          console.error("Failed to load historical bodies:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load letter information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    const emailList = recipients
      .map((r: any) => r.email.trim())
      .filter((e: string) => e !== "");

    if (emailList.length === 0) {
      toast.error("Please provide at least one recipient email address");
      return;
    }

    if (selectedForms.length === 0) {
      toast.error("Please select at least one form to send.");
      return;
    }

    // Validate @gmail.com requirement
    const nonGmail = emailList.filter(
      (email: string) => !email.toLowerCase().endsWith("@gmail.com"),
    );
    if (nonGmail.length > 0) {
      toast.error(
        "Invalid email address. All recipients must use a Gmail address (@gmail.com).",
      );
      return;
    }

    confirm({
      title: "Confirm Dissemination",
      description: `You are about to send an official ${effectiveType === "late" ? "tardiness" : "leave"} warning letter to ${emailList.join(", ")}. Do you wish to proceed?`,
      confirmText: "Send Notification",
      onConfirm: async () => {
        setIsSending(true);
        const sendingToast = toast.loading("Preparing document package...");
        try {
          // ── Dynamically import heavy PDF libs (tree-shaken at build time) ────
          const [{ default: html2canvas }, { default: jsPDF }] =
            await Promise.all([import("html2canvas"), import("jspdf")]);

          // ── Collect ordered form element IDs that are currently rendered ─────
          const formIds: { id: string; key: string }[] = [];
          if (selectedForms.includes("form1"))
            formIds.push({ id: "form-letter-1", key: "form1" });
          if (selectedForms.includes("form2"))
            formIds.push({ id: "form-letter-2", key: "form2" });

          if (formIds.length === 0) {
            toast.dismiss(sendingToast);
            toast.error("No form selected. Please select at least one form.");
            setIsSending(false);
            return;
          }

          // A4 size in points: 595 x 842 pt (210mm x 297mm at 72dpi)
          const pdf = new jsPDF({
            unit: "pt",
            format: "a4",
            orientation: "portrait",
          });
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();

          for (let i = 0; i < formIds.length; i++) {
            const { id } = formIds[i];
            const el = document.getElementById(id);
            if (!el) continue;

            const canvas = await html2canvas(el as HTMLElement, {
              scale: 2,
              useCORS: true,
              allowTaint: false,
              backgroundColor: "#ffffff",
              logging: false,
              onclone: (clonedDoc) => {
                fixModernColors(clonedDoc);
              },
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const imgW = canvas.width;
            const imgH = canvas.height;
            const ratio = pageW / imgW;
            const finalW = pageW;
            const scaledH = imgH * ratio;
            const totalSlices = Math.max(1, Math.ceil((scaledH - 20) / pageH));

            for (let p = 0; p < totalSlices; p++) {
              if (i > 0 || p > 0) pdf.addPage();
              pdf.addImage(imgData, "JPEG", 0, -(p * pageH), finalW, scaledH);
            }
          }

          const pdfBase64 = pdf.output("datauristring").split(",")[1];
          toast.dismiss(sendingToast);
          const mailingToast = toast.loading("Dispatching email...");

          const res = await fetch(
            `${getApiUrl()}/api/warning-letter/send-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipients: emailList,
                employee_name: employee?.name ?? "",
                letter_type: effectiveType,
                pdf_base64: pdfBase64,
                pdf_filename: (() => {
                  const firstName =
                    employee?.first_name ||
                    employee?.name?.trim()?.split(/\s+/)[0] ||
                    "Employee";
                  const lastName =
                    employee?.last_name ||
                    employee?.name?.trim()?.split(/\s+/).slice(-1)[0] ||
                    "Unknown";
                  const warningLabel =
                    selectedWarningLevel === 1
                      ? "1st_warning_letter"
                      : selectedWarningLevel === 2
                        ? "2nd_warning_letter"
                        : selectedWarningLevel === 3
                          ? "final_warning_letter"
                          : `${selectedWarningLevel}th_warning_letter`;
                  return `${warningLabel}_${lastName}, ${firstName}.pdf`;
                })(),
              }),
            },
          );
          const data = await res.json();
          toast.dismiss(mailingToast);

          if (!res.ok || !data.success) {
            const rawMsg = data.message || "Failed to send email.";
            const userFriendlyMsg = getFriendlyErrorMessage(rawMsg);
            toast.error(`Email Error: ${userFriendlyMsg}`, {
              duration: 10000,
            });
            setIsSending(false);
            return;
          }

          toast.success(
            `Notification successfully sent to: ${emailList.join(", ")}`,
          );

          // Log history
          try {
            const warningLevel = Math.max(1, selectedWarningLevel);

            const saveHistoryRes = await fetch(
              `${getApiUrl()}/api/sent-warning-letters`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  employee_id: employeeId,
                  employee_name: employee?.name ?? "",
                  type: effectiveType,
                  warning_level: warningLevel,
                  month: month,
                  year: Number(year),
                  cutoff: cutoff,
                  recipients: recipients.map((r: any) => ({
                    email: r.email,
                    type: r.type,
                  })),
                  forms_included: selectedForms,
                  form1_body: selectedForms.includes("form1") ? f1Body : null,
                  form2_body: selectedForms.includes("form2") ? f2Body : null,
                }),
              },
            );
            if (!saveHistoryRes.ok) {
              const saveHistoryData = await saveHistoryRes
                .json()
                .catch(() => ({}));
              console.error("Failed to save history:", saveHistoryData);
              toast.error(
                saveHistoryData?.message ||
                  "Email sent, but failed to save letter history.",
              );
            }
          } catch (e) {
            console.error("Failed to save history:", e);
            toast.error("Email sent, but failed to save letter history.");
          }
        } catch (err: any) {
          toast.dismiss();
          const userFriendly =
            err?.message || "An unexpected error occurred during dispatch.";
          toast.error(`Dispatch Error: ${userFriendly}`, { duration: 8000 });
        } finally {
          setIsSending(false);
        }
      },
    });
  };

  const handleAddRecipient = () => {
    // Check if there are any empty email slots
    const hasEmpty = recipients.some((r: any) => r.email.trim() === "");
    if (hasEmpty) {
      toast.error(
        "Please fill in the current recipient slot before adding another.",
      );
      return;
    }
    setRecipients([...recipients, { email: "", type: "custom" }]);
  };

  const handleRemoveRecipient = (index: number) => {
    setRecipients(recipients.filter((_: any, i: number) => i !== index));
  };

  const updateRecipient = (index: number, email: string) => {
    const next = [...recipients];
    next[index].email = email;
    setRecipients(next);
  };

  // Confidentiality Logic: Remove employee if Form 1 is selected
  useEffect(() => {
    if (!employee || isReviewMode) return;

    const hasForm1 = selectedForms.includes("form1");
    const hasEmployeeRecipient = recipients.some(
      (r: any) => r.type === "employee",
    );

    if (hasForm1 && hasEmployeeRecipient) {
      setRecipients((prev) => prev.filter((r: any) => r.type !== "employee"));
      toast.message("Confidentiality Notice", {
        description:
          "Employee recipient removed. Form 1 (Supervisor Notification) is confidential.",
      });
    } else if (
      !hasForm1 &&
      !hasEmployeeRecipient &&
      selectedForms.includes("form2")
    ) {
      // Restore employee if form1 is removed and form2 is still there
      setRecipients((prev) => [
        { email: employee.email || "", type: "employee" },
        ...prev,
      ]);
    }

    // Supervisor Management
    const hasSupervisorRecipient = recipients.some(
      (r: any) => r.type === "supervisor",
    );

    if (hasForm1 && !hasSupervisorRecipient && supervisorEmail) {
      setRecipients((prev) => [
        ...prev,
        { email: supervisorEmail, type: "supervisor" },
      ]);
    } else if (!hasForm1 && hasSupervisorRecipient) {
      setRecipients((prev) => prev.filter((r: any) => r.type !== "supervisor"));
    }
  }, [selectedForms, employee, supervisorEmail, isReviewMode]);

  // --- Content Initialization for Editing ---
  useEffect(() => {
    if (
      employee &&
      !hasInitializedContent &&
      !isLoading &&
      templatesLoaded &&
      supervisorResolved &&
      !isReviewMode
    ) {
      // Helper to process template or fallback
      const generateInitialBodies = () => {
        // Handle empty entries case
        if (entries.length === 0) {
          const emptyF1 =
            `Dear ${supervisorSalutation && supervisorFirstName ? `${supervisorSalutation} ${supervisorFirstName}` : "Supervisor"},\n\n` +
            `    This letter was generated but no qualifying attendance records were found for ${salutationPrefix} ${employee.name} for the selected period.\n\n` +
            `Please verify the employee's records and the selected time period.\n\n` +
            `Thank you.`;

          const emptyF2 =
            `Dear ${salutationPrefix} ${lastName},\n\n` +
            `    This letter was generated but no qualifying attendance records were found for the selected period.\n\n` +
            `Please contact your HR department if you believe this is an error.\n\n` +
            `Thank you.`;

          setF1Body(emptyF1);
          setF2Body(emptyF2);
          setHasInitializedContent(true);
          return;
        }

        const totalCount =
          type === "leave"
            ? entries.reduce(
                (acc: number, curr: any) =>
                  acc + (Number(curr.number_of_days) || 0),
                0,
              )
            : entries.length;

        // 3. Process and Clean Entry List (with Expansion for multi-day Leave)
        const processedEntries =
          type === "leave"
            ? (() => {
                const expanded: any[] = [];
                entries.forEach((entry: any) => {
                  const isPersonalLeave =
                    entry.remarks?.toUpperCase() === "PERSONAL LEAVE";
                  const reasonDetail = isPersonalLeave
                    ? `Personal Leave (${entry.cite_reason || "no stated reason"})`
                    : entry.remarks || entry.cite_reason || "No stated reason";

                  if (entry.start_date && entry.number_of_days) {
                    const count = Number(entry.number_of_days);
                    const startDate = new Date(entry.start_date);
                    for (let i = 0; i < count; i++) {
                      const currentDate = new Date(startDate);
                      currentDate.setDate(startDate.getDate() + i);
                      expanded.push({
                        ...entry,
                        date: currentDate.toISOString().split("T")[0],
                        displayRemarks: reasonDetail,
                      });
                    }
                  } else {
                    expanded.push({
                      ...entry,
                      displayRemarks: reasonDetail,
                    });
                  }
                });
                return expanded.sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
                );
              })()
            : entries;

        const entryListStr = processedEntries
          .map((e: any) => {
            const detail =
              type === "late"
                ? formatTime(e.actual_in)
                : e.displayRemarks ||
                  e.remarks ||
                  e.cite_reason ||
                  "No stated reason";
            return `- ${formatDateLong(e.date || e.start_date)} - ${detail}`;
          })
          .join("\n\n");

        // Form 1 body (Supervisor)
        let initialF1 = "";
        if (customSupervisorTemplate) {
          initialF1 = formatEntriesListForTemplate(
            customSupervisorTemplate.body,
            entryListStr,
          )
            .replace(/{{employee_name}}/g, employee.name)
            .replace(/{{last_name}}/g, lastName)
            .replace(
              /{{salutation}}\s*{{(supervisor first name|supervisor(_|\s)?name)}}/g,
              supervisorSalutation && supervisorFirstName
                ? `${supervisorSalutation} ${supervisorFirstName}`
                : supervisorFirstName || "Supervisor",
            )
            .replace(/{{salutation}}/g, salutationPrefix)
            .replace(/{{instances_text}}/g, numberToText(totalCount))
            .replace(/{{instances_count}}/g, String(totalCount))
            .replace(
              /{{pronoun_he_she}}/g,
              employee.gender?.toLowerCase() === "female" ? "She" : "He",
            )
            .replace(
              /{{pronoun_his_her}}/g,
              employee.gender?.toLowerCase() === "female" ? "her" : "his",
            )
            .replace(/{{grace_period}}/g, gracePeriod)
            .replace(
              /{{instances_count_ordinal}}/g,
              totalCount === 1
                ? "1st"
                : totalCount === 2
                  ? "2nd"
                  : totalCount === 3
                    ? "3rd"
                    : `${totalCount}th`,
            )
            .replace(
              /{{(supervisor first name|supervisor(_|\s)?name)}}/g,
              supervisorSalutation && supervisorFirstName
                ? `${supervisorSalutation} ${supervisorFirstName}`
                : supervisorFirstName || "Supervisor",
            )
            .replace(/Employee Acknowledgment:[\s\S]*$/, ""); // Remove if present in stored template

          // Reminders are always included for Supervisor Form
        } else {
          const issueType = type === "late" ? "tardiness" : "leave/absences";
          let reminders = `\n\nPlease be reminded of the following:\n1. ${salutationPrefix} ${lastName} is expected to correct ${employee.gender?.toLowerCase() === "female" ? "her" : "his"} attendance behavior immediately.\n2. Future occurrences of tardiness may result in stricter disciplinary action.\n\n`;

          const supSalutation =
            supervisorSalutation && supervisorFirstName
              ? `${supervisorSalutation} ${supervisorFirstName}`
              : supervisorFirstName || "Supervisor";
          initialF1 =
            `Dear ${supSalutation},\n\n    This letter serves as a Formal Warning regarding the ${issueType} of ${salutationPrefix} ${employee.name}. ${employee.gender?.toLowerCase() === "male" ? "He" : "She"} has accumulated ${numberToText(totalCount)} (${totalCount}) ${totalCount === 1 ? (type === "late" ? "occurrence" : "day") : type === "late" ? "occurrences" : "days"} of ${issueType} within the current cut-off period.\n\n` +
            `    In accordance with company policy, reaching this threshold within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee.\n\n` +
            `Specific dates recorded:\n${entryListStr}${reminders}` +
            `Kindly ensure that the employee is informed and that corrective action is enforced appropriately.\n\n` +
            `Thank you.`;
        }
        setF1Body(initialF1);

        // Form 2 body
        let initialF2 = "";
        const targetTemplate =
          effectiveType === "late"
            ? customTardinessTemplate?.[
                employee?.position?.toLowerCase().includes("driver") ||
                employee?.position?.toLowerCase().includes("liaison")
                  ? "tardiness-probee"
                  : "tardiness-regular"
              ]
            : customLeaveTemplate;

        if (targetTemplate) {
          initialF2 = formatEntriesListForTemplate(
            targetTemplate.body,
            entryListStr,
          )
            .replace(/{{salutation}}/g, salutationPrefix)
            .replace(/{{last_name}}/g, lastName)
            .replace(/{{shift_time}}/g, shiftTime)
            .replace(/{{grace_period}}/g, gracePeriod)
            .replace(/{{instances_text}}/g, numberToText(totalCount))
            .replace(/{{instances_count}}/g, String(totalCount))
            .replace(/{{cutoff_text}}/g, cutoffText)
            .replace(/{{month}}/g, month)
            .replace(/{{year}}/g, year)
            .replace(/Employee Acknowledgment:[\s\S]*$/, ""); // Remove if present in stored template
        } else {
          if (effectiveType === "late") {
            initialF2 =
              `Dear ${salutationPrefix} ${lastName},\n\n` +
              `    This letter serves as a Formal Warning regarding your tardiness. Your scheduled time-in is ${shiftTime}, with a five (5)-minute grace period until ${gracePeriod}.\n\n` +
              `    You have incurred ${numberToText(totalCount)} (${totalCount}) instances of tardiness within the current cut-off period, which constitutes a violation of the Company's Attendance and Punctuality Policy.\n\n` +
              `Recorded instances:\n${entryListStr}\n\n` +
              `    Consistent tardiness disrupts workflow. You are expected to immediately correct your attendance behavior. Future occurrences may result in stricter disciplinary action.\n\n` +
              `Thank you.`;
          } else {
            initialF2 =
              `Dear ${salutationPrefix} ${lastName},\n\n` +
              `    This letter serves as a Formal Warning regarding your attendance record for the current cutoff period.\n\n` +
              `It has been noted that you incurred ${numberToText(totalCount)} (${totalCount}) days of leave within the ${cutoffText} of ${month} ${year}, specifically on the following dates:\n\n` +
              `${entryListStr}\n\n` +
              `    These absences negatively affect work operations. Repeated absences may lead to further disciplinary action.\n\n` +
              `Moving forward, you are expected to improve your attendance immediately and avoid unapproved absences.\n\n` +
              `Thank you.`;
          }
        }
        setF2Body(initialF2);
      };

      generateInitialBodies();
      setHasInitializedContent(true);
    }
  }, [
    employee,
    entries,
    hasInitializedContent,
    isLoading,
    isProbee,
    customSupervisorTemplate,
    customTardinessTemplate,
    customLeaveTemplate,
    supervisorFirstName,
    supervisorSalutation,
    templatesLoaded,
    supervisorResolved,
    effectiveType,
  ]);

  const lateWarningCap = deriveLateWarningLevel(entries);
  const lateWarningChoices = Array.from(
    { length: Math.max(1, lateWarningCap) },
    (_, i) => i + 1,
  );

  useEffect(() => {
    if (isReviewMode) return;
    if (warningLevelFromQuery > 0) {
      setSelectedWarningLevel(Math.max(1, warningLevelFromQuery));
      return;
    }
    if (effectiveType === "late") {
      setSelectedWarningLevel(Math.max(1, lateWarningCap));
    } else {
      setSelectedWarningLevel(
        Math.max(1, Number(entries[0]?.warning_level) || 1),
      );
    }
  }, [
    effectiveType,
    lateWarningCap,
    entries,
    isReviewMode,
    warningLevelFromQuery,
  ]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <LetterSkeleton />;
  }

  if (!employee) {
    return <div className="p-20 text-center">Employee not found.</div>;
  }

  // Determine warning title
  let letterTitle = "FORMAL WARNING LETTER";
  const maxWarning = Math.max(
    ...entries.map((e: any) => e.warning_level || 0),
    0,
  );
  const effectiveWarningLevel = Math.max(
    1,
    warningLevelFromQuery || selectedWarningLevel || maxWarning,
  );

  if (effectiveType === "late") {
    if (effectiveWarningLevel === 1) letterTitle = "FIRST WARNING LETTER";
    else if (effectiveWarningLevel === 2) letterTitle = "SECOND WARNING LETTER";
    else if (effectiveWarningLevel >= 3)
      letterTitle = "FOR CONSULTATION LETTER";
    else letterTitle = "ATTENDANCE WARNING LETTER";
  } else {
    // Leave logic
    if (effectiveWarningLevel === 1) letterTitle = "FIRST WARNING LETTER";
    else if (effectiveWarningLevel === 2) letterTitle = "SECOND WARNING LETTER";
    else if (effectiveWarningLevel >= 3) letterTitle = "FINAL WARNING";
    else letterTitle = "LEAVE WARNING LETTER";
  }

  const toggleForm = (formId: string) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id: string) => id !== formId)
        : formId === "form1" && !hasSupervisor
          ? prev
          : [...prev, formId],
    );
  };

  const selectAll = (checked: boolean) => {
    if (checked) {
      setSelectedForms(hasSupervisor ? ["form1", "form2"] : ["form2"]);
    } else {
      setSelectedForms([]);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 pb-20 print:bg-white print:pb-0">
      {/* Action Bar */}
      <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6 sticky top-0 z-50 print:hidden">
        {/* Main Header Row */}
        <div className="w-full px-4 md:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Preview Warning Letter
                </h1>
                <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  ABIC REALTY & CONSULTANCY
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-white text-[#7B0F2B] hover:bg-white hover:text-[#7B0F2B] border-transparent shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>BACK</span>
            </Button>
          </div>
        </div>

        {/* Secondary Toolbar */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto no-scrollbar">
          <div className="w-full px-4 md:px-8 py-3">
            <div className="flex items-center justify-end gap-3 md:gap-4 min-w-max md:min-w-0">
              {effectiveType === "late" && !isReviewMode && (
                <div className="flex items-center gap-2 bg-white/90 rounded-lg px-3 h-10 border border-white/60 shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7B0F2B] whitespace-nowrap">
                    Warning Level
                  </span>
                  <select
                    value={selectedWarningLevel}
                    onChange={(e) =>
                      setSelectedWarningLevel(Number(e.target.value))
                    }
                    className="h-7 rounded-md border border-rose-200 bg-white text-[#7B0F2B] text-xs font-bold px-2 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    {lateWarningChoices.map((level) => (
                      <option key={level} value={level}>
                        {level === 1
                          ? "1st Warning"
                          : level === 2
                            ? "2nd Warning"
                            : level === 3
                              ? "Final Warning"
                              : `${level}th Warning`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isReviewMode && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 px-4 py-1.5 rounded-full font-black uppercase tracking-widest animate-pulse h-10 shadow-sm">
                  Reviewing Sent Letter
                </Badge>
              )}

              <Button
                onClick={() => setIsEditMode(!isEditMode)}
                disabled={isViewOnly}
                variant="outline"
                className={cn(
                  "h-10 px-4 rounded-lg font-bold gap-2 active:scale-95 transition-all text-sm uppercase tracking-wider",
                  isEditMode
                    ? "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200"
                    : "bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A]",
                  isReviewMode && "hidden",
                )}
              >
                {isEditMode ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Edit3 className="w-4 h-4" />
                )}
                {isEditMode ? "Finish Editing" : "Customize Content"}
              </Button>

              <Button
                onClick={handlePrint}
                variant="outline"
                className="h-10 px-4 rounded-lg font-bold bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all text-sm uppercase tracking-wider gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Print Letter
              </Button>

              <Popover open={isActionOpen} onOpenChange={setIsActionOpen}>
                <PopoverTrigger asChild>
                  {!isReviewMode && (
                    <Button
                      disabled={isViewOnly}
                      className="h-10 px-6 rounded-lg font-black gap-2 bg-white border border-white text-[#A4163A] hover:bg-rose-100 shadow-md active:scale-95 transition-all w-auto uppercase tracking-widest"
                    >
                      <Mail className="w-4 h-4" />
                      Send via Email
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  )}
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 p-0 rounded-2xl border-stone-200 shadow-2xl overflow-hidden"
                  align="end"
                >
                  <div className="p-4 space-y-4 text-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedForms.length === 2}
                          onCheckedChange={selectAll}
                        />
                        <Label
                          htmlFor="select-all"
                          className="font-bold cursor-pointer"
                        >
                          Select all
                        </Label>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        {selectedForms.length} selected
                      </span>
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-3">
                      <div
                        className={cn(
                          "p-3 rounded-xl flex items-center gap-3 transition-colors",
                          selectedForms.includes("form1")
                            ? "bg-rose-50 border border-rose-100"
                            : "hover:bg-slate-50",
                          (!hasSupervisor || isViewOnly) &&
                            "opacity-50 grayscale pointer-events-none",
                        )}
                      >
                        <Checkbox
                          id="form1"
                          checked={selectedForms.includes("form1")}
                          onCheckedChange={() => {
                            if (!isViewOnly) {
                              toggleForm("form1");
                            }
                          }}
                          disabled={!hasSupervisor || isViewOnly}
                        />
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            if (hasSupervisor && !isViewOnly)
                              toggleForm("form1");
                          }}
                        >
                          <p className="font-bold text-sm leading-none">
                            Form 1
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {Boolean(
                              employee.department || employee.office_name,
                            )
                              ? "Supervisor Notification"
                              : "No Department Assigned"}
                          </p>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "p-3 rounded-xl flex items-center gap-3 transition-colors",
                          selectedForms.includes("form2")
                            ? "bg-rose-50 border border-rose-100"
                            : "hover:bg-slate-50",
                          isViewOnly &&
                            "opacity-50 grayscale pointer-events-none",
                        )}
                      >
                        <Checkbox
                          id="form2"
                          checked={selectedForms.includes("form2")}
                          onCheckedChange={() => {
                            if (!isViewOnly) {
                              toggleForm("form2");
                            }
                          }}
                          disabled={isViewOnly}
                        />
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            if (!isViewOnly) {
                              toggleForm("form2");
                            }
                          }}
                        >
                          <p className="font-bold text-sm leading-none">
                            Form 2
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Employee Warning
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-slate-100" />

                    <div className="space-y-3 px-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Recipients:
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isViewOnly}
                          className="h-6 text-[10px] font-bold text-[#A4163A] hover:bg-rose-50 rounded-lg gap-1 border border-rose-100"
                          onClick={handleAddRecipient}
                        >
                          <Plus className="w-3 h-3" />
                          Add New
                        </Button>
                      </div>

                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 customize-scrollbar font-sans">
                        {selectedForms.includes("form1") && (
                          <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2">
                            <div className="w-4 h-4 mt-0.5 rounded-full bg-amber-200 flex items-center justify-center text-[10px] font-bold text-amber-700">
                              !
                            </div>
                            <p className="text-[10px] leading-tight text-amber-700 font-medium">
                              Employee recipient disabled. Form 1 contains
                              confidential supervisor information.
                            </p>
                          </div>
                        )}
                        {recipients.map((r, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center ${
                                    r.type === "employee"
                                      ? "bg-rose-100"
                                      : r.type === "supervisor"
                                        ? "bg-amber-100"
                                        : "bg-slate-200"
                                  }`}
                                >
                                  {r.type === "employee" ? (
                                    <User className="w-3 h-3 text-[#A4163A]" />
                                  ) : r.type === "supervisor" ? (
                                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                                  ) : (
                                    <Mail className="w-3 h-3 text-slate-500" />
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  {r.type === "employee"
                                    ? `Employee (${employee.name.split(" ").pop()})`
                                    : r.type === "supervisor"
                                      ? `Supervisor (${supervisorFirstName})`
                                      : "Custom Email"}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isViewOnly}
                                className="h-5 w-5 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  if (!isViewOnly) {
                                    handleRemoveRecipient(idx);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                            <Input
                              type="email"
                              placeholder="Enter email address"
                              value={r.email}
                              onChange={(e) => {
                                if (!isViewOnly) {
                                  updateRecipient(idx, e.target.value);
                                }
                              }}
                              disabled={isViewOnly}
                              className="h-9 text-xs rounded-lg border-slate-200 focus-visible:ring-[#A4163A] bg-white shadow-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (!isViewOnly) {
                        handleSendEmail();
                        setIsActionOpen(false);
                      }
                    }}
                    disabled={
                      isSending || selectedForms.length === 0 || isViewOnly
                    }
                    className="w-full rounded-none h-12 font-bold bg-[#A4163A] hover:bg-[#7B0F2B] text-white gap-2 uppercase tracking-widest"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "SEND EMAIL NOW"
                    )}
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Letter Paper Container */}
      <div className="w-full max-w-none mx-auto py-10 px-6 print:px-0 print:py-0 flex flex-wrap justify-center gap-10 print:flex-col print:items-center">
        {selectedForms.includes("form1") && (
          <FormOneTemplate
            employee={employee}
            entries={entries}
            today={today}
            shiftTime={shiftTime}
            gracePeriod={gracePeriod}
            salutationPrefix={salutationPrefix}
            lastName={lastName}
            numberToText={numberToText}
            type={effectiveType}
            formatDateLong={formatDateLong}
            customTemplate={customSupervisorTemplate}
            isEditMode={isEditMode}
            supervisorFirstName={supervisorFirstName}
            body={f1Body}
            setBody={setF1Body}
            letterTitle={letterTitle}
            effectiveWarningLevel={effectiveWarningLevel}
            offices={offices}
            deptMap={deptMap}
            isViewOnly={isViewOnly}
          />
        )}

        {selectedForms.includes("form2") && (
          <FormTwoTemplate
            employee={employee}
            entries={entries}
            today={today}
            shiftTime={shiftTime}
            gracePeriod={gracePeriod}
            salutationPrefix={salutationPrefix}
            lastName={lastName}
            numberToText={numberToText}
            type={effectiveType}
            letterTitle={letterTitle}
            cutoffText={cutoffText}
            month={month}
            year={year}
            formatDateLong={formatDateLong}
            customTemplate={
              effectiveType === "late"
                ? customTardinessTemplate?.[
                    employee?.position?.toLowerCase().includes("driver") ||
                    employee?.position?.toLowerCase().includes("liaison")
                      ? "tardiness-probee"
                      : "tardiness-regular"
                  ]
                : customLeaveTemplate
            }
            isProbee={isProbee}
            isEditMode={isEditMode}
            body={f2Body}
            setBody={setF2Body}
            effectiveWarningLevel={effectiveWarningLevel}
            offices={offices}
            deptMap={deptMap}
            isViewOnly={isViewOnly}
          />
        )}

        {selectedForms.length === 0 && (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-2">
            <FileText className="w-12 h-12 opacity-20" />
            <p className="font-medium">Please select a form to preview</p>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4; /* 210mm x 297mm */
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          #form-letter-1,
          #form-letter-2 {
            margin-left: auto !important;
            margin-right: auto !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- Template Components ---

function FormOneTemplate({
  employee,
  entries,
  today,
  shiftTime,
  gracePeriod,
  salutationPrefix,
  lastName,
  numberToText,
  type,
  formatDateLong,
  customTemplate,
  isEditMode,
  supervisorFirstName,
  body,
  setBody,
  letterTitle,
  effectiveWarningLevel,
  offices,
  deptMap,
  isViewOnly,
}: any) {
  const totalCount =
    type === "leave"
      ? entries.reduce(
          (acc: number, curr: any) => acc + (Number(curr.number_of_days) || 0),
          0,
        )
      : entries.length;

  const unit = type === "late" ? "occurrence" : "day";
  const unitPlural = type === "late" ? "occurrences" : "days";
  const issueType = type === "late" ? "tardiness" : "leave/absences";
  const policyName =
    type === "late"
      ? "Attendance and Punctuality Policy"
      : "Leave and Attendance Policy";
  return (
    <Card
      className="border-0 shadow-2xl rounded-none print:shadow-none min-h-[1120px] w-[794px] flex flex-col bg-white"
      id="form-letter-1"
    >
      <CardContent className="px-14 py-8 flex-1 flex flex-col font-serif leading-snug text-[#333] text-xs">
        {/* Header Branding */}
        <div
          className="flex flex-col items-center mb-2 w-full"
          style={{ marginTop: "0.5cm" }}
        >
          {(() => {
            // Enhanced Resolution:
            // 1. Try direct office_id or department_id from employee
            // 2. Try looking up the office name via deptMap if we only have a department string
            let resolvedOfficeId = String(
              employee.office_id || employee.department?.office_id || "",
            );

            if (!resolvedOfficeId) {
              const deptName = employee.department || employee.office_name;
              if (deptName) {
                const offName = deptMap[deptName.toUpperCase().trim()];
                if (offName) {
                  const mappedOffice = offices.find(
                    (o: any) => o.name.toUpperCase().trim() === offName,
                  );
                  if (mappedOffice) resolvedOfficeId = String(mappedOffice.id);
                }
              }
            }

            const office = offices.find(
              (o: any) => String(o.id) === String(resolvedOfficeId),
            );
            const officeLogo = office?.header_logo_image;
            const officeDetails = office?.header_details;

            const logoToUse = officeLogo || customTemplate?.headerLogoImage;
            const detailsToUse = officeDetails || customTemplate?.headerDetails;

            return (
              <>
                {logoToUse ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={logoToUse}
                      alt="Company Logo"
                      className="max-w-[150px] max-h-[100px] object-contain"
                    />
                  </div>
                ) : null}

                {detailsToUse && (
                  <div className="text-center mt-1 text-[10px] leading-tight text-slate-600 max-w-[500px] whitespace-pre-wrap">
                    {detailsToUse}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="text-base font-black text-black tracking-wide uppercase">
            {resolveWarningTitle(
              customTemplate?.title,
              letterTitle,
              effectiveWarningLevel,
            )}
          </h1>
        </div>

        {/* Metadata */}
        <div className="space-y-0.5 mb-3 text-black text-xs">
          <div className="flex justify-end">
            <p className="font-bold">
              Date: <span className="font-bold">{today}</span>
            </p>
          </div>
          {/* Form 1 Top Metadata matches edit_forms preview */}
          <p className="font-bold">
            Position:{" "}
            <span className="font-bold">{employee.position || "Employee"}</span>
          </p>
          {(employee.department || employee.office_name) && (
            <p className="font-bold">
              Department:{" "}
              <span className="font-bold">
                {employee.department || employee.office_name}
              </span>
            </p>
          )}

          {customTemplate?.subject && (
            <p className="mt-4 font-bold uppercase tracking-tight text-[#A4163A]">
              {customTemplate.subject}
            </p>
          )}
        </div>

        {/* Salutation (only show if NO custom template, as custom includes it) */}
        {!customTemplate && (
          <p className="mb-3">Dear {supervisorFirstName || "Supervisor"},</p>
        )}

        {/* Body Content */}
        <div className="text-black text-xs leading-snug text-justify relative group/body">
          {isEditMode ? (
            <div className="relative group">
              <StandardRichTextEditor
                value={body}
                onChange={(val: string) => setBody(val)}
                isViewOnly={isViewOnly}
              />
            </div>
          ) : (
            <div className="flex-1 space-y-0 text-slate-900">
              {!/<[a-z/][\s\S]*>/i.test(body) ? (
                body.split("\n").map((line: string, idx: number) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={idx} className="h-2" />;
                  if (trimmed.startsWith("•")) {
                    return (
                      <div key={idx} className="flex gap-4 pl-10 mb-2">
                        <span className="shrink-0">•</span>
                        <span>{trimmed.substring(1).trim()}</span>
                      </div>
                    );
                  }
                  const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
                  if (numMatch) {
                    return (
                      <div key={idx} className="flex gap-4 pl-10 mb-2">
                        <span className="shrink-0 font-bold">
                          {numMatch[1]}.
                        </span>
                        <span>{numMatch[2]}</span>
                      </div>
                    );
                  }
                  const isSalutation =
                    trimmed.toLowerCase().startsWith("dear") ||
                    trimmed.endsWith(",");
                  const isClosing =
                    trimmed.toLowerCase() === "thank you." ||
                    trimmed.toLowerCase() === "respectfully," ||
                    trimmed.toLowerCase() === "respectfully yours,";

                  if (isSalutation || isClosing) {
                    return (
                      <div key={idx} className="mb-4">
                        {line}
                      </div>
                    );
                  }

                  // Paragraph with first-line indent (any leading spaces/tabs)
                  const hasIndent = /^[ \t]+/.test(line);
                  return (
                    <div
                      key={idx}
                      className="text-justify mb-2"
                      style={{ textIndent: hasIndent ? "2rem" : "0" }}
                    >
                      {trimmed}
                    </div>
                  );
                })
              ) : (
                <div
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{ __html: body }}
                  style={{ whiteSpace: "pre-wrap" }}
                />
              )}
            </div>
          )}
        </div>

        {/* Closing */}
        <div className="mt-6">
          <p>Respectfully,</p>
          <div className="mt-5">
            <p className="font-black text-xs underline uppercase">
              {customTemplate?.signatoryName || "AIZLE MARIE M. ATIENZA"}
            </p>
            <p className="font-medium text-slate-700">
              {customTemplate?.footer || "Admin Assistant"}
            </p>
          </div>
        </div>

        {/* Acknowledgment Section */}
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
          <p className="font-bold mb-4">Employee Acknowledgment:</p>
          <p className="mb-4">
            I, <span className="font-bold">{employee.name}</span>, hereby
            acknowledge receipt of this Formal Warning Letter.
          </p>
          <div className="space-y-4 pt-3">
            <div className="flex items-end gap-2 max-w-[400px]">
              <span className="font-bold whitespace-nowrap">
                Employee Signature:
              </span>
              <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
            </div>
            <div className="flex items-end gap-2 max-w-[250px]">
              <span className="font-bold whitespace-nowrap">Date:</span>
              <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormTwoTemplate({
  employee,
  entries,
  today,
  shiftTime,
  gracePeriod,
  salutationPrefix,
  lastName,
  numberToText,
  type,
  letterTitle,
  cutoffText,
  month,
  year,
  formatDateLong,
  customTemplate,
  isProbee,
  isEditMode,
  body,
  setBody,
  effectiveWarningLevel,
  offices,
  deptMap,
  isViewOnly,
}: any) {
  const totalDays =
    type === "leave"
      ? entries.reduce(
          (acc: number, curr: any) => acc + (Number(curr.number_of_days) || 0),
          0,
        )
      : entries.length;

  return (
    <Card
      className="border-0 shadow-2xl rounded-none print:shadow-none min-h-[1120px] w-[794px] flex flex-col bg-white"
      id="form-letter-2"
    >
      <CardContent className="px-14 py-8 flex-1 flex flex-col font-serif leading-snug text-[#333] text-xs">
        {/* Header Branding */}
        <div
          className="flex flex-col items-center mb-2 w-full"
          style={{ marginTop: "0.5cm" }}
        >
          {(() => {
            // Enhanced Resolution:
            // 1. Try direct office_id or department_id from employee
            // 2. Try looking up the office name via deptMap if we only have a department string
            let resolvedOfficeId = String(
              employee.office_id || employee.department?.office_id || "",
            );

            if (!resolvedOfficeId) {
              const deptName = employee.department || employee.office_name;
              if (deptName) {
                const offName = deptMap[deptName.toUpperCase().trim()];
                if (offName) {
                  const mappedOffice = offices.find(
                    (o: any) => o.name.toUpperCase().trim() === offName,
                  );
                  if (mappedOffice) resolvedOfficeId = String(mappedOffice.id);
                }
              }
            }

            const office = offices.find(
              (o: any) => String(o.id) === String(resolvedOfficeId),
            );
            const officeLogo = office?.header_logo_image;
            const officeDetails = office?.header_details;

            const logoToUse = officeLogo || customTemplate?.headerLogoImage;
            const detailsToUse = officeDetails || customTemplate?.headerDetails;

            return (
              <>
                {logoToUse ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={logoToUse}
                      alt="Company Logo"
                      className="max-w-[150px] max-h-[100px] object-contain"
                    />
                  </div>
                ) : null}

                {detailsToUse && (
                  <div className="text-center mt-1 text-[10px] leading-tight text-slate-600 max-w-[500px] whitespace-pre-wrap">
                    {detailsToUse}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="text-base font-black text-black tracking-wide">
            {resolveWarningTitle(
              customTemplate?.title,
              type === "late"
                ? `TARDINESS WARNING LETTER - ${isProbee ? "PROBEE" : "REGULAR"}`
                : letterTitle,
              effectiveWarningLevel,
            )}
          </h1>
        </div>

        {/* Metadata Block */}
        <div className="flex flex-col mb-3 text-black text-xs">
          <div className="flex justify-end">
            <p className="font-bold">
              Date: <span className="font-bold">{today}</span>
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="font-bold">
              Employee Name: <span className="font-bold">{employee.name}</span>
            </p>
            <p className="font-bold">
              Position:{" "}
              <span className="font-bold">
                {employee.position || "Employee"}
              </span>
            </p>
            {(employee.department || employee.office_name) && (
              <p className="font-bold">
                Department:{" "}
                <span className="font-bold">
                  {employee.department || employee.office_name}
                </span>
              </p>
            )}

            {customTemplate?.subject && (
              <p className="mt-4 font-bold uppercase tracking-tight text-[#A4163A]">
                {customTemplate.subject}
              </p>
            )}
          </div>
        </div>

        {/* Salutation (Only show if NO custom template, as custom body includes it) */}
        {!customTemplate && (
          <div className="mb-3">
            <p>
              Dear{" "}
              <span className="font-bold">
                {salutationPrefix} {lastName}
              </span>
              ,
            </p>
            {type === "late" && !isProbee && (
              <p className="mt-2 text-justify">Good day.</p>
            )}
          </div>
        )}

        {/* Body Content */}
        <div className="text-black text-xs leading-snug text-justify relative group/body">
          {isEditMode ? (
            <div className="relative group">
              <StandardRichTextEditor
                value={body}
                onChange={(val: string) => setBody(val)}
                isViewOnly={isViewOnly}
              />
            </div>
          ) : (
            <div className="flex-1 space-y-0 text-slate-900">
              {!/<[a-z/][\s\S]*>/i.test(body) ? (
                body.split("\n").map((line: string, idx: number) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={idx} className="h-2" />;
                  if (trimmed.startsWith("•")) {
                    return (
                      <div key={idx} className="flex gap-4 pl-10 mb-2">
                        <span className="shrink-0">•</span>
                        <span>{trimmed.substring(1).trim()}</span>
                      </div>
                    );
                  }
                  const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
                  if (numMatch) {
                    return (
                      <div key={idx} className="flex gap-4 pl-10 mb-2">
                        <span className="shrink-0 font-bold">
                          {numMatch[1]}.
                        </span>
                        <span>{numMatch[2]}</span>
                      </div>
                    );
                  }
                  const isSalutation =
                    trimmed.toLowerCase().startsWith("dear") ||
                    trimmed.endsWith(",");
                  const isClosing =
                    trimmed.toLowerCase() === "thank you." ||
                    trimmed.toLowerCase() === "respectfully," ||
                    trimmed.toLowerCase() === "respectfully yours,";

                  if (isSalutation || isClosing) {
                    return (
                      <div key={idx} className="mb-4">
                        {line}
                      </div>
                    );
                  }

                  // Paragraph with first-line indent (any leading spaces/tabs)
                  const hasIndent = /^[ \t]+/.test(line);
                  return (
                    <div
                      key={idx}
                      className="text-justify mb-2"
                      style={{ textIndent: hasIndent ? "2rem" : "0" }}
                    >
                      {trimmed}
                    </div>
                  );
                })
              ) : (
                <div
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{ __html: body }}
                  style={{ whiteSpace: "pre-wrap" }}
                />
              )}
            </div>
          )}
        </div>

        {/* Closing */}
        <div className="mt-6">
          <p>Respectfully,</p>
          <div className="mt-5">
            <p className="font-black text-xs underline uppercase">
              {customTemplate?.signatoryName || "AIZLE MARIE M. ATIENZA"}
            </p>
            <p className="font-medium text-slate-700">
              {customTemplate?.footer ||
                (type === "late"
                  ? isProbee
                    ? "Admin Assistant"
                    : "Admin Supervisor/HR"
                  : "Admin Assistant")}
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="my-4 border-t-2 border-slate-200 border-dashed print:hidden"></div>

        {/* Acknowledgment */}
        <div className="mt-3 space-y-2">
          <p className="font-bold mb-2">Employee Acknowledgment:</p>
          <p className="mb-4">
            I, <span className="font-bold">{employee.name}</span>, hereby
            acknowledge receipt of this Formal Warning Letter.
          </p>
          <div className="space-y-4 pt-3">
            <div className="flex items-end gap-2 max-w-[400px]">
              <span className="font-bold whitespace-nowrap">
                Employee Signature:
              </span>
              <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
            </div>
            <div className="flex items-end gap-2 max-w-[250px]">
              <span className="font-bold whitespace-nowrap">Date:</span>
              <div className="flex-1 border-b-[1.5px] border-black h-5"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FormLetterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FormLetterContent />
    </Suspense>
  );
}
