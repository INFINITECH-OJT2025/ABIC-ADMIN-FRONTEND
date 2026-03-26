"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Save,
  Eraser,
  Eye,
  Layout,
  Type,
  FileText,
  User,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Minimize2,
  EyeOff,
  Upload,
  Trash2,
  Image as ImageIcon,
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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { useUserRole } from "@/lib/hooks/useUserRole";
import { useConfirmation } from "@/components/providers/confirmation-provider";
import { Separator } from "@/components/ui/separator";

type Office = {
  id: string;
  name: string;
};

const DEFAULT_TARDINESS_REGULAR_TEMPLATE = {
  title: "TARDINESS WARNING LETTER",
  body: `Dear {{salutation}} {{last_name}},


Good day.


    This letter serves as a Formal Warning regarding your tardiness. Please be reminded that your scheduled time-in is {{shift_time}}, with a five (5)-minute grace period until {{grace_period}}, in accordance with company policy.


    Despite this allowance, you have incurred {{instances_text}} ({{instances_count}}) instances of tardiness beyond the allowable grace period within the current cut-off period, which constitutes a violation of the Company's Attendance and Punctuality Policy.


Below is the recorded instances for this cut-off period:
{{entries_list}}


    Consistent tardiness negatively affects team productivity, disrupts workflow, and fails to meet the company's standards for punctuality and professionalism.


Please be reminded of the following:
1. You are expected to immediately correct your attendance behavior and strictly adhere to your scheduled working hours.
2. Any future occurrences of tardiness may result in stricter disciplinary action, up to and including suspension or termination, in accordance with company policy.


This notice shall be documented accordingly. Your cooperation and compliance are expected.


Thank you.`,
  footer: "Admin Supervisor/HR",
  signatoryName: "AIZLE MARIE M. ATIENZA",
  headerLogoImage: null,
  headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy. Pio Del Pilar, Makati City, 1230
(02) 8646-6136`,
};

const DEFAULT_TARDINESS_PROBEE_TEMPLATE = {
  title: "TARDINESS WARNING LETTER",
  body: `Dear {{salutation}} {{last_name}},


    This letter serves as a formal warning regarding your repeated tardiness. It has been recorded that you have reported late to work {{instances_text}} ({{instances_count}}) times, exceeding the company's grace period of five (5) minutes.


    We trust that you will take this matter seriously and make the necessary adjustments to improve your attendance and punctuality moving forward.


Additionally, please note the specific dates of tardiness recorded for this cut-off:
{{entries_list}}


    Consistent tardiness affects team productivity, disrupts workflow, and your evaluation needed for your regularization, which requires all employees to report to work on time and adhere to their scheduled working hours.


Thank you.`,
  footer: "Admin Assistant",
  signatoryName: "AIZLE MARIE M. ATIENZA",
  headerLogoImage: null,
  headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy. Pio Del Pilar, Makati City, 1230
(02) 8646-6136`,
};

const DEFAULT_LEAVE_TEMPLATE = {
  title: "{{Warning level}} WARNING LETTER",
  body: `Dear {{salutation}} {{last_name}},


    This letter serves as a Formal Warning regarding your attendance record for the current cutoff period.


It has been noted that you incurred {{instances_text}} ({{instances_count}}) absences within the {{cutoff_text}} of {{month}} {{year}}, specifically on the following dates:
{{entries_list}}


    These absences negatively affect work operations and your evaluation needed for your regularization.


Please be reminded that repeated absences, especially within a short period, may lead to further disciplinary action in accordance with company rules and regulations.


Moving forward, you are expected to:
1. Improve your attendance immediately,
2. Avoid unnecessary or unapproved absences, and
3. Provide proper documentation or notice for any unavoidable absence.


Failure to comply may result in stricter sanctions, up to and including suspension or termination.


Please acknowledge receipt of this warning by signing below.`,
  footer: "Admin Assistant",
  signatoryName: "AIZLE MARIE M. ATIENZA",
  headerLogoImage: null,
  headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy. Pio Del Pilar, Makati City, 1230
(02) 8646-6136`,
};

const DEFAULT_SUPERVISOR_TARDINESS_TEMPLATE = {
  title: "WARNING LETTER",
  body: `Dear {{salutation}} {{supervisor first name}},


    This letter serves as a Formal Warning regarding the tardiness of {{salutation}} {{employee_name}}. {{pronoun_he_she}} has accumulated {{instances_text}} ({{instances_count}}) occurrences of tardiness beyond the grace period of {{grace_period}} within the current cut-off period.


    In accordance with company policy, reaching the {{instances_count_ordinal}} occurrence of tardiness within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee and coordinate with the HR/Admin Department for proper documentation and necessary action.


Additionally, please note the specific dates recorded for this cut-off:
{{entries_list}}


    Consistent tardiness affects team productivity, disrupts workflow, and violates the company’s Attendance and Punctuality Policy, which requires all employees to report to work on time and adhere to their scheduled working hours.


Please be reminded of the following:
1. {{salutation}} {{last_name}} is expected to correct {{pronoun_his_her}} attendance behavior immediately.
2. Future occurrences of tardiness may result in stricter disciplinary action, including suspension or termination, in accordance with company policy.


Kindly ensure that the employee is informed and that corrective action is enforced appropriately.


Thank you.`,
  footer: "Admin Assistant",
  signatoryName: "AIZLE MARIE M. ATIENZA",
  headerLogoImage: null,
  headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy.Pio Del Pilar, Makati City, 1230
(02) 8646-6136`,
};

const DEFAULT_SUPERVISOR_LEAVE_TEMPLATE = {
  title: "{{Warning level}} WARNING LETTER",
  body: `Dear {{supervisor first name}},


    This letter serves as a Formal Warning regarding the leave absences of {{salutation}} {{employee_name}}. {{pronoun_he_she}} has accumulated {{instances_text}} ({{instances_count}}) days of leave within the current cut-off period.


    In accordance with company policy, reaching this threshold within a single cut-off period is subject to appropriate coaching, warning, and/or sanction. We request that you address this matter with the concerned employee and coordinate with the HR/Admin Department for proper documentation and necessary action.


Additionally, please note the specific dates recorded for this cut-off:
{{entries_list}}


    These absences negatively affect work operations and your evaluation needed for your regularization.


Please be reminded of the following:
1. {{salutation}} {{last_name}} is expected to correct {{pronoun_his_her}} attendance behavior immediately.
2. Future occurrences of absences may result in stricter disciplinary action, including suspension or termination, in accordance with company policy.


Kindly ensure that the employee is informed and that corrective action is enforced appropriately.


Thank you.`,
  footer: "Admin Assistant",
  signatoryName: "AIZLE MARIE M. ATIENZA",
  headerLogoImage: null,
  headerDetails: `Unit 202 Campos Rueda Bldg., Urban Avenue, Brgy.Pio Del Pilar, Makati City, 1230
(02) 8646-6136`,
};

