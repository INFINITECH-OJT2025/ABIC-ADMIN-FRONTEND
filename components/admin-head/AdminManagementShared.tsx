"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowUp, 
  ArrowDown, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ShieldCheck,
  Briefcase
} from "lucide-react";

import HeadHeader from "./HeadHeader";
import HeadSummaryBar, { HeadStatPill } from "./HeadSummaryBar";
import HeadToolbar from "./HeadToolbar";
import HeadDataTable, { HeadColumn, PaginationMeta } from "./HeadDataTable";
import HeadListContainer from "./HeadListContainer";

import { ConfirmationModal } from "@/components/ConfirmationModal";
import LoadingModal from "@/components/app/LoadingModal";
import GrantAdminAccessPanel from "./GrantAdminAccessPanel";
import ViewEditAdminPanel from "./ViewEditAdminPanel";
// Assuming Toast system is already present or handled elsewhere. 
// If not, we'll use window.alert as fallback for now or adapt to local toast.
// Let's use a dummy showToast for now or check if it exists.
const showToastFallback = (title: string, message: string, type: "success" | "error" = "success") => {
    console.log(`[TOAST][${type}] ${title}: ${message}`);
};

import { adminHeadNav } from "@/lib/navigation";

type Status = "Active" | "Inactive" | "Suspended" | "Pending" | "Expired";

type HeadAccount = {
  id: number;
  name: string;
  email: string;
  status: Status;
  promoted_at?: string | null;
  updated_at?: string;
};

interface AdminManagementSharedProps {
  type: "admin" | "accountant";
}

