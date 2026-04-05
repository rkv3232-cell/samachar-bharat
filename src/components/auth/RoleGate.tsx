// src/components/auth/RoleGate.tsx
// Conditionally renders children based on the current user's role.
// Shows nothing during loading to prevent flash of restricted content.

"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth.types";

interface RoleGateProps {
    allowedRoles: UserRole[];
    children: ReactNode;
    /** Optional fallback rendered when role doesn't match (and not loading) */
    fallback?: ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback }: RoleGateProps) {
    const { role, loading } = useAuth();

    // Show nothing during auth initialization — never show fallback during loading
    if (loading) return null;

    const isAllowed = role !== null && allowedRoles.includes(role);

    if (!isAllowed) {
        return fallback ? <>{fallback}</> : null;
    }

    return <>{children}</>;
}
