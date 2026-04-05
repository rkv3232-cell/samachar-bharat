// src/components/auth/PermissionGate.tsx
// Conditionally renders children based on a specific Permission enum value.

"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Permission } from "@/types/auth.types";

interface PermissionGateProps {
    permission: Permission;
    children: ReactNode;
    fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback }: PermissionGateProps) {
    const { hasPermission, loading } = useAuth();

    if (loading) return null;

    if (!hasPermission(permission)) {
        return fallback ? <>{fallback}</> : null;
    }

    return <>{children}</>;
}
