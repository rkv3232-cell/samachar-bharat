// src/app/admin/layout.tsx
// Admin layout — SECOND LINE OF DEFENSE.
//
// This is a client component because we need the AuthContext.
// The middleware (first line) already blocked non-admins at the edge.
// This layer provides the loading state guard that prevents any flash
// of admin UI while the client-side auth context is initializing.
//
// SECURITY: AuthProvider populates role via onSnapshot (real-time).
// If role is revoked while on an admin page, the user is redirected
// within seconds — no manual refresh required.

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/admin/ui/ToastContainer";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import type { ReactNode } from "react";

// Full-page loading skeleton that reveals nothing about the admin UI
function AdminLoadingScreen() {
    return (
        <div
            className="flex items-center justify-center min-h-screen bg-gray-50"
            role="status"
            aria-label="Verifying admin access..."
        >
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium font-sans">Verifying access...</p>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { loading, isAdmin, user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const router = useRouter();
    const pathname = usePathname();
    const isLoginPage = pathname === "/admin/login";

    // Standard Reliable Mobile Detection
    useEffect(() => {
        const mql = window.matchMedia("(max-width: 1024px)");
        const onChange = () => {
            const mobile = mql.matches;
            setIsMobile(mobile);
            setIsSidebarOpen(!mobile);
        };
        onChange();
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        if (isMobile && isSidebarOpen) setIsSidebarOpen(false);
    }, [pathname, isMobile, isSidebarOpen]);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.replace("/login");
            } else if (!isAdmin) {
                router.replace("/");
            }
        }
    }, [loading, user, isAdmin, router]);

    if (isLoginPage) return <>{children}</>;
    if (loading || !isAdmin) return <AdminLoadingScreen />;

    return (
        <ToastProvider>
            <div className="flex h-screen bg-slate-50 overflow-hidden relative">
                {/* Backdrop - High Priority */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-[60] bg-gray-950/40 backdrop-blur-sm transition-all duration-300 pointer-events-auto"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <div className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full overflow-hidden">
                    <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 overflow-y-auto w-full h-full">
                        <div className="p-3 sm:p-4 lg:p-5 max-w-7xl mx-auto min-h-full">
                            {children}
                        </div>
                    </main>
                </div>
                <ToastContainer />
            </div>
        </ToastProvider>
    );
}
