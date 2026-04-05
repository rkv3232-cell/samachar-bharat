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

export default function AdminSidebar() {
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
        <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-16 shrink-0 items-center px-6">
                <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    <span className="text-blue-600 dark:text-blue-400">News</span>Admin
                </h1>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
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
                            {item.icon}
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-gray-200 p-4 dark:border-gray-800">
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
