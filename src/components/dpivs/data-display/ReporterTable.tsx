// src/components/dpivs/data-display/ReporterTable.tsx
"use client";

import React, { useState } from "react";
import {
  BadgeCheck,
  Edit3,
  Eye,
  MoreVertical,
  QrCode,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
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
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
      text: "text-emerald-700 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    [ReporterStatus.PENDING]: {
      label: "Pending Review",
      bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
      text: "text-amber-700 dark:text-amber-400",
      dot: "bg-amber-500",
    },
    [ReporterStatus.SUSPENDED]: {
      label: "Suspended",
      bg: "bg-orange-500/10 dark:bg-orange-500/20 border-orange-500/30",
      text: "text-orange-700 dark:text-orange-400",
      dot: "bg-orange-500",
    },
    [ReporterStatus.EXPIRED]: {
      label: "Expired",
      bg: "bg-gray-500/10 dark:bg-gray-500/20 border-gray-500/30",
      text: "text-gray-700 dark:text-gray-400",
      dot: "bg-gray-500",
    },
    [ReporterStatus.RENEWED_ACTIVE]: {
      label: "Renewed",
      bg: "bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30",
      text: "text-blue-700 dark:text-blue-400",
      dot: "bg-blue-500",
    },
    [ReporterStatus.REVOKED]: {
      label: "Revoked",
      bg: "bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30",
      text: "text-rose-700 dark:text-rose-400",
      dot: "bg-rose-500",
    },
  };

  const style = badgeMap[status] || badgeMap[ReporterStatus.PENDING];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-full space-y-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
          />
        ))}
      </div>
    );
  }

  if (reporters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-12 h-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          No Press Credentials Found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1">
          No journalist profiles match your search criteria. Click "Issue New Press Card" to register a reporter.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
      <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-800/60 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
          <tr>
            <th className="px-6 py-4">Reporter Details</th>
            <th className="px-6 py-4">Press ID Number</th>
            <th className="px-6 py-4">Designation</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Valid Until</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {reporters.map((reporter) => (
            <tr
              key={reporter.id}
              className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 border border-gray-300 dark:border-gray-700">
                    {reporter.photoURL ? (
                      <img
                        src={reporter.photoURL}
                        alt={reporter.fullName}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-500 text-sm">
                        {reporter.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {reporter.fullName}
                      {reporter.status === ReporterStatus.ACTIVE && (
                        <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {reporter.mobile} • {reporter.bloodGroup} {reporter.beat ? `• Beat: ${reporter.beat}` : ""}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800/50">
                  {reporter.pressIdNumber}
                </span>
                {reporter.employeeId && (
                  <div className="text-[11px] text-gray-500 mt-0.5">Emp: {reporter.employeeId}</div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {reporter.designation}
                </div>
                <div className="text-xs text-gray-500">
                  {reporter.address?.villageCity ? `${reporter.address.villageCity}, ` : ""}
                  {reporter.address?.district ? `${reporter.address.district}, ` : ""}
                  {reporter.address?.state || "India"}
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={reporter.status} />
              </td>
              <td className="px-6 py-4">
                <div className="text-xs font-medium text-gray-900 dark:text-gray-200">
                  {new Date(reporter.validUntil).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="text-[11px] text-gray-500">
                  {reporter.daysRemaining !== undefined
                    ? `${reporter.daysRemaining} days remaining`
                    : ""}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onViewCard(reporter)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                    title="View & Download Official Press Card"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    Card
                  </button>

                  <button
                    onClick={() => onChangeStatus(reporter)}
                    className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                    title="Change Status"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEdit(reporter)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Edit Profile"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDelete(reporter)}
                    className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                    title="Archive / Revoke Credential"
                  >
                    <Trash2 className="w-4 h-4" />
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
