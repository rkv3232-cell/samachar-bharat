// src/app/admin/dpivs/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Clock,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ReporterProfile, ReporterStatus } from "@/types/dpivs";
import ReporterTable from "@/components/dpivs/data-display/ReporterTable";
import ReporterFormModal from "@/components/dpivs/forms/ReporterFormModal";
import StatusChangeModal from "@/components/dpivs/status-components/StatusChangeModal";
import CardPreviewModal from "@/components/dpivs/card-generation/CardPreviewModal";

import {
  createReporterInFirestore,
  deleteReporterInFirestore,
  fetchReportersFromFirestore,
  updateReporterInFirestore,
} from "@/lib/firebase/reporters";

export default function DPIVSAdminPage() {
  const { user, userRole, isOwner, isAdmin } = useAuth();

  const [reporters, setReporters] = useState<ReporterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // 300ms Search Debounce to eliminate excessive Firestore calls on typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReporter, setEditingReporter] = useState<ReporterProfile | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusReporter, setStatusReporter] = useState<ReporterProfile | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewReporter, setPreviewReporter] = useState<ReporterProfile | null>(null);

  // Fetch Reporters
  const fetchReporters = useCallback(async (isInitial = false) => {
    try {
      if (!isInitial) setLoading(true);
      // Primary: Direct Firestore Fetch
      const fsList = await fetchReportersFromFirestore(selectedStatus, debouncedSearchQuery);
      setReporters(fsList);
    } catch (err: any) {
      console.warn("[DPIVS Page] Firestore direct fetch error, trying API fallback:", err);
      try {
        const params = new URLSearchParams();
        if (selectedStatus !== "ALL") params.append("status", selectedStatus);
        if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);

        const res = await fetch(`/api/dpivs/reporters?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setReporters(data.data || []);
        }
      } catch (_apiErr: any) {
        toast.error("Failed to load reporter records");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, debouncedSearchQuery]);

  useEffect(() => {
    fetchReporters(true);
  }, [fetchReporters]);

  // Memoized Action Handlers for Table & Modals
  const handleViewCard = useCallback((reporter: ReporterProfile) => {
    setPreviewReporter(reporter);
    setIsPreviewModalOpen(true);
  }, []);

  const handleEdit = useCallback((reporter: ReporterProfile) => {
    setEditingReporter(reporter);
    setIsFormOpen(true);
  }, []);

  const handleChangeStatusClick = useCallback((reporter: ReporterProfile) => {
    setStatusReporter(reporter);
    setIsStatusModalOpen(true);
  }, []);

  // Create or Edit Submit
  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingReporter) {
        await updateReporterInFirestore(editingReporter.id, formData, user?.uid || "admin");
        
        fetch(`/api/dpivs/reporters/${editingReporter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }).catch(() => {});

        toast.success(`Profile for ${formData.fullName} updated successfully!`);
        await fetchReporters();
      } else {
        const newReporter = await createReporterInFirestore(formData, user?.uid || "admin");

        fetch("/api/dpivs/reporters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }).catch(() => {});

        toast.success(`Press ID ${newReporter.pressIdNumber} issued successfully!`);
        await fetchReporters();
      }
    } catch (err: any) {
      console.error("[DPIVS Form Submit Error]:", err);
      toast.error(err.message || "Failed to save reporter profile.");
    }
  };

  // Status Change Submit
  const handleStatusChange = async (targetStatus: ReporterStatus, reason: string) => {
    if (!statusReporter) return;

    try {
      await updateReporterInFirestore(
        statusReporter.id,
        { status: targetStatus, notes: reason ? `Status change reason: ${reason}` : undefined },
        user?.uid || "admin"
      );

      fetch(`/api/dpivs/reporters/${statusReporter.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus, reason }),
      }).catch(() => {});

      toast.success("Status updated successfully!");
      await fetchReporters();
    } catch (err: any) {
      toast.error(err.message || "Status update error");
    }
  };

  // Soft Delete / Archive
  const handleDeleteReporter = useCallback(async (reporter: ReporterProfile) => {
    if (!isOwner) {
      toast.error("Only the Organization Owner can archive or revoke credentials.");
      return;
    }

    if (!confirm(`Are you sure you want to archive and revoke credential for ${reporter.fullName}?`)) {
      return;
    }

    try {
      await deleteReporterInFirestore(reporter.id, user?.uid || "owner");

      fetch(`/api/dpivs/reporters/${reporter.id}`, {
        method: "DELETE",
      }).catch(() => {});

      toast.success(`Reporter profile for ${reporter.fullName} archived.`);
      await fetchReporters();
    } catch (err: any) {
      toast.error(err.message || "Archiving error");
    }
  }, [isOwner, user, fetchReporters]);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    if (reporters.length === 0) {
      toast.error("No reporter records to export.");
      return;
    }

    const headers = [
      "Press ID",
      "Full Name",
      "Father Name",
      "Designation",
      "Status",
      "Mobile",
      "Blood Group",
      "Issue Date",
      "Valid Until",
    ];

    const rows = reporters.map((r) => [
      r.pressIdNumber,
      `"${r.fullName}"`,
      `"${r.fatherName}"`,
      `"${r.designation}"`,
      r.status,
      r.mobile,
      r.bloodGroup,
      r.issueDate,
      r.validUntil,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DPIVS_Reporters_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Reporter records exported to CSV!");
  }, [reporters]);

  // Compute Summary Statistics (Memoized)
  const { totalCount, activeCount, pendingCount, suspendedCount } = React.useMemo(() => {
    const total = reporters.length;
    const active = reporters.filter(
      (r) => r.status === ReporterStatus.ACTIVE || r.status === ReporterStatus.RENEWED_ACTIVE
    ).length;
    const pending = reporters.filter((r) => r.status === ReporterStatus.PENDING).length;
    const suspended = reporters.filter(
      (r) => r.status === ReporterStatus.SUSPENDED || r.status === ReporterStatus.REVOKED
    ).length;
    return { totalCount: total, activeCount: active, pendingCount: pending, suspendedCount: suspended };
  }, [reporters]);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900">
              Press Credentials (DPIVS)
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            Autonomous Press Credential Management & Cryptographic QR Verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          {(isAdmin || isOwner) && (
            <button
              onClick={() => {
                setEditingReporter(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              Issue Press Card
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <BadgeCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-gray-900 leading-tight">{totalCount}</div>
            <div className="text-[10px] font-medium text-gray-500 truncate">Total Registered</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-gray-900 leading-tight">{activeCount}</div>
            <div className="text-[10px] font-medium text-gray-500 truncate">Active Cards</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-gray-900 leading-tight">{pendingCount}</div>
            <div className="text-[10px] font-medium text-gray-500 truncate">Pending</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-black text-gray-900 leading-tight">{suspendedCount}</div>
            <div className="text-[10px] font-medium text-gray-500 truncate">Suspended</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, ID, phone..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-gray-200 bg-white text-gray-900 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 px-2.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-800 font-semibold focus:ring-1 focus:ring-red-500 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value={ReporterStatus.ACTIVE}>Active</option>
              <option value={ReporterStatus.PENDING}>Pending</option>
              <option value={ReporterStatus.SUSPENDED}>Suspended</option>
              <option value={ReporterStatus.EXPIRED}>Expired</option>
              <option value={ReporterStatus.REVOKED}>Revoked</option>
            </select>
          </div>

          <button
            onClick={() => fetchReporters(false)}
            className="h-8 w-8 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reporter Data Table */}
      <ReporterTable
        reporters={reporters}
        loading={loading}
        onViewCard={handleViewCard}
        onEdit={handleEdit}
        onChangeStatus={handleChangeStatusClick}
        onDelete={handleDeleteReporter}
      />

      {/* Modals */}
      <ReporterFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingReporter}
        mode={editingReporter ? "edit" : "create"}
        reporters={reporters}
      />

      <StatusChangeModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        reporter={statusReporter}
        currentUserRole={userRole}
        onConfirm={handleStatusChange}
      />

      <CardPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        reporter={previewReporter}
      />
    </div>
  );
}
