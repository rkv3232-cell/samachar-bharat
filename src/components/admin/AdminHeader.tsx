// src/components/admin/AdminHeader.tsx
// Admin header with real user name, role badge, and notifications.

"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, UserCircle, Crown, ShieldCheck, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth.types";

interface AdminHeaderProps {
    onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
    const pathname = usePathname();
    const { firestoreUser, role } = useAuth();

    const title =
        pathname === "/admin"
            ? "Dashboard"
            : pathname
                .split("/")
                .pop()
                ?.replace(/-/g, " ")
                .replace(/\b\w/g, (char) => char.toUpperCase()) || "Dashboard";

    const displayName = firestoreUser?.name ?? "Admin";

    return (
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 md:px-5 shadow-2xs">
            <div className="flex items-center gap-2 md:gap-3">
                <button
                    onClick={onMenuClick}
                    className="group flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600 transition-all hover:bg-gray-100 hover:text-red-600 active:scale-95"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={16} className="transition-transform group-hover:scale-105" />
                </button>
                <h2 className="text-sm font-bold text-gray-900 truncate">{title}</h2>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search..."
                        aria-label="Search admin panel"
                        className="h-8 w-48 rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-900 outline-none transition-colors focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-100"
                    />
                </div>

                {/* Notifications */}
                <button
                    className="relative rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 active:scale-95"
                    aria-label="Notifications"
                >
                    <Bell size={16} />
                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
                </button>

                {/* Profile with role badge */}
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 py-0.5 pl-1 pr-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-tr from-red-500 to-rose-600 text-white font-medium shadow-xs">
                        <UserCircle size={15} />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 max-w-[100px] truncate">
                        {displayName}
                    </span>
                    {role === UserRole.OWNER && (
                        <span
                            className="flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-800"
                            aria-label="Owner role"
                        >
                            <Crown size={9} />
                            Owner
                        </span>
                    )}
                    {role === UserRole.ADMIN && (
                        <span
                            className="flex items-center gap-0.5 rounded-md bg-red-100 px-1.5 py-0.2 text-[9px] font-bold uppercase text-red-700"
                            aria-label="Admin role"
                        >
                            <ShieldCheck size={9} />
                            Admin
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}
