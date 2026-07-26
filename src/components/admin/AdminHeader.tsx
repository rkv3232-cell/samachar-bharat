// src/components/admin/AdminHeader.tsx
// Admin header with real user name, role badge, and notifications.

"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, UserCircle, Crown, ShieldCheck, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth.types";
import ThemeToggle from "@/components/ThemeToggle";

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
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2 md:gap-4">
                <button
                    onPointerDown={(e) => {
                        e.preventDefault(); // Prevent focus/click flickering
                        onMenuClick();
                    }}
                    className="group flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 text-gray-500 transition-all hover:bg-gray-100 hover:text-blue-600 active:scale-90 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 md:h-10 md:w-10"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={24} className="transition-transform group-hover:scale-110 md:size-5" />
                </button>
                <h2 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white truncate">{title}</h2>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative hidden sm:block">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Search..."
                        aria-label="Search admin panel"
                        className="h-10 w-64 rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* Theme Toggle (Light / Dark Mode) */}
                <ThemeToggle />

                {/* Notifications */}
                <button
                    className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
                </button>

                {/* Profile with role badge */}
                <div className="flex items-center gap-2 rounded-full border border-gray-100 bg-gray-50 py-1 pl-1 pr-3 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white">
                        <UserCircle size={20} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {displayName}
                    </span>
                    {role === UserRole.OWNER && (
                        <span
                            className="flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            aria-label="Owner role"
                        >
                            <Crown size={10} />
                            Owner
                        </span>
                    )}
                    {role === UserRole.ADMIN && (
                        <span
                            className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            aria-label="Admin role"
                        >
                            <ShieldCheck size={10} />
                            Admin
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}
