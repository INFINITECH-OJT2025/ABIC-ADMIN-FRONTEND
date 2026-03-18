"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2, CheckCheck, Bell, Search, ArrowUpDown, ListFilter, Eye, ChevronLeft, Calendar, Users, UserCircle, FileText, GitBranch, Clock, UserPlus, Package, LayoutGrid, Filter } from "lucide-react";

type ActivityLogRow = {
	id: number;
	activity_type: string;
	action: string;
	status: "success" | "warning" | "error" | "info" | string;
	title: string;
	description: string;
	user_name?: string | null;
	user_email?: string | null;
	created_at: string;
	read_at?: string | null;
};

const statusClassMap: Record<string, string> = {
	success: "bg-emerald-100 text-emerald-800",
	warning: "bg-amber-100 text-amber-800",
	error: "bg-red-100 text-red-800",
	info: "bg-sky-100 text-sky-800",
};

function formatDate(value: string) {
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return value;
	return d.toLocaleString();
}

const PAGE_STEP = 15;

const MODULE_TYPES = [
	"attendance",
	"directory",
	"employee",
	"forms",
	"hierarchy",
	"tardiness",
	"hiring",
	"inventory",
] as const;

function normalizeType(value: string) {
	const type = value.toLowerCase();
	if (type.includes("employee")) return "employee";
	if (type.includes("attendance")) return "attendance";
	if (type.includes("directory")) return "directory";
	if (type.includes("tard")) return "tardiness";
	if (type.includes("form") || type.includes("warning") || type.includes("checklist") || type.includes("evaluation")) return "forms";
	if (type.includes("hierarch") || type.includes("department")) return "hierarchy";
	if (type.includes("hiring")) return "hiring";
	if (type.includes("inventory") || type.includes("office_supply") || type.includes("office-supply")) return "inventory";
	return type;
}

const MODULE_ICONS: Record<string, any> = {
	attendance: Calendar,
	directory: Users,
	employee: UserCircle,
	forms: FileText,
	hierarchy: GitBranch,
	tardiness: Clock,
	hiring: UserPlus,
	inventory: Package,
};

