"use client";

import React, { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Users,
  FileText,
  Check,
  ChevronsUpDown,
  X,
  Search,
  ArrowUpDown,
  History,
  Clock3,
  ArrowUpAZ,
  ArrowDownAZ,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserRole } from "@/lib/hooks/useUserRole";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  status:
    | string
    | "pending"
    | "employed"
    | "terminated"
    | "rehire_pending"
    | "rehired_employee"
    | "termination_pending"
    | "resignation_pending";
  department?: string;
}

interface TerminationRecord {
  id: number;
  employee_id: string;
  termination_date: string;
  rehired_at?: string | null;
  reason: string;
  notes: string;
  status: string;
  exit_type?: string;
  employee: Employee;
  created_at?: string;
}

const statusBadgeColors: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  employed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  terminated: "border-rose-200 bg-rose-50 text-rose-700",
  resigned: "border-amber-200 bg-amber-50 text-amber-700",
  rehire_pending: "border-orange-200 bg-orange-50 text-orange-700",
  rehired_employee: "border-blue-200 bg-blue-50 text-blue-700",
  termination_pending: "border-rose-200 bg-rose-50 text-rose-700",
  resignation_pending: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  employed: "Employed",
  terminated: "Terminated",
  resigned: "Resigned",
  rehire_pending: "Rehire Pending",
  rehired_employee: "Rehired Employee",
  termination_pending: "Pending Termination",
  resignation_pending: "Pending Resignation",
};

const normalizeExitStatus = (value: unknown) => {
  const status = String(value ?? "")
    .toLowerCase()
    .trim();

  if (status === "termination_pending") return "terminated";
  if (status === "resignation_pending") return "resigned";
  return status;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const formatDateForInput = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatTimeForInput = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

const formatDateTimeForInput = (date: Date) =>
  `${formatDateForInput(date)}T${formatTimeForInput(date)}`;

const parseDateTimeValue = (value?: string | null): Date | null => {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/,
  );
  if (!match) return null;

  const [, year, month, day, hour = "00", minute = "00"] = match;
  const fallback = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );

  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const getDatePartFromDateTime = (value?: string | null) => {
  const parsed = parseDateTimeValue(value);
  return parsed ? formatDateForInput(parsed) : "";
};

const getTimePartFromDateTime = (value?: string | null) => {
  const parsed = parseDateTimeValue(value);
  return parsed ? formatTimeForInput(parsed) : "";
};

const joinDateAndTime = (
  datePart?: string | null,
  timePart?: string | null,
  fallback?: string | null,
) => {
  const safeDate = String(datePart ?? "").trim();
  const safeTime = String(timePart ?? "").trim();
  if (safeDate && safeTime) return `${safeDate}T${safeTime}`;

  const fallbackParsed = parseDateTimeValue(fallback);
  if (fallbackParsed) return formatDateTimeForInput(fallbackParsed);

  return formatDateTimeForInput(new Date());
};

const DISPLAY_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  day: "2-digit",
  year: "numeric",
});

const DISPLAY_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const formatDisplayDate = (value?: string | null) => {
  const parsed = parseDateTimeValue(value);
  return parsed ? DISPLAY_DATE_FORMATTER.format(parsed) : "N/A";
};

const formatDisplayTime = (value?: string | null) => {
  const parsed = parseDateTimeValue(value);
  return parsed ? DISPLAY_TIME_FORMATTER.format(parsed) : "";
};

const formatDisplayDateTime = (value?: string | null) => {
  const parsed = parseDateTimeValue(value);
  if (!parsed) return "N/A";
  return `${DISPLAY_DATE_FORMATTER.format(parsed)} ${DISPLAY_TIME_FORMATTER.format(parsed)}`;
};

interface TerminationFormData {
  termination_date: string;
  rehire_date: string;
  reason: string;
  notes: string;
  recommended_by: string;
  notice_modes: string[];
  notice_date: string;
  reviewed_by: string;
  approved_by: string;
  approval_date: string;
}

export default function TerminatePage() {
  return (
    <Suspense fallback={<TerminateSkeleton />}>
      <TerminatePageContent />
    </Suspense>
  );
}

const TerminateSkeleton = () => (
  <div className="flex-1 flex flex-col animate-pulse">
    {/* White Header Skeleton */}
    <div className="bg-white border-b border-slate-200 shadow-sm mb-6 overflow-hidden">
      <div className="w-full px-4 md:px-8 py-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 bg-slate-200 rounded-lg" />
            <Skeleton className="h-4 w-96 bg-slate-100 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-48 bg-slate-100 rounded-xl" />
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50/50 px-4 md:px-8 py-3 flex gap-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-8 w-32 bg-slate-100 rounded-lg" />
        ))}
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="px-4 md:px-8 pb-12 space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <Skeleton className="h-6 w-48 bg-slate-200" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-64 rounded-lg bg-slate-100" />
            <Skeleton className="h-10 w-32 rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-12 w-12 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full bg-slate-100" />
                <Skeleton className="h-3 w-2/3 bg-slate-50" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <Skeleton className="h-6 w-40 bg-slate-200" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-50" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

