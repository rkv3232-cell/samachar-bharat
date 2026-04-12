// src/components/admin/AdminSidebar.tsx
// Admin sidebar with sign-out functionality using the new auth context.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    Tags,
    MessageSquare,
    Users,
    Settings,
    BarChart3,
    LogOut,
    Radio,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const menuItems = [
    { href: "/admin", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { href: "/admin/analytics", icon: <BarChart3 size={20} />, label: "Analytics" },
    { href: "/admin/posts", icon: <FileText size={20} />, label: "Posts" },
    { href: "/admin/live", icon: <Radio size={20} />, label: "Live Telecast" },
    { href: "/admin/categories", icon: <Tags size={20} />, label: "Categories" },
    { href: "/admin/comments", icon: <MessageSquare size={20} />, label: "Comments" },
    { href: "/admin/users", icon: <Users size={20} />, label: "Users" },
    { href: "/admin/settings", icon: <Settings size={20} />, label: "Settings" },
];

interface AdminSidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function AdminSidebar({ isOpen, setIsOpen }: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const handleSignOut = async () => {
        try {
            await logout();
            router.replace("/admin/login");
        } catch (error) {
            console.error("[AdminSidebar] Sign out failed:", error);
        }
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white shadow-xl transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:static lg:shadow-none ${isOpen ? "w-64 translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 lg:w-0"
                }`}
            style={{ width: isOpen ? "16rem" : "0" }}
        >
            <div className={`flex h-16 shrink-0 items-center justify-between px-6 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white truncate">
                    <span className="text-blue-600 dark:text-blue-400">News</span>Admin
                </h1>
                {/* Close button for mobile */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:text-gray-400 dark:hover:bg-gray-800"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className={`flex-1 space-y-1 overflow-y-auto px-4 py-4 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 invisible"}`}>
                {menuItems.map((item) => {
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
                            <span className="shrink-0">{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={`border-t border-gray-200 p-4 dark:border-gray-800 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0 invisible"}`}>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                    <LogOut size={20} className="shrink-0" />
                    <span className="truncate">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