export default function AdminHeadActivityLogsPage() {
	const [logs, setLogs] = useState<ActivityLogRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
	const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
	const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
	const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
	const [workingAction, setWorkingAction] = useState<"refresh" | "read" | "delete" | "single-read" | null>(null);

	const fetchLogs = useCallback(async () => {
		setWorkingAction("refresh");
		setError(null);

		try {
			const response = await fetch("/api/laravel/api/activity-logs?per_page=200", {
				method: "GET",
			});
			const result = await response.json();

			if (!response.ok || !result?.success) {
				throw new Error(result?.message || "Failed to load activity logs");
			}

			setLogs(Array.isArray(result.data) ? result.data : []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load activity logs");
		} finally {
			setLoading(false);
			setWorkingAction(null);
		}
	}, []);

	const emitUnreadCount = useCallback((nextLogs: ActivityLogRow[]) => {
		const count = nextLogs.reduce((acc, row) => (row.read_at ? acc : acc + 1), 0);
		window.dispatchEvent(new CustomEvent("activity-log-unread-changed", { detail: { count } }));
	}, []);

	const markAllAsRead = useCallback(async () => {
		setWorkingAction("read");
		setError(null);

		try {
			const response = await fetch("/api/laravel/api/activity-logs/mark-all-read", {
				method: "POST",
			});
			const result = await response.json();

			if (!response.ok || !result?.success) {
				throw new Error(result?.message || "Failed to mark all as read");
			}

			const nextLogs = logs.map((row) => ({ ...row, read_at: row.read_at || new Date().toISOString() }));
			setLogs(nextLogs);
			emitUnreadCount(nextLogs);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to mark all as read");
		} finally {
			setWorkingAction(null);
		}
	}, [emitUnreadCount, logs]);

	const markSingleAsRead = useCallback(async (id: number) => {
		const target = logs.find((row) => row.id === id);
		if (!target || target.read_at) return;

		setWorkingAction("single-read");
		setError(null);

		try {
			const response = await fetch(`/api/laravel/api/activity-logs/${id}/mark-read`, {
				method: "PATCH",
			});
			const result = await response.json();

			if (!response.ok || !result?.success) {
				throw new Error(result?.message || "Failed to mark activity as read");
			}

			const nowIso = new Date().toISOString();
			const nextLogs = logs.map((row) => (row.id === id ? { ...row, read_at: row.read_at || nowIso } : row));
			setLogs(nextLogs);
			emitUnreadCount(nextLogs);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to mark activity as read");
		} finally {
			setWorkingAction(null);
		}
	}, [emitUnreadCount, logs]);

	const onOpenCard = useCallback(async (id: number) => {
		setSelectedLogId(id);
		await markSingleAsRead(id);
	}, [markSingleAsRead]);

	const deleteAllLogs = useCallback(async () => {
		const ok = window.confirm("Delete all activity logs?");
		if (!ok) return;

		setWorkingAction("delete");
		setError(null);

		try {
			const response = await fetch("/api/laravel/api/activity-logs/delete-all", {
				method: "DELETE",
			});
			const result = await response.json();

			if (!response.ok || !result?.success) {
				throw new Error(result?.message || "Failed to delete all logs");
			}

			setLogs([]);
			emitUnreadCount([]);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete all logs");
		} finally {
			setWorkingAction(null);
		}
	}, [emitUnreadCount]);

	useEffect(() => {
		void fetchLogs();
	}, [fetchLogs]);

	useEffect(() => {
		emitUnreadCount(logs);
	}, [emitUnreadCount, logs]);

	const unreadCount = useMemo(
		() => logs.reduce((count, row) => (row.read_at ? count : count + 1), 0),
		[logs],
	);

	const moduleCounts = useMemo(() => {
		return MODULE_TYPES.reduce<Record<string, number>>((acc, type) => {
			acc[type] = logs.filter((row) => normalizeType(row.activity_type) === type).length;
			return acc;
		}, {});
	}, [logs]);

	const availableStatuses = useMemo(() => {
		const values = Array.from(new Set(logs.map((row) => row.status))).sort();
		return values;
	}, [logs]);

	const filteredLogs = useMemo(() => {
		let rows = [...logs];

		if (typeFilter !== "all") rows = rows.filter((row) => normalizeType(row.activity_type) === typeFilter);
		if (statusFilter !== "all") rows = rows.filter((row) => row.status === statusFilter);
		if (readFilter === "read") rows = rows.filter((row) => Boolean(row.read_at));
		if (readFilter === "unread") rows = rows.filter((row) => !row.read_at);

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			rows = rows.filter((row) =>
				`${row.title} ${row.description} ${row.action} ${row.activity_type} ${row.user_name || ""}`
					.toLowerCase()
					.includes(q),
			);
		}

		rows.sort((a, b) => {
			const at = new Date(a.created_at).getTime();
			const bt = new Date(b.created_at).getTime();
			return sortOrder === "recent" ? bt - at : at - bt;
		});

		return rows;
	}, [logs, readFilter, searchQuery, sortOrder, statusFilter, typeFilter]);

	const visibleLogs = useMemo(() => filteredLogs.slice(0, visibleCount), [filteredLogs, visibleCount]);
	const selectedLog = useMemo(() => logs.find((row) => row.id === selectedLogId) ?? null, [logs, selectedLogId]);

	const hasMore = visibleCount < filteredLogs.length;

	useEffect(() => {
		setVisibleCount(PAGE_STEP);
	}, [searchQuery, typeFilter, statusFilter, readFilter, sortOrder]);

	if (selectedLog) {
		const selectedStatusClass = statusClassMap[selectedLog.status] || statusClassMap.info;
		const DetailsIcon = MODULE_ICONS[normalizeType(selectedLog.activity_type)];

		return (
			<section className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
				<div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-xl relative overflow-hidden">
					<div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
					<div className="w-full px-4 md:px-8 py-10 relative z-10">
						<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
							<div>
								<button
									type="button"
									onClick={() => setSelectedLogId(null)}
									className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/20 transition-all hover:-translate-x-1 active:scale-95 uppercase tracking-widest"
								>
									<ChevronLeft className="h-4 w-4" />
									Back to Activity Logs
								</button>
								<div className="flex items-center gap-3 mb-2">
									<div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20">
										{DetailsIcon ? <DetailsIcon className="h-8 w-8 text-white" /> : <Bell className="h-8 w-8 text-white" />}
									</div>
									<div>
										<h1 className="text-3xl md:text-4xl font-black tracking-tight">Log Details</h1>
										<p className="text-white/70 text-sm font-bold uppercase tracking-widest mt-1">Event Reference #{selectedLog.id}</p>
									</div>
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-3">
								<span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white border border-white/20 backdrop-blur-md shadow-inner">
									<Bell className="h-4 w-4 text-amber-300 animate-pulse" />
									{unreadCount} UNREAD
								</span>
							</div>
						</div>
					</div>
					<div className="border-t border-white/10 bg-white/5 backdrop-blur-md h-12" />
				</div>

				<div className="mx-auto max-w-[1000px] px-4 -mt-6 relative z-20">
					<div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-2xl space-y-10">
						<div className="flex flex-wrap items-center gap-3">
							<span className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors ${selectedStatusClass} border-current/10`}>
								{selectedLog.status}
							</span>
							<span className="rounded-full bg-slate-100 border border-slate-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2">
								{DetailsIcon && <DetailsIcon className="h-3.5 w-3.5" />}
								{normalizeType(selectedLog.activity_type)}
							</span>
							<span className="rounded-full bg-slate-900 border border-slate-800 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
								{selectedLog.action}
							</span>
						</div>

						<div>
							<h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
								{selectedLog.title}
							</h2>
							<div className="mt-6 p-6 rounded-2xl bg-slate-50 border border-slate-100 italic text-slate-700 text-lg leading-relaxed">
								"{selectedLog.description}"
							</div>
						</div>

						<div className="grid gap-6 md:grid-cols-2">
							<div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-[#9d1238]/20 hover:shadow-md">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2 bg-slate-100 rounded-lg group-hover:bg-[#9d1238]/10 group-hover:text-[#9d1238] transition-colors">
										<Clock className="h-5 w-5" />
									</div>
									<p className="text-xs font-black uppercase tracking-widest text-slate-400">Time & Date</p>
								</div>
								<p className="text-lg font-bold text-slate-900">{formatDate(selectedLog.created_at)}</p>
								<p className="text-xs text-slate-500 mt-1">System Timestamp</p>
							</div>

							<div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-[#9d1238]/20 hover:shadow-md">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2 bg-slate-100 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
										<Eye className="h-5 w-5" />
									</div>
									<p className="text-xs font-black uppercase tracking-widest text-slate-400">Read Receipt</p>
								</div>
								<p className="text-lg font-bold text-slate-900">
									{selectedLog.read_at ? `Viewed at ${formatDate(selectedLog.read_at)}` : "Unread by Admin"}
								</p>
								<p className="text-xs text-slate-500 mt-1">Status Tracking</p>
							</div>

							<div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-[#9d1238]/20 hover:shadow-md">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2 bg-slate-100 rounded-lg group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
										<UserCircle className="h-5 w-5" />
									</div>
									<p className="text-xs font-black uppercase tracking-widest text-slate-400">Initiated By</p>
								</div>
								<p className="text-lg font-bold text-slate-900">{selectedLog.user_name || "System Automated"}</p>
								<p className="text-xs font-medium text-slate-500 mt-1 truncate">{selectedLog.user_email || "no-reply@system.log"}</p>
							</div>

							<div className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-[#9d1238]/20 hover:shadow-md">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
										<LayoutGrid className="h-5 w-5" />
									</div>
									<p className="text-xs font-black uppercase tracking-widest text-slate-400">System Module</p>
								</div>
								<p className="text-lg font-bold text-slate-900 uppercase">{normalizeType(selectedLog.activity_type)}</p>
								<p className="text-xs text-slate-500 mt-1">Contextual Namespace</p>
							</div>
						</div>
						
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="min-h-screen bg-slate-50 text-slate-900 font-sans">
			<div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
				<div className="w-full px-4 md:px-8 py-6">
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h1 className="text-2xl md:text-3xl font-bold mb-2">Activity Logs</h1>
							<p className="text-white/80 text-sm md:text-base">Track every insert, update, delete, terminate, and all system actions.</p>
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white border border-white/20 backdrop-blur-md shadow-inner">
								<Bell className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
								{unreadCount} UNREAD
							</span>
							<button
								type="button"
								onClick={fetchLogs}
								disabled={workingAction === "refresh"}
								className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/20 hover:border-white/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg"
							>
								<RefreshCw className={`h-4 w-4 ${workingAction === "refresh" ? "animate-spin" : ""}`} />
								REFRESH
							</button>
							<button
								type="button"
								onClick={markAllAsRead}
								disabled={workingAction === "read"}
								className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/90 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 hover:shadow-emerald-500/20 shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<CheckCheck className="h-4 w-4" />
								MARK ALL READ
							</button>
							<button
								type="button"
								onClick={deleteAllLogs}
								disabled={workingAction === "delete"}
								className="inline-flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-600 hover:shadow-red-500/20 shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<Trash2 className="h-4 w-4" />
								DELETE ALL
							</button>
						</div>
					</div>
				</div>

				<div className="border-t border-white/10 bg-white/5 backdrop-blur-sm border-b border-white/5">
					<div className="w-full px-4 md:px-8 py-4">
						<div className="flex flex-col gap-5">
							{/* Top Row: Module Filters */}
							<div className="flex flex-wrap items-center gap-2">
								<div className="text-xs font-bold uppercase tracking-wider text-white/50 mr-2 flex items-center gap-1.5">
									<LayoutGrid className="h-3.5 w-3.5" />
									Modules
								</div>
								<div className="flex flex-wrap items-center bg-black/20 p-1 rounded-xl border border-white/10 gap-1">
									<button
										type="button"
										onClick={() => setTypeFilter("all")}
										className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${typeFilter === "all" ? "bg-white text-[#9d1238] shadow-lg scale-105" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
									>
										<span>All</span>
										<span className={`px-1.5 py-0.5 rounded-md text-[10px] ${typeFilter === "all" ? "bg-[#9d1238]/10 text-[#9d1238]" : "bg-white/10 text-white/50"}`}>
											{logs.length}
										</span>
									</button>
									{MODULE_TYPES.map((module) => {
										const Icon = MODULE_ICONS[module];
										return (
											<button
												key={module}
												type="button"
												onClick={() => setTypeFilter(module)}
												className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all duration-200 ${typeFilter === module ? "bg-white text-[#9d1238] shadow-lg scale-105" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
											>
												{Icon && <Icon className="h-3.5 w-3.5" />}
												<span>{module}</span>
												<span className={`px-1.5 py-0.5 rounded-md text-[10px] ${typeFilter === module ? "bg-[#9d1238]/10 text-[#9d1238]" : "bg-white/10 text-white/50"}`}>
													{moduleCounts[module] ?? 0}
												</span>
											</button>
										);
									})}
								</div>
							</div>

							{/* Bottom Row: Controls */}
							<div className="flex flex-wrap items-center gap-4">
								<div className="flex flex-wrap items-center gap-3">
									<div className="flex items-center bg-black/20 p-1 rounded-xl border border-white/10 gap-1">
										<button
											type="button"
											onClick={() => setReadFilter("all")}
											className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${readFilter === "all" ? "bg-white text-[#9d1238]" : "text-white/70 hover:bg-white/10"}`}
										>
											ALL
										</button>
										<button
											type="button"
											onClick={() => setReadFilter("unread")}
											className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${readFilter === "unread" ? "bg-white text-[#9d1238]" : "text-white/70 hover:bg-white/10"}`}
										>
											UNREAD
											<span className={`px-1.5 py-0.5 rounded-md text-[10px] ${readFilter === "unread" ? "bg-[#9d1238]/10 text-[#9d1238]" : "bg-white/10 text-white/50"}`}>
												{unreadCount}
											</span>
										</button>
										<button
											type="button"
											onClick={() => setReadFilter("read")}
											className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${readFilter === "read" ? "bg-white text-[#9d1238]" : "text-white/70 hover:bg-white/10"}`}
										>
											VIEWED
										</button>
									</div>

									<div className="relative group">
										<Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors" />
										<input
											type="text"
											value={searchQuery}
											onChange={(event) => setSearchQuery(event.target.value)}
											placeholder="Search activities..."
											className="h-10 w-64 rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20 transition-all focus:w-80"
										/>
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-2 ml-auto">
									<div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/10">
										<Filter className="h-3.5 w-3.5 text-white/40 ml-2" />
										<select
											value={statusFilter}
											onChange={(event) => setStatusFilter(event.target.value)}
											className="h-8 bg-transparent text-sm font-bold text-white outline-none cursor-pointer pr-2"
										>
											<option value="all" className="text-slate-900">All Status</option>
											{availableStatuses.map((status) => (
												<option key={status} value={status} className="text-slate-900">{status.toUpperCase()}</option>
											))}
										</select>
									</div>

									<button
										type="button"
										onClick={() => setSortOrder((current) => (current === "recent" ? "oldest" : "recent"))}
										className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 text-xs font-bold text-white transition-all hover:bg-white/10 active:scale-95"
									>
										<ArrowUpDown className="h-3.5 w-3.5 text-white/50" />
										{sortOrder === "recent" ? "RECENT FIRST" : "OLDEST FIRST"}
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-[1200px] px-4 pb-8 md:px-8 md:pb-12">

				{error ? (
					<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
				) : null}

				{loading ? (
					<div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Loading activity logs...</div>
				) : filteredLogs.length === 0 ? (
					<div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">No activity logs found.</div>
				) : (
					<div className="space-y-3">
						{visibleLogs.map((log) => {
							const statusClass = statusClassMap[log.status] || statusClassMap.info;
							return (
								<article
									key={log.id}
									onClick={() => void onOpenCard(log.id)}
									className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#9d1238]/30 hover:shadow-xl hover:shadow-[#9d1238]/5 active:scale-[0.99] relative overflow-hidden"
								>
									{!log.read_at && (
										<div className="absolute left-0 top-0 h-full w-1 bg-[#9d1238]" />
									)}
									<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
										<div className="flex-1">
											<div className="flex flex-wrap items-center gap-2 mb-1.5">
												<h2 className={`text-lg font-bold transition-colors ${!log.read_at ? "text-[#9d1238]" : "text-slate-800 group-hover:text-[#9d1238]"}`}>
													{log.title}
												</h2>
												{!log.read_at && (
													<span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600 tracking-tighter uppercase">
														NEW
													</span>
												)}
											</div>
											<p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3">
												{log.description}
											</p>
											<div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
												<div className="flex items-center gap-1.5">
													<UserCircle className="h-3.5 w-3.5" />
													{log.user_name || "System"}
												</div>
												<div className="flex items-center gap-1.5">
													<Clock className="h-3.5 w-3.5" />
													{formatDate(log.created_at)}
												</div>
											</div>
										</div>
										<div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">
											<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border transition-colors ${log.read_at ? "bg-slate-50 text-slate-500 border-slate-100" : "bg-blue-50 text-blue-600 border-blue-100"}`}>
												<Eye className="h-3.5 w-3.5" />
												{log.read_at ? "Viewed" : "Unread"}
											</span>
											<span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border ${statusClass} border-current/10`}>
												{log.status}
											</span>
											<span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-1">
												{(() => {
													const LogIcon = MODULE_ICONS[normalizeType(log.activity_type)];
													return LogIcon ? <LogIcon className="h-3 w-3" /> : null;
												})()}
												{normalizeType(log.activity_type)}
											</span>
											<span className="rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
												{log.action}
											</span>
										</div>
									</div>
								</article>
							);
						})}

						{hasMore ? (
							<div className="pt-4 flex justify-center">
								<button
									type="button"
									onClick={() => setVisibleCount((current) => current + PAGE_STEP)}
									className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-black text-[#9d1238] hover:border-[#9d1238] hover:bg-[#9d1238] hover:text-white transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#9d1238]/20 active:scale-95"
								>
									<RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
									LOAD MORE ACTIVITIES
								</button>
							</div>
						) : (
							<div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-center text-sm font-bold text-slate-400">
								YOU HAVE REACHED THE END OF THE ACTIVITY SYSTEM LOGS
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