const EVALUATION_CRITERIA_DEFAULTS = [
  {
    id: "work_attitude",
    label: "1. WORK ATTITUDE",
    desc: "How does an employee feel about his/her job? Is he/she interested in his/her work? \nDoes the employee work hard? Is he alert and resourceful?",
  },
  {
    id: "job_knowledge",
    label: "2. KNOWLEDGE OF THE JOB",
    desc: "Does he know the requirements of the job he is working on?",
  },
  {
    id: "quality_of_work",
    label: "3. QUALITY OF WORK",
    desc: "Is he accurate, thorough and neat? Consider working habits. Extent to which decision \nand action are based on facts and sound reasoning and weighing of outcome?",
  },
  {
    id: "handle_workload",
    label: "4. ABILITY TO HANDLE ASSIGNED WORKLOAD",
    desc: "Consider working habits. Is work completed on time? Do you have to follow up?",
  },
  {
    id: "work_with_supervisor",
    label: "5. ABILITY TO WORK WITH SUPERVISOR",
    desc: "Consider working relationship / Interaction with superior?",
  },
  {
    id: "work_with_coemployees",
    label: "6. ABILITY TO WORK WITH CO-EMPLOYEE",
    desc: "Can he work harmoniously with others?",
  },
  {
    id: "attendance",
    label: "7. ATTENDANCE (ABSENCES/TARDINESS/ UNDERTIME)",
    desc: "Is he regular and punctual in his attendance? What is his attitude towards time lost?",
  },
  {
    id: "compliance",
    label: "8. COMPLIANCE WITH COMPANY RULES AND REGULATIONS",
    desc: "Does the employee follow the company's rules and regulations at all times?",
  },
  {
    id: "grooming",
    label: "9. GROOMING AND APPEARANCE",
    desc: "Does he wear his uniform completely and neatly? Is he clean and neat?",
  },
  {
    id: "communication",
    label: "10. COMMUNICATION SKILLS",
    desc: "How successful is he in expressing himself orally, verbally and in written form?",
  },
] as const;

const DEFAULT_EVALUATION_TEMPLATE = {
  title: "PERFORMANCE APPRAISAL",
  metaNameLabel: "NAME",
  metaDepartmentLabel: "DEPARTMENT/JOB TITLE",
  metaRatingPeriodLabel: "RATING PERIOD",
  criteriaHeader: "CRITERIA",
  ratingHeader: "RATING",
  criteriaOverrides: Object.fromEntries(
    EVALUATION_CRITERIA_DEFAULTS.map((item) => [
      item.id,
      { label: item.label, desc: item.desc },
    ]),
  ),
  agreementText:
    "The above appraisal was discussed with me by my superior and I",
  ratingScaleTitle: "EMPLOYEE SHALL BE RATED AS FOLLOWS:",
  ratingScaleLines:
    "1 - Poor\n2 - Needs Improvement\n3 - Meets Minimum Requirement\n4 - Very Satisfactory\n5 - Outstanding",
  interpretationTitle: "INTERPRETATION OF TOTAL RATING SCORE:",
  interpretationLines:
    "50 - 41 Highly suitable to the position\n40 - 31 Suitable to the position\n30 - 16 Fails to meet minimum requirements of the job\n15 - 0 Employee advise to resign",
  recommendationLabel: "RECOMMENDATION: REGULAR EMPLOYMENT",
  remarksLabel: "COMMENTS / REMARKS:",
  managerSignaturesTitle: "Manager Approval Signatures",
  ratedByLabel: "Rated by:",
  reviewedByLabel: "Reviewed by:",
  approvedByLabel: "Approved by:",
};

const SERVER_TEMPLATE_KEYS = new Set([
  "tardiness-regular",
  "tardiness-probee",
  "leave",
  "supervisor-tardiness",
  "supervisor-leave",
  "evaluation",
  "branding-config",
]);

const normalizeWarningTemplateTitle = (slug: string, title?: string) => {
  const isLeaveTemplate = slug === "leave" || slug === "supervisor-leave";
  if (!isLeaveTemplate) return title;
  if (!title) return "{{Warning level}} WARNING LETTER";

  const hasWarningPlaceholder = /{{\s*Warning level\s*}}/i.test(title);
  const hardcodedWarningTitle = /\b(FIRST|SECOND|FINAL)\s+WARNING\b/i.test(title);

  if (!hasWarningPlaceholder && hardcodedWarningTitle) {
    return "{{Warning level}} WARNING LETTER";
  }

  return title;
};

// --- Skeleton Component ---
const EditorSkeleton = () => (
  <div className="min-h-screen bg-[#FDF4F6] pb-20">
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
    </div>

    <div className="max-w-[1400px] mx-auto px-10 pt-10 space-y-10">
      <div className="flex justify-center">
        <Skeleton className="h-10 w-[800px] rounded-xl" />
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-8 w-[600px] rounded-lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6">
          <Card className="flex-1 border-0 shadow-xl overflow-hidden rounded-2xl bg-white flex flex-col">
            <Skeleton className="h-16 w-full" />
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-[350px] w-full rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Card className="border-0 shadow-2xl rounded-none min-h-[1120px] w-[794px] bg-white mx-auto p-16 space-y-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <Skeleton className="h-16 w-16 rotate-45" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
            <div className="space-y-2 py-10">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

const SubtextInput = ({ officeId, initialValue, onSave, officeName }: any) => {
  const [val, setVal] = useState(initialValue || "");

  useEffect(() => {
    setVal(initialValue || "");
  }, [initialValue]);

  return (
    <Textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => {
        if (val !== initialValue) onSave(val);
      }}
      placeholder={`${officeName} address...`}
      className="min-h-[80px] text-[11px] p-3 rounded-xl border-rose-100 resize-none focus:border-rose-300 transition-colors"
    />
  );
};

/* --- Rich Text Editor for Word-like experience --- */
const StandardRichTextEditor = ({ value, onChange, isViewOnly }: any) => {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal innerHTML with external value only when not focused
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
    <div className="flex flex-col border border-rose-100 rounded-2xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-[#A4163A]/10 transition-all bg-white">
      {!isViewOnly && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-slate-50/80 border-b border-rose-50 sticky top-0 z-10">
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
          <Separator orientation="vertical" className="h-6 mx-1 bg-rose-100" />
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
          <Separator orientation="vertical" className="h-6 mx-1 bg-rose-100" />
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
          <Separator orientation="vertical" className="h-6 mx-1 bg-rose-100" />
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
          "min-h-[500px] p-8 focus:outline-none font-serif text-[15px] leading-relaxed text-[#4A081A]",
          isViewOnly && "cursor-not-allowed opacity-80",
        )}
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
};

