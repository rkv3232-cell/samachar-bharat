// src/hooks/useRequireAuth.ts
// Hook that enforces authentication and optionally a minimum role.
// Owner always passes any role check (highest privilege).

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth.types";
import { hasMinimumRole } from "@/lib/permissions";

interface UseRequireAuthReturn {
    user: ReturnType<typeof useAuth>["user"];
    role: UserRole | null;
    loading: boolean;
}

export function useRequireAuth(requiredRole?: UserRole): UseRequireAuthReturn {
    const { user, role, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (requiredRole && !hasMinimumRole(role, requiredRole)) {
            router.replace("/");
        }
    }, [user, role, loading, requiredRole, router]);

    return { user, role, loading };
}
