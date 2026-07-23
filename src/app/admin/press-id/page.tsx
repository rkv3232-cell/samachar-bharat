// ============================================================
// app/admin/press-id/page.tsx
// DPIVS — Digital Press Identity & Verification System
// Admin dashboard + reporter management (search / filter / CRUD)
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    IdCard,
    Users,
    ShieldCheck,
    Clock,
    AlertTriangle,
    Plus,
    Pencil,
    Trash2,
    Ban,
    CheckCircle2,
    History,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/lib/auth-context";
import SearchBar from "@/components/admin/ui/SearchBar";
import LoadingSpinner from "@/components/admin/ui/LoadingSpinner";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import ReporterFormModal from "@/components/dpivs/ReporterFormModal";
import ReporterStatusBadge from "@/components/dpivs/ReporterStatusBadge";
import {
    fetchReporters,
    createReporter,
    updateReporter,
    deleteReporter,
    setReporterStatus,
    fetchAuditLog,
    computeStats,
    daysUntil,
} from "@/lib/firestore/reporters";
import type { Reporter, ReporterInput, ReporterStatus, AuditEntry } from "@/types/dpivs";

type FilterKey = "all" | ReporterStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "suspended", label: "Suspended" },
    { key: "expired", label: "Expired" },
];

function formatDate(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function PressIdPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const { firestoreUser } = useAuth();
    const actor = firestoreUser?.email || firestoreUser?.name || "Admin";

    const [reporters, setReporters] = useState<Reporter[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterKey>("all");

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Reporter | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Reporter | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [audit, setAudit] = useState<AuditEntry[]>([]);
    const [showAudit, setShowAudit] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const [data, log] = await Promise.all([fetchReporters(), fetchAuditLog(40)]);
            setReporters(data);
            setAudit(log);
        } catch (err) {
            console.error(err);
            addToast("Failed to load reporters", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        load();
    }, [load]);

    const stats = useMemo(() => computeStats(reporters), [reporters]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return reporters.filter((r) => {
            const matchesFilter = filter === "all" || r.status === filter;
            const matchesSearch =
                !term ||
                r.fullName.toLowerCase().includes(term) ||
                r.reporterId.toLowerCase().includes(term) ||
                r.mobile.includes(term) ||
                (r.district || "").toLowerCase().includes(term) ||
                (r.state || "").toLowerCase().includes(term);
            return matchesFilter && matchesSearch;
        });
    }, [reporters, search, filter]);

    const recentlyIssued = useMemo(
        () =>
            [...reporters]
                .sort((a, b) => {
                    const ta = a.createdAt?.toMillis?.() ?? 0;
                    const tb = b.createdAt?.toMillis?.() ?? 0;
                    return tb - ta;
                })
                .slice(0, 5),
        [reporters]
    );

    // ─── Handlers ───────────────────────────────
    const handleSave = async (data: ReporterInput) => {
        if (editing) {
            await updateReporter(editing.id, data, data.fullName, editing.reporterId, actor);
            addToast("Reporter updated", "success");
        } else {
            await createReporter(data, actor);
            addToast("Reporter added", "success");
        }
        await load();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setActionLoading(true);
            await deleteReporter(
                deleteTarget.id,
                deleteTarget.fullName,
                deleteTarget.reporterId,
                actor
            );
            addToast("Reporter deleted", "success");
            await load();
        } catch {
            addToast("Failed to delete", "error");
        } finally {
            setActionLoading(false);
            setDeleteTarget(null);
        }
    };

    const toggleSuspend = async (r: Reporter) => {
        const next: ReporterStatus = r.status === "suspended" ? "active" : "suspended";
        try {
            await setReporterStatus(r.id, next, r.fullName, r.reporterId, actor);
            addToast(next === "suspended" ? "Reporter suspended" : "Reporter reactivated", "success");
            await load();
        } catch {
            addToast("Action failed", "error");
        }
    };

    // ─── Stat card config ───────────────────────
    const statCards = [
        { label: "Total Reporters", value: stats.total, icon: Users, color: "bg-blue-100 text-blue-600" },
        { label: "Active IDs", value: stats.active, icon: ShieldCheck, color: "bg-emerald-100 text-emerald-600" },
        { label: "Expiring Soon", value: stats.expiringSoon, icon: Clock, color: "bg-amber-100 text-amber-600" },
        { label: "Expired IDs", value: stats.expired, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
    ];

    return (
        <div>
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                        <IdCard className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800">Press ID / DPIVS</h1>
                        <p className="text-gray-500 text-sm">
                            Digital Press Identity &amp; Verification System
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Add Reporter
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((s) => (
                    <div
                        key={s.label}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                            <s.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">{s.label}</p>
                            <p className="text-2xl font-extrabold text-gray-900">
                                {loading ? "—" : s.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recently Issued */}
            {!loading && recentlyIssued.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                    <h2 className="text-sm font-bold text-gray-800 mb-3">Recently Issued IDs</h2>
                    <div className="flex flex-wrap gap-2">
                        {recentlyIssued.map((r) => (
                            <button
                                key={r.id}
                                onClick={() => router.push(`/admin/press-id/${r.id}`)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700 transition-colors"
                            >
                                <span className="font-mono text-gray-400">{r.reporterId}</span>
                                {r.fullName}
                                <ReporterStatusBadge status={r.status} size="sm" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div className="lg:w-80">
                        <SearchBar
                            value={search}
                            onChange={setSearch}
                            placeholder="Search name, ID, mobile, district..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f.key
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowAudit((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                        >
                            <History size={14} />
                            Audit Log
                        </button>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <LoadingSpinner message="Loading reporters..." />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <IdCard className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm font-medium">No reporters found</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Add a reporter to issue their Digital Press ID
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-5 py-3">Reporter</th>
                                    <th className="px-5 py-3 hidden md:table-cell">Reporter ID</th>
                                    <th className="px-5 py-3 hidden lg:table-cell">Designation</th>
                                    <th className="px-5 py-3 hidden lg:table-cell">Valid Till</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((r) => {
                                    const days = daysUntil(r.validTill);
                                    const expiringSoon = r.status === "active" && days >= 0 && days <= 30;
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="px-5 py-3">
                                                <button
                                                    onClick={() => router.push(`/admin/press-id/${r.id}`)}
                                                    className="flex items-center gap-3 text-left"
                                                >
                                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                                                        {r.photoUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={r.photoUrl || "/placeholder.svg"}
                                                                alt={r.fullName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Users className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">
                                                            {r.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {[r.district, r.state].filter(Boolean).join(", ") || r.mobile}
                                                        </p>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-5 py-3 hidden md:table-cell font-mono text-xs text-gray-600">
                                                {r.reporterId}
                                            </td>
                                            <td className="px-5 py-3 hidden lg:table-cell text-gray-600">
                                                {r.designation}
                                            </td>
                                            <td className="px-5 py-3 hidden lg:table-cell">
                                                <span className={expiringSoon ? "text-amber-600 font-semibold" : "text-gray-600"}>
                                                    {formatDate(r.validTill)}
                                                </span>
                                                {expiringSoon && (
                                                    <span className="block text-[11px] text-amber-500">
                                                        {days}d left
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <ReporterStatusBadge status={r.status} />
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => router.push(`/admin/press-id/${r.id}`)}
                                                        title="View / ID Card"
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                                                    >
                                                        <IdCard size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditing(r);
                                                            setFormOpen(true);
                                                        }}
                                                        title="Edit"
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleSuspend(r)}
                                                        title={r.status === "suspended" ? "Reactivate" : "Suspend"}
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                                                    >
                                                        {r.status === "suspended" ? (
                                                            <CheckCircle2 size={16} />
                                                        ) : (
                                                            <Ban size={16} />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTarget(r)}
                                                        title="Delete"
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Audit Log */}
            {showAudit && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-6">
                    <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <History size={16} className="text-gray-400" />
                        Audit Log
                    </h2>
                    {audit.length === 0 ? (
                        <p className="text-sm text-gray-400 py-6 text-center">No activity yet</p>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {audit.map((a) => (
                                <li key={a.id} className="py-2.5 flex items-start gap-3 text-sm">
                                    <span className="mt-0.5 inline-flex px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold capitalize shrink-0">
                                        {a.action.replace("_", " ")}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-gray-800">
                                            <span className="font-semibold">{a.reporterName}</span>{" "}
                                            <span className="font-mono text-xs text-gray-400">
                                                {a.reporterId}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-500">{a.details}</p>
                                    </div>
                                    <span className="text-[11px] text-gray-400 shrink-0">
                                        {a.actor}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Modals */}
            <ReporterFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSave={handleSave}
                reporter={editing}
            />

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Reporter"
                message={`Delete "${deleteTarget?.fullName}" (${deleteTarget?.reporterId})? This permanently removes their record and Press ID.`}
                confirmText="Delete Reporter"
                loading={actionLoading}
            />
        </div>
    );
}
