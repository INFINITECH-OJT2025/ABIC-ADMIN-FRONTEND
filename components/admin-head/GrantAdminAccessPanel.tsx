"use client"

import React, { useState } from "react"
import { X, Mail, User, ShieldCheck, ArrowRight } from "lucide-react"
import LoadingModal from "@/components/app/LoadingModal"

const MAROON_GRADIENT = "linear-gradient(135deg, #7a0f1f 0%, #5f0c18 100%)"
const fieldClass = "w-full h-12 bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-rose-500/5 transition-all outline-none focus:border-[#7a0f1f]"

export interface GrantAdminAccessPanelProps {
    open: boolean
    onClose: () => void
    onGranted: () => void
}

export default function GrantAdminAccessPanel({
    open,
    onClose,
    onGranted,
}: GrantAdminAccessPanelProps) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [closing, setClosing] = useState(false)

    const label = "Administrator"
    const Icon = ShieldCheck

    const handleClose = () => {
        setClosing(true)
        setTimeout(() => {
            onClose()
            setClosing(false)
            setName("")
            setEmail("")
        }, 350)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || !email.trim()) {
            alert("Please provide both a name and email address.")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch("/api/laravel/api/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim() }),
            })

            const data = await res.json()

            if (res.ok && data.success) {
                alert(data.message || `Admin access has been provisioned successfully.`)
                onGranted()
                handleClose()
            } else {
                alert(data.message || `Failed to grant system access.`)
            }
        } catch (err) {
            alert("Communication failure with administrative buffer.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!open && !closing) return null

    return (
        <>
            <style jsx global>{`
                @keyframes grantPanelSlideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes grantPanelSlideOut {
                    from { transform: translateX(0); }
                    to { transform: translateX(100%); }
                }
            `}</style>

            <div
                className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-[350ms] ${closing ? "opacity-0" : "opacity-100"}`}
                onClick={handleClose}
                aria-hidden="true"
            />

            <div
                className="fixed top-0 right-0 bottom-0 w-full h-screen bg-white z-[70] flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.1)] transition-all font-sans"
                style={{
                    maxWidth: "420px",
                    animation: closing
                        ? "grantPanelSlideOut 0.35s cubic-bezier(0.32,0.72,0,1) forwards"
                        : "grantPanelSlideIn 0.4s cubic-bezier(0.32,0.72,0,1)",
                }}
            >
                <div
                    className="flex-shrink-0 px-8 py-10 flex items-center justify-between text-white relative overflow-hidden"
                    style={{ background: MAROON_GRADIENT }}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 pointer-events-none" />
                    
                    <div className="relative z-10 flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                            <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight italic uppercase leading-none">
                                Grant Access
                            </h2>
                            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-2 leading-none">
                                Provision System Credentials
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="relative z-10 p-2.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-10 space-y-8 bg-slate-50/30">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                            Full Legal Name
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#7a0f1f] transition-colors">
                                <User className="w-full h-full" />
                            </div>
                            <input
                                type="text"
                                placeholder="e.g. Juan De La Cruz"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={fieldClass}
                                required
                            />
                        </div>
                        <p className="mt-2 ml-1 text-[10px] font-medium text-slate-400 italic">
                            This name will be displayed on all system logs and records.
                        </p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
                            Primary Email Address
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#7a0f1f] transition-colors">
                                <Mail className="w-full h-full" />
                            </div>
                            <input
                                type="email"
                                placeholder="e.g. juan@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={fieldClass}
                                required
                            />
                        </div>
                        <p className="mt-2 ml-1 text-[10px] font-medium text-slate-400 italic">
                            System credentials and security alerts will be sent here.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-rose-200 flex flex-shrink-0 items-center justify-center shadow-sm">
                            <ArrowRight className="w-5 h-5 text-[#7a0f1f]" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-[#7a0f1f]">Security Note</h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 font-medium">
                                Granting access will immediately dispatch login credentials. If the user already exists, their current permissions will be upgraded.
                            </p>
                        </div>
                    </div>
                </form>

                <div className="flex-shrink-0 px-8 py-6 bg-white border-t border-slate-200 flex gap-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-[2] h-12 rounded-xl bg-[#7a0f1f] text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-rose-900/20 hover:shadow-rose-900/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 active:scale-95"
                    >
                        {isLoading ? "Processing..." : `Confirm ${label}`}
                    </button>
                </div>
            </div>

            {isLoading && (
                <LoadingModal
                    isOpen={isLoading}
                    title="Provisioning Access"
                    message={`Establishing admin credentials and notifying user...`}
                />
            )}
        </>
    )
}
