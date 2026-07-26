// src/app/editor/layout.tsx
// Editor layout — requires editor or higher role.
// Owners and admins also have full access to the editor panel.

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FilePlus,
    FileText,
    LogOut,
    PenTool,
} from "lucide-react";
import { UserRole } from "@/types/auth.types";

function EditorLoadingScreen() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
                <p className="text-sm font-medium text-gray-500">Verifying access...</p>
            </div>
        </div>
    );
}

function EditorSidebar() {
    const pathname = usePathname();
    const { signOut, firestoreUser, isAdmin, role } = useAuth();
    const router = useRouter();

    const navItems = [
        { href: "/editor", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
        { href: "/editor/create", icon: <FilePlus size={20} />, label: "New Post" },
        { href: "/editor/posts", icon: <FileText size={20} />, label: "My Posts" },
    ];

    const handleSignOut = async () => {
        await signOut();
        router.replace("/login");
    };

    return (
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-16 shrink-0 items-center gap-2 px-6">
                <PenTool size={22} className="text-blue-600" />
                <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                    {role === UserRole.REPORTER ? "Reporter Panel" : "Editor Panel"}
                </h1>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${isActive
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}

                {/* Admin link for admins/owners visiting the editor panel */}
                {isAdmin && (
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                        <LayoutDashboard size={20} />
                        Admin Panel
                    </Link>
                )}
            </nav>

            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                <p className="mb-3 px-4 text-xs text-gray-400 truncate">
                    {firestoreUser?.name ?? "Editor"}
                </p>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

export default function EditorLayout({ children }: { children: ReactNode }) {
    const { loading, isReporter } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isReporter) {
            router.replace("/");
        }
    }, [loading, isReporter, router]);

    if (loading) return <EditorLoadingScreen />;
    if (!isReporter) return <EditorLoadingScreen />;

    return (
        <div className="flex h-screen bg-gray-50/50">
            <EditorSidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