export default function AdminManagementShared({ type }: AdminManagementSharedProps) {
  // Use local mock for toast if not provided globally
  const showToast = showToastFallback; 
  
  // Labels & Config
  const isAccountant = type === "accountant";
  const label = isAccountant ? "Accountant" : "Administrator";
  const labelPlural = isAccountant ? "Accountants" : "Administrators";
  const apiPath = isAccountant ? "accountants" : "admins";
  const Icon = isAccountant ? Briefcase : ShieldCheck;

  // State
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [accounts, setAccounts] = useState<HeadAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  
  // Stats State
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  } | null>(null);

  // Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<HeadAccount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [revertConfirmAccount, setRevertConfirmAccount] = useState<HeadAccount | null>(null);
  const [isReverting, setIsReverting] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingActionType, setLoadingActionType] = useState<"edit" | "revert">("edit");

  // Fetch Logic
  async function fetchAccounts() {
    setIsLoading(true);
    try {
      const url = new URL(`/api/laravel/api/${apiPath}`, window.location.origin);
      if (query.trim()) url.searchParams.append("search", query.trim());
      if (statusFilter !== "all") url.searchParams.append("status", statusFilter);
      url.searchParams.append("page", currentPage.toString());
      url.searchParams.append("per_page", "10");

      const res = await fetch(url.toString());
      const data = await res.json();
      
      if (res.ok && data.success) {
        const list = data.data?.data || data.data || [];
        setAccounts(Array.isArray(list) ? list : []);
        
        if (data.data?.current_page !== undefined) {
          setPaginationMeta({
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            per_page: data.data.per_page,
            total: data.data.total,
            from: (data.data.current_page - 1) * data.data.per_page + 1,
            to: (data.data.current_page - 1) * data.data.per_page + list.length,
          } as PaginationMeta);
        }
      }
    } catch (err) {
      console.error(`Error fetching ${apiPath}:`, err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchStats() {
    try {
      // Small hack: per_page=all to get counts, or specialized stats endpoint
      const res = await fetch(`/api/laravel/api/${apiPath}?per_page=1000`);
      const data = await res.json();
      const list: HeadAccount[] = data?.data?.data || data?.data || [];
      
      setStats({
        total: list.length,
        active: list.filter(a => a.status === "Active").length,
        inactive: list.filter(a => a.status === "Inactive").length,
        suspended: list.filter(a => a.status === "Suspended").length,
      });
    } catch (err) {
      console.error(`Stats fetch failed for ${apiPath}:`, err);
    }
  }

  useEffect(() => {
    fetchAccounts();
    fetchStats();
  }, [query, currentPage, statusFilter]);

  // Actions
  async function handleSaveEdit(newName: string, newEmail: string, newStatus: string) {
    if (!editing) return;
    setIsEditing(true);
    setShowLoadingModal(true);
    setLoadingActionType("edit");
    try {
      const res = await fetch(`/api/laravel/api/${apiPath}/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed");
      
      showToast(`${label} Updated`, "Changes saved successfully.", "success");
      setEditing(null);
      fetchAccounts();
      fetchStats();
    } catch (err: any) {
      showToast("Update Failed", err.message, "error");
    } finally {
      setIsEditing(false);
      setShowLoadingModal(false);
    }
  }

  async function handleRemoveAccess() {
    if (!revertConfirmAccount) return;
    setIsReverting(true);
    try {
      const res = await fetch(`/api/laravel/api/${apiPath}/${revertConfirmAccount.id}/revert-to-employee`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Access Removed", `${label} access has been revoked.`, "success");
        setRevertConfirmAccount(null);
        setEditing(null);
        fetchAccounts();
        fetchStats();
      }
    } catch {
      showToast("Error", "Action failed. Try again.", "error");
    } finally {
      setIsReverting(false);
    }
  }

  function statusBadge(status: Status) {
    const config = {
      Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      Inactive: "bg-slate-50 text-slate-600 ring-slate-500/10",
      Suspended: "bg-amber-50 text-amber-700 ring-amber-600/20",
      Pending: "bg-amber-50 text-amber-600 ring-amber-600/20",
      Expired: "bg-rose-50 text-rose-700 ring-rose-600/20",
    };
    const configValue = config[status] || config.Inactive;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-black ring-1 ring-inset ${configValue}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {status}
      </span>
    );
  }

  const columns: HeadColumn<HeadAccount>[] = [
    {
      key: "name",
      label: "name",
      flex: true,
      sortable: true,
      renderCell: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-[10px] font-black text-rose-700 border border-rose-100">
            {row.name.charAt(0)}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-slate-900 uppercase tracking-tight leading-none">{row.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "contact",
      flex: true,
      renderCell: (row) => (
        <span className="text-slate-500 font-medium lowercase tracking-tight">{row.email}</span>
      ),
    },
    {
      key: "status",
      label: "status",
      width: "140px",
      renderCell: (row) => statusBadge(row.status),
    },
  ];

  const breadcrumb = type === "admin" ? "Admins" : "Accountants";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB] font-sans">
      <HeadHeader
        navigation={adminHeadNav}
        title={`${labelPlural}`}
        subtitle={`System-level management of ${label} credentials and access control.`}
        icon={Icon}
        breadcrumbLabel={breadcrumb}
        primaryAction={(
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#7a0f1f] rounded-lg text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-all shadow-xl active:scale-95"
          >
            <ArrowUp className="w-4 h-4" />
            Grant Access
          </button>
        )}
      />

      <HeadSummaryBar>
        <HeadStatPill icon={Users} label={`Total ${labelPlural}`} value={stats?.total ?? null} colorScheme="slate" />
        <HeadStatPill icon={CheckCircle} label="Operational" value={stats?.active ?? null} colorScheme="emerald" />
        <HeadStatPill icon={AlertTriangle} label="Suspended" value={stats?.suspended ?? null} colorScheme="rose" />
        <HeadStatPill icon={XCircle} label="Inactive" value={stats?.inactive ?? null} colorScheme="amber" />
      </HeadSummaryBar>

      <HeadListContainer>
        <HeadToolbar 
          searchQuery={query}
          onSearchChange={setQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          isLoading={isLoading}
          onRefresh={fetchAccounts}
          statusOptions={[
            { value: "all", label: "ALL REGISTRY" },
            { value: "Active", label: "ACTIVE" },
            { value: "Suspended", label: "SUSPENDED" },
            { value: "Inactive", label: "INACTIVE" },
          ]}
        />

        <HeadDataTable
          columns={columns}
          rows={accounts}
          loading={isLoading}
          pagination={paginationMeta}
          onPageChange={setCurrentPage}
          onRowClick={setEditing}
        />
      </HeadListContainer>

      {/* Grant Access Panel */}
      {showCreate && (
         <GrantAdminAccessPanel
            open={showCreate}
            onClose={() => setShowCreate(false)}
            onGranted={() => { fetchAccounts(); fetchStats(); }}
         />
      )}

      {/* Revert Confirmation */}
      {revertConfirmAccount && (
          <ConfirmationModal
            isOpen={!!revertConfirmAccount}
            variant="destructive"
            title="Revoke System Access"
            description={`Are you certain you want to revoke Administrator access for ${revertConfirmAccount.name}? They will lose all administrative privileges immediately.`}
            confirmText="Confirm Revoke"
            onClose={() => setRevertConfirmAccount(null)}
            onConfirm={handleRemoveAccess}
            isLoading={isReverting}
          />
      )}

      {/* View/Edit Panel */}
      {editing && (
          <ViewEditAdminPanel
            account={editing}
            onClose={() => setEditing(null)}
            onSave={handleSaveEdit}
            isSaving={isEditing}
            onRemoveAccess={() => {
                setRevertConfirmAccount(editing);
                setLoadingActionType("revert");
            }}
            removeLabel="Revoke Access"
          />
      )}

      {showLoadingModal && (
        <LoadingModal
          isOpen={showLoadingModal}
          title={loadingActionType === "edit" ? `Updating ${label}` : "Processing Revocation"}
          message="Synchronizing changes with system buffer..."
        />
      )}
    </div>
  );
}
