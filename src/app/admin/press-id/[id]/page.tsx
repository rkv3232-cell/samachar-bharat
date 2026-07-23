// ============================================================
// app/admin/press-id/[id]/page.tsx
// Reporter detail + Digital Press ID generation.
// Features: QR, print, PDF export, renewal, status controls.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import {
    ArrowLeft,
    Printer,
    FileDown,
    RefreshCw,
    Pencil,
    Ban,
    CheckCircle2,
    Trash2,
    Copy,
    ExternalLink,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/lib/auth-context";
import LoadingSpinner from "@/components/admin/ui/LoadingSpinner";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";
import Modal from "@/components/admin/ui/Modal";
import ReporterFormModal from "@/components/dpivs/ReporterFormModal";
import ReporterStatusBadge from "@/components/dpivs/ReporterStatusBadge";
import PressIdCard from "@/components/dpivs/PressIdCard";
import {
    fetchReporter,
    updateReporter,
    deleteReporter,
    setReporterStatus,
    renewReporter,
    logIdIssued,
    daysUntil,
} from "@/lib/firestore/reporters";
import type { Reporter, ReporterInput } from "@/types/dpivs";

function formatDate(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReporterDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const { addToast } = useToast();
    const { firestoreUser } = useAuth();
    const actor = firestoreUser?.email || firestoreUser?.name || "Admin";

    const [reporter, setReporter] = useState<Reporter | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [verifyUrl, setVerifyUrl] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [renewOpen, setRenewOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchReporter(id);
            setReporter(data);
        } catch {
            addToast("Failed to load reporter", "error");
        } finally {
            setLoading(false);
        }
    }, [id, addToast]);

    useEffect(() => {
        load();
    }, [load]);

    // Generate QR whenever reporter loads
    useEffect(() => {
        if (!reporter) return;
        const url = `${window.location.origin}/verify/${reporter.reporterId}`;
        setVerifyUrl(url);
        QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#111827", light: "#ffffff" } })
            .then(setQrDataUrl)
            .catch(() => addToast("Could not generate QR code", "error"));
    }, [reporter, addToast]);

    const handlePrint = async () => {
        if (reporter) await logIdIssued(reporter.id, reporter.fullName, reporter.reporterId, actor);
        window.print();
    };

    const handleExportPdf = async () => {
        if (!printRef.current || !reporter) return;
        try {
            setBusy(true);
            const dataUrl = await toPng(printRef.current, {
                cacheBust: true,
                pixelRatio: 3,
                backgroundColor: "#ffffff",
            });
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = dataUrl;
            await new Promise((res) => (img.onload = res));

            const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: "a4" });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            const margin = 24;
            const maxW = pageW - margin * 2;
            const ratio = img.height / img.width;
            const w = maxW;
            const h = Math.min(w * ratio, pageH - margin * 2);
            pdf.addImage(dataUrl, "PNG", (pageW - w) / 2, margin, w, h);
            pdf.save(`PressID-${reporter.reporterId}.pdf`);

            await logIdIssued(reporter.id, reporter.fullName, reporter.reporterId, actor);
            addToast("PDF exported", "success");
        } catch (err) {
            console.error(err);
            addToast("PDF export failed", "error");
        } finally {
            setBusy(false);
        }
    };

    const handleSaveEdit = async (data: ReporterInput) => {
        if (!reporter) return;
        await updateReporter(reporter.id, data, data.fullName, reporter.reporterId, actor);
        addToast("Reporter updated", "success");
        await load();
    };

    const handleDelete = async () => {
        if (!reporter) return;
        try {
            setBusy(true);
            await deleteReporter(reporter.id, reporter.fullName, reporter.reporterId, actor);
            addToast("Reporter deleted", "success");
            router.push("/admin/press-id");
        } catch {
            addToast("Failed to delete", "error");
            setBusy(false);
        }
    };

    const toggleSuspend = async () => {
        if (!reporter) return;
        const next = reporter.status === "suspended" ? "active" : "suspended";
        try {
            await setReporterStatus(reporter.id, next, reporter.fullName, reporter.reporterId, actor);
            addToast(next === "suspended" ? "Suspended" : "Reactivated", "success");
            await load();
        } catch {
            addToast("Action failed", "error");
        }
    };

    const copyVerify = () => {
        navigator.clipboard.writeText(verifyUrl);
        addToast("Verification link copied", "success");
    };

    if (loading) return <LoadingSpinner message="Loading reporter..." />;

    if (!reporter) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 mb-4">Reporter not found.</p>
                <button
                    onClick={() => router.push("/admin/press-id")}
                    className="text-red-600 font-semibold text-sm"
                >
                    Back to Press ID
                </button>
            </div>
        );
    }

    const days = daysUntil(reporter.validTill);

    const detailRows: [string, string][] = [
        ["Reporter ID", reporter.reporterId],
        ["Designation", reporter.designation],
        ["Mobile", reporter.mobile],
        ["Email", reporter.email],
        ["Aadhaar", reporter.aadhaar || "—"],
        ["Bureau", reporter.bureau || "—"],
        ["District", reporter.district || "—"],
        ["State", reporter.state || "—"],
        ["Blood Group", reporter.bloodGroup || "—"],
        ["Joining Date", formatDate(reporter.joiningDate)],
        ["Valid From", formatDate(reporter.validFrom)],
        ["Valid Till", formatDate(reporter.validTill)],
    ];

    return (
        <div>
            {/* Header (hidden on print) */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <button
                    onClick={() => router.push("/admin/press-id")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft size={18} />
                    Back to Reporters
                </button>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setFormOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                    >
                        <Pencil size={15} /> Edit
                    </button>
                    <button
                        onClick={() => setRenewOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all"
                    >
                        <RefreshCw size={15} /> Renew
                    </button>
                    <button
                        onClick={toggleSuspend}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-orange-700 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all"
                    >
                        {reporter.status === "suspended" ? (
                            <>
                                <CheckCircle2 size={15} /> Reactivate
                            </>
                        ) : (
                            <>
                                <Ban size={15} /> Suspend
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => setDeleteOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
                    >
                        <Trash2 size={15} /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Profile */}
                <div className="xl:col-span-2 print:hidden">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 h-20" />
                        <div className="px-6 pb-6 -mt-10">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white bg-gray-100 shadow-md flex items-center justify-center">
                                {reporter.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={reporter.photoUrl || "/placeholder.svg"}
                                        alt={reporter.fullName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">No Photo</span>
                                )}
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <h1 className="text-xl font-extrabold text-gray-900">{reporter.fullName}</h1>
                                <ReporterStatusBadge status={reporter.status} />
                            </div>
                            <p className="text-sm text-red-600 font-semibold">{reporter.designation}</p>

                            {reporter.status === "active" && days >= 0 && days <= 30 && (
                                <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 text-amber-700 px-3 py-2 text-xs font-semibold">
                                    <RefreshCw size={14} />
                                    Expiring in {days} day{days === 1 ? "" : "s"} — consider renewal.
                                </div>
                            )}

                            <dl className="mt-4 divide-y divide-gray-100">
                                {detailRows.map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-4 py-2 text-sm">
                                        <dt className="text-gray-400">{label}</dt>
                                        <dd className="font-medium text-gray-800 text-right truncate">{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            {/* Verify link */}
                            <div className="mt-4 rounded-xl border border-gray-200 p-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Public Verification
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        readOnly
                                        value={verifyUrl}
                                        className="flex-1 min-w-0 text-xs bg-gray-50 rounded-lg px-2.5 py-2 text-gray-600 font-mono"
                                    />
                                    <button
                                        onClick={copyVerify}
                                        title="Copy link"
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                                    >
                                        <Copy size={15} />
                                    </button>
                                    <a
                                        href={verifyUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Open"
                                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                                    >
                                        <ExternalLink size={15} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ID Card + actions */}
                <div className="xl:col-span-3">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:border-0 print:shadow-none print:p-0">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
                            <h2 className="text-lg font-bold text-gray-800">Digital Press ID</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all shadow-sm"
                                >
                                    <Printer size={16} /> Print
                                </button>
                                <button
                                    onClick={handleExportPdf}
                                    disabled={busy}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    <FileDown size={16} /> {busy ? "Exporting..." : "Export PDF"}
                                </button>
                            </div>
                        </div>

                        {/* Print area */}
                        <div ref={printRef} className="dpivs-print-area">
                            <PressIdCard reporter={reporter} qrDataUrl={qrDataUrl} verifyUrl={verifyUrl} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ReporterFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                onSave={handleSaveEdit}
                reporter={reporter}
            />

            <RenewModal
                isOpen={renewOpen}
                onClose={() => setRenewOpen(false)}
                reporter={reporter}
                onRenew={async (from, till) => {
                    await renewReporter(reporter.id, from, till, reporter.fullName, reporter.reporterId, actor);
                    addToast("Press ID renewed", "success");
                    setRenewOpen(false);
                    await load();
                }}
            />

            <ConfirmDialog
                isOpen={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleDelete}
                title="Delete Reporter"
                message={`Delete "${reporter.fullName}" (${reporter.reporterId})? This permanently removes their record and Press ID.`}
                confirmText="Delete Reporter"
                loading={busy}
            />
        </div>
    );
}

// ─── Renewal Modal ─────────────────────────────
function RenewModal({
    isOpen,
    onClose,
    reporter,
    onRenew,
}: {
    isOpen: boolean;
    onClose: () => void;
    reporter: Reporter;
    onRenew: (from: string, till: string) => Promise<void>;
}) {
    const [from, setFrom] = useState("");
    const [till, setTill] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const start = new Date();
            const end = new Date();
            end.setFullYear(end.getFullYear() + 1);
            setFrom(start.toISOString().split("T")[0]);
            setTill(end.toISOString().split("T")[0]);
        }
    }, [isOpen]);

    const submit = async () => {
        try {
            setSaving(true);
            await onRenew(from, till);
        } finally {
            setSaving(false);
        }
    };

    const inputCls =
        "w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Renew Press ID">
            <p className="text-sm text-gray-500 mb-4">
                Extend validity for <span className="font-semibold text-gray-800">{reporter.fullName}</span>.
                Renewing sets the status back to Active.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Valid From
                    </label>
                    <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Valid Till
                    </label>
                    <input type="date" className={inputCls} value={till} onChange={(e) => setTill(e.target.value)} />
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <button
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={submit}
                    disabled={saving}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
                >
                    {saving ? "Renewing..." : "Renew ID"}
                </button>
            </div>
        </Modal>
    );
}
