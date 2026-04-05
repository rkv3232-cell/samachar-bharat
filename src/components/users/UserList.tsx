"use client";

import { useState } from "react";
import {
    Users,
    Trash2,
    Mail,
    Calendar,
    Search,
    Filter,
    AlertCircle,
    UserCheck,
    Loader2
} from "lucide-react";
import toast from "react-hot-toast";

import RoleBadge from "@/components/ui/RoleBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { UserDocument, UserRole } from "@/types";

interface Props {
    users: UserDocument[];
    onUserDeleted: (uid: string) => void;
    onUserUpdated: (updatedUser: UserDocument) => void;
}

export default function UserList({ users, onUserDeleted, onUserUpdated }: Props) {
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
    const [deleteTarget, setDeleteTarget] = useState<UserDocument | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    // ── Filtering ──
    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            (user.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (user.role?.toLowerCase() || "").includes(searchQuery.toLowerCase());

        const matchesRole =
            roleFilter === "all" || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    // ── Delete handler ──
    async function handleDelete() {
        if (!deleteTarget) return;

        setDeleting(true);

        try {
            const res = await fetch(
                `/api/delete-user?uid=${encodeURIComponent(deleteTarget.uid)}`,
                {
                    method: "DELETE",
                    headers: {
                        "x-api-secret": process.env.NEXT_PUBLIC_ADMIN_API_SECRET || "",
                    },
                }
            );

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || data.message || "Failed to delete user");
            }

            toast.success(`"${deleteTarget.name}" has been deleted`, {
                icon: "🗑️",
            });

            onUserDeleted(deleteTarget.uid);
        } catch (err: any) {
            toast.error(err.message || "Failed to delete user");
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    }

    // ── Role update handler ──
    async function handleRoleUpdate(uid: string, newRole: UserRole) {
        setUpdatingUid(uid);
        try {
            const res = await fetch("/api/update-user-role", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-secret": process.env.NEXT_PUBLIC_ADMIN_API_SECRET || "",
                },
                body: JSON.stringify({ uid, role: newRole }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || data.message || "Failed to update role");
            }

            toast.success(`Role updated to ${newRole}`, {
                icon: "✅",
            });

            // Find and update the user in the local data
            const user = users.find(u => u.uid === uid);
            if (user) {
                onUserUpdated({ ...user, role: newRole });
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update role");
        } finally {
            setUpdatingUid(null);
        }
    }

    // ── Format date ──
    function formatDate(dateStr: any) {
        if (!dateStr) return "N/A";
        try {
            // Handle Firestore timestamp or ISO string
            const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr.toDate?.() || new Date(dateStr);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "N/A";
        }
    }

    // ── Role counts ──
    const roleCounts = users.reduce(
        (acc, u) => {
            acc[u.role] = (acc[u.role] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-700">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-white">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Users size={20} />
                                </div>
                                All Users
                                <span className="ml-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    {users.length}
                                </span>
                            </h2>
                        </div>

                        {/* Role summary pills */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            {["owner", "admin", "editor", "reporter", "user"].map((role) => (
                                <span
                                    key={role}
                                    className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    {role}: {roleCounts[role] || 0}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users..."
                                className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div className="relative">
                            <Filter
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) =>
                                    setRoleFilter(e.target.value as UserRole | "all")
                                }
                                className="appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="all">All Roles</option>
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                                <option value="editor">Editor</option>
                                <option value="reporter">Reporter</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* User List Table Style */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-left text-xs uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4 hidden md:table-cell">Joined</th>
                                <th className="px-6 py-4">Assign Role</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-gray-400">
                                        <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-medium">No users match your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.uid} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center font-bold text-red-600 dark:text-red-400">
                                                    {u.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{u.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Calendar size={13} />
                                                {formatDate(u.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group">
                                                {updatingUid === u.uid ? (
                                                    <div className="flex items-center gap-2 text-xs text-blue-500 animate-pulse">
                                                        <Loader2 className="animate-spin" size={14} />
                                                        Saving...
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={u.role || "user"}
                                                        onChange={(e) => handleRoleUpdate(u.uid, e.target.value as UserRole)}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none pr-8 cursor-pointer transition-all ${u.role === 'owner' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-200' :
                                                                u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-200' :
                                                                    u.role === 'editor' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-200' :
                                                                        u.role === 'reporter' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-200' :
                                                                            'bg-gray-50 text-gray-700 border-gray-200 focus:ring-gray-200'
                                                            } outline-none focus:ring-2`}
                                                    >
                                                        <option value="owner">👑 OWNER</option>
                                                        <option value="admin">🛡️ ADMIN</option>
                                                        <option value="editor">📝 EDITOR</option>
                                                        <option value="reporter">🎥 REPORTER</option>
                                                        <option value="user">👤 USER</option>
                                                    </select>
                                                )}
                                                <UserCheck className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-50" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setDeleteTarget(u)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!deleteTarget}
                title="Delete User"
                message={`Are you sure you want to delete ${deleteTarget?.name}? This action is permanent.`}
                confirmLabel="Delete"
                variant="danger"
                loading={deleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </>
    );
}
