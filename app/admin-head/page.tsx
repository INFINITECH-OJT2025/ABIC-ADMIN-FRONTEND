"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trash2, CheckCheck, Bell, Search, ArrowUpDown, ListFilter, Eye, ChevronLeft } from "lucide-react";

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
		return (
			<section className="min-h-screen bg-slate-50 text-slate-900 font-sans">
				<div className="bg-gradient-to-r from-[#A4163A] to-[#7B0F2B] text-white shadow-md mb-6">
					<div className="w-full px-4 md:px-8 py-6">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div>
								<button
									type="button"
									onClick={() => setSelectedLogId(null)}
									className="mb-3 inline-flex items-center gap-1 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
								>
									<ChevronLeft className="h-4 w-4" />
									Back to activity logs
								</button>
								<h1 className="text-2xl md:text-3xl font-bold mb-2">Activity Log Details</h1>
								<p className="text-white/80 text-sm md:text-base">Full information for the selected activity event.</p>
							</div>
							<span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white border border-white/20">
								<Bell className="h-3.5 w-3.5" />
								{unreadCount} unread
							</span>
						</div>
					</div>
					<div className="border-t border-white/10 bg-white/5 backdrop-blur-sm h-10" />
				</div>

				<div className="mx-auto max-w-[1200px] px-4 pb-8 md:px-8 md:pb-12">
					<div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
						<div className="flex flex-wrap items-center gap-2">
							<span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${selectedStatusClass}`}>{selectedLog.status}</span>
							<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">{normalizeType(selectedLog.activity_type)}</span>
							<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">{selectedLog.action}</span>
							<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">#{selectedLog.id}</span>
						</div>
						<h2 className="mt-4 text-2xl font-bold text-slate-900">{selectedLog.title}</h2>
						<p className="mt-3 text-slate-700 leading-relaxed">{selectedLog.description}</p>
						<div className="mt-6 grid gap-4 md:grid-cols-2">
							<div className="rounded-lg border border-slate-200 p-4">
								<p className="text-xs uppercase tracking-wide text-slate-500">Created At</p>
								<p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(selectedLog.created_at)}</p>
							</div>
							<div className="rounded-lg border border-slate-200 p-4">
								<p className="text-xs uppercase tracking-wide text-slate-500">Read Status</p>
								<p className="mt-1 text-sm font-semibold text-slate-900">{selectedLog.read_at ? `Viewed at ${formatDate(selectedLog.read_at)}` : "Unread"}</p>
							</div>
							<div className="rounded-lg border border-slate-200 p-4">
								<p className="text-xs uppercase tracking-wide text-slate-500">Performed By</p>
								<p className="mt-1 text-sm font-semibold text-slate-900">{selectedLog.user_name || "System"}</p>
								<p className="text-xs text-slate-500">{selectedLog.user_email || "N/A"}</p>
							</div>
							<div className="rounded-lg border border-slate-200 p-4">
								<p className="text-xs uppercase tracking-wide text-slate-500">Module</p>
								<p className="mt-1 text-sm font-semibold text-slate-900">{normalizeType(selectedLog.activity_type)}</p>
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
						<div className="flex flex-wrap items-center gap-2">
							<span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white border border-white/20">
								<Bell className="h-3.5 w-3.5" />
								{unreadCount} unread
							</span>
							<button
								type="button"
								onClick={fetchLogs}
								disabled={workingAction === "refresh"}
								className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<RefreshCw className="h-4 w-4" />
								Refresh
							</button>
							<button
								type="button"
								onClick={markAllAsRead}
								disabled={workingAction === "read"}
								className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<CheckCheck className="h-4 w-4" />
								Mark all as read
							</button>
							<button
								type="button"
								onClick={deleteAllLogs}
								disabled={workingAction === "delete"}
								className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<Trash2 className="h-4 w-4" />
								Delete all
							</button>
						</div>
					</div>
				</div>

				<div className="border-t border-white/10 bg-white/5 backdrop-blur-sm">
					<div className="w-full px-4 md:px-8 py-3">
						<div className="flex flex-wrap items-center gap-3">
							<div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 gap-1 flex-wrap">
								<button
									type="button"
									onClick={() => setTypeFilter("all")}
									className={`px-4 py-2 rounded-md text-sm font-semibold transition ${typeFilter === "all" ? "bg-[#9d1238] text-white" : "text-slate-700 hover:bg-slate-100"}`}
								>
									All ({logs.length})
								</button>
								{MODULE_TYPES.map((module) => (
									<button
										key={module}
										type="button"
										onClick={() => setTypeFilter(module)}
										className={`px-4 py-2 rounded-md text-sm font-semibold uppercase transition ${typeFilter === module ? "bg-[#9d1238] text-white" : "text-slate-700 hover:bg-slate-100"}`}
									>
										{module} ({moduleCounts[module] ?? 0})
									</button>
								))}
						</div>

						<div className="flex flex-wrap items-center gap-2 ml-auto">
							<div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 gap-1">
									<button
										type="button"
										onClick={() => setReadFilter("all")}
										className={`px-3 py-2 rounded-md text-sm font-semibold transition ${readFilter === "all" ? "bg-[#9d1238] text-white" : "text-slate-700 hover:bg-slate-100"}`}
									>
										All
									</button>
									<button
										type="button"
										onClick={() => setReadFilter("unread")}
										className={`px-3 py-2 rounded-md text-sm font-semibold transition ${readFilter === "unread" ? "bg-[#9d1238] text-white" : "text-slate-700 hover:bg-slate-100"}`}
									>
										Unread ({unreadCount})
									</button>
									<button
										type="button"
										onClick={() => setReadFilter("read")}
										className={`px-3 py-2 rounded-md text-sm font-semibold transition ${readFilter === "read" ? "bg-[#9d1238] text-white" : "text-slate-700 hover:bg-slate-100"}`}
									>
										Viewed ({logs.length - unreadCount})
									</button>
							</div>

							<div className="relative">
									<Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
									<input
										type="text"
										value={searchQuery}
										onChange={(event) => setSearchQuery(event.target.value)}
										placeholder="Search activity..."
										className="h-10 w-64 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#9d1238]/20"
									/>
							</div>

							<select
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none"
								>
									<option value="all">All Status</option>
									{availableStatuses.map((status) => (
										<option key={status} value={status}>{status}</option>
									))}
								</select>

							<button
									type="button"
									onClick={() => setSortOrder((current) => (current === "recent" ? "oldest" : "recent"))}
									className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
								>
									<ArrowUpDown className="h-4 w-4" />
									{sortOrder === "recent" ? "Recent first" : "Oldest first"}
								</button>
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
									className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
								>
									<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
										<div>
											<div className="flex flex-wrap items-center gap-2">
												<h2 className="text-base font-semibold text-slate-900">{log.title}</h2>
												{!log.read_at ? (
													<span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" title="Unread" />
												) : null}
											</div>
											<p className="mt-1 text-sm text-slate-700 line-clamp-1">{log.description}</p>
											<p className="mt-2 text-xs text-slate-500">
												By {log.user_name || "System"} ({log.user_email || "N/A"})
											</p>
										</div>
										<div className="flex flex-wrap items-center gap-2 md:justify-end">
											<span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
												<Eye className="h-3.5 w-3.5" />
												{log.read_at ? "Viewed" : "Open"}
											</span>
											<span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${statusClass}`}>
												{log.status}
											</span>
											<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
												{normalizeType(log.activity_type)}
											</span>
											<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
												{log.action}
											</span>
										</div>
									</div>
									<div className="mt-3 text-xs text-slate-500">{formatDate(log.created_at)}</div>
								</article>
							);
						})}

						{hasMore ? (
							<div className="pt-2">
								<button
									type="button"
									onClick={() => setVisibleCount((current) => current + PAGE_STEP)}
									className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
								>
									Show more 15+15
								</button>
							</div>
						) : (
							<div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-center text-sm text-slate-500">
								You have reached the end of the activity logs.
							</div>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