export default function EditFormsPage() {
  const { isViewOnly } = useUserRole();
  const { confirm } = useConfirmation();
  const router = useRouter();
  const viewOnlyDescription =
    "Create, update, and delete actions are disabled in view only mode.";
  const notifyViewOnly = () => {
    toast.warning("View Only Mode", {
      description: viewOnlyDescription,
    });
  };

  const [activeTab, setActiveTab] = useState("letterhead");
  const [templates, setTemplates] = useState({
    "tardiness-regular": DEFAULT_TARDINESS_REGULAR_TEMPLATE,
    "tardiness-probee": DEFAULT_TARDINESS_PROBEE_TEMPLATE,
    leave: DEFAULT_LEAVE_TEMPLATE,
    "supervisor-tardiness": DEFAULT_SUPERVISOR_TARDINESS_TEMPLATE,
    "supervisor-leave": DEFAULT_SUPERVISOR_LEAVE_TEMPLATE,
    evaluation: DEFAULT_EVALUATION_TEMPLATE,
    "branding-config": {
      officeLogos: {},
      officeDetails: {},
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [isFullWidth, setIsFullWidth] = useState(true);
  const [offices, setOffices] = useState<Office[]>([]);

  const [hasLocalOnlyChanges, setHasLocalOnlyChanges] = useState(false);

  // Load templates from API on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const [res, officeRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/warning-letter-templates`),
          fetch(`${getApiUrl()}/api/offices`),
        ]);
        const [data, officeData] = await Promise.all([
          res.json(),
          officeRes.json(),
        ]);

        if (officeData?.success && Array.isArray(officeData.data)) {
          setOffices(officeData.data);
        }

        const localSaved = localStorage.getItem("warning_letter_templates");

        if (data && data.success && Array.isArray(data.data)) {
          const mapped: any = { ...templates };
          let hasServerEvaluation = false;
          data.data.forEach((template: any) => {
            const slug = template.slug;
            if (slug) {
              if (slug === "evaluation") {
                hasServerEvaluation = true;
                let parsedEvaluation = {};

                if (typeof template.body === "string" && template.body.trim()) {
                  try {
                    const candidate = JSON.parse(template.body);
                    if (candidate && typeof candidate === "object") {
                      parsedEvaluation = candidate;
                    }
                  } catch {
                    parsedEvaluation = {};
                  }
                }

                const {
                  officeLogos: _legacyOfficeLogos,
                  officeNameOverrides: _legacyOfficeNames,
                  ...sanitizedEvaluation
                } = parsedEvaluation as any;

                mapped.evaluation = {
                  ...DEFAULT_EVALUATION_TEMPLATE,
                  ...sanitizedEvaluation,
                  title:
                    (sanitizedEvaluation as any).title ||
                    template.title ||
                    DEFAULT_EVALUATION_TEMPLATE.title,
                };
                return;
              }

              mapped[slug] = {
                title: normalizeWarningTemplateTitle(slug, template.title),
                headerLogoImage: template.header_logo_image,
                headerDetails: template.header_details,
                body: template.body,
                footer: template.footer,
                signatoryName: template.signatory_name,
              };

              if (slug === "branding-config") {
                try {
                  const brandingData = JSON.parse(template.body);
                  mapped["branding-config"] = {
                    ...mapped["branding-config"],
                    ...brandingData,
                  };
                } catch (e) {
                  console.error("Failed to parse branding config");
                }
              }
            }
          });

          if (localSaved) {
            const local = JSON.parse(localSaved);
            if (!hasServerEvaluation && local?.evaluation) {
              mapped.evaluation = {
                ...DEFAULT_EVALUATION_TEMPLATE,
                ...local.evaluation,
              };
            }
          }

          setTemplates(mapped);

          // Check if local storage differs from recently fetched server data
          if (localSaved) {
            const local = JSON.parse(localSaved);

            const normalize = (templatesObj: any) => {
              const normalized: any = {};
              Object.keys(templatesObj).forEach((slug) => {
                // EXCLUDE branding-config from comparison since handleSave does not upload it!
                if (slug === "branding-config") return;

                if (SERVER_TEMPLATE_KEYS.has(slug)) {
                  if (slug !== "evaluation") {
                    const copy = { ...templatesObj[slug] };
                    // Strip heavy/redundant fields naturally ignored in bulk updates
                    delete copy.officeLogos;
                    delete copy.officeDetails;
                    delete copy.headerLogoImage;
                    delete copy.headerDetails;
                    normalized[slug] = copy;
                  } else {
                    normalized[slug] = templatesObj[slug];
                  }
                }
              });
              return normalized;
            };

            const stableStringify = (obj: any): string => {
              if (obj === null) return "null";
              if (typeof obj !== "object") return JSON.stringify(obj);
              if (Array.isArray(obj))
                return `[${obj.map(stableStringify).join(",")}]`;
              const keys = Object.keys(obj).sort();
              return `{${keys.map((k) => `"${k}":${stableStringify(obj[k])}`).join(",")}}`;
            };

            const localServerSubset = normalize(local);
            const mappedServerSubset = normalize(mapped);

            const isDifferent =
              stableStringify(localServerSubset) !==
              stableStringify(mappedServerSubset);

            setHasLocalOnlyChanges(isDifferent);
          }
        } else if (localSaved) {
          // DB is empty but local exists - user likely needs to sync!
          const local = JSON.parse(localSaved);
          setTemplates({
            ...local,
            evaluation: {
              ...DEFAULT_EVALUATION_TEMPLATE,
              ...local.evaluation,
            },
          });
          setHasLocalOnlyChanges(true);
        }
      } catch (e) {
        console.error("Failed to fetch templates:", e);
        const saved = localStorage.getItem("warning_letter_templates");
        if (saved) {
          const local = JSON.parse(saved);
          setTemplates({
            ...local,
            evaluation: {
              ...DEFAULT_EVALUATION_TEMPLATE,
              ...local.evaluation,
            },
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Browser-level navigation guard for refreshing/closing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasLocalOnlyChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasLocalOnlyChanges]);

  const handleSave = async (silent = false) => {
    if (isViewOnly) {
      if (!silent) notifyViewOnly();
      return;
    }

    if (!silent) setIsSaving(true);
    confirm({
      title: "Sync Template Changes?",
      description:
        "Are you sure you want to sync these template changes to the database? This will update the official letter formats.",
      confirmText: "Sync Now",
      onConfirm: async () => {
        try {
          // Optimization: Create a clean payload for server and localStorage
          // to avoid QuotaExceededError by removing redundant base64 copies
          const finalTemplates = { ...templates };
          Object.keys(finalTemplates).forEach((slug) => {
            if (slug !== "branding-config" && slug !== "evaluation") {
              const copy = { ...(finalTemplates as any)[slug] };
              // Strip heavy redundant fields if they accidentally leaked in
              delete copy.officeLogos;
              delete copy.officeDetails;
              delete copy.headerLogoImage;
              delete copy.headerDetails;
              (finalTemplates as any)[slug] = copy;
            }
          });

          const payload = Object.fromEntries(
            Object.entries(finalTemplates)
              .filter(
                ([slug]) =>
                  SERVER_TEMPLATE_KEYS.has(slug) && slug !== "branding-config",
              )
              .map(([slug, content]) => {
                if (slug === "evaluation") {
                  const t = (finalTemplates as any)[slug];
                  const {
                    officeLogos: _legacyOfficeLogos,
                    officeNameOverrides: _legacyOfficeNames,
                    ...sanitizedEvaluation
                  } = t || {};
                  return [
                    slug,
                    {
                      title: sanitizedEvaluation.title || "EVALUATION",
                      body: JSON.stringify(sanitizedEvaluation),
                    },
                  ];
                }
                return [slug, content];
              }),
          );

          const res = await fetch(
            `${getApiUrl()}/api/warning-letter-templates/bulk`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            },
          );

          if (res.ok) {
            localStorage.setItem(
              "warning_letter_templates",
              JSON.stringify(finalTemplates),
            );
            setHasLocalOnlyChanges(false);
            if (!silent)
              toast.success("Form templates synced to database successfully!");
          } else {
            localStorage.setItem(
              "warning_letter_templates",
              JSON.stringify(finalTemplates),
            );
            if (!silent)
              toast.warning("Saved locally, but server sync failed.");
          }
        } catch (e) {
          console.error("Save failed:", e);
          const legacySafe = { ...templates };
          localStorage.setItem(
            "warning_letter_templates",
            JSON.stringify(legacySafe),
          );
          if (!silent) toast.error("Templates saved locally (Network error).");
        } finally {
          if (!silent) setIsSaving(false);
        }
      },
    });
  };

  const resetTemplate = (type: string) => {
    if (isViewOnly) {
      notifyViewOnly();
      return;
    }

    const mappedTypes: Record<string, string> = {
      "tardiness-regular": "Regular & Probee Tardiness",
      "tardiness-probee": "Driver/Liaison Tardiness",
      leave: "Leave Absences",
      "supervisor-tardiness": "Supervisor (Tardiness)",
      "supervisor-leave": "Supervisor (Leave)",
      evaluation: "Performance Evaluation",
    };

    confirm({
      title: "Reset Template?",
      description: `Are you sure you want to reset the '${mappedTypes[type] || type}' template to its default content? This will overwrite any current changes in this tab.`,
      variant: "warning",
      confirmText: "Reset to Default",
      onConfirm: () => {
        const defaults: any = {
          "tardiness-regular": DEFAULT_TARDINESS_REGULAR_TEMPLATE,
          "tardiness-probee": DEFAULT_TARDINESS_PROBEE_TEMPLATE,
          leave: DEFAULT_LEAVE_TEMPLATE,
          "supervisor-tardiness": DEFAULT_SUPERVISOR_TARDINESS_TEMPLATE,
          "supervisor-leave": DEFAULT_SUPERVISOR_LEAVE_TEMPLATE,
          evaluation: DEFAULT_EVALUATION_TEMPLATE,
        };

        const newTemplate = defaults[type];
        setHasLocalOnlyChanges(true);

        setTemplates((prev) => ({
          ...prev,
          [type]: newTemplate,
        }));

        toast.info("Template reset to default values.");
      },
    });
  };

  const updateTemplate = (key: string, value: any) => {
    const globalSyncFields = ["signatoryName", "footer"];

    setHasLocalOnlyChanges(true);

    if (globalSyncFields.includes(key)) {
      setTemplates((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((slug) => {
          if (slug !== "branding-config") {
            (updated as any)[slug] = {
              ...(updated as any)[slug],
              [key]: value,
            };
          }
        });
        return updated;
      });
    } else {
      setTemplates((prev) => ({
        ...prev,
        [activeTab]: { ...(prev as any)[activeTab], [key]: value },
      }));
    }
  };

  const updateEvaluationCriteria = (
    id: string,
    field: "label" | "desc",
    value: string,
  ) => {
    setHasLocalOnlyChanges(true);
    setTemplates((prev) => {
      const current = (prev as any).evaluation || DEFAULT_EVALUATION_TEMPLATE;
      const overrides = {
        ...(current.criteriaOverrides || {}),
        [id]: {
          ...(current.criteriaOverrides?.[id] || {}),
          [field]: value,
        },
      };
      return {
        ...prev,
        evaluation: {
          ...current,
          criteriaOverrides: overrides,
        },
      };
    });
  };

  const handleOfficeBrandingLogoUpload = (
    officeId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large. Please select a logo under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch(
          `${getApiUrl()}/api/offices/${officeId}/branding`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ header_logo_image: base64 }),
          },
        );
        if (res.ok) {
          toast.success("Office logo uploaded to database.");
          // Refresh offices list to show new logo
          const freshOffices = await fetch(`${getApiUrl()}/api/offices`).then(
            (r) => r.json(),
          );
          if (freshOffices.success) setOffices(freshOffices.data);
        } else {
          toast.error("Failed to save logo to database.");
        }
      } catch (e) {
        toast.error("Network error saving logo.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOfficeBrandingDetailsChange = async (
    officeId: string,
    value: string,
  ) => {
    try {
      const res = await fetch(
        `${getApiUrl()}/api/offices/${officeId}/branding`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ header_details: value }),
        },
      );
      if (res.ok) {
        // Update local offices state to avoid full re-fetch
        setOffices((prev) =>
          prev.map((o) =>
            String(o.id) === officeId ? { ...o, header_details: value } : o,
          ),
        );
      }
    } catch (e) {
      console.error("Failed to save office details", e);
    }
  };

  const removeOfficeBrandingLogo = async (officeId: string) => {
    try {
      const res = await fetch(
        `${getApiUrl()}/api/offices/${officeId}/branding`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ header_logo_image: null }),
        },
      );
      if (res.ok) {
        toast.success("Office logo removed from database.");
        setOffices((prev) =>
          prev.map((o) =>
            String(o.id) === officeId ? { ...o, header_logo_image: null } : o,
          ),
        );
      }
    } catch (e) {
      toast.error("Failed to remove logo.");
    }
  };

  const renderPreview = () => {
    const type = activeTab === "letterhead" ? "tardiness-regular" : activeTab;
    const template = (templates as any)[type];
    if (!template) return null; // Safety check

    if (type === "evaluation") {
      const safeTemplate = {
        ...DEFAULT_EVALUATION_TEMPLATE,
        ...template,
      };
      const criteriaOverrides = safeTemplate.criteriaOverrides || {};
      const ratingScaleLines = String(safeTemplate.ratingScaleLines || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const interpretationLines = String(safeTemplate.interpretationLines || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return (
        <div className="bg-white border-0 shadow-2xl px-16 py-12 w-[794px] mx-auto min-h-[1120px] font-serif flex flex-col text-[13px] leading-relaxed">
          <div className="text-center mb-10">
            <h1 className="font-bold text-base uppercase tracking-tight">
              [OFFICE NAME AUTO]
            </h1>
            <h2 className="font-bold text-lg uppercase tracking-wider">
              {safeTemplate.title}
            </h2>
          </div>

          <div className="space-y-2 mb-10">
            <div className="flex gap-2">
              <span className="font-bold whitespace-nowrap">
                {safeTemplate.metaNameLabel}
              </span>
              <span className="flex-1 border-b border-black text-[#A4163A] font-bold">
                [Employee Name]
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold whitespace-nowrap">
                {safeTemplate.metaDepartmentLabel}
              </span>
              <span className="flex-1 border-b border-black text-[#A4163A] font-bold">
                [Department / Position]
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold whitespace-nowrap">
                {safeTemplate.metaRatingPeriodLabel}
              </span>
              <span className="flex-1 border-b border-black text-[#A4163A] font-bold">
                [Rating Period]
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 mb-4 border-b-2 border-transparent">
            <div className="col-span-10 text-center font-bold underline">
              {safeTemplate.criteriaHeader}
            </div>
            <div className="col-span-2 text-center font-bold underline">
              {safeTemplate.ratingHeader}
            </div>
          </div>

          <div className="space-y-6 mb-10">
            {EVALUATION_CRITERIA_DEFAULTS.map((criterion) => {
              const override = criteriaOverrides[criterion.id] || criterion;
              return (
                <div key={criterion.id} className="grid grid-cols-12 gap-4">
                  <div className="col-span-9">
                    <div className="font-bold">{override.label}</div>
                    <div className="ml-6 text-[12px] whitespace-pre-wrap">
                      {override.desc}
                    </div>
                  </div>
                  <div className="col-span-3 pt-4 border-b border-black" />
                </div>
              );
            })}
          </div>

          <div className="mb-8 text-[12px]">
            {safeTemplate.agreementText}{" "}
            <span className="underline">agree</span> /{" "}
            <span className="underline">disagree</span>
          </div>

          <div className="mb-8">
            <div className="font-bold uppercase mb-2">
              {safeTemplate.ratingScaleTitle}
            </div>
            <div className="ml-6 space-y-0 text-[12px]">
              {ratingScaleLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <div className="font-bold uppercase mb-2">
              {safeTemplate.interpretationTitle}
            </div>
            <div className="space-y-0 text-[12px]">
              {interpretationLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="mb-8 font-bold">
            {safeTemplate.recommendationLabel}
          </div>

          <div className="mb-8">
            <div className="font-bold uppercase mb-2">
              {safeTemplate.remarksLabel}
            </div>
            <div className="border-b border-black text-slate-500 italic">
              [Comments here]
            </div>
          </div>

          <div className="mt-auto">
            <div className="font-bold uppercase mb-2 text-[12px]">
              {safeTemplate.managerSignaturesTitle}
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-[12px]">
              <div className="flex gap-2">
                <span className="min-w-[80px]">
                  {safeTemplate.ratedByLabel}
                </span>
                <div className="flex-1 border-b border-black" />
              </div>
              <div className="flex gap-2">
                <span className="min-w-[40px]">Date:</span>
                <div className="flex-1 border-b border-black" />
              </div>
              <div className="flex gap-2">
                <span className="min-w-[80px]">
                  {safeTemplate.reviewedByLabel}
                </span>
                <div className="flex-1 border-b border-black" />
              </div>
              <div className="flex gap-2">
                <span className="min-w-[40px]">Date:</span>
                <div className="flex-1 border-b border-black" />
              </div>
              <div className="flex gap-2">
                <span className="min-w-[80px]">
                  {safeTemplate.approvedByLabel}
                </span>
                <div className="flex-1 border-b border-black" />
              </div>
              <div className="flex gap-2">
                <span className="min-w-[40px]">Date:</span>
                <div className="flex-1 border-b border-black" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    let content = template.body;
    const todayLabel = "[Letter Date]";

    // Placeholder replacements for preview instead of mock data
    const mockEntriesList = `[List of Attendance/Leave Entries for current cut-off]`;

    if (type.startsWith("tardiness")) {
      content = content
        .replace(/{{salutation}}/g, "[Salutation]")
        .replace(/{{last_name}}/g, "[Last Name]")
        .replace(/{{shift_time}}/g, "[Shift Time]")
        .replace(/{{grace_period}}/g, "[Grace Period]")
        .replace(/{{instances_text}}/g, "[Count in words]")
        .replace(/{{instances_count}}/g, "[#]")
        .replace(/{{entries_list}}/g, mockEntriesList);
    } else if (type === "leave") {
      content = content
        .replace(/{{salutation}}/g, "[Salutation]")
        .replace(/{{last_name}}/g, "[Last Name]")
        .replace(/{{instances_text}}/g, "[Count in words]")
        .replace(/{{instances_count}}/g, "[#]")
        .replace(/{{cutoff_text}}/g, "[Cut-off Period]")
        .replace(/{{month}}/g, "[Month]")
        .replace(/{{year}}/g, "[Year]")
        .replace(/{{entries_list}}/g, mockEntriesList);
    } else if (type === "supervisor-tardiness") {
      content = content
        .replace(
          /{{salutation}}\s+{{supervisor first name}}/g,
          "[Sir/Ma'am] [Supervisor First Name]",
        )
        .replace(/{{salutation}}/g, "[Salutation]")
        .replace(/{{employee_name}}/g, "[Employee Full Name]")
        .replace(/{{last_name}}/g, "[Last Name]")
        .replace(/{{pronoun_he_she}}/g, "[He/She]")
        .replace(/{{pronoun_his_her}}/g, "[His/Her]")
        .replace(/{{instances_text}}/g, "[Count in words]")
        .replace(/{{instances_count}}/g, "[#]")
        .replace(/{{instances_count_ordinal}}/g, "[#th]")
        .replace(/{{grace_period}}/g, "[Grace Period]")
        .replace(/{{supervisor first name}}/g, "[Supervisor First Name]")
        .replace(/{{entries_list}}/g, mockEntriesList);
    } else if (type === "supervisor-leave") {
      content = content
        .replace(
          /{{salutation}}\s+{{supervisor first name}}/g,
          "[Sir/Ma'am] [Supervisor First Name]",
        )
        .replace(/{{salutation}}/g, "[Salutation]")
        .replace(/{{employee_name}}/g, "[Employee Full Name]")
        .replace(/{{last_name}}/g, "[Last Name]")
        .replace(/{{pronoun_he_she}}/g, "[He/She]")
        .replace(/{{pronoun_his_her}}/g, "[His/Her]")
        .replace(/{{instances_text}}/g, "[Count in words]")
        .replace(/{{instances_count}}/g, "[#]")
        .replace(/{{cutoff_text}}/g, "[Cut-off Period]")
        .replace(/{{month}}/g, "[Month]")
        .replace(/{{year}}/g, "[Year]")
        .replace(/{{supervisor first name}}/g, "[Supervisor First Name]")
        .replace(/{{entries_list}}/g, mockEntriesList);
    }

    const isSupervisor = type.startsWith("supervisor");

    return (
      <div className="bg-white border-0 shadow-2xl px-16 py-12 w-[794px] mx-auto min-h-[1120px] font-serif flex flex-col items-center print:shadow-none print:p-0">
        {/* Header Branding */}
        <div
          className="flex flex-col items-center mb-2 w-full"
          style={{ marginTop: "0.5cm" }}
        >
          {template.headerLogoImage ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={template.headerLogoImage}
                alt="Custom Logo"
                className="max-w-[150px] max-h-[100px] object-contain"
              />
            </div>
          ) : null}

          {template.headerDetails && (
            <div className="text-center mt-1 text-[10px] leading-tight text-slate-600 max-w-[500px] whitespace-pre-wrap">
              {template.headerDetails}
            </div>
          )}
        </div>

        <div className="w-full text-center mb-6">
          <h1 className="text-xl font-black text-black tracking-wide uppercase">
            {template.title?.replace(/{{Warning level}}/g, "[Warning Level]")}
          </h1>
        </div>

        <div className="w-full text-right mb-8 text-sm font-bold">
          Date: {todayLabel}
        </div>

        <div className="w-full text-left mb-6 text-sm font-bold space-y-1">
          {!isSupervisor && (
            <p>
              Employee Name:{" "}
              <span className="font-bold text-[#A4163A]">
                [Employee Full Name]
              </span>
            </p>
          )}
          <p>
            Position:{" "}
            <span className="font-bold text-[#A4163A]">
              [Employee Position]
            </span>
          </p>
          <p>
            Department:{" "}
            <span className="font-bold text-[#A4163A]">
              [Employee Department]
            </span>
          </p>
        </div>

        <div className="w-full text-justify text-sm leading-relaxed flex-1 text-slate-800">
          {/* Support both legacy plain text and new HTML bodies */}
          {!/<[a-z/][\s\S]*>/i.test(content) ? (
            content.split("\n").map((line: string, idx: number) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={idx} className="h-4" />;

              // Bullet points
              if (trimmed.startsWith("•")) {
                return (
                  <div key={idx} className="flex gap-4 pl-10 mb-2">
                    <span className="shrink-0">•</span>
                    <span>{trimmed.substring(1).trim()}</span>
                  </div>
                );
              }

              // Numbered lists (e.g., "1.", "2.")
              const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
              if (numMatch) {
                return (
                  <div key={idx} className="flex gap-4 pl-10 mb-2">
                    <span className="shrink-0 font-bold">{numMatch[1]}.</span>
                    <span>{numMatch[2]}</span>
                  </div>
                );
              }

              // Salutation & Closing (usually small/no indent)
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

              // Paragraph with first-line indent (only if line starts with 4 spaces)
              const hasIndent = line.startsWith("    ");
              return (
                <div
                  key={idx}
                  className="text-justify mb-4"
                  style={{ textIndent: hasIndent ? "2rem" : "0" }}
                >
                  {trimmed}
                </div>
              );
            })
          ) : (
            <div
              className="rich-text-content"
              dangerouslySetInnerHTML={{ __html: content }}
              style={{ whiteSpace: "pre-wrap" }}
            />
          )}
        </div>

        {/* Official Footer Signature */}
        <div className="w-full mt-12 text-left text-sm space-y-8">
          <div>
            <p>Respectfully,</p>
            <div className="mt-8">
              <p className="font-black text-sm underline uppercase">
                {template.signatoryName || "AIZLE MARIE M. ATIENZA"}
              </p>
              <p className="font-medium text-slate-600">
                {template.footer || "Admin Assistant"}
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-100 pt-8 space-y-4">
            <p className="font-bold mb-4">Employee Acknowledgment:</p>
            <p className="mb-8">
              I,{" "}
              <span className="font-bold text-[#A4163A]">
                [Employee Full Name]
              </span>
              , hereby acknowledge receipt of this Formal Warning Letter.
            </p>
            <div className="space-y-6 pt-6">
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
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <EditorSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#FDF4F6] overflow-x-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ----- INTEGRATED HEADER & TOOLBAR ----- */}
        <div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-lg mb-6 sticky top-0 z-50">
          {/* Main Header Row */}
          <div className="w-full px-4 md:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Template Editor
                </h1>
                <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  ABIC REALTY & CONSULTANCY
                </p>
                {isViewOnly && (
                  <p className="text-yellow-200 text-xs md:text-sm font-semibold mt-2 flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    VIEW ONLY MODE - Editing and modifications are disabled
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {hasLocalOnlyChanges && (
                  <button
                    onClick={() => handleSave()}
                    disabled={isSaving || isViewOnly}
                    className="flex items-center gap-2.5 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all group backdrop-blur-sm disabled:opacity-50"
                    title="You have local changes. Click to sync to cloud."
                  >
                    <div className="relative">
                      <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-amber-400/40 blur-md rounded-full animate-pulse" />
                    </div>
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                        Sync Required
                      </span>
                      <span className="text-[7px] text-amber-200/50 font-bold uppercase tracking-tighter mt-0.5">
                        {isSaving ? "Syncing..." : "Local Changes"}
                      </span>
                    </div>
                  </button>
                )}

                <Button
                  onClick={() => setIsFullWidth(!isFullWidth)}
                  variant="ghost"
                  className="text-white hover:bg-white/10 rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all bg-white/5 border border-white/10"
                  title={isFullWidth ? "Standard Width" : "Full Width"}
                >
                  {isFullWidth ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>

                <Button
                  onClick={() => {
                    if (hasLocalOnlyChanges) {
                      confirm({
                        title: "Unsaved Changes",
                        description:
                          "You have changes that are not synced to the database. Are you sure you want to leave?",
                        confirmText: "Leave Anyway",
                        cancelText: "Stay and Sync",
                        variant: "warning",
                        onConfirm: () =>
                          router.push("/admin-head/attendance/warning-letter"),
                      });
                    } else {
                      router.push("/admin-head/attendance/warning-letter");
                    }
                  }}
                  variant="outline"
                  className="bg-white border-transparent text-[#7B0F2B] hover:bg-rose-50 hover:text-[#4A081A] shadow-sm transition-all duration-200 text-sm font-bold uppercase tracking-wider h-10 px-6 rounded-lg flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span>Back</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Secondary Toolbar */}
          <div className="border-t border-white/10 bg-white/5 backdrop-blur-sm overflow-x-auto">
            <div className="w-full max-w-[100vw] px-4 md:px-8 py-4">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center">
                  <TabsList className="bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-inner h-10 flex gap-1">
                    <TabsTrigger
                      value="letterhead"
                      className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      LETTERHEAD
                    </TabsTrigger>
                    <TabsTrigger
                      value="evaluation"
                      className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      EVALUATION FORM
                    </TabsTrigger>
                    <TabsTrigger
                      value="tardiness-regular"
                      className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      TARDINESS
                    </TabsTrigger>
                    <TabsTrigger
                      value="tardiness-probee"
                      className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      TARDINESS (DRIVER/LIAISON)
                    </TabsTrigger>
                    <TabsTrigger
                      value="leave"
                      className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      LEAVE FORM
                    </TabsTrigger>
                    <TabsTrigger
                      value="supervisor-tardiness"
                      className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      SUPERVISOR (TARDINESS)
                    </TabsTrigger>
                    <TabsTrigger
                      value="supervisor-leave"
                      className="px-4 py-0 rounded-md text-[11px] font-bold transition-all whitespace-nowrap uppercase tracking-wider data-[state=active]:bg-[#800020] data-[state=active]:text-white data-[state=active]:shadow-md text-[#800020]/60 hover:bg-white/50 h-8 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      SUPERVISOR (LEAVE)
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowPreview(!showPreview)}
                    variant="outline"
                    className={cn(
                      "h-10 px-6 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border-2",
                      showPreview
                        ? "bg-rose-50 border-rose-200 text-[#7B0F2B] hover:bg-rose-100"
                        : "bg-[#7B0F2B] border-[#7B0F2B] text-white hover:bg-[#4A081A]",
                    )}
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show Preview
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSave()}
                    disabled={isViewOnly || isSaving}
                    className="bg-white text-[#7B0F2B] hover:bg-rose-50 shadow-md hover:shadow-lg transition-all duration-300 text-[10px] font-black uppercase tracking-widest h-10 px-8 rounded-xl flex items-center border-b-4 border-rose-200 active:border-b-0 active:translate-y-1"
                  >
                    {isSaving ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        SAVING
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        SYNC CHANGES
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "mx-auto p-4 md:p-6 transition-all duration-500 ease-in-out",
            isFullWidth
              ? "max-w-[100%] px-4 md:px-6 lg:px-10"
              : "max-w-[1400px]",
          )}
        >
          <div
            className={cn(
              "grid gap-8 transition-all duration-500",
              showPreview
                ? "grid-cols-1 2xl:grid-cols-[1fr_816px]"
                : "grid-cols-1 max-w-[1200px] mx-auto",
            )}
          >
            {/* Editor Side */}
            <div
              className={cn(
                "space-y-6 transition-all duration-500",
                isViewOnly && "opacity-75",
                showPreview ? "animate-in slide-in-from-left" : "w-full",
              )}
            >
              <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-gradient-to-r from-[#7B0F2B] to-[#A4163A] text-white p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                        <FileText className="w-6 h-6 text-rose-300" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xl text-white font-bold tracking-tight">
                          {activeTab === "letterhead"
                            ? "Company Letterhead"
                            : activeTab === "evaluation"
                              ? "Evaluation Template"
                              : activeTab.startsWith("supervisor-tardiness")
                                ? "Supervisor Tardiness Advisory"
                                : activeTab.startsWith("supervisor-leave")
                                  ? "Supervisor Leave Advisory"
                                  : "Employee Warning"}
                        </span>
                        <span className="text-[10px] font-medium text-rose-200/70 uppercase tracking-[0.2em]">
                          {activeTab === "letterhead"
                            ? "Shared Branding"
                            : activeTab === "evaluation"
                              ? "Form Configuration"
                              : "Configuration Panel"}
                        </span>
                      </div>
                    </CardTitle>
                    <Badge className="bg-rose-500/20 text-rose-100 border border-rose-400/30 font-bold uppercase text-[9px] px-3 py-1 rounded-full backdrop-blur-sm">
                      {activeTab === "letterhead"
                        ? "GLOBAL"
                        : activeTab === "evaluation"
                          ? "EVALUATION"
                          : activeTab.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 pt-12">
                  <fieldset
                    disabled={isViewOnly}
                    className="space-y-8 [&_button:disabled]:cursor-not-allowed [&_input:disabled]:cursor-not-allowed [&_textarea:disabled]:cursor-not-allowed [&_[data-slot=select-trigger][data-disabled]]:cursor-not-allowed"
                  >
                    {activeTab === "letterhead" ? (
                      <div className="space-y-6 bg-rose-50/10 p-2 border-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-rose-100 rounded-lg">
                            <Layout className="w-4 h-4 text-[#A4163A]" />
                          </div>
                          <h4 className="text-xs font-black text-[#A4163A] uppercase tracking-wider">
                            Office Letterhead Customization
                          </h4>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {offices.map((office: any) => {
                              const officeLogo = office.header_logo_image;
                              const officeDetail = office.header_details || "";

                              return (
                                <div
                                  key={office.id}
                                  className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm space-y-4"
                                >
                                  <div className="flex items-center justify-between">
                                    <Badge className="bg-[#7B0F2B] text-white font-bold uppercase text-[9px]">
                                      {office.name}
                                    </Badge>
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                      Logo
                                    </Label>
                                    {officeLogo ? (
                                      <div className="relative group aspect-video bg-rose-50/20 rounded-xl border border-dashed border-rose-200 overflow-hidden flex items-center justify-center p-2">
                                        <img
                                          src={officeLogo}
                                          alt={office.name}
                                          className="max-h-full max-w-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-white hover:text-red-400 p-0"
                                            onClick={() =>
                                              removeOfficeBrandingLogo(
                                                String(office.id),
                                              )
                                            }
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <label className="aspect-video bg-rose-50/10 hover:bg-rose-50/50 rounded-xl border border-dashed border-rose-200 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                                        <input
                                          type="file"
                                          className="hidden"
                                          accept="image/*"
                                          onChange={(e) =>
                                            handleOfficeBrandingLogoUpload(
                                              String(office.id),
                                              e,
                                            )
                                          }
                                        />
                                        <Upload className="w-5 h-5 text-rose-300" />
                                        <span className="text-[8px] font-black text-slate-500 uppercase">
                                          Upload
                                        </span>
                                      </label>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                      Address
                                    </Label>
                                    <SubtextInput
                                      officeId={String(office.id)}
                                      initialValue={officeDetail}
                                      onSave={(val: string) =>
                                        handleOfficeBrandingDetailsChange(
                                          String(office.id),
                                          val,
                                        )
                                      }
                                      officeName={office.name}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : activeTab === "evaluation" ? (
                      <div className="space-y-8">
                        <div className="space-y-2.5">
                          <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                            Document Title
                          </Label>
                          <Input
                            value={(templates as any)[activeTab].title}
                            onChange={(e) =>
                              updateTemplate("title", e.target.value)
                            }
                            className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Name Label
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab].metaNameLabel
                              }
                              onChange={(e) =>
                                updateTemplate("metaNameLabel", e.target.value)
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Department/Job Title Label
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab]
                                  .metaDepartmentLabel
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "metaDepartmentLabel",
                                  e.target.value,
                                )
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Rating Period Label
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab]
                                  .metaRatingPeriodLabel
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "metaRatingPeriodLabel",
                                  e.target.value,
                                )
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-rose-100 rounded-lg">
                              <Layout className="w-4 h-4 text-[#A4163A]" />
                            </div>
                            <h4 className="text-xs font-black text-[#A4163A] uppercase tracking-wider">
                              Criteria Labels & Descriptions
                            </h4>
                          </div>
                          <div className="space-y-5">
                            {EVALUATION_CRITERIA_DEFAULTS.map((criterion) => {
                              const overrides =
                                (templates as any).evaluation
                                  ?.criteriaOverrides?.[criterion.id] ||
                                criterion;
                              return (
                                <div
                                  key={criterion.id}
                                  className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm space-y-3"
                                >
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                      <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                                        Label
                                      </Label>
                                      <Input
                                        value={overrides.label}
                                        onChange={(e) =>
                                          updateEvaluationCriteria(
                                            criterion.id,
                                            "label",
                                            e.target.value,
                                          )
                                        }
                                        className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                                      />
                                    </div>
                                    <div className="space-y-2.5">
                                      <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                                        Description
                                      </Label>
                                      <Textarea
                                        value={overrides.desc}
                                        onChange={(e) =>
                                          updateEvaluationCriteria(
                                            criterion.id,
                                            "desc",
                                            e.target.value,
                                          )
                                        }
                                        className="min-h-[90px] bg-white border-rose-100 shadow-sm rounded-2xl font-medium text-[13px] leading-relaxed text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all p-4 resize-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Criteria Header
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab].criteriaHeader
                              }
                              onChange={(e) =>
                                updateTemplate("criteriaHeader", e.target.value)
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Rating Header
                            </Label>
                            <Input
                              value={(templates as any)[activeTab].ratingHeader}
                              onChange={(e) =>
                                updateTemplate("ratingHeader", e.target.value)
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                            Agreement Text
                          </Label>
                          <Textarea
                            value={(templates as any)[activeTab].agreementText}
                            onChange={(e) =>
                              updateTemplate("agreementText", e.target.value)
                            }
                            className="min-h-[120px] bg-white border-rose-100 shadow-sm rounded-2xl font-medium text-[14px] leading-relaxed text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all p-5 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Rating Scale Title
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab].ratingScaleTitle
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "ratingScaleTitle",
                                  e.target.value,
                                )
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Rating Scale Lines
                            </Label>
                            <Textarea
                              value={
                                (templates as any)[activeTab].ratingScaleLines
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "ratingScaleLines",
                                  e.target.value,
                                )
                              }
                              className="min-h-[120px] bg-white border-rose-100 shadow-sm rounded-2xl font-medium text-[14px] leading-relaxed text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all p-5 resize-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Interpretation Title
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab]
                                  .interpretationTitle
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "interpretationTitle",
                                  e.target.value,
                                )
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Interpretation Lines
                            </Label>
                            <Textarea
                              value={
                                (templates as any)[activeTab]
                                  .interpretationLines
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "interpretationLines",
                                  e.target.value,
                                )
                              }
                              className="min-h-[120px] bg-white border-rose-100 shadow-sm rounded-2xl font-medium text-[14px] leading-relaxed text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all p-5 resize-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Recommendation Label
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab]
                                  .recommendationLabel
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "recommendationLabel",
                                  e.target.value,
                                )
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Remarks Label
                            </Label>
                            <Input
                              value={(templates as any)[activeTab].remarksLabel}
                              onChange={(e) =>
                                updateTemplate("remarksLabel", e.target.value)
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                            Manager Signatures Title
                          </Label>
                          <Input
                            value={
                              (templates as any)[activeTab]
                                .managerSignaturesTitle
                            }
                            onChange={(e) =>
                              updateTemplate(
                                "managerSignaturesTitle",
                                e.target.value,
                              )
                            }
                            className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Rated By Label
                            </Label>
                            <Input
                              value={(templates as any)[activeTab].ratedByLabel}
                              onChange={(e) =>
                                updateTemplate("ratedByLabel", e.target.value)
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Reviewed By Label
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab].reviewedByLabel
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "reviewedByLabel",
                                  e.target.value,
                                )
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Approved By Label
                            </Label>
                            <Input
                              value={
                                (templates as any)[activeTab].approvedByLabel
                              }
                              onChange={(e) =>
                                updateTemplate(
                                  "approvedByLabel",
                                  e.target.value,
                                )
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-6">
                          <div className="space-y-2.5">
                            <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                              Document Title
                            </Label>
                            <Input
                              value={(templates as any)[activeTab].title}
                              onChange={(e) =>
                                updateTemplate("title", e.target.value)
                              }
                              className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center pl-1">
                            <Label className="text-[#4A081A] font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                              <Type className="w-3.5 h-3.5 text-[#A4163A]" />
                              Letter Body Content
                            </Label>
                            <div className="flex items-center gap-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                              <span className="text-[9px] text-rose-700 uppercase font-black tracking-wider">
                                Dynamic Component
                              </span>
                            </div>
                          </div>
                          <div className="relative group">
                            <StandardRichTextEditor
                              value={(templates as any)[activeTab].body}
                              onChange={(val: string) =>
                                updateTemplate("body", val)
                              }
                              isViewOnly={isViewOnly}
                            />
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2.5">
                              <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                                Signatory Name
                              </Label>
                              <Input
                                value={
                                  (templates as any)[activeTab].signatoryName
                                }
                                onChange={(e) =>
                                  updateTemplate(
                                    "signatoryName",
                                    e.target.value,
                                  )
                                }
                                placeholder="AIZLE MARIE M. ATIENZA"
                                className="bg-white border-rose-100 shadow-sm rounded-xl font-bold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                              />
                            </div>
                            <div className="space-y-2.5">
                              <Label className="text-[#4A081A]/60 font-bold uppercase text-[10px] tracking-widest pl-1">
                                Signatory Title
                              </Label>
                              <Input
                                value={(templates as any)[activeTab].footer}
                                onChange={(e) =>
                                  updateTemplate("footer", e.target.value)
                                }
                                className="bg-white border-rose-100 shadow-sm rounded-xl font-semibold text-[#4A081A] focus:ring-2 focus:ring-[#A4163A]/20 focus:border-[#A4163A] transition-all h-11"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </fieldset>
                </CardContent>
              </Card>

              {activeTab !== "letterhead" && activeTab !== "evaluation" && (
                <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-slate-50 border-l-[6px] border-[#A4163A]">
                  <CardHeader className="py-4 px-6 border-b border-slate-200/60 bg-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold text-[#4A081A] uppercase tracking-[0.15em] flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[#A4163A]" />
                        Available Placeholders
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2.5">
                      {(activeTab.startsWith("supervisor")
                        ? [
                            "{{employee_name}}",
                            "{{last_name}}",
                            "{{instances_text}}",
                            "{{instances_count}}",
                            "{{entries_list}}",
                            "{{pronoun_he_she}}",
                            "{{pronoun_his_her}}",
                            "{{supervisor first name}}",
                            "{{salutation}}",
                          ]
                        : activeTab === "leave"
                          ? [
                              "{{salutation}}",
                              "{{last_name}}",
                              "{{instances_text}}",
                              "{{instances_count}}",
                              "{{month}}",
                              "{{year}}",
                              "{{cutoff_text}}",
                              "{{entries_list}}",
                            ]
                          : [
                              "{{salutation}}",
                              "{{last_name}}",
                              "{{shift_time}}",
                              "{{grace_period}}",
                              "{{instances_text}}",
                              "{{instances_count}}",
                              "{{entries_list}}",
                            ]
                      ).map((tag) => (
                        <button
                          key={tag}
                          className="group relative px-3 py-1.5 bg-white hover:bg-[#A4163A] rounded-lg border border-slate-200 hover:border-[#A4163A] transition-all duration-200 shadow-sm"
                        >
                          <code className="text-[10px] font-mono font-bold text-[#A4163A] group-hover:text-white">
                            {tag}
                          </code>
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium text-blue-800/80">
                        Insert these tags into your letter body. They will be
                        automatically populated with the relevant employee
                        details when generating the final document.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview Side */}
            {showPreview && (
              <div className="space-y-6 animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between px-4 sticky top-[20px] lg:top-[120px] z-10 bg-[#FDF4F6]/80 backdrop-blur-sm py-3 rounded-2xl border border-rose-100 shadow-sm">
                  <h3 className="text-lg font-black text-[#4A081A] flex items-center gap-2">
                    <div className="p-1.5 bg-[#A4163A] rounded-lg">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    Dynamic Preview
                  </h3>
                  <Badge className="bg-[#A4163A] text-white px-3 py-1 rounded-full uppercase text-[9px] font-black tracking-[0.15em] animate-pulse border-0">
                    Live Rendering
                  </Badge>
                </div>
                <div className="sticky top-[20px] lg:top-[120px] shadow-2xl rounded-sm overflow-auto border border-slate-200 bg-white max-h-[90vh]">
                  <div
                    className="origin-top transition-transform duration-500 mx-auto"
                    style={{
                      transform: isFullWidth ? "scale(0.85)" : "scale(0.95)",
                      width: "794px",
                    }}
                  >
                    {renderPreview()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Tabs>

      {/* --- BOTTOM DECORATION --- */}
      <div className="h-40 bg-gradient-to-t from-[#FFE5EC] to-transparent opacity-30 mt-20" />
    </div>
  );
}
