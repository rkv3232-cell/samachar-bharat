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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        borderRadius: "12px",
                        background: "#1f2937",
                        color: "#f9fafb",
                        fontSize: "14px",
                    },
                }}
            />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                {/* ── Page Header ── */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                <Users size={28} />
                            </div>
                            User Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Create, manage, and delete users for your news platform
                        </p>
                    </div>

                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* ── Error Banner ── */}
                {error && (
                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">
                            Error: {error}
                        </p>
                        <button
                            onClick={fetchUsers}
                            className="mt-1 text-sm font-medium text-red-700 underline dark:text-red-300"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* ── Content ── */}
                <div className="space-y-6">
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
        </div>
    );
}
