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
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReporter, setEditingReporter] = useState<ReporterProfile | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusReporter, setStatusReporter] = useState<ReporterProfile | null>(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewReporter, setPreviewReporter] = useState<ReporterProfile | null>(null);

  // Fetch Reporters
  const fetchReporters = useCallback(async () => {
    try {
      setLoading(true);
      // Primary: Direct Firestore Fetch
      const fsList = await fetchReportersFromFirestore(selectedStatus, searchQuery);
      setReporters(fsList);
    } catch (err: any) {
      console.warn("[DPIVS Page] Firestore direct fetch error, trying API fallback:", err);
      try {
        const params = new URLSearchParams();
        if (selectedStatus !== "ALL") params.append("status", selectedStatus);
        if (searchQuery) params.append("search", searchQuery);

        const res = await fetch(`/api/dpivs/reporters?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setReporters(data.data || []);
        }
      } catch (apiErr: any) {
        toast.error("Failed to load reporter records");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    fetchReporters();
  }, [fetchReporters]);

  // Create or Edit Submit
  const handleFormSubmit = async (formData: any) => {
    try {
      if (editingReporter) {
        // 1. Save to Firestore
        await updateReporterInFirestore(editingReporter.id, formData, user?.uid || "admin");
        
        // 2. Trigger API in background (optional)
        fetch(`/api/dpivs/reporters/${editingReporter.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }).catch(() => {});

        toast.success(`Profile for ${formData.fullName} updated successfully!`);
        await fetchReporters();
      } else {
        // 1. Create in Firestore
        const newReporter = await createReporterInFirestore(formData, user?.uid || "admin");

        // 2. Trigger API in background (optional)
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
  const handleDeleteReporter = async (reporter: ReporterProfile) => {
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
  };

  // CSV Export
  const handleExportCSV = () => {
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
  };

  // Compute Summary Statistics
  const totalCount = reporters.length;
  const activeCount = reporters.filter(
    (r) => r.status === ReporterStatus.ACTIVE || r.status === ReporterStatus.RENEWED_ACTIVE
  ).length;
  const pendingCount = reporters.filter((r) => r.status === ReporterStatus.PENDING).length;
  const suspendedCount = reporters.filter(
    (r) => r.status === ReporterStatus.SUSPENDED || r.status === ReporterStatus.REVOKED
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Digital Press Identity & Verification System (DPIVS)
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Autonomous Press Credential Management, Lifecycle Enforcement & Cryptographic QR Verification
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {(isAdmin || isOwner) && (
            <button
              onClick={() => {
                setEditingReporter(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              Issue New Press Card
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <BadgeCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</div>
            <div className="text-xs text-gray-500">Total Registered Credentials</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</div>
            <div className="text-xs text-gray-500">Active Verified Cards</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</div>
            <div className="text-xs text-gray-500">Pending Review</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{suspendedCount}</div>
            <div className="text-xs text-gray-500">Suspended / Revoked</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, ID, phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            onClick={fetchReporters}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reporter Data Table */}
      <ReporterTable
        reporters={reporters}
        loading={loading}
        onViewCard={(reporter) => {
          setPreviewReporter(reporter);
          setIsPreviewModalOpen(true);
        }}
        onEdit={(reporter) => {
          setEditingReporter(reporter);
          setIsFormOpen(true);
        }}
        onChangeStatus={(reporter) => {
          setStatusReporter(reporter);
          setIsStatusModalOpen(true);
        }}
        onDelete={handleDeleteReporter}
      />

      {/* Modals */}
      <ReporterFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingReporter}
        mode={editingReporter ? "edit" : "create"}
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
