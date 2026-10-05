// ============================================================
// app/admin/comments/page.tsx
// COMPLETE COMMENTS MANAGEMENT SYSTEM
// Features: Fetch all, Approve, Reject, Delete,
//           Search, Filter, Pagination, Stats
// ============================================================

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    fetchAllComments,
    updateCommentStatus,
    deleteComment,
} from "@/lib/firestore/comments";
import { useToast } from "@/contexts/ToastContext";
import type { Comment } from "@/types";
import LoadingSpinner from "@/components/admin/ui/LoadingSpinner";
import SearchBar from "@/components/admin/ui/SearchBar";
import StatusBadge from "@/components/admin/ui/StatusBadge";
import Pagination from "@/components/admin/ui/Pagination";
import ConfirmDialog from "@/components/admin/ui/ConfirmDialog";

const ITEMS_PER_PAGE = 10;

type FilterType = "all" | "approved" | "pending" | "rejected";

export default function CommentsPage() {
    // ─── State ──────────────────────────────────────
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
    const { addToast } = useToast();

    // ─── Load Comments ──────────────────────────────
    const loadComments = useCallback(async (isInitial = false) => {
        try {
            if (!isInitial) setLoading(true);
            const data = await fetchAllComments();
            setComments(data);
        } catch (_error) {
            console.error("Failed to load comments:", _error);
            addToast("Failed to load comments", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadComments(true);
    }, [loadComments]);

    // ─── Filtering & Search ─────────────────────────
    const filteredComments = useMemo(() => {
        let result = comments;

        // Filter by status
        if (filter !== "all") {
            result = result.filter((c) => c.status === filter);
        }

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (c) =>
                    (c.name?.toLowerCase() || "").includes(q) ||
                    (c.message?.toLowerCase() || "").includes(q) ||
                    (c.postTitle?.toLowerCase() || "").includes(q)
            );
        }

        return result;
    }, [comments, filter, search]);

    // ─── Pagination ─────────────────────────────────
    const totalPages = Math.ceil(filteredComments.length / ITEMS_PER_PAGE);
    const paginatedComments = filteredComments.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // ─── Actions ────────────────────────────────────
    const handleStatusChange = async (
        comment: Comment,
        status: "approved" | "rejected"
    ) => {
        try {
            setActionLoading(comment.id);
            await updateCommentStatus(comment.postId, comment.id, status);
            setComments((prev) =>
                prev.map((c) => (c.id === comment.id ? { ...c, status } : c))
            );
            addToast(
                `Comment ${status === "approved" ? "approved" : "rejected"} successfully`,
                "success"
            );
        } catch (error) {
            addToast(`Failed to update comment status`, "error");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            setActionLoading(deleteTarget.id);
            await deleteComment(deleteTarget.postId, deleteTarget.id);
            setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            addToast("Comment deleted successfully", "success");
        } catch (error) {
            addToast("Failed to delete comment", "error");
        } finally {
            setActionLoading(null);
            setDeleteTarget(null);
        }
    };

    // ─── Helpers ────────────────────────────────────
    const formatDate = (date: Date) =>
        new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    const getStats = () => ({
        total: comments.length,
        pending: comments.filter((c) => c.status === "pending").length,
        approved: comments.filter((c) => c.status === "approved").length,
        rejected: comments.filter((c) => c.status === "rejected").length,
    });

    const stats = getStats();

    // ─── Render ─────────────────────────────────────
    return (
        <div className="space-y-4">
            {/* Page Header */}
            <div>
                <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                    Comments Management
                </h1>
                <p className="text-xs text-gray-500">
                    Moderate and manage reader comments across all published articles
                </p>
            </div>

            {/* ─── Stats Cards ───────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: "Total Comments",
                        count: stats.total,
                        color: "border-gray-200/80",
                        icon: "💬",
                    },
                    {
                        label: "Pending",
                        count: stats.pending,
                        color: "border-gray-200/80",
                        icon: "⏳",
                    },
                    {
                        label: "Approved",
                        count: stats.approved,
                        color: "border-gray-200/80",
                        icon: "✅",
                    },
                    {
                        label: "Rejected",
                        count: stats.rejected,
                        color: "border-gray-200/80",
                        icon: "❌",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={`rounded-xl p-3 bg-white border ${stat.color} shadow-2xs`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-medium text-gray-500">{stat.label}</p>
                            <span className="text-base">{stat.icon}</span>
                        </div>
                        <p className="text-lg font-black text-gray-900 mt-0.5 leading-tight">{stat.count}</p>
                    </div>
                ))}
            </div>

            {/* ─── Filters & Search ──────────────────── */}
            <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 p-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                        <SearchBar
                            value={search}
                            onChange={(val) => {
                                setSearch(val);
                                setCurrentPage(1);
                            }}
                            placeholder="Search comments by name or text..."
                        />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => {
                                    setFilter(f);
                                    setCurrentPage(1);
                                }}
                                className={`h-8 px-3 text-xs font-semibold rounded-lg capitalize transition-all active:scale-95 ${filter === f
                                    ? "bg-red-600 text-white shadow-2xs"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {f}
                                {f !== "all" && (
                                    <span className="ml-1 text-[10px] opacity-80">
                                        (
                                        {f === "pending"
                                            ? stats.pending
                                            : f === "approved"
                                                ? stats.approved
                                                : stats.rejected}
                                        )
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Table ─────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 overflow-hidden">
                {loading ? (
                    <div className="p-4"><LoadingSpinner message="Loading comments..." /></div>
                ) : paginatedComments.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-2xl mb-1">💬</p>
                        <p className="text-xs font-bold text-gray-900">
                            No comments found
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            {search || filter !== "all"
                                ? "Try adjusting your search or filter"
                                : "Comments will appear here once users start commenting"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <th className="px-3.5 py-2">User</th>
                                    <th className="px-3.5 py-2">Comment</th>
                                    <th className="px-3.5 py-2">Post</th>
                                    <th className="px-3.5 py-2">Date</th>
                                    <th className="px-3.5 py-2">Status</th>
                                    <th className="px-3.5 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {paginatedComments.map((comment) => (
                                    <tr
                                        key={comment.id}
                                        className="hover:bg-gray-50/60 transition-colors"
                                    >
                                        {/* User */}
                                        <td className="px-3.5 py-1.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0 text-white font-bold text-[10px]">
                                                    {(comment.name || "?").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-semibold text-gray-900 truncate max-w-[120px]">
                                                    {comment.name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Comment */}
                                        <td className="px-3.5 py-1.5">
                                            <p
                                                className="text-xs text-gray-700 max-w-[260px] truncate"
                                                title={comment.message}
                                            >
                                                {comment.message}
                                            </p>
                                        </td>

                                        {/* Post Title */}
                                        <td className="px-3.5 py-1.5 whitespace-nowrap">
                                            <span className="text-xs text-gray-500 truncate max-w-[150px] inline-block">
                                                {comment.postTitle || "—"}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-3.5 py-1.5 whitespace-nowrap text-[11px] text-gray-400">
                                            {formatDate(comment.createdAt)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-3.5 py-1.5 whitespace-nowrap">
                                            <StatusBadge status={comment.status as any || "pending"} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-3.5 py-1.5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {comment.status !== "approved" && (
                                                    <button
                                                        onClick={() =>
                                                            handleStatusChange(comment, "approved")
                                                        }
                                                        disabled={actionLoading === comment.id}
                                                        className="h-6 px-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {comment.status !== "rejected" && (
                                                    <button
                                                        onClick={() =>
                                                            handleStatusChange(comment, "rejected")
                                                        }
                                                        disabled={actionLoading === comment.id}
                                                        className="h-6 px-2 text-[11px] font-semibold text-amber-700 bg-amber-50 rounded hover:bg-amber-100 disabled:opacity-50 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteTarget(comment)}
                                                    disabled={actionLoading === comment.id}
                                                    className="h-6 px-2 text-[11px] font-semibold text-red-700 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && filteredComments.length > ITEMS_PER_PAGE && (
                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredComments.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Comment"
                message={`Are you sure you want to permanently delete this comment by "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmText="Delete Comment"
                loading={!!actionLoading}
            />
        </div>
    );
}
