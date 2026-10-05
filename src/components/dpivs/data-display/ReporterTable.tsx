// src/components/dpivs/data-display/ReporterTable.tsx
"use client";

import React, { useState } from "react";
import {
  BadgeCheck,
  Edit3,
  QrCode,
  ShieldAlert,
  Trash2,
  UserCheck,
} from "lucide-react";
import { ReporterProfile, ReporterStatus } from "@/types/dpivs";

interface ReporterTableProps {
  reporters: ReporterProfile[];
  loading: boolean;
  onViewCard: (reporter: ReporterProfile) => void;
  onEdit: (reporter: ReporterProfile) => void;
  onChangeStatus: (reporter: ReporterProfile) => void;
  onDelete: (reporter: ReporterProfile) => void;
}

export function StatusBadge({ status }: { status: ReporterStatus }) {
  const badgeMap: Record<
    ReporterStatus,
    { label: string; bg: string; text: string; dot: string }
  > = {
    [ReporterStatus.ACTIVE]: {
      label: "Active",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    [ReporterStatus.PENDING]: {
      label: "Pending",
      bg: "bg-amber-500/10 border-amber-500/30",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    [ReporterStatus.SUSPENDED]: {
      label: "Suspended",
      bg: "bg-orange-500/10 border-orange-500/30",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
    [ReporterStatus.EXPIRED]: {
      label: "Expired",
      bg: "bg-gray-500/10 border-gray-500/30",
      text: "text-gray-700",
      dot: "bg-gray-500",
    },
    [ReporterStatus.RENEWED_ACTIVE]: {
      label: "Renewed",
      bg: "bg-blue-500/10 border-blue-500/30",
      text: "text-blue-700",
      dot: "bg-blue-500",
    },
    [ReporterStatus.REVOKED]: {
      label: "Revoked",
      bg: "bg-rose-500/10 border-rose-500/30",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
  };

  const style = badgeMap[status] || badgeMap[ReporterStatus.PENDING];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function ReporterTableComponent({
  reporters,
  loading,
  onViewCard,
  onEdit,
  onChangeStatus,
  onDelete,
}: ReporterTableProps) {
  if (loading) {
    return (
      <div className="w-full space-y-2 p-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-12 w-full animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    );
  }

  if (reporters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-gray-200">
        <ShieldAlert className="w-8 h-8 text-gray-400 mb-2" />
        <h3 className="text-sm font-bold text-gray-800">
          No Press Credentials Found
        </h3>
        <p className="text-xs text-gray-500 max-w-sm mt-0.5">
          No journalist profiles match your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200/80 bg-white shadow-2xs">
      <table className="w-full text-left text-xs text-gray-600">
        <thead className="bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
          <tr>
            <th className="px-3.5 py-2">Reporter Details</th>
            <th className="px-3.5 py-2">Press ID</th>
            <th className="px-3.5 py-2">Designation</th>
            <th className="px-3.5 py-2">Status</th>
            <th className="px-3.5 py-2">Valid Until</th>
            <th className="px-3.5 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reporters.map((reporter) => (
            <tr
              key={reporter.id}
              className="hover:bg-gray-50/60 transition-colors"
            >
              <td className="px-3.5 py-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0 border border-gray-300">
                    {reporter.photoURL ? (
                      <img
                        src={reporter.photoURL}
                        alt={reporter.fullName}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-xs">
                        {reporter.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-1 text-xs leading-tight">
                      {reporter.fullName}
                      {reporter.status === ReporterStatus.ACTIVE && (
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      {reporter.mobile} • {reporter.bloodGroup} {reporter.beat ? `• ${reporter.beat}` : ""}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3.5 py-1.5">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {reporter.pressIdNumber}
                </span>
                {reporter.employeeId && (
                  <div className="text-[10px] text-gray-500 mt-0.5">Emp: {reporter.employeeId}</div>
                )}
              </td>
              <td className="px-3.5 py-1.5">
                <div className="font-semibold text-gray-900 text-xs">
                  {reporter.designation}
                </div>
                <div className="text-[11px] text-gray-500 truncate max-w-[150px]">
                  {reporter.address?.villageCity ? `${reporter.address.villageCity}, ` : ""}
                  {reporter.address?.district || "India"}
                </div>
              </td>
              <td className="px-3.5 py-1.5">
                <StatusBadge status={reporter.status} />
              </td>
              <td className="px-3.5 py-1.5">
                <div className="text-xs font-medium text-gray-900">
                  {new Date(reporter.validUntil).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="text-[10px] text-gray-500">
                  {reporter.daysRemaining !== undefined
                    ? `${reporter.daysRemaining} days left`
                    : ""}
                </div>
              </td>
              <td className="px-3.5 py-1.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onViewCard(reporter)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                    title="View & Download Official Press Card"
                  >
                    <QrCode className="w-3 h-3" />
                    Card
                  </button>

                  <button
                    onClick={() => onChangeStatus(reporter)}
                    className="p-1 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                    title="Change Status"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onEdit(reporter)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDelete(reporter)}
                    className="p-1 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Archive / Revoke Credential"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ReporterTable = React.memo(ReporterTableComponent);
export default ReporterTable;
