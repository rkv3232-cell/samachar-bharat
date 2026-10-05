// src/components/dpivs/status-components/StatusChangeModal.tsx
"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { ReporterProfile, ReporterStatus } from "@/types/dpivs";
import { UserRole } from "@/types/auth.types";
import { validateStatusTransition } from "@/lib/dpivs";

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporter: ReporterProfile | null;
  currentUserRole: UserRole | string | null;
  onConfirm: (targetStatus: ReporterStatus, reason: string) => Promise<void>;
}

export default function StatusChangeModal({
  isOpen,
  onClose,
  reporter,
  currentUserRole,
  onConfirm,
}: StatusChangeModalProps) {
  const [targetStatus, setTargetStatus] = useState<ReporterStatus>(
    ReporterStatus.ACTIVE
  );
  const [reason, setReason] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !reporter) return null;

  const statusOptions: { status: ReporterStatus; label: string; desc: string }[] = [
    {
      status: ReporterStatus.ACTIVE,
      label: "Active Credential",
      desc: "Approve profile & authorize press card verification",
    },
    {
      status: ReporterStatus.SUSPENDED,
      label: "Suspended",
      desc: "Temporarily freeze verification lookup (requires reason)",
    },
    {
      status: ReporterStatus.EXPIRED,
      label: "Mark Expired",
      desc: "Set credential state to expired pending renewal",
    },
    {
      status: ReporterStatus.RENEWED_ACTIVE,
      label: "Renew Credential",
      desc: "Extend validity period and reactivate card",
    },
    {
      status: ReporterStatus.REVOKED,
      label: "REVOKE IDENTITY (Owner Only)",
      desc: "Permanently cancel press identity credential (irreversible)",
    },
  ];

  const handleStatusChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const guard = validateStatusTransition(
      reporter.status,
      targetStatus,
      currentUserRole,
      reason
    );

    if (!guard.allowed) {
      setError(guard.reason || "Status transition not allowed.");
      return;
    }

    if (targetStatus === ReporterStatus.REVOKED && confirmationInput !== "REVOKED") {
      setError("You must type 'REVOKED' to confirm permanent identity revocation.");
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(targetStatus, reason);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update reporter status.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-900">
              Change Credential Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStatusChangeSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs flex justify-between items-center border border-blue-200">
            <div>
              <span className="font-semibold">{reporter.fullName}</span> ({reporter.pressIdNumber})
            </div>
            <div className="font-mono text-xs uppercase font-bold text-blue-700">
              Current: {reporter.status}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Select Target Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <label
                  key={opt.status}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
 targetStatus === opt.status
 ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
 : "border-gray-200 hover:bg-gray-50"
 }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={opt.status}
                    checked={targetStatus === opt.status}
                    onChange={() => setTargetStatus(opt.status)}
                    className="mt-0.5 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {(targetStatus === ReporterStatus.SUSPENDED ||
            targetStatus === ReporterStatus.REVOKED ||
            targetStatus === ReporterStatus.EXPIRED) && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Status Change *
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify administrative justification for audit trail..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {targetStatus === ReporterStatus.REVOKED && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <p className="text-xs text-rose-700 font-semibold">
                ⚠️ CRITICAL CONFIRMATION: Type "REVOKED" below to confirm.
              </p>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type REVOKED"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 bg-white text-gray-900 font-mono uppercase focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
            >
              {submitting ? "Updating..." : "Confirm Status Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
