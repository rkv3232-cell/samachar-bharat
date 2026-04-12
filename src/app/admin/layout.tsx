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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const isLoginPage = pathname === "/admin/login";

    // Close sidebar on navigation (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // ─── Diagnostics ───
    useEffect(() => {
        console.log("[AdminLayout] Check:", {
            pathname,
            isLoginPage,
            loading,
            isAdmin,
            email: user?.email
        });
    }, [loading, isAdmin, role, user, pathname, isLoginPage]);

    // Real-time role watch — if admin/owner access is revoked, redirect immediately
    // EXCEPT for the login page itself!
    useEffect(() => {
        if (!loading && !isAdmin && !isLoginPage) {
            console.log("[AdminLayout] Access Denied, redirecting...");
            // Use replace "/" safely
            router.replace("/");
        }
    }, [loading, isAdmin, isLoginPage, router]);

    // OPT-OUT for login page:
    // If we're on the login page, just render the child (which is the login form)
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Show neutral loading screen — never show admin UI during loading
    if (loading || !isAdmin) {
        return <AdminLoadingScreen />;
    }

    return (
        <ToastProvider>
            <div className="flex h-screen bg-gray-50/50">
                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

                <div className="flex-1 flex flex-col overflow-hidden w-full">
                    <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
                        {children}
                    </main>
                </div>
                <ToastContainer />
            </div>
        </ToastProvider>
    );
}