function TerminatePageContent() {
  const { isViewOnly } = useUserRole();
  const viewOnlyDescription =
    "Create, update, and delete actions are disabled in view only mode.";
  const notifyViewOnly = () => {
    toast.warning("View Only Mode", {
      description: viewOnlyDescription,
    });
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [terminations, setTerminations] = useState<TerminationRecord[]>([]);
  const [resigned, setResigned] = useState<TerminationRecord[]>([]);
  const [hierarchies, setHierarchies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedTermination, setSelectedTermination] =
    useState<TerminationRecord | null>(null);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [rehireLoading, setRehireLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<TerminationFormData>({
    termination_date: formatDateTimeForInput(new Date()),
    rehire_date: formatDateTimeForInput(new Date()),
    reason: "",
    notes: "",
    recommended_by: "",
    notice_modes: [],
    notice_date: formatDateTimeForInput(new Date()),
    reviewed_by: "",
    approved_by: "Mr. Angelle S. Sarmiento",
    approval_date: formatDateTimeForInput(new Date()),
  });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [currentResignedPage, setCurrentResignedPage] = useState(1);
  const itemsPerPage = 10;
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "az" | "za">(
    "recent",
  );
  const [activeTab, setActiveTab] = useState<
    "all" | "terminated" | "rehired" | "resigned"
  >("all");
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "terminated" | "rehired" | "resigned"
  >("all");
  const [exitActionType, setExitActionType] = useState<
    "terminate" | "resigned"
  >("terminate");
  const router = useRouter();
  const pathname = usePathname();

  const searchParams = useSearchParams();
  const isHistoryView = searchParams.get("view") === "history";

  const getLatestPerEmployee = (records: TerminationRecord[]) => {
    const latestMap = new Map<string, TerminationRecord>();
    for (const record of records) {
      const key = String(record.employee_id ?? "");
      const existing = latestMap.get(key);
      if (!existing) {
        latestMap.set(key, record);
        continue;
      }
      const currentTs = new Date(record.termination_date ?? 0).getTime();
      const existingTs = new Date(existing.termination_date ?? 0).getTime();
      if (currentTs > existingTs) latestMap.set(key, record);
    }
    return Array.from(latestMap.values());
  };

  const isRehiredRecord = (record: TerminationRecord) => {
    const status = String(record.employee?.status ?? record.status ?? "")
      .toLowerCase()
      .trim();
    return status === "rehired_employee";
  };
  const getRecordStatusValue = (record: TerminationRecord) =>
    String(record.employee?.status ?? record.status ?? "")
      .toLowerCase()
      .trim();
  const getRecordStatusLabel = (record: TerminationRecord) => {
    const status = getRecordStatusValue(record);
    return (
      statusLabels[status] ??
      (record.exit_type === "resigned" ? "Resigned" : "Terminated")
    );
  };
  const getStatusBadgeClass = (record: TerminationRecord) => {
    const status = getRecordStatusValue(record);
    return statusBadgeColors[status] ?? "border-rose-200 bg-rose-50 text-rose-700";
  };
  const canShowRehireAction = (record: TerminationRecord) => {
    const status = getRecordStatusValue(record);
    if (status === "rehired_employee" || status === "rehire_pending")
      return false;
    return (
      status === "terminated" ||
      status === "resigned" ||
      status === "termination_pending" ||
      status === "resignation_pending"
    );
  };

  const applyRecordFilters = (records: TerminationRecord[]) =>
    records
      .filter((record) => {
        // Search filter
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        const fullName =
          `${record.employee?.last_name ?? ""}, ${record.employee?.first_name ?? ""}`.toLowerCase();
        const reason = (record.reason ?? "").toLowerCase();
        const date = formatDisplayDateTime(record.termination_date).toLowerCase();
        return fullName.includes(q) || reason.includes(q) || date.includes(q);
      })
      .sort((a, b) => {
        switch (sortOrder) {
          case "recent":
            return (
              new Date(b.termination_date ?? 0).getTime() -
              new Date(a.termination_date ?? 0).getTime()
            );
          case "oldest":
            return (
              new Date(a.termination_date ?? 0).getTime() -
              new Date(b.termination_date ?? 0).getTime()
            );
          case "az":
            return `${a.employee?.last_name} ${a.employee?.first_name}`.localeCompare(
              `${b.employee?.last_name} ${b.employee?.first_name}`,
            );
          case "za":
            return `${b.employee?.last_name} ${b.employee?.first_name}`.localeCompare(
              `${a.employee?.last_name} ${a.employee?.first_name}`,
            );
          default:
            return 0;
        }
      });

  const mergedRecords = [...terminations, ...resigned];
  const statusBackedRecords: TerminationRecord[] = allEmployees
    .filter((emp) => {
      const status = String(emp.status ?? "")
        .toLowerCase()
        .trim();
      return [
        "terminated",
        "termination_pending",
        "resigned",
        "resignation_pending",
        "rehired_employee",
      ].includes(status);
    })
    .filter((emp) => {
      const empId = String(emp.id ?? "").trim();
      const empEmail = String(emp.email ?? "")
        .toLowerCase()
        .trim();
      return !mergedRecords.some((record) => {
        const recordId = String(record.employee_id ?? "").trim();
        const recordEmail = String(record.employee?.email ?? "")
          .toLowerCase()
          .trim();
        return (
          (empId && recordId && empId === recordId) ||
          (empEmail && recordEmail && empEmail === recordEmail)
        );
      });
    })
    .map((emp, index) => {
      const status = String(emp.status ?? "")
        .toLowerCase()
        .trim();
      const anyEmp = emp as any;
      return {
        id: -(index + 1),
        employee_id: String(emp.id ?? ""),
        termination_date:
          anyEmp.resignation_date ||
          anyEmp.termination_date ||
          anyEmp.updated_at ||
          anyEmp.created_at ||
          "",
        rehired_at: anyEmp.rehired_at || null,
        reason:
          anyEmp.resignation_reason ||
          anyEmp.termination_reason ||
          anyEmp.reason ||
          "No recorded reason",
        notes: anyEmp.notes || "",
        status,
        exit_type:
          status === "resigned" || status === "resignation_pending"
            ? "resigned"
            : "terminate",
        employee: emp,
        created_at: anyEmp.created_at,
      } as TerminationRecord;
    });
  const recordsWithStatusFallback = [...mergedRecords, ...statusBackedRecords];
  const baseTerminations = isHistoryView
    ? recordsWithStatusFallback
    : getLatestPerEmployee(recordsWithStatusFallback);
  const baseResigned = baseTerminations;
  const realtimeTerminations = getLatestPerEmployee(recordsWithStatusFallback);
  const realtimeResigned = realtimeTerminations;

  const tabFilteredTerminations = applyRecordFilters(baseTerminations).filter(
    (record) => {
      const status = getRecordStatusValue(record);
      if (isHistoryView) return true;
      if (activeTab === "all") return true;
      if (activeTab === "terminated") {
        return status === "terminated" || status === "termination_pending";
      }
      if (activeTab === "rehired") return isRehiredRecord(record);
      if (activeTab === "resigned") {
        return status === "resigned" || status === "resignation_pending";
      }
      return false;
    },
  );
  const tabFilteredResigned = tabFilteredTerminations;
  const filteredTerminations = tabFilteredTerminations.filter((record) => {
    const status = getRecordStatusValue(record);
    if (!isHistoryView || historyFilter === "all") return true;
    if (historyFilter === "terminated") {
      return status === "terminated" || status === "termination_pending";
    }
    if (historyFilter === "resigned") {
      return status === "resigned" || status === "resignation_pending";
    }
    if (historyFilter === "rehired") return isRehiredRecord(record);
    return false;
  });
  const filteredResigned = filteredTerminations;
  const sortRecords = (records: TerminationRecord[]) =>
    [...records].sort((a, b) => {
      switch (sortOrder) {
        case "recent":
          return (
            new Date(b.termination_date ?? 0).getTime() -
            new Date(a.termination_date ?? 0).getTime()
          );
        case "oldest":
          return (
            new Date(a.termination_date ?? 0).getTime() -
            new Date(b.termination_date ?? 0).getTime()
          );
        case "az":
          return `${a.employee?.last_name} ${a.employee?.first_name}`.localeCompare(
            `${b.employee?.last_name} ${b.employee?.first_name}`,
          );
        case "za":
          return `${b.employee?.last_name} ${b.employee?.first_name}`.localeCompare(
            `${a.employee?.last_name} ${a.employee?.first_name}`,
          );
        default:
          return 0;
      }
    });
  const primaryRecords = sortRecords(filteredTerminations);
  const primaryBaseCount = baseTerminations.length;
  const isRehireFocusedView =
    (!isHistoryView && activeTab === "rehired") ||
    (isHistoryView && historyFilter === "rehired");
  const isResignedFocusedView =
    (!isHistoryView && activeTab === "resigned") ||
    (isHistoryView && historyFilter === "resigned");
  const primaryHistoryTitle =
    activeTab === "all" || isHistoryView
      ? "All Exit History"
      : isRehireFocusedView
        ? "Rehire History"
        : isResignedFocusedView
          ? "Resigned History"
          : "Terminated History";
  const primaryDateLabel = "Exit Date";
  const showTerminatedTable = true;
  const showResignedTable = false;
  const selectedRecordIsResigned =
    selectedTermination?.exit_type === "resigned";
  const superiors = React.useMemo(() => {
    if (!selectedEmployeeId) return [];
    const targetEmp = employees.find((e) => e.id === selectedEmployeeId);
    if (!targetEmp) return [];

    const normalize = (value: unknown) =>
      String(value || "")
        .toLowerCase()
        .trim();
    const normalizeRole = (value: unknown) =>
      normalize(value)
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    const empPosName = normalizeRole(targetEmp.position);

    const hierarchyById = new Map(hierarchies.map((h) => [String(h.id), h]));

    // Find hierarchy node for the employee's position
    const node = hierarchies.find((h) => {
      const name = h?.name ?? h?.position?.name;
      return normalizeRole(name) === empPosName;
    });
    const ancestorPositionNames = new Set<string>();
    const coreRoles = hierarchies
      .filter((h) => h.department_id == null && (h.position?.name || h.name))
      .map((h) => normalizeRole(h.position?.name || h.name));

    if (!node) {
      // Fallback: allow core/top-level positions when hierarchy is missing
      coreRoles.forEach((name) => ancestorPositionNames.add(name));
      hierarchies
        .filter((h) => !h.parent_id && (h.position?.name || h.name))
        .forEach((h) =>
          ancestorPositionNames.add(normalizeRole(h.position?.name || h.name)),
        );
    } else {
      let currentParentId = node.parent_id;
      while (currentParentId) {
        const parentNode = hierarchyById.get(String(currentParentId));
        if (parentNode) {
          const parentName = parentNode?.name ?? parentNode?.position?.name;
          if (parentName) ancestorPositionNames.add(normalizeRole(parentName));
          currentParentId = parentNode.parent_id;
        } else {
          break;
        }
      }
      // Non-core employees should also be recommended by core leadership
      if (node.department_id != null) {
        coreRoles.forEach((name) => ancestorPositionNames.add(name));
      }
    }

    return employees.filter(
      (emp) =>
        emp.id !== selectedEmployeeId &&
        ancestorPositionNames.has(normalizeRole(emp.position)),
    );
  }, [selectedEmployeeId, employees, hierarchies]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    const superiorNames = new Set(
      superiors.map((emp) => `${emp.first_name} ${emp.last_name}`),
    );
    setFormData((prev) => ({
      ...prev,
      recommended_by: superiorNames.has(prev.recommended_by)
        ? prev.recommended_by
        : "",
      reviewed_by: superiorNames.has(prev.reviewed_by) ? prev.reviewed_by : "",
    }));
  }, [selectedEmployeeId, superiors]);

  const allCount = realtimeTerminations.filter((r) => {
    const status = getRecordStatusValue(r);
    return [
      "terminated",
      "termination_pending",
      "resigned",
      "resignation_pending",
      "rehired_employee",
    ].includes(status);
  }).length;
  const terminatedCount = realtimeTerminations.filter(
    (r) => {
      const status = getRecordStatusValue(r);
      return status === "terminated" || status === "termination_pending";
    },
  ).length;
  const rehiredCount = realtimeTerminations.filter((r) =>
    isRehiredRecord(r),
  ).length;
  const resignedCount = realtimeResigned.filter((r) => {
    const status = getRecordStatusValue(r);
    return status === "resigned" || status === "resignation_pending";
  }).length;
  // Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "destructive" | "warning" | "success" | "default";
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "default",
    confirmText: "Confirm",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const [empRes, termRes, resignedRes, hierRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/employees`),
        fetch(`${getApiUrl()}/api/terminations`),
        fetch(`${getApiUrl()}/api/resigned`),
        fetch(`${getApiUrl()}/api/hierarchies`, {
          headers: { Accept: "application/json" },
        }),
      ]);

      const empData = await empRes.json();
      const termData = await termRes.json();
      const resignedData = await resignedRes.json();
      const hierData = await hierRes.json();

      const parsedHierarchies = Array.isArray(hierData?.data)
        ? hierData.data
        : Array.isArray(hierData)
          ? hierData
          : [];
      setHierarchies(parsedHierarchies);

      const employeeStatusById = new Map<string, string>();
      const employeeStatusByEmail = new Map<string, string>();
      if (empData.success && Array.isArray(empData.data)) {
        for (const emp of empData.data) {
          const status = String(emp?.status ?? "")
            .toLowerCase()
            .trim();
          if (!status) continue;

          const idKey = String(emp?.id ?? "").trim();
          if (idKey && !employeeStatusById.has(idKey)) {
            employeeStatusById.set(idKey, status);
          }

          const emailKey = String(emp?.email ?? "")
            .trim()
            .toLowerCase();
          if (emailKey && !employeeStatusByEmail.has(emailKey)) {
            employeeStatusByEmail.set(emailKey, status);
          }
        }
      }

      const resolveCurrentEmployeeStatus = (record: any): string => {
        const employeeId = String(record?.employee_id ?? "").trim();
        const employeeEmail = String(record?.employee?.email ?? "")
          .trim()
          .toLowerCase();

        return normalizeExitStatus(
          employeeStatusById.get(employeeId) ??
          employeeStatusByEmail.get(employeeEmail) ??
          String(record?.employee?.status ?? record?.status ?? "")
            .toLowerCase()
              .trim(),
        );
      };

      const resolveRehiredAt = (record: any): string | null => {
        const candidates = [
          record?.rehired_at,
          record?.rehire_date,
          record?.rehired_date,
          record?.rehireDate,
          record?.rehiredAt,
          record?.re_hired_at,
          record?.employee?.rehired_at,
          record?.employee?.rehire_date,
          record?.employee?.rehired_date,
          record?.employee?.rehireDate,
          record?.employee?.rehiredAt,
        ];
        const resolved = candidates.find((value) => {
          if (value === null || value === undefined) return false;
          return String(value).trim() !== "";
        });
        return resolved ? String(resolved) : null;
      };
      const rehiredByEmployeeId = new Map<string, string>();
      const rehiredByEmail = new Map<string, string>();
      try {
        const rehiredRes = await fetch(`${getApiUrl()}/api/rehired`, {
          headers: { Accept: "application/json" },
        });
        if (rehiredRes.ok) {
          const rehiredData = await rehiredRes.json();
          const rehiredRows = Array.isArray(rehiredData?.data)
            ? rehiredData.data
            : [];
          for (const row of rehiredRows) {
            const resolvedRehiredAt = resolveRehiredAt(row);
            if (!resolvedRehiredAt) continue;

            const keys = [
              row?.employee_id,
              row?.previous_employee_id,
              row?.employee?.id,
            ]
              .map((value) => String(value ?? "").trim())
              .filter(Boolean);

            for (const key of keys) {
              if (!rehiredByEmployeeId.has(key)) {
                rehiredByEmployeeId.set(key, resolvedRehiredAt);
              }
            }

            const emailKeys = [
              row?.profile_snapshot?.email,
              row?.employee?.email,
            ]
              .map((value) =>
                String(value ?? "")
                  .trim()
                  .toLowerCase(),
              )
              .filter(Boolean);

            for (const emailKey of emailKeys) {
              if (!rehiredByEmail.has(emailKey)) {
                rehiredByEmail.set(emailKey, resolvedRehiredAt);
              }
            }
          }
        }
      } catch (rehiredFetchError) {
        console.error(
          "Unable to fetch rehired records for fallback mapping:",
          rehiredFetchError,
        );
      }

      if (empData.success && Array.isArray(empData.data)) {
        setAllEmployees(empData.data);

        // Only show currently employed or rehired employees in dropdown
        const active = empData.data
          .filter((emp: Employee) =>
            ["employed", "rehired_employee"].includes(
              String(emp.status).toLowerCase(),
            ),
          )
          .sort((a: Employee, b: Employee) =>
            a.last_name.localeCompare(b.last_name),
          );
        setEmployees(active);
      }

      if (termData.success && Array.isArray(termData.data)) {
        const normalizedTerminations = termData.data.map((record: any) => ({
          ...record,
          employee: {
            ...(record?.employee ?? {}),
            status: resolveCurrentEmployeeStatus(record),
          },
          rehired_at:
            resolveRehiredAt(record) ??
            rehiredByEmployeeId.get(String(record?.employee_id ?? "").trim()) ??
            rehiredByEmail.get(
              String(record?.employee?.email ?? "")
                .trim()
                .toLowerCase(),
            ) ??
            null,
        }));
        setTerminations(normalizedTerminations);
      } else {
        toast.error("Failed to load termination history");
      }

      if (resignedData.success && Array.isArray(resignedData.data)) {
        const normalizedResigned = resignedData.data.map((record: any) => ({
          ...record,
          termination_date: record.resignation_date,
          employee: {
            ...(record?.employee ?? {}),
            status: resolveCurrentEmployeeStatus(record),
          },
          rehired_at:
            resolveRehiredAt(record) ??
            rehiredByEmployeeId.get(String(record?.employee_id ?? "").trim()) ??
            rehiredByEmail.get(
              String(record?.employee?.email ?? "")
                .trim()
                .toLowerCase(),
            ) ??
            null,
          exit_type: "resigned",
        }));
        setResigned(normalizedResigned);
      } else {
        toast.error("Failed to load resigned history");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setFetchError("Network Error: Could not connect to the server.");
      toast.error("Network Error: Could not connect to the server.");
    } finally {
      setLoading(false);
      setIsActionLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "reason") {
      const sanitized = value
        .replace(/[^A-Za-z0-9 ]+/g, "")
        .replace(/\s+/g, " ")
        .slice(0, 50);
      setFormData((prev) => ({
        ...prev,
        [name]: sanitized,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setDateTimeDatePart = (
    field: "termination_date" | "notice_date" | "approval_date" | "rehire_date",
    date: Date | undefined,
  ) => {
    if (!date) return;
    const datePart = formatDateForInput(date);
    setFormData((prev) => ({
      ...prev,
      [field]: joinDateAndTime(
        datePart,
        getTimePartFromDateTime(prev[field]) || "00:00",
        prev[field],
      ),
    }));
  };

  const setDateTimeTimePart = (
    field: "termination_date" | "notice_date" | "approval_date" | "rehire_date",
    timeValue: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: joinDateAndTime(
        getDatePartFromDateTime(prev[field]) || formatDateForInput(new Date()),
        timeValue,
        prev[field],
      ),
    }));
  };

  const toggleNoticeMode = (mode: "email" | "printed_letter" | "both") => {
    setFormData((prev) => {
      const current = prev.notice_modes;
      if (mode === "both") {
        return {
          ...prev,
          notice_modes: current.includes("both") ? [] : ["both"],
        };
      }

      const withoutBoth = current.filter((m) => m !== "both");
      const hasMode = withoutBoth.includes(mode);
      return {
        ...prev,
        notice_modes: hasMode
          ? withoutBoth.filter((m) => m !== mode)
          : [...withoutBoth, mode],
      };
    });
  };

  const getNoticeModeSummary = (modes: string[]) => {
    if (modes.includes("both")) return "Both (Email and Printed Letter)";
    const labels: Record<string, string> = {
      email: "Email",
      printed_letter: "Printed Letter",
    };
    return modes.map((m) => labels[m] ?? m).join(", ");
  };

  const buildPrintNoticeHtml = (
    employee: Employee,
    payload: TerminationFormData,
  ) => {
    const formatDate = (value?: string) => formatDisplayDateTime(value);
    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Notice of Termination</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: Arial, sans-serif; color: #111827; }
          .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm; box-sizing: border-box; }
          .title { text-align: center; font-size: 20px; font-weight: 700; margin-bottom: 24px; }
          .section { margin-bottom: 14px; line-height: 1.6; }
          .meta { margin-top: 18px; border: 1px solid #d1d5db; padding: 12px; border-radius: 8px; }
          .meta p { margin: 6px 0; }
          .label { font-weight: 700; }
          .signatures { margin-top: 36px; display: grid; grid-template-columns: 1fr 1fr; gap: 36px; }
          .sigline { border-top: 1px solid #111827; margin-top: 44px; padding-top: 6px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="title">NOTICE OF TERMINATION</div>
          <div class="section">Dear <strong>${employee.first_name} ${employee.last_name}</strong>,</div>
          <div class="section">
            This serves as formal notice regarding the termination of your employment with ABIC Accounting.
          </div>
          <div class="meta">
            <p><span class="label">Employee:</span> ${employee.first_name} ${employee.last_name}</p>
            <p><span class="label">Position:</span> ${employee.position || "N/A"}</p>
            <p><span class="label">Termination Date:</span> ${formatDate(payload.termination_date)}</p>
            <p><span class="label">Reason:</span> ${payload.reason}</p>
            <p><span class="label">Recommended By:</span> ${payload.recommended_by || "N/A"}</p>
            <p><span class="label">Mode of Notice:</span> ${getNoticeModeSummary(payload.notice_modes)}</p>
            <p><span class="label">Date of Notice:</span> ${formatDate(payload.notice_date)}</p>
            <p><span class="label">Reviewed By:</span> ${payload.reviewed_by || "N/A"}</p>
            <p><span class="label">Approved By:</span> ${payload.approved_by || "N/A"}</p>
            <p><span class="label">Date of Approval:</span> ${formatDate(payload.approval_date)}</p>
          </div>
          <div class="section" style="margin-top:18px;">
            For concerns, please coordinate with HR/Admin Office.
          </div>
          <div class="signatures">
            <div>
              <div class="sigline">Employee Signature</div>
            </div>
            <div>
              <div class="sigline">Authorized Signature</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
      </html>
    `;
  };

  const openPrintNotice = (
    printWindow: Window,
    employee: Employee,
    payload: TerminationFormData,
  ) => {
    const letterHtml = buildPrintNoticeHtml(employee, payload);
    printWindow.document.open();
    printWindow.document.write(letterHtml);
    printWindow.document.close();
  };

  const normalizedReason = formData.reason.trim();
  const hasValidReasonLength =
    normalizedReason.length >= 5 && normalizedReason.length <= 50;
  const hasValidReasonCharacters = /^[A-Za-z0-9 ]+$/.test(normalizedReason);

  const handleSubmit = async (e: React.FormEvent) => {
    if (isViewOnly) {
      notifyViewOnly();
      return;
    }

    e.preventDefault();

    if (!selectedEmployeeId) {
      toast.error("Please select an employee to terminate");
      return;
    }

    if (!normalizedReason) {
      toast.error("Reason is required");
      return;
    }

    if (normalizedReason.length < 5) {
      toast.error("Reason must be at least 5 characters");
      return;
    }

    if (normalizedReason.length > 50) {
      toast.error("Reason must not exceed 50 characters");
      return;
    }

    if (!hasValidReasonCharacters) {
      toast.error("Reason must only contain letters, numbers, and spaces");
      return;
    }

    if (exitActionType === "terminate") {
      if (!formData.recommended_by) {
        toast.error("Please select Recommended By");
        return;
      }
      if (formData.notice_modes.length === 0) {
        toast.error("Please select at least one Mode of Notice");
        return;
      }
      if (!formData.notice_date) {
        toast.error("Date of Notice is required");
        return;
      }
    }

    if (!formData.reviewed_by) {
      toast.error("Please select Reviewed By");
      return;
    }

    if (!formData.approval_date) {
      toast.error("Date of Approval is required");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title:
        exitActionType === "resigned"
          ? "Confirm Resignation"
          : "Confirm Termination",
      description:
        exitActionType === "resigned"
          ? "Are you sure you want to process this employee as resigned? This action can be reversed via re-hire."
          : "Are you sure you want to proceed with this termination? This action can be reversed via re-hire.",
      variant: "destructive",
      confirmText:
        exitActionType === "resigned"
          ? "Yes, Mark as Resigned"
          : "Yes, Terminate",
      onConfirm: async () => {
        let requestTimeout: ReturnType<typeof setTimeout> | null = null;
        const controller = new AbortController();
        try {
          setSubmitting(true);
          const selectedEmployee =
            employees.find((emp) => emp.id === selectedEmployeeId) || null;
          const snapshot = { ...formData };
          const isTerminate = exitActionType === "terminate";
          const wantsPrinted =
            isTerminate &&
            (snapshot.notice_modes.includes("both") ||
              snapshot.notice_modes.includes("printed_letter"));
          let reservedPrintWindow: Window | null = null;
          if (wantsPrinted) {
            // Open early while still in user gesture context; fill content after success.
            reservedPrintWindow = window.open(
              "",
              "_blank",
              "width=900,height=1000",
            );
            if (!reservedPrintWindow) {
              toast.error("Please allow pop-ups to print the notice letter.");
            }
          }

          requestTimeout = setTimeout(() => controller.abort(), 30000);
          const submitExitRequest = async (reasonValue: string) => {
            const response = await fetch(
              `${getApiUrl()}/api/employees/${selectedEmployeeId}/terminate`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                signal: controller.signal,
                body: JSON.stringify({
                  termination_date: formData.termination_date,
                  reason: reasonValue,
                  notes: formData.notes,
                  exit_type: exitActionType,
                  recommended_by: formData.recommended_by || null,
                  notice_mode: formData.notice_modes.includes("both")
                    ? "both"
                    : formData.notice_modes.join(","),
                  notice_date: formData.notice_date || null,
                  reviewed_by: formData.reviewed_by || null,
                  approved_by: formData.approved_by,
                  approval_date: formData.approval_date || null,
                }),
              },
            );

            const data = await response.json();
            return { response, data };
          };

          const reasonForApi =
            normalizedReason.length >= 5 && normalizedReason.length < 10
              ? normalizedReason.padEnd(10, " ")
              : normalizedReason;

          let { data } = await submitExitRequest(reasonForApi);

          const backendErrorDetails = [
            String(data?.message ?? ""),
            ...(data?.errors
              ? Object.values(data.errors)
                  .flat()
                  .map((value) => String(value ?? ""))
              : []),
          ]
            .join(" ")
            .toLowerCase()
            .trim();

          const needsHardPaddingRetry =
            !data?.success &&
            normalizedReason.length >= 5 &&
            normalizedReason.length < 10 &&
            backendErrorDetails.includes("at least 10 characters");

          if (needsHardPaddingRetry) {
            const hardPaddedReason = normalizedReason.padEnd(
              10,
              normalizedReason.slice(-1) || "x",
            );
            const retryResult = await submitExitRequest(hardPaddedReason);
            data = retryResult.data;
          }

          if (data.success) {
            if (exitActionType === "terminate") {
              try {
                await fetch(
                  `${getApiUrl()}/api/employees/${encodeURIComponent(selectedEmployeeId)}`,
                  {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      Accept: "application/json",
                    },
                    body: JSON.stringify({
                      status: "terminated",
                    }),
                  },
                );
              } catch (statusError) {
                console.error(
                  "Failed to enforce terminated status after termination:",
                  statusError,
                );
              }
            }

            if (exitActionType === "terminate") {
              if (wantsPrinted && selectedEmployee && reservedPrintWindow) {
                openPrintNotice(
                  reservedPrintWindow,
                  selectedEmployee,
                  snapshot,
                );
              }
              if (data.email_notice_status === "failed") {
                toast.error(
                  data.email_notice_error ||
                    "Termination saved but email notice failed.",
                );
              }
            }

            toast.success(
              data.message ||
                (exitActionType === "resigned"
                  ? "Employee marked as resigned successfully"
                  : "Employee terminated successfully"),
            );
            setSelectedEmployeeId("");
            setFormData({
              termination_date: formatDateTimeForInput(new Date()),
              rehire_date: formatDateTimeForInput(new Date()),
              reason: "",
              notes: "",
              recommended_by: "",
              notice_modes: [],
              notice_date: formatDateTimeForInput(new Date()),
              reviewed_by: "",
              approved_by: "Mr. Angelle S. Sarmiento",
              approval_date: formatDateTimeForInput(new Date()),
            });
            setIsRequestFormOpen(false);
            fetchData();
          } else {
            if (data.errors) {
              const errorMessages = Object.values(data.errors).flat().join(" ");
              toast.error(errorMessages || data.message);
            } else {
              toast.error(
                data.message ||
                  (exitActionType === "resigned"
                    ? "Failed to mark employee as resigned"
                    : "Failed to terminate employee"),
              );
            }
          }
        } catch (error) {
          console.error("Error:", error);
          if (error instanceof DOMException && error.name === "AbortError") {
            toast.error("Request timed out. Please try again.");
          } else {
            toast.error("Network Error: Could not connect to the server.");
          }
        } finally {
          if (requestTimeout) clearTimeout(requestTimeout);
          setSubmitting(false);
          setIsActionLoading(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRehire = async (employeeId: string) => {
    if (isViewOnly) {
      notifyViewOnly();
      return;
    }

    if (!formData.rehire_date) {
      toast.error("Please set a re-hire date and time");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Confirm Re-hire",
      description:
        "Are you sure you want to re-hire this employee? This will restore their active status.",
      variant: "success",
      confirmText: "Yes, Re-hire",
      onConfirm: async () => {
        try {
          setRehireLoading(employeeId);
          const rehireEmailQuery = selectedTermination?.employee?.email
            ? `&email=${encodeURIComponent(selectedTermination.employee.email)}`
            : "";
          const profileResponse = await fetch(
            `${getApiUrl()}/api/employees/${encodeURIComponent(employeeId)}`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );
          const profileData = await profileResponse.json();
          const employeeProfile = profileData?.data ?? null;

          const requiredProfileFields = [
            "position",
            "date_hired",
            "last_name",
            "first_name",
            "birthday",
            "birthplace",
            "civil_status",
            "gender",
            "mobile_number",
            "street",
            "region",
            "province",
            "city_municipality",
            "barangay",
            "zip_code",
            "email",
            "perm_street",
            "perm_region",
            "perm_province",
            "perm_city_municipality",
            "perm_barangay",
            "perm_zip_code",
          ];

          const missingFields = requiredProfileFields.filter((field) => {
            const value = employeeProfile?.[field];
            return (
              value === null ||
              value === undefined ||
              String(value).trim() === ""
            );
          });

          if (!employeeProfile || missingFields.length > 0) {
            toast.error(
              "Re-hire blocked: please complete and save employee information in onboarding before re-hiring.",
            );
            setShowDetailDialog(false);
            localStorage.removeItem("employee_onboarding_state");
            router.push(
              `/admin/employee/onboard?id=${encodeURIComponent(employeeId)}&view=onboard&rehire=1&batch=1${rehireEmailQuery}`,
            );
            return;
          }

          const response = await fetch(
            `${getApiUrl()}/api/employees/${encodeURIComponent(employeeId)}/rehire`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                rehired_at: formData.rehire_date,
              }),
            },
          );

          const data = await response.json();

          if (data.success) {
            let resolvedEmployeeId = String(
              data?.data?.id ??
                data?.employee?.id ??
                data?.rehire?.id ??
                employeeId,
            );

            // Some backends issue a new employee code on re-hire (e.g. 27-0002 -> 29-0002).
            // If response doesn't provide it, resolve by latest record with the same email.
            const selectedEmail = String(
              selectedTermination?.employee?.email ?? "",
            )
              .trim()
              .toLowerCase();
            if (selectedEmail && resolvedEmployeeId === employeeId) {
              try {
                const employeesResponse = await fetch(
                  `${getApiUrl()}/api/employees`,
                  {
                    headers: { Accept: "application/json" },
                  },
                );
                const employeesData = await employeesResponse.json();
                const employees = Array.isArray(employeesData?.data)
                  ? employeesData.data
                  : [];
                const matched = employees
                  .filter((emp: any) => {
                    const email = String(emp?.email ?? "")
                      .trim()
                      .toLowerCase();
                    return email === selectedEmail;
                  })
                  .sort((a: any, b: any) => {
                    const aTs = new Date(
                      a?.updated_at ?? a?.created_at ?? 0,
                    ).getTime();
                    const bTs = new Date(
                      b?.updated_at ?? b?.created_at ?? 0,
                    ).getTime();
                    return bTs - aTs;
                  })[0];

                if (matched?.id) {
                  resolvedEmployeeId = String(matched.id);
                }
              } catch (resolveError) {
                console.error(
                  "Unable to resolve latest employee ID after re-hire:",
                  resolveError,
                );
              }
            }

            try {
              await fetch(
                `${getApiUrl()}/api/employees/${encodeURIComponent(resolvedEmployeeId)}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify({
                    status: "rehire_pending",
                    rehire_process: true,
                  }),
                },
              );
            } catch (flagError) {
              console.error(
                "Failed to mark rehire process as in progress:",
                flagError,
              );
            }

            toast.success(data.message || "Employee re-hired successfully");
            // Ensure onboarding loads fresh server data for this employee.
            localStorage.removeItem("employee_onboarding_state");
            setShowDetailDialog(false);
            router.push(
              `/admin/employee/onboard?id=${encodeURIComponent(resolvedEmployeeId)}&view=onboard&rehire=1&batch=1${rehireEmailQuery}`,
            );
          } else {
            if (data.errors) {
              const errorMessages = Object.values(data.errors).flat().join(" ");
              toast.error(errorMessages || data.message);
            } else {
              toast.error(data.message || "Failed to re-hire employee");
            }
          }
        } catch (error) {
          console.error("Error re-hiring:", error);
          toast.error("Network Error: Could not connect to the server.");
        } finally {
          setRehireLoading(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-red-50 text-stone-900 font-sans flex flex-col [&_button:disabled]:cursor-not-allowed [&_input:disabled]:cursor-not-allowed [&_textarea:disabled]:cursor-not-allowed">
      {loading ? (
        <TerminateSkeleton />
      ) : (
        <>
          {/* ----- GLOBAL LOADING OVERLAY (For Actions Only) ----- */}
          {(submitting || rehireLoading !== null || isActionLoading) && (
            <div className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
              <div className="bg-white/80 backdrop-blur-xl w-[400px] h-auto p-12 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col items-center gap-10 animate-in zoom-in-95 duration-300">
                <div className="relative">
                  <div className="w-14 h-14 border-[3px] border-slate-100 border-t-[#A4163A] rounded-full animate-spin" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-2xl font-bold text-[#1e293b] tracking-tight">
                    Loading...
                  </h3>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2.5 h-2.5 bg-[#A4163A]/60 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          {/* Masterfile-style maroon header */}
          <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
            {/* Main Header Row */}
            <div className="w-full px-4 md:px-8 py-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">
                    Terminate / Resign Employee
                  </h1>
                  <p className="text-white/80 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Process employee exit and manage records
                  </p>
                  {isViewOnly && (
                    <p className="text-yellow-200 text-xs md:text-sm font-semibold mt-2 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      VIEW ONLY MODE - Editing and modifications are disabled
                    </p>
                  )}
                </div>
                <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        if (isViewOnly) {
                          notifyViewOnly();
                          return;
                        }
                        if (
                          isRequestFormOpen &&
                          exitActionType === "terminate"
                        ) {
                          setIsRequestFormOpen(false);
                        } else {
                          setExitActionType("terminate");
                          setIsRequestFormOpen(true);
                        }
                      }}
                      disabled={isViewOnly}
                      className={cn(
                        "bg-white text-[#7B0F2B] hover:bg-white hover:text-[#7B0F2B] border-transparent shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2",
                        isRequestFormOpen && exitActionType === "terminate"
                          ? "bg-rose-100 text-[#A4163A] border-rose-200"
                          : "bg-white text-[#7B0F2B] border-transparent",
                      )}
                    >
                      {isRequestFormOpen && exitActionType === "terminate" ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span>Terminate Employee</span>
                    </Button>
                    <Button
                      onClick={() => {
                        if (isViewOnly) {
                          notifyViewOnly();
                          return;
                        }
                        if (
                          isRequestFormOpen &&
                          exitActionType === "resigned"
                        ) {
                          setIsRequestFormOpen(false);
                        } else {
                          setExitActionType("resigned");
                          setIsRequestFormOpen(true);
                        }
                      }}
                      disabled={isViewOnly}
                      className={cn(
                        "bg-white text-[#7B0F2B] hover:bg-white hover:text-[#7B0F2B] border-transparent shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-4 rounded-lg flex items-center gap-2",
                        isRequestFormOpen && exitActionType === "resigned"
                          ? "bg-rose-100 text-[#A4163A] border-rose-200"
                          : "bg-white text-[#7B0F2B] border-transparent",
                      )}
                    >
                      {isRequestFormOpen && exitActionType === "resigned" ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span>Resigned Employee</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Toolbar — matches masterfile */}
            <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="w-full px-4 md:px-8 py-3">
                <div className="flex flex-wrap items-center gap-4 lg:gap-8">
                  {/* Status Count Tabs */}
                  {!isHistoryView && (
                    <div className="flex items-center bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/10">
                      <button
                        onClick={() => {
                          setActiveTab("all");
                          setCurrentPage(1);
                          setCurrentResignedPage(1);
                        }}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                          activeTab === "all"
                            ? "bg-white text-[#A4163A] shadow-md"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        All ({allCount})
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("terminated");
                          setCurrentPage(1);
                          setCurrentResignedPage(1);
                        }}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                          activeTab === "terminated"
                            ? "bg-white text-[#A4163A] shadow-md"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        Terminated ({terminatedCount})
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("rehired");
                          setCurrentPage(1);
                          setCurrentResignedPage(1);
                        }}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                          activeTab === "rehired"
                            ? "bg-white text-[#A4163A] shadow-md"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        Rehired ({rehiredCount})
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab("resigned");
                          setCurrentPage(1);
                          setCurrentResignedPage(1);
                        }}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                          activeTab === "resigned"
                            ? "bg-white text-[#A4163A] shadow-md"
                            : "text-white/70 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        Resigned ({resignedCount})
                      </button>
                    </div>
                  )}
                  {/* Search and Sort */}
                  <div className="flex flex-1 flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-[300px]">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A0153E]" />
                      <Input
                        placeholder="Search employee..."
                        value={searchInput}
                        onChange={(e) => {
                          setSearchInput(e.target.value);
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                          setCurrentResignedPage(1);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setSearchQuery(searchInput);
                            setCurrentPage(1);
                            setCurrentResignedPage(1);
                          }
                        }}
                        className="bg-white border-2 border-[#FFE5EC] text-slate-700 placeholder:text-slate-400 pl-10 h-9 w-full focus:ring-2 focus:ring-[#A0153E] focus:border-[#C9184A] shadow-sm rounded-lg transition-all"
                      />
                    </div>
                    {isHistoryView && (
                      <Select
                        value={historyFilter}
                        onValueChange={(
                          value: "all" | "terminated" | "rehired" | "resigned",
                        ) => {
                          setHistoryFilter(value);
                          setCurrentPage(1);
                          setCurrentResignedPage(1);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-[210px] bg-white border-2 border-[#FFE5EC] h-9 rounded-lg shadow-sm focus:ring-[#A0153E] text-[#800020] font-bold">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                            <SelectValue placeholder="Filter records" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-stone-200 shadow-xl overflow-hidden">
                          <SelectItem
                            value="all"
                            className="font-bold text-xs py-2 uppercase tracking-wider cursor-pointer"
                          >
                            All History
                          </SelectItem>
                          <SelectItem
                            value="terminated"
                            className="font-bold text-xs py-2 uppercase tracking-wider cursor-pointer"
                          >
                            Terminated
                          </SelectItem>
                          <SelectItem
                            value="rehired"
                            className="font-bold text-xs py-2 uppercase tracking-wider cursor-pointer"
                          >
                            Rehired
                          </SelectItem>
                          <SelectItem
                            value="resigned"
                            className="font-bold text-xs py-2 uppercase tracking-wider cursor-pointer"
                          >
                            Resigned
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    <Select
                      value={sortOrder}
                      onValueChange={(value: any) => {
                        setSortOrder(value);
                        setCurrentPage(1);
                        setCurrentResignedPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[180px] bg-white border-2 border-[#FFE5EC] h-10 rounded-lg shadow-sm focus:ring-[#A0153E] text-[#800020] font-bold select-none caret-transparent pr-4 [&>svg]:hidden">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          <SelectValue placeholder="Sort by" />
                        </div>
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        side="bottom"
                        align="start"
                        sideOffset={6}
                        avoidCollisions={false}
                        className="rounded-xl border-stone-200 shadow-xl overflow-hidden"
                      >
                        <SelectItem
                          value="recent"
                          className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <History className="h-4 w-4" />
                            <span>Recent First</span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="oldest"
                          className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <Clock3 className="h-4 w-4" />
                            <span>Oldest First</span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="az"
                          className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <ArrowUpAZ className="h-4 w-4" />
                            <span>Alphabet (A-Z)</span>
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="za"
                          className="focus:bg-red-50 focus:text-[#630C22] font-bold text-xs py-2 uppercase tracking-wider cursor-pointer border-b border-slate-50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <ArrowDownAZ className="h-4 w-4" />
                            <span>Alphabet (Z-A)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setCurrentPage(1);
                      setCurrentResignedPage(1);
                      if (isHistoryView) {
                        router.push(pathname);
                      } else {
                        router.push(`${pathname}?view=history`);
                      }
                    }}
                    className="h-9 px-4 rounded-lg text-xs font-bold uppercase tracking-wider bg-white text-[#A4163A] hover:bg-rose-50 border border-white/80 ml-auto"
                  >
                    {isHistoryView
                      ? "Back To Current Records"
                      : "View All History"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-4 md:px-8 space-y-6">
            <>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-500 ease-in-out",
                    isRequestFormOpen
                      ? "max-h-[900px] opacity-100"
                      : "max-h-0 opacity-0 pointer-events-none",
                  )}
                >
                  <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-4 md:p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#A4163A]" />
                      <span className="text-xs font-bold text-[#A4163A] uppercase tracking-widest whitespace-nowrap">
                        {exitActionType === "resigned"
                          ? "RESIGNED"
                          : "TERMINATE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Employee
                        </Label>
                        <Popover
                          open={openCombobox}
                          onOpenChange={setOpenCombobox}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openCombobox}
                              disabled={isViewOnly || loading || submitting}
                              className={cn(
                                "w-full justify-between h-10 text-sm font-normal rounded-lg",
                                !selectedEmployeeId && "text-slate-400",
                              )}
                            >
                              {selectedEmployeeId
                                ? (() => {
                                    const emp = employees.find(
                                      (e) => e.id === selectedEmployeeId,
                                    );
                                    return emp
                                      ? `${emp.last_name}, ${emp.first_name}`
                                      : "Select employee...";
                                  })()
                                : "Select employee..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[320px] p-0"
                            align="start"
                          >
                            <Command>
                              <CommandInput placeholder="Search employee..." />
                              <CommandList>
                                <CommandEmpty>No employee found.</CommandEmpty>
                                <CommandGroup>
                                  {employees.map((emp) => (
                                    <CommandItem
                                      key={emp.id}
                                      value={`${emp.last_name}, ${emp.first_name} ${emp.position}`}
                                      onSelect={() => {
                                        setSelectedEmployeeId(emp.id);
                                        setOpenCombobox(false);
                                      }}
                                      className="py-2.5 cursor-pointer"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedEmployeeId === emp.id
                                            ? "opacity-100 text-[#800020]"
                                            : "opacity-0",
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">
                                          {emp.last_name}, {emp.first_name}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          {emp.position}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Termination Date & Time
                        </Label>
                        <div className="grid grid-cols-[1fr_130px] gap-2">
                          <DatePicker
                            value={getDatePartFromDateTime(
                              formData.termination_date,
                            )}
                            onChange={(date) =>
                              setDateTimeDatePart("termination_date", date)
                            }
                            disabled={isViewOnly || submitting}
                            placeholder="mm/dd/yyyy"
                            className="h-10"
                          />
                          <Input
                            type="time"
                            step={60}
                            value={getTimePartFromDateTime(
                              formData.termination_date,
                            )}
                            onChange={(e) =>
                              setDateTimeTimePart(
                                "termination_date",
                                e.target.value,
                              )
                            }
                            className="h-10"
                            disabled={isViewOnly || submitting}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Reason
                        </Label>
                        <Input
                          type="text"
                          name="reason"
                          value={formData.reason}
                          onChange={handleInputChange}
                          placeholder={
                            exitActionType === "resigned"
                              ? "Reason for resignation..."
                              : "Reason for termination..."
                          }
                          maxLength={50}
                          className="h-10"
                          disabled={isViewOnly || submitting}
                        />
                        <p className="text-[10px] text-slate-500 text-right">
                          {formData.reason.length}/50
                        </p>
                        {normalizedReason.length > 0 &&
                          normalizedReason.length < 5 && (
                            <p className="text-[10px] text-rose-600">
                              Minimum 5 characters required.
                            </p>
                          )}
                      </div>

                      {exitActionType === "terminate" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Recommended By
                            </Label>
                            <Select
                              value={formData.recommended_by}
                              disabled={isViewOnly || submitting}
                              onValueChange={(value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  recommended_by: value,
                                }))
                              }
                            >
                              <SelectTrigger className="w-full h-10 rounded-lg">
                                <SelectValue placeholder="Select recommender..." />
                              </SelectTrigger>
                              <SelectContent>
                                {superiors.length > 0 ? (
                                  <SelectGroup>
                                    <SelectLabel className="text-xs text-slate-500 bg-slate-50">
                                      Higher in Hierarchy
                                    </SelectLabel>
                                    {superiors.map((emp) => (
                                      <SelectItem
                                        key={`recommended-sup-${emp.id}`}
                                        value={`${emp.first_name} ${emp.last_name}`}
                                      >
                                        {emp.first_name} {emp.last_name} (
                                        {emp.position})
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                ) : (
                                  <SelectGroup>
                                    <SelectLabel className="text-xs text-slate-500 bg-slate-50">
                                      No higher roles found
                                    </SelectLabel>
                                  </SelectGroup>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Date of Notice
                            </Label>
                            <div className="grid grid-cols-[1fr_130px] gap-2">
                              <DatePicker
                                value={getDatePartFromDateTime(
                                  formData.notice_date,
                                )}
                                onChange={(date) =>
                                  setDateTimeDatePart("notice_date", date)
                                }
                                disabled={isViewOnly || submitting}
                                placeholder="mm/dd/yyyy"
                                className="h-10"
                              />
                              <Input
                                type="time"
                                step={60}
                                value={getTimePartFromDateTime(
                                  formData.notice_date,
                                )}
                                onChange={(e) =>
                                  setDateTimeTimePart(
                                    "notice_date",
                                    e.target.value,
                                  )
                                }
                                className="h-10"
                                disabled={isViewOnly || submitting}
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              Mode of Notice
                            </Label>
                            <div className="h-10 px-3 border border-slate-200 rounded-md flex items-center gap-4 text-sm">
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={formData.notice_modes.includes(
                                    "email",
                                  )}
                                  onChange={() => toggleNoticeMode("email")}
                                  disabled={isViewOnly || submitting}
                                />
                                <span>Email</span>
                              </label>
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={formData.notice_modes.includes(
                                    "printed_letter",
                                  )}
                                  onChange={() =>
                                    toggleNoticeMode("printed_letter")
                                  }
                                  disabled={isViewOnly || submitting}
                                />
                                <span>Printed Letter</span>
                              </label>
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={formData.notice_modes.includes(
                                    "both",
                                  )}
                                  onChange={() => toggleNoticeMode("both")}
                                  disabled={isViewOnly || submitting}
                                />
                                <span>Both</span>
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Reviewed By
                        </Label>
                        <Select
                          value={formData.reviewed_by}
                          disabled={isViewOnly || submitting}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              reviewed_by: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full h-10 rounded-lg">
                            <SelectValue placeholder="Select reviewer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {superiors.length > 0 ? (
                              <SelectGroup>
                                <SelectLabel className="text-xs text-slate-500 bg-slate-50">
                                  Higher in Hierarchy
                                </SelectLabel>
                                {superiors.map((emp) => (
                                  <SelectItem
                                    key={`reviewed-sup-${emp.id}`}
                                    value={`${emp.first_name} ${emp.last_name}`}
                                  >
                                    {emp.first_name} {emp.last_name} (
                                    {emp.position})
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ) : (
                              <SelectGroup>
                                <SelectLabel className="text-xs text-slate-500 bg-slate-50">
                                  No higher roles found
                                </SelectLabel>
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Approved By
                        </Label>
                        <Input
                          type="text"
                          name="approved_by"
                          value={formData.approved_by}
                          onChange={handleInputChange}
                          className="h-10 bg-slate-50"
                          disabled
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Date of Approval
                        </Label>
                        <div className="grid grid-cols-[1fr_130px] gap-2">
                          <DatePicker
                            value={getDatePartFromDateTime(
                              formData.approval_date,
                            )}
                            onChange={(date) =>
                              setDateTimeDatePart("approval_date", date)
                            }
                            disabled={isViewOnly || submitting}
                            placeholder="mm/dd/yyyy"
                            className="h-10"
                          />
                          <Input
                            type="time"
                            step={60}
                            value={getTimePartFromDateTime(
                              formData.approval_date,
                            )}
                            onChange={(e) =>
                              setDateTimeTimePart("approval_date", e.target.value)
                            }
                            className="h-10"
                            disabled={isViewOnly || submitting}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2">
                      <Button
                        onClick={handleSubmit as any}
                        disabled={
                          isViewOnly ||
                          submitting ||
                          !selectedEmployeeId ||
                          !hasValidReasonLength ||
                          !hasValidReasonCharacters ||
                          !formData.reviewed_by ||
                          !formData.approval_date ||
                          (exitActionType === "terminate" &&
                            (!formData.recommended_by ||
                              formData.notice_modes.length === 0 ||
                              !formData.notice_date))
                        }
                        className={cn(
                          "h-10 px-6 text-sm font-bold rounded-xl transition-all whitespace-nowrap",
                          submitting
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-[#800020] to-[#A0153E] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5",
                        )}
                      >
                        {submitting
                          ? "Processing..."
                          : exitActionType === "resigned"
                            ? "Proceed Resignation"
                            : "Proceed Termination"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsRequestFormOpen(false)}
                        className="h-9 w-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {showTerminatedTable && (
                  <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-xl flex flex-col">
                    {fetchError ? (
                      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 group">
                          <Badge
                            variant="outline"
                            className="h-12 w-12 border-rose-200 bg-white shadow-sm flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform duration-300"
                          >
                            <X className="w-6 h-6 text-rose-500" />
                          </Badge>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">
                          Connection Failed
                        </h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">
                          {fetchError} Please ensure the backend server is
                          running and try again.
                        </p>
                        <Button
                          onClick={fetchData}
                          className="bg-[#A4163A] hover:bg-[#80122D] text-white px-8 h-12 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                        >
                          Retry Connection
                        </Button>
                      </div>
                    ) : loading ? (
                      <div className="p-8 md:p-10 space-y-4 animate-pulse">
                        {[...Array(5)].map((_, i) => (
                          <Skeleton
                            key={i}
                            className="h-16 w-full rounded-xl"
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-[#4A081A] uppercase tracking-wide">
                              {primaryHistoryTitle}
                            </h2>
                            <p className="text-[#A0153E]/70 text-[11px] mt-1 font-bold uppercase">
                              {primaryRecords.length} of {primaryBaseCount}{" "}
                              records
                            </p>
                          </div>
                        </div>

                        <div className="p-0 bg-white overflow-hidden">
                          {primaryBaseCount === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                              <FileText className="h-20 w-20 mb-4 opacity-10" />
                              <p className="text-lg">No records found.</p>
                            </div>
                          ) : primaryRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                              <Search className="h-14 w-14 mb-4 opacity-10" />
                              <p className="text-base font-medium">
                                No results for &quot;{searchQuery}&quot;
                              </p>
                              <p className="text-sm mt-1">
                                Try a different name or reason.
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
                                  <TableRow className="border-b border-[#FFE5EC]/50">
                                    <TableHead className="py-2 pl-6 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      Employee
                                    </TableHead>
                                    <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      Status
                                    </TableHead>
                                    <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      {primaryDateLabel}
                                    </TableHead>
                                    {(isHistoryView ||
                                      activeTab !== "terminated") && (
                                      <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                        Rehire Date
                                      </TableHead>
                                    )}
                                    <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      Reason
                                    </TableHead>
                                    <TableHead className="py-2 pr-6 text-[10px] font-bold text-[#800020] uppercase tracking-wider text-right">
                                      Action
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {primaryRecords
                                    .slice(
                                      (currentPage - 1) * itemsPerPage,
                                      currentPage * itemsPerPage,
                                    )
                                    .map((record) => (
                                      <TableRow
                                        key={`${record.exit_type ?? "terminated"}-${record.id}`}
                                        className="hover:bg-[#FFE5EC] hover:[&>td]:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200 group"
                                      >
                                        <TableCell className="py-2 pl-6 font-medium text-slate-900 border-r border-rose-50/50">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#630C22] group-hover:text-[#4A081A] transition-colors">
                                              {record.employee?.last_name},{" "}
                                              {record.employee?.first_name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                              {record.employee?.position}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-[11px] font-medium border-r border-rose-50/50">
                                          <span
                                            className={cn(
                                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                                              getStatusBadgeClass(record),
                                            )}
                                          >
                                            {getRecordStatusLabel(record)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-[11px] font-medium border-r border-rose-50/50">
                                          {record.termination_date ? (
                                            <div className="flex flex-col">
                                              <span className="font-semibold text-rose-700">
                                                {formatDisplayDate(
                                                  record.termination_date,
                                                )}
                                              </span>
                                              <span className="text-[10px] text-slate-400 mt-0.5">
                                                {formatDisplayTime(
                                                  record.termination_date,
                                                )}
                                              </span>
                                            </div>
                                          ) : (
                                            "N/A"
                                          )}
                                        </TableCell>
                                        {(isHistoryView ||
                                          activeTab !== "terminated") && (
                                          <TableCell className="text-slate-600 text-[11px] font-medium border-r border-rose-50/50">
                                            {isRehiredRecord(record) &&
                                            record.rehired_at ? (
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-emerald-700">
                                                  {formatDisplayDate(
                                                    record.rehired_at,
                                                  )}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mt-0.5">
                                                  {formatDisplayTime(
                                                    record.rehired_at,
                                                  )}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-slate-300 italic text-[10px]">
                                                -
                                              </span>
                                            )}
                                          </TableCell>
                                        )}
                                        <TableCell className="max-w-[300px] truncate text-slate-500 text-[11px] italic border-r border-rose-50/50">
                                          &quot;{record.reason}&quot;
                                        </TableCell>
                                        <TableCell className="py-2 pr-6 text-right">
                                          <div className="flex items-center justify-end gap-3">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="rounded-lg font-bold transition-all text-[#630C22] border-[#630C22] hover:bg-[#630C22] hover:text-white h-7 px-2 text-[10px]"
                                              onClick={() => {
                                                setSelectedTermination(record);
                                                setShowDetailDialog(true);
                                              }}
                                            >
                                              Review
                                            </Button>
                                            {canShowRehireAction(record) && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 transition-all font-bold px-4 rounded-lg shadow-sm"
                                                onClick={() => {
                                                  setSelectedTermination(
                                                    record,
                                                  );
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    rehire_date:
                                                      formatDateTimeForInput(
                                                        new Date(),
                                                      ),
                                                  }));
                                                  setShowDetailDialog(true);
                                                }}
                                                disabled={
                                                  isViewOnly ||
                                                  rehireLoading ===
                                                    record.employee_id
                                                }
                                              >
                                                {rehireLoading ===
                                                record.employee_id
                                                  ? "Wait..."
                                                  : "Re-hire"}
                                              </Button>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                              {/* Pagination */}
                              {primaryRecords.length > itemsPerPage && (
                                <div className="px-6 py-3 border-t border-[#FFE5EC]/70 flex items-center justify-between bg-[#FFE5EC]/20">
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    Showing{" "}
                                    {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                    {Math.min(
                                      currentPage * itemsPerPage,
                                      primaryRecords.length,
                                    )}{" "}
                                    of {primaryRecords.length}
                                  </div>
                                  <div className="flex gap-1.5 items-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCurrentPage((prev) =>
                                          Math.max(prev - 1, 1),
                                        )
                                      }
                                      disabled={currentPage === 1}
                                      className="h-8 px-3 text-xs font-bold border-[#FFE5EC] text-[#7B0F2B] hover:bg-white disabled:opacity-40"
                                    >
                                      Previous
                                    </Button>
                                    {Array.from(
                                      {
                                        length: Math.ceil(
                                          primaryRecords.length / itemsPerPage,
                                        ),
                                      },
                                      (_, i) => i + 1,
                                    ).map((page) => (
                                      <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={cn(
                                          "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                          currentPage === page
                                            ? "bg-[#800020] text-white shadow-md scale-105"
                                            : "text-[#7B0F2B]/70 hover:bg-[#FFE5EC]/60",
                                        )}
                                      >
                                        {page}
                                      </button>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCurrentPage((prev) =>
                                          Math.min(
                                            prev + 1,
                                            Math.ceil(
                                              primaryRecords.length /
                                                itemsPerPage,
                                            ),
                                          ),
                                        )
                                      }
                                      disabled={
                                        currentPage ===
                                        Math.ceil(
                                          primaryRecords.length / itemsPerPage,
                                        )
                                      }
                                      className="h-8 px-3 text-xs font-bold border-[#FFE5EC] text-[#7B0F2B] hover:bg-white disabled:opacity-40"
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {showResignedTable && (
                  <div className="bg-white border-2 border-[#FFE5EC] shadow-md overflow-hidden rounded-xl flex flex-col">
                    {fetchError ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                        <p>Unable to load resigned history.</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gradient-to-r from-[#4A081A]/10 to-transparent pb-3 border-b-2 border-[#630C22] p-4 flex items-center justify-between">
                          <div>
                            <h2 className="text-xl font-bold text-[#4A081A] uppercase tracking-wide">
                              Resigned History
                            </h2>
                            <p className="text-[#A0153E]/70 text-[11px] mt-1 font-bold uppercase">
                              {filteredResigned.length} of {baseResigned.length}{" "}
                              records
                            </p>
                          </div>
                        </div>

                        <div className="p-0 bg-white overflow-hidden">
                          {baseResigned.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                              <FileText className="h-20 w-20 mb-4 opacity-10" />
                              <p className="text-lg">
                                No resigned records found.
                              </p>
                            </div>
                          ) : filteredResigned.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                              <Search className="h-14 w-14 mb-4 opacity-10" />
                              <p className="text-base font-medium">
                                No results for &quot;{searchQuery}&quot;
                              </p>
                              <p className="text-sm mt-1">
                                Try a different name or reason.
                              </p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-[#FFE5EC]/30 sticky top-0 border-b border-[#FFE5EC]">
                                  <TableRow className="border-b border-[#FFE5EC]/50">
                                    <TableHead className="py-2 pl-6 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      Employee
                                    </TableHead>
                                    <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      Status
                                    </TableHead>
                                    <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      Resignation Date
                                    </TableHead>
                                    {(isHistoryView ||
                                      activeTab !== "terminated") && (
                                      <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                        Rehire Date
                                      </TableHead>
                                    )}
                                    <TableHead className="py-2 text-[10px] font-bold text-[#800020] uppercase tracking-wider border-r border-[#FFE5EC]/50">
                                      Reason
                                    </TableHead>
                                    <TableHead className="py-2 pr-6 text-[10px] font-bold text-[#800020] uppercase tracking-wider text-right">
                                      Action
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredResigned
                                    .slice(
                                      (currentResignedPage - 1) * itemsPerPage,
                                      currentResignedPage * itemsPerPage,
                                    )
                                    .map((record) => (
                                      <TableRow
                                        key={`resigned-${record.id}`}
                                        className="hover:bg-[#FFE5EC] hover:[&>td]:bg-[#FFE5EC] border-b border-rose-50 transition-colors duration-200 group"
                                      >
                                        <TableCell className="py-2 pl-6 font-medium text-slate-900 border-r border-rose-50/50">
                                          <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#630C22] group-hover:text-[#4A081A] transition-colors">
                                              {record.employee?.last_name},{" "}
                                              {record.employee?.first_name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                              {record.employee?.position}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-[11px] font-medium border-r border-rose-50/50">
                                          <span
                                            className={cn(
                                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border",
                                              getStatusBadgeClass(record),
                                            )}
                                          >
                                            {getRecordStatusLabel(record)}
                                          </span>
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-[11px] font-medium border-r border-rose-50/50">
                                          {record.termination_date ? (
                                            <div className="flex flex-col">
                                              <span className="font-semibold text-rose-700">
                                                {formatDisplayDate(
                                                  record.termination_date,
                                                )}
                                              </span>
                                              <span className="text-[10px] text-slate-400 mt-0.5">
                                                {formatDisplayTime(
                                                  record.termination_date,
                                                )}
                                              </span>
                                            </div>
                                          ) : (
                                            "N/A"
                                          )}
                                        </TableCell>
                                        {(isHistoryView ||
                                          activeTab !== "terminated") && (
                                          <TableCell className="text-slate-600 text-[11px] font-medium border-r border-rose-50/50">
                                            {isRehiredRecord(record) &&
                                            record.rehired_at ? (
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-emerald-700">
                                                  {formatDisplayDate(
                                                    record.rehired_at,
                                                  )}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mt-0.5">
                                                  {formatDisplayTime(
                                                    record.rehired_at,
                                                  )}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-slate-300 italic text-[10px]">
                                                -
                                              </span>
                                            )}
                                          </TableCell>
                                        )}
                                        <TableCell className="max-w-[300px] truncate text-slate-500 text-[11px] italic border-r border-rose-50/50">
                                          &quot;{record.reason}&quot;
                                        </TableCell>
                                        <TableCell className="py-2 pr-6 text-right">
                                          <div className="flex items-center justify-end gap-3">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="rounded-lg font-bold transition-all text-[#630C22] border-[#630C22] hover:bg-[#630C22] hover:text-white h-7 px-2 text-[10px]"
                                              onClick={() => {
                                                setSelectedTermination(record);
                                                setShowDetailDialog(true);
                                              }}
                                            >
                                              Review
                                            </Button>
                                            {canShowRehireAction(record) && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-9 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-300 transition-all font-bold px-4 rounded-lg shadow-sm"
                                                onClick={() => {
                                                  setSelectedTermination(
                                                    record,
                                                  );
                                                  setFormData((prev) => ({
                                                    ...prev,
                                                    rehire_date:
                                                      formatDateTimeForInput(
                                                        new Date(),
                                                      ),
                                                  }));
                                                  setShowDetailDialog(true);
                                                }}
                                                disabled={
                                                  isViewOnly ||
                                                  rehireLoading ===
                                                    record.employee_id
                                                }
                                              >
                                                {rehireLoading ===
                                                record.employee_id
                                                  ? "Wait..."
                                                  : "Re-hire"}
                                              </Button>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                              {filteredResigned.length > itemsPerPage && (
                                <div className="px-6 py-3 border-t border-[#FFE5EC]/70 flex items-center justify-between bg-[#FFE5EC]/20">
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    Showing{" "}
                                    {(currentResignedPage - 1) * itemsPerPage +
                                      1}{" "}
                                    to{" "}
                                    {Math.min(
                                      currentResignedPage * itemsPerPage,
                                      filteredResigned.length,
                                    )}{" "}
                                    of {filteredResigned.length}
                                  </div>
                                  <div className="flex gap-1.5 items-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCurrentResignedPage((prev) =>
                                          Math.max(prev - 1, 1),
                                        )
                                      }
                                      disabled={currentResignedPage === 1}
                                      className="h-8 px-3 text-xs font-bold border-[#FFE5EC] text-[#7B0F2B] hover:bg-white disabled:opacity-40"
                                    >
                                      Previous
                                    </Button>
                                    {Array.from(
                                      {
                                        length: Math.ceil(
                                          filteredResigned.length /
                                            itemsPerPage,
                                        ),
                                      },
                                      (_, i) => i + 1,
                                    ).map((page) => (
                                      <button
                                        key={`resigned-page-${page}`}
                                        onClick={() =>
                                          setCurrentResignedPage(page)
                                        }
                                        className={cn(
                                          "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                                          currentResignedPage === page
                                            ? "bg-[#800020] text-white shadow-md scale-105"
                                            : "text-[#7B0F2B]/70 hover:bg-[#FFE5EC]/60",
                                        )}
                                      >
                                        {page}
                                      </button>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setCurrentResignedPage((prev) =>
                                          Math.min(
                                            prev + 1,
                                            Math.ceil(
                                              filteredResigned.length /
                                                itemsPerPage,
                                            ),
                                          ),
                                        )
                                      }
                                      disabled={
                                        currentResignedPage ===
                                        Math.ceil(
                                          filteredResigned.length /
                                            itemsPerPage,
                                        )
                                      }
                                      className="h-8 px-3 text-xs font-bold border-[#FFE5EC] text-[#7B0F2B] hover:bg-white disabled:opacity-40"
                                    >
                                      Next
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
          </div>

          {/* Termination Detail View Modal */}
          <Dialog
            open={showDetailDialog}
            onOpenChange={(open) => {
              setShowDetailDialog(open);
            }}
          >
            <DialogContent className="sm:max-w-2xl border-0 shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="bg-gradient-to-r from-[#800020] to-[#630C22] p-8 text-white">
                <DialogTitle className="text-2xl font-bold">
                  {selectedRecordIsResigned
                    ? "Resignation Details"
                    : "Termination Details"}
                </DialogTitle>
                <DialogDescription className="text-rose-100/90 mt-1">
                  For {selectedTermination?.employee?.first_name}{" "}
                  {selectedTermination?.employee?.last_name}
                </DialogDescription>
              </DialogHeader>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Position
                    </p>
                    <p className="font-semibold text-slate-800">
                      {selectedTermination?.employee?.position || "N/A"}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      {selectedRecordIsResigned
                        ? "Resignation Date"
                        : "Termination Date"}
                    </p>
                    <div className="flex flex-col">
                      <p className="font-semibold text-rose-700">
                        {selectedTermination?.termination_date
                          ? formatDisplayDate(
                              selectedTermination.termination_date,
                            )
                          : "N/A"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {selectedTermination?.termination_date
                          ? formatDisplayTime(
                              selectedTermination.termination_date,
                            )
                          : ""}
                      </p>
                    </div>
                  </div>
                  {selectedTermination?.rehired_at && (
                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 font-sans col-span-2">
                      <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <History className="w-3 h-3" /> Re-hire Date
                      </p>
                      <div className="flex flex-col">
                        <p className="font-semibold text-emerald-700">
                          {formatDisplayDate(selectedTermination.rehired_at)}
                        </p>
                        <p className="text-xs text-emerald-500/70 mt-0.5 font-medium italic">
                          Restored at{" "}
                          {formatDisplayTime(selectedTermination.rehired_at)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-50" />{" "}
                    {selectedRecordIsResigned
                      ? "Reason for Resignation"
                      : "Reason for Termination"}
                  </p>
                  <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600 leading-relaxed shadow-sm italic">
                    "
                    {selectedTermination?.reason ||
                      "No specific reason recorded."}
                    "
                  </div>
                </div>

                {selectedTermination?.notes && (
                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-2">
                      Additional Notes
                    </p>
                    <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100">
                      {selectedTermination?.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-4">
                {selectedTermination &&
                  canShowRehireAction(selectedTermination) && (
                    <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex flex-col gap-1 shrink-0">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                          Re-hire Date & Time
                        </Label>
                        <div className="grid grid-cols-[1fr_120px] gap-2">
                          <DatePicker
                            value={getDatePartFromDateTime(formData.rehire_date)}
                            onChange={(date) =>
                              setDateTimeDatePart("rehire_date", date)
                            }
                            disabled={rehireLoading !== null}
                            placeholder="mm/dd/yyyy"
                            className="h-9"
                          />
                          <Input
                            type="time"
                            step={60}
                            value={getTimePartFromDateTime(formData.rehire_date)}
                            onChange={(e) =>
                              setDateTimeTimePart("rehire_date", e.target.value)
                            }
                            className="h-9"
                            disabled={rehireLoading !== null}
                          />
                        </div>
                      </div>
                      <div className="flex-1 text-xs text-slate-400 italic">
                        Specify the official re-hire date for this employee.
                      </div>
                    </div>
                  )}
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowDetailDialog(false)}
                    className="font-bold text-slate-600"
                  >
                    Back to List
                  </Button>
                  {selectedTermination &&
                    canShowRehireAction(selectedTermination) && (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all font-bold px-6"
                        onClick={() => {
                          if (selectedTermination) {
                            handleRehire(selectedTermination.employee_id);
                          }
                        }}
                        disabled={
                          isViewOnly ||
                          rehireLoading === selectedTermination?.employee_id
                        }
                      >
                        {rehireLoading === selectedTermination?.employee_id
                          ? "Restoring Access..."
                          : "Re-hire Employee"}
                      </Button>
                    )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <ConfirmationModal
            isOpen={confirmModal.isOpen}
            onClose={() =>
              setConfirmModal((prev) => ({ ...prev, isOpen: false }))
            }
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            description={confirmModal.description}
            variant={confirmModal.variant}
            confirmText={confirmModal.confirmText}
            isLoading={submitting || rehireLoading !== null}
          />
        </>
      )}
    </div>
  );
}
