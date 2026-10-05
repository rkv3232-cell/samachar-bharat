// src/app/verify-press-id/[id]/page.tsx
/**
 * Public Verification Page for Press Cards (Light Mode)
 * Accessible via QR Code scan or direct URL: /verify-press-id/SB-REP-2026-XXXXXX
 */

"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { PublicVerificationResult, ReporterStatus } from "@/types/dpivs";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  AlertOctagon,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";

export default function PublicVerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const idParam = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PublicVerificationResult | null>(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`/api/dpivs/verify/${encodeURIComponent(idParam)}`);
        const json = await res.json();
        setResult(json);
      } catch {
        setResult({
          success: false,
          verified: false,
          status: "invalid",
          errorMessage: "Failed to connect to verification server.",
          verificationTimestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [idParam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-gray-800">
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-gray-800">Verifying Digital Press Credentials...</h2>
        <p className="text-xs text-gray-500 mt-1">Connecting to Samachar Bharat Registry</p>
      </div>
    );
  }

  const reporter = result?.reporter;
  const status = result?.status;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden my-6">
        {/* Header Branding */}
        <div className="bg-white px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <span className="font-extrabold tracking-tight text-gray-900 text-sm">
              Samachar Bharat
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            OFFICIAL VERIFICATION
          </span>
        </div>

        {/* Status Banner */}
        {status === ReporterStatus.ACTIVE || status === ReporterStatus.RENEWED_ACTIVE ? (
          <div className="bg-emerald-50 border-b border-emerald-200 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2.5 border border-emerald-300 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-emerald-800 tracking-wide">
              VERIFIED OFFICIAL PRESS CARD
            </h2>
            <p className="text-xs text-emerald-700 mt-0.5">
              Active Journalist Credential Authenticated
            </p>
          </div>
        ) : status === "expired" || (status as string) === ReporterStatus.EXPIRED ? (
          <div className="bg-amber-50 border-b border-amber-200 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2.5 border border-amber-300">
              <Clock className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-amber-800 tracking-wide">
              PRESS CARD EXPIRED
            </h2>
            <p className="text-xs text-amber-700 mt-0.5">
              This credential has passed its validity date.
            </p>
          </div>
        ) : status === ReporterStatus.SUSPENDED ? (
          <div className="bg-orange-50 border-b border-orange-200 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2.5 border border-orange-300">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-orange-800 tracking-wide">
              CREDENTIAL SUSPENDED
            </h2>
            <p className="text-xs text-orange-700 mt-0.5">
              Verification temporarily frozen by publishing authority.
            </p>
          </div>
        ) : (
          <div className="bg-rose-50 border-b border-rose-200 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5 border border-rose-300">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-rose-800 tracking-wide">
              INVALID / REVOKED CREDENTIAL
            </h2>
            <p className="text-xs text-rose-700 mt-0.5">
              Not registered or officially revoked by publisher.
            </p>
          </div>
        )}

        {/* Reporter Profile Details */}
        {reporter && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-300 shrink-0">
                {reporter.photoURL ? (
                  <img
                    src={reporter.photoURL}
                    alt={reporter.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xl text-gray-400">
                    {reporter.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5 truncate">
                  {reporter.fullName}
                  {result?.verified && <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                </h3>
                <p className="text-xs font-semibold text-red-600">{reporter.designation}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{reporter.organization}</p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold">Press ID Number</span>
                <span className="font-mono text-xs font-bold text-gray-900">
                  {reporter.pressIdNumber}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold">Issue Date</span>
                <span className="text-xs font-medium text-gray-800">
                  {new Date(reporter.issueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-xs text-gray-500 font-semibold">Valid Until</span>
                <span className="text-xs font-medium text-gray-800">
                  {new Date(reporter.validUntil).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Meta & Actions */}
        <div className="bg-gray-50 p-4 border-t border-gray-200 text-center space-y-2.5">
          <div className="text-[10px] text-gray-400">
            Verified Timestamp: {new Date(result?.verificationTimestamp || "").toLocaleString("en-IN")}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            Visit Samachar Bharat Official Portal
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
