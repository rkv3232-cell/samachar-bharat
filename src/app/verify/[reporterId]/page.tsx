// ============================================================
// app/verify/[reporterId]/page.tsx
// PUBLIC QR verification page for a Digital Press ID.
// Shows ONLY public information + validity status badge.
// Mobile-first, no auth required (route not guarded by middleware).
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ShieldCheck, ShieldAlert, ShieldX, Clock, MapPin, BadgeCheck } from "lucide-react";
import { fetchReporterByReporterId } from "@/lib/firestore/reporters";
import type { Reporter, ReporterStatus } from "@/types/dpivs";

const ORG_NAME = "SAMACHAR BHARAT";
const ORG_LOGO = "/dpivs/samachar-bharat-emblem.png";

function formatDate(iso?: string): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_UI: Record<
    ReporterStatus,
    { label: string; wrap: string; icon: typeof ShieldCheck; note: string }
> = {
    active: {
        label: "Verified & Active",
        wrap: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: ShieldCheck,
        note: "This press credential is valid and currently active.",
    },
    expired: {
        label: "Expired",
        wrap: "bg-red-50 text-red-700 border-red-200",
        icon: ShieldX,
        note: "This press credential has expired and is no longer valid.",
    },
    suspended: {
        label: "Suspended",
        wrap: "bg-orange-50 text-orange-700 border-orange-200",
        icon: ShieldAlert,
        note: "This press credential has been suspended by the issuing office.",
    },
    pending: {
        label: "Pending Activation",
        wrap: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
        note: "This credential is registered but not yet activated.",
    },
};

export default function VerifyPage() {
    const params = useParams();
    const reporterId = decodeURIComponent((params?.reporterId as string) || "");

    const [reporter, setReporter] = useState<Reporter | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const data = await fetchReporterByReporterId(reporterId);
                if (!active) return;
                if (!data) setNotFound(true);
                else setReporter(data);
            } catch {
                if (active) setNotFound(true);
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, [reporterId]);

    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
            {/* Brand header */}
            <div className="flex items-center gap-2.5 mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ORG_LOGO || "/placeholder.svg"} alt={ORG_NAME} className="w-10 h-10 object-contain" />
                <div className="leading-tight">
                    <p className="text-base font-extrabold tracking-wide text-gray-900">{ORG_NAME}</p>
                    <p className="text-[11px] text-gray-500">Press ID Verification</p>
                </div>
            </div>

            <div className="w-full max-w-md">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">Verifying credential...</p>
                    </div>
                ) : notFound || !reporter ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-3">
                            <ShieldX className="w-7 h-7 text-red-600" />
                        </div>
                        <h1 className="text-lg font-bold text-gray-900">Credential Not Found</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            No press ID matches{" "}
                            <span className="font-mono font-semibold text-gray-700">{reporterId}</span>.
                        </p>
                        <p className="text-xs text-gray-400 mt-3">
                            This may be an invalid, fake, or revoked credential.
                        </p>
                    </div>
                ) : (
                    <VerifiedCard reporter={reporter} />
                )}

                <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
                    This page displays only public credential information for verification purposes.
                    <br />© {new Date().getFullYear()} {ORG_NAME}. All rights reserved.
                </p>
            </div>
        </main>
    );
}

function VerifiedCard({ reporter }: { reporter: Reporter }) {
    const ui = STATUS_UI[reporter.status];
    const StatusIcon = ui.icon;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Status banner */}
            <div className={`flex items-center gap-2.5 border-b px-5 py-3 ${ui.wrap}`}>
                <StatusIcon className="w-5 h-5 shrink-0" />
                <div>
                    <p className="text-sm font-bold">{ui.label}</p>
                    <p className="text-[11px] opacity-80">{ui.note}</p>
                </div>
            </div>

            {/* Identity */}
            <div className="p-5">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-red-100 bg-gray-100 shrink-0 flex items-center justify-center">
                        {reporter.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={reporter.photoUrl || "/placeholder.svg"}
                                alt={reporter.fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-[10px] text-gray-400">No Photo</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-lg font-extrabold text-gray-900 truncate">{reporter.fullName}</h1>
                            {reporter.status === "active" && (
                                <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            )}
                        </div>
                        <p className="text-sm font-semibold text-red-600">{reporter.designation}</p>
                        <p className="font-mono text-xs text-gray-400 mt-1">{reporter.reporterId}</p>
                    </div>
                </div>

                {/* Public details only */}
                <dl className="mt-5 divide-y divide-gray-100">
                    {(reporter.bureau || reporter.district || reporter.state) && (
                        <div className="flex items-center justify-between py-2.5 text-sm">
                            <dt className="text-gray-400 flex items-center gap-1.5">
                                <MapPin size={14} /> Posting
                            </dt>
                            <dd className="font-medium text-gray-800 text-right">
                                {[reporter.bureau, reporter.district, reporter.state]
                                    .filter(Boolean)
                                    .join(", ")}
                            </dd>
                        </div>
                    )}
                    <div className="flex items-center justify-between py-2.5 text-sm">
                        <dt className="text-gray-400">Valid From</dt>
                        <dd className="font-medium text-gray-800">{formatDate(reporter.validFrom)}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5 text-sm">
                        <dt className="text-gray-400">Valid Till</dt>
                        <dd className="font-medium text-gray-800">{formatDate(reporter.validTill)}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
