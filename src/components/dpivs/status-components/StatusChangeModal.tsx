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
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Change Credential Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleStatusChangeSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 text-xs flex justify-between items-center border border-blue-200 dark:border-blue-800">
            <div>
              <span className="font-semibold">{reporter.fullName}</span> ({reporter.pressIdNumber})
            </div>
            <div className="font-mono text-xs uppercase font-bold text-blue-700 dark:text-blue-300">
              Current: {reporter.status}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Target Status
            </label>
            <div className="space-y-2">
              {statusOptions.map((opt) => (
                <label
                  key={opt.status}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    targetStatus === opt.status
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
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
                    <div className="text-xs font-bold text-gray-900 dark:text-white">
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
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
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Reason for Status Change *
              </label>
              <textarea
                required
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Specify administrative justification for audit trail..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {targetStatus === ReporterStatus.REVOKED && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
              <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                ⚠️ CRITICAL CONFIRMATION: Type "REVOKED" below to confirm.
              </p>
              <input
                type="text"
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                placeholder="Type REVOKED"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono uppercase focus:ring-2 focus:ring-rose-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
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
