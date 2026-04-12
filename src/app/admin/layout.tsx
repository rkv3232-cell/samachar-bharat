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
    const { loading, isAdmin, role, user } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to open
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const isLoginPage = pathname === "/admin/login";

    // Detect screen size for responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false); // Close by default on mobile
            else setIsSidebarOpen(true); // Open by default on desktop
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close sidebar on navigation (mobile only)
    useEffect(() => {
        if (isMobile) setIsSidebarOpen(false);
    }, [pathname, isMobile]);

    // ─── Diagnostics ───
    useEffect(() => {
        console.log("[AdminLayout] Check:", {
            pathname,
            isLoginPage,
            loading,
            isAdmin,
            email: user?.email,
            isMobile,
            isSidebarOpen
        });
    }, [loading, isAdmin, role, user, pathname, isLoginPage, isMobile, isSidebarOpen]);

    // Real-time role watch
    useEffect(() => {
        if (!loading && !isAdmin && !isLoginPage) {
            router.replace("/");
        }
    }, [loading, isAdmin, isLoginPage, router]);

    if (isLoginPage) return <>{children}</>;
    if (loading || !isAdmin) return <AdminLoadingScreen />;

    return (
        <ToastProvider>
            <div className="flex h-screen bg-gray-50/50 overflow-hidden">
                {/* Backdrop for mobile */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
                    <AdminHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-full">
                        <div className="mx-auto max-w-7xl h-full">
                            {children}
                        </div>
                    </main>
                </div>
                <ToastContainer />
            </div>
        </ToastProvider>
    );
}
