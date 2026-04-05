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
    const loadComments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAllComments();
            setComments(data);
        } catch (error) {
            console.error("Failed to load comments:", error);
            addToast("Failed to load comments", "error");
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadComments();
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

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, search]);

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
        <div>
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    💬 Comments Management
                </h1>
                <p className="text-gray-500 mt-1">
                    Moderate and manage comments across all posts
                </p>
            </div>

            {/* ─── Stats Cards ───────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                    {
                        label: "Total",
                        count: stats.total,
                        color: "bg-blue-50 text-blue-700 border-blue-200",
                        icon: "📊",
                    },
                    {
                        label: "Pending",
                        count: stats.pending,
                        color: "bg-amber-50 text-amber-700 border-amber-200",
                        icon: "⏳",
                    },
                    {
                        label: "Approved",
                        count: stats.approved,
                        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        icon: "✅",
                    },
                    {
                        label: "Rejected",
                        count: stats.rejected,
                        color: "bg-red-50 text-red-700 border-red-200",
                        icon: "❌",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={`rounded-xl p-4 border ${stat.color}`}
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium opacity-80">{stat.label}</p>
                            <span className="text-lg">{stat.icon}</span>
                        </div>
                        <p className="text-2xl font-bold mt-1">{stat.count}</p>
                    </div>
                ))}
            </div>

            {/* ─── Filters & Search ──────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <SearchBar
                            value={search}
                            onChange={setSearch}
                            placeholder="Search by name, comment, or post title..."
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2.5 text-sm font-medium rounded-xl capitalize transition-all ${filter === f
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {f}
                                {f !== "all" && (
                                    <span className="ml-1.5 text-xs opacity-75">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <LoadingSpinner message="Loading comments..." />
                ) : paginatedComments.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">💬</p>
                        <p className="text-lg font-medium text-gray-900">
                            No comments found
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {search || filter !== "all"
                                ? "Try adjusting your search or filter"
                                : "Comments will appear here once users start commenting"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Comment
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Post
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedComments.map((comment) => (
                                    <tr
                                        key={comment.id}
                                        className="hover:bg-blue-50/30 transition-colors"
                                    >
                                        {/* User */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-sm">
                                                        {(comment.name || "?").charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {comment.name}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Comment */}
                                        <td className="px-6 py-4">
                                            <p
                                                className="text-sm text-gray-700 max-w-[250px] truncate"
                                                title={comment.message}
                                            >
                                                {comment.message}
                                            </p>
                                        </td>

                                        {/* Post Title */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600 font-medium">
                                                {comment.postTitle}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={comment.status as any || "pending"} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                {comment.status !== "approved" && (
                                                    <button
                                                        onClick={() =>
                                                            handleStatusChange(comment, "approved")
                                                        }
                                                        disabled={actionLoading === comment.id}
                                                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                )}
                                                {comment.status !== "rejected" && (
                                                    <button
                                                        onClick={() =>
                                                            handleStatusChange(comment, "rejected")
                                                        }
                                                        disabled={actionLoading === comment.id}
                                                        className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-50 transition-colors"
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setDeleteTarget(comment)}
                                                    disabled={actionLoading === comment.id}
                                                    className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                >
                                                    🗑 Delete
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
