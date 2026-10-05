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
    Bell,
    BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const menuItems = [
    { href: "/admin", icon: <LayoutDashboard size={16} />, label: "Dashboard" },
    { href: "/admin/analytics", icon: <BarChart3 size={16} />, label: "Analytics" },
    { href: "/admin/dpivs", icon: <BadgeCheck size={16} className="text-amber-500" />, label: "Press Credentials (DPIVS)" },
    { href: "/admin/posts", icon: <FileText size={16} />, label: "Posts" },
    { href: "/admin/notifications", icon: <Bell size={16} />, label: "Notifications" },
    { href: "/admin/live", icon: <Radio size={16} />, label: "Live Telecast" },
    { href: "/menu", icon: <LayoutDashboard size={16} className="text-red-500" />, label: "Explore Hub (Public)" },
    { href: "/admin/categories", icon: <Tags size={16} />, label: "Categories" },
    { href: "/admin/comments", icon: <MessageSquare size={16} />, label: "Comments" },
    { href: "/admin/users", icon: <Users size={16} />, label: "Users" },
    { href: "/admin/settings", icon: <Settings size={16} />, label: "Settings" },
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
            router.replace("/login");
        } catch (error) {
            console.error("[AdminSidebar] Sign out failed:", error);
        }
    };

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-gray-200 bg-white shadow-xl transition-all duration-200 ease-in-out lg:static lg:shadow-none ${isOpen ? "w-56 translate-x-0 opacity-100" : "w-0 -translate-x-full opacity-0 lg:w-0"
                }`}
            style={{ width: isOpen ? "14rem" : "0" }}
        >
            <div className={`flex h-12 shrink-0 items-center justify-between px-4 border-b border-gray-100 transition-opacity duration-150 ${isOpen ? "opacity-100" : "opacity-0"}`}>
                <h1 className="text-base font-black tracking-tight text-gray-900 truncate flex items-center gap-1.5">
                    <span className="text-red-600">समाचार</span>
                    <span>Admin</span>
                </h1>
                {/* Close button for mobile */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
                    aria-label="Close sidebar"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className={`flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2.5 transition-opacity duration-150 ${isOpen ? "opacity-100" : "opacity-0 invisible"}`}>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch={true}
                            className={`flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] ${isActive
                                ? "bg-red-50 text-red-600 font-bold border border-red-100"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            <span className={`shrink-0 ${isActive ? "text-red-600" : "text-gray-400"}`}>{item.icon}</span>
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={`border-t border-gray-100 p-2.5 transition-opacity duration-150 ${isOpen ? "opacity-100" : "opacity-0 invisible"}`}>
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-95"
                >
                    <LogOut size={16} className="shrink-0" />
                    <span className="truncate">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
