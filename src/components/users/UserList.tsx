"use client";

import { useState } from "react";
import {
    Users,
    Trash2,
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

function formatDate(dateStr?: string): string {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
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

            toast.success("Role updated successfully");

            const existing = users.find((u) => u.uid === uid);
            if (existing) {
                onUserUpdated({ ...existing, role: newRole });
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update role");
        } finally {
            setUpdatingUid(null);
        }
    }

    const roleCounts = users.reduce(
        (acc, user) => {
            const r = user.role || "user";
            acc[r] = (acc[r] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <>
            <div className="rounded-xl border border-gray-200/80 bg-white shadow-2xs overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 bg-gray-50/50 p-3 sm:p-3.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                <Users size={16} className="text-red-600" />
                                All Users
                            </h2>
                            <span className="rounded-full bg-gray-100 px-2 py-0.2 text-[11px] font-bold text-gray-600">
                                {users.length}
                            </span>
                        </div>

                        {/* Role summary pills */}
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                            {["owner", "admin", "editor", "reporter", "user"].map((role) => (
                                <span
                                    key={role}
                                    className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-gray-600 font-semibold"
                                >
                                    {role}: {roleCounts[role] || 0}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Search
                                size={14}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users by name, email, or role..."
                                className="w-full h-8 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs text-gray-900 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
                            />
                        </div>

                        <div className="relative">
                            <Filter
                                size={14}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) =>
                                    setRoleFilter(e.target.value as UserRole | "all")
                                }
                                className="h-8 rounded-lg border border-gray-200 bg-white pl-8 pr-8 text-xs font-semibold text-gray-800 outline-none transition-all focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
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

                {/* User List Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/80 text-left text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-3.5 py-2">User</th>
                                <th className="px-3.5 py-2 hidden md:table-cell">Joined</th>
                                <th className="px-3.5 py-2">Assign Role</th>
                                <th className="px-3.5 py-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-gray-400">
                                        <AlertCircle size={24} className="mx-auto mb-1 opacity-50" />
                                        <p className="text-xs font-medium">No users match your filters</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.uid} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="px-3.5 py-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-7 w-7 bg-red-100 rounded-lg flex items-center justify-center font-bold text-xs text-red-600 shrink-0">
                                                    {u.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold truncate text-gray-900 leading-tight">{u.name}</p>
                                                    <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3.5 py-1.5 hidden md:table-cell">
                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                <Calendar size={12} />
                                                {formatDate(u.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-3.5 py-1.5">
                                            <div className="relative inline-block">
                                                {updatingUid === u.uid ? (
                                                    <div className="flex items-center gap-1.5 text-xs text-blue-500 animate-pulse py-1">
                                                        <Loader2 className="animate-spin" size={13} />
                                                        Saving...
                                                    </div>
                                                ) : (
                                                    <select
                                                        value={u.role || "user"}
                                                        onChange={(e) => handleRoleUpdate(u.uid, e.target.value as UserRole)}
                                                        className={`h-7 text-xs font-bold px-2.5 rounded-md border appearance-none pr-7 cursor-pointer transition-all ${u.role === 'owner' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                u.role === 'editor' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                    u.role === 'reporter' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                            } outline-none focus:ring-1`}
                                                    >
                                                        <option value="owner">👑 OWNER</option>
                                                        <option value="admin">🛡️ ADMIN</option>
                                                        <option value="editor">📝 EDITOR</option>
                                                        <option value="reporter">🎥 REPORTER</option>
                                                        <option value="user">👤 USER</option>
                                                    </select>
                                                )}
                                                <UserCheck className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-40" />
                                            </div>
                                        </td>
                                        <td className="px-3.5 py-1.5 text-right">
                                            <button
                                                onClick={() => setDeleteTarget(u)}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                title="Delete user"
                                            >
                                                <Trash2 size={14} />
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
