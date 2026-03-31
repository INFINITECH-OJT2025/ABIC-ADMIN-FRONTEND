"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowDown, User, Mail, Calendar, RefreshCw } from "lucide-react";
import FormTooltipError from "@/components/ui/form-tooltip-error";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const MAROON_GRADIENT = "linear-gradient(135deg, #7a0f1f 0%, #5f0c18 100%)";
const fieldClass = "w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all outline-none focus:border-[#7a0f1f]";
const labelClass = "text-xs font-black uppercase tracking-wider text-slate-500 ml-1 block mb-2";

export interface ViewEditAdminPanelProps {
    account: {
        id: string | number;
        name: string;
        email: string;
        status?: string;
        promoted_at?: string | null;
    } | null;
    onClose: () => void;
    onSave: (newName: string, newEmail: string, newStatus: string) => Promise<void>;
    onRemoveAccess: () => void;
    isSaving: boolean;
    removeLabel: string;
}

const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "No record";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid record";
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch {
        return "Invalid record";
    }
};

export default function ViewEditAdminPanel({
    account,
    onClose,
    onSave,
    onRemoveAccess,
    isSaving,
    removeLabel
}: ViewEditAdminPanelProps) {
    const [isClosing, setIsClosing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", email: "", status: "Active" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [confirmingRemove, setConfirmingRemove] = useState(false);

    const open = account !== null;

    useEffect(() => {
        if (account) {
            const s = account.status || "Active";
            setEditForm({
                name: account.name,
                email: account.email,
                status: s,
            });
            setErrors({});
            setIsClosing(false);
        }
    }, [account]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setEditForm({ name: "", email: "", status: "Active" });
            setErrors({});
        }, 350);
    };

    const handleSave = () => {
        if (!editForm.name.trim()) {
            setErrors({ name: "Account Name required" });
            return;
        }
        setErrors({});
        onSave(editForm.name, editForm.email, editForm.status);
    };

    const originalStatus = account?.status || "Active";
    const hasChanges = editForm.name !== account?.name || editForm.status !== originalStatus;

    if (!open && !isClosing) return null;

    return (
        <>
            <style jsx global>{`
                @keyframes viewPanelSlideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes viewPanelSlideOut {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `}</style>

            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-[350ms] ${isClosing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            <div
                className="fixed top-0 right-0 bottom-0 w-full h-screen bg-[#f8fafc] z-[70] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] transition-all font-sans"
                style={{
                    maxWidth: "32rem",
                    animation: isClosing
                        ? "viewPanelSlideOut 0.35s cubic-bezier(0.32,0.72,0,1) forwards"
                        : "viewPanelSlideIn 0.4s cubic-bezier(0.32,0.72,0,1)",
                }}
            >
                <div 
                    className="flex-shrink-0 px-8 py-6 flex items-center justify-between text-white relative overflow-hidden"
                    style={{ background: MAROON_GRADIENT }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 pointer-events-none" />
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                            <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight italic uppercase leading-none">
                                {account?.name || "System Profile"}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="relative z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-white border-r border-slate-200">
                    <div className="p-8 space-y-8">
                        <div className="relative">
                            <label className={labelClass}>System Activation Date</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div className="w-full h-12 flex items-center px-12 rounded-xl bg-slate-100/50 border border-slate-200 text-xs font-bold text-slate-500 italic">
                                    {account?.promoted_at ? formatDate(account.promoted_at) : "No record available"}
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <label className={labelClass}>Account Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User className="h-4 w-4" />
                                </div>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => {
                                        setEditForm((p) => ({ ...p, name: e.target.value.toUpperCase() }));
                                        if (errors.name) setErrors({ name: "" });
                                    }}
                                    placeholder="Enter system name..."
                                    className={`${fieldClass} ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                                />
                            </div>
                            <FormTooltipError message={errors.name} />
                        </div>

                        <div className="relative">
                            <label className={labelClass}>Email Address</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <div className="w-full h-12 flex items-center px-12 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-400 truncate cursor-not-allowed">
                                    {editForm.email}
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="px-2 py-0.5 rounded-md bg-slate-200 text-[8px] font-black uppercase text-slate-500">
                                        Locked
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className={labelClass}>Account Status</label>
                            <div className="p-1 bg-slate-100/80 rounded-[14px] flex gap-1 border border-slate-200/60 font-semibold">
                                {(["Active", "Inactive", "Suspended"] as const).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setEditForm(p => ({ ...p, status: s }))}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${editForm.status === s ? "bg-white text-[#7a0f1f] shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={() => setConfirmingRemove(true)}
                                className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-rose-50 hover:text-[#7a0f1f] hover:border-rose-100 transition-all active:scale-95 group shadow-sm"
                            >
                                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                                {removeLabel}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 px-8 py-5 bg-white border-t border-slate-200 flex items-center justify-end gap-3 z-10">
                    <button
                        onClick={handleClose}
                        type="button"
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 border border-transparent hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors active:scale-95"
                    >
                        Cancel
                    </button>
                    {!isSaving && hasChanges && (
                        <button
                            onClick={handleSave}
                            className="px-8 py-2.5 bg-[#7a0f1f] text-white text-sm font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(122,15,31,0.3)] hover:shadow-[0_12px_25px_-4px_rgba(122,15,31,0.4)] hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
                        >
                            Save Changes
                        </button>
                    )}
                    {isSaving && (
                        <div className="px-8 py-2.5 bg-slate-100 text-slate-400 text-sm font-bold rounded-xl flex items-center gap-2">
                             <RefreshCw className="w-4 h-4 animate-spin" />
                             Saving...
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmingRemove}
                title="System Revocation"
                description={`Are you certain you want to revoke administrative access for ${account?.name?.toLowerCase()}? Item will be demoted to basic employee status.`}
                confirmText="Confirm Revocation"
                variant="destructive"
                onClose={() => setConfirmingRemove(false)}
                onConfirm={() => {
                    setConfirmingRemove(false);
                    onRemoveAccess();
                }}
                isLoading={isSaving}
            />
        </>
    );
}
