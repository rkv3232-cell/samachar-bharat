// src/app/verify-press-id/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertOctagon,
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { PublicVerificationResult, ReporterStatus } from "@/types/dpivs";

export default function PublicVerificationPage() {
  const params = useParams();
  const idParam = (params?.id as string) || "";

  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idParam) return;

    const verify = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/dpivs/verify/${encodeURIComponent(idParam)}`);
        const data = (await res.json()) as PublicVerificationResult;
        setResult(data);
      } catch (err) {
        setResult({
          success: false,
          verified: false,
          status: "invalid",
          errorMessage: "Unable to contact verification server.",
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
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-semibold">Verifying Digital Press Credentials...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Samachar Bharat Registry</p>
      </div>
    );
  }

  const reporter = result?.reporter;
  const status = result?.status;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header Branding */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            <span className="font-bold tracking-tight text-white text-base">
              Samachar Bharat
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            OFFICIAL VERIFICATION
          </span>
        </div>

        {/* Status Banner */}
        {status === ReporterStatus.ACTIVE || status === ReporterStatus.RENEWED_ACTIVE ? (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30 shadow-lg animate-pulse">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-emerald-400 tracking-wide">
              VERIFIED OFFICIAL PRESS CARD
            </h2>
            <p className="text-xs text-emerald-200/80 mt-1">
              Active Journalist Credential Authenticated
            </p>
          </div>
        ) : status === "expired" || (status as string) === ReporterStatus.EXPIRED ? (
          <div className="bg-amber-500/15 border-b border-amber-500/30 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-amber-500/30">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-amber-400 tracking-wide">
              PRESS CARD EXPIRED
            </h2>
            <p className="text-xs text-amber-200/80 mt-1">
              This credential has passed its validity date.
            </p>
          </div>
        ) : status === ReporterStatus.SUSPENDED ? (
          <div className="bg-orange-500/15 border-b border-orange-500/30 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-3 border border-orange-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-orange-400 tracking-wide">
              CREDENTIAL SUSPENDED
            </h2>
            <p className="text-xs text-orange-200/80 mt-1">
              Verification temporarily frozen by publishing authority.
            </p>
          </div>
        ) : (
          <div className="bg-rose-500/15 border-b border-rose-500/30 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/30">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-rose-400 tracking-wide">
              INVALID / REVOKED CREDENTIAL
            </h2>
            <p className="text-xs text-rose-200/80 mt-1">
              Not registered or officially revoked by publisher.
            </p>
          </div>
        )}

        {/* Reporter Profile Details */}
        {reporter && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
                {reporter.photoURL ? (
                  <img
                    src={reporter.photoURL}
                    alt={reporter.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-slate-500">
                    {reporter.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                  {reporter.fullName}
                  {result?.verified && <BadgeCheck className="w-5 h-5 text-blue-400" />}
                </h3>
                <p className="text-sm font-medium text-blue-400">{reporter.designation}</p>
                <p className="text-xs text-slate-400 mt-0.5">{reporter.organization}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Press ID Number</span>
                <span className="font-mono text-xs font-bold text-blue-300">
                  {reporter.pressIdNumber}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Issue Date</span>
                <span className="text-xs font-medium text-slate-200">
                  {new Date(reporter.issueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Valid Until</span>
                <span className="text-xs font-medium text-slate-200">
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
        <div className="bg-slate-950 p-6 border-t border-slate-800 text-center space-y-4">
          <div className="text-[11px] text-slate-500">
            Verified Timestamp: {new Date(result?.verificationTimestamp || "").toLocaleString("en-IN")}
          </div>

          <a
            href="https://samacharbharat.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Visit Samachar Bharat Official Portal
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
