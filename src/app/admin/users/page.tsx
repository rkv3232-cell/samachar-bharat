"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import CreateUserForm from "@/components/users/CreateUserForm";
import UserList from "@/components/users/UserList";
import { FormSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import type { UserDocument } from "@/types";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Fetch users ──
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/list-users", {
                headers: {
                    "x-api-secret": process.env.NEXT_PUBLIC_ADMIN_API_SECRET || "",
                },
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to fetch users");
            }

            setUsers(data.data || []);
        } catch (err: any) {
            console.error("Fetch users error:", err);
            setError(err.message);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ── Handlers ──
    function handleUserCreated(newUser: UserDocument) {
        setUsers((prev) => [newUser, ...prev]);
    }

    function handleUserDeleted(uid: string) {
        setUsers((prev) => prev.filter((u) => u.uid !== uid));
    }

    return (
        <div className="space-y-4">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        borderRadius: "8px",
                        background: "#1f2937",
                        color: "#f9fafb",
                        fontSize: "12px",
                    },
                }}
            />

            {/* ── Page Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        <Users size={18} className="text-red-600" />
                        User Management
                    </h1>
                    <p className="text-xs text-gray-500">
                        Create, manage, and assign roles for newsroom staff and users
                    </p>
                </div>

                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white h-8 px-3 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 shadow-2xs active:scale-95"
                >
                    <RefreshCw
                        size={13}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* ── Error Banner ── */}
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs flex items-center justify-between">
                    <p className="font-medium text-red-600">Error: {error}</p>
                    <button
                        onClick={fetchUsers}
                        className="font-bold text-red-700 underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* ── Content ── */}
            <div className="space-y-4">
                {/* Create User Form */}
                {loading ? (
                    <FormSkeleton />
                ) : (
                    <CreateUserForm onUserCreated={handleUserCreated} />
                )}

                {/* User List */}
                {loading ? (
                    <TableSkeleton rows={5} />
                ) : (
                    <UserList
                        users={users}
                        onUserDeleted={handleUserDeleted}
                        onUserUpdated={(updatedUser) => {
                            setUsers((prev) =>
                                prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u))
                            );
                        }}
                    />
                )}
            </div>
        </div>
    );
}
