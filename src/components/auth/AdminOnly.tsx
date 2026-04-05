// src/components/auth/AdminOnly.tsx
// Shorthand wrapper that renders children only for UserRole.ADMIN.

"use client";

import { type ReactNode } from "react";
import { RoleGate } from "@/components/auth/RoleGate";
import { UserRole } from "@/types/auth.types";

interface AdminOnlyProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export function AdminOnly({ children, fallback }: AdminOnlyProps) {
    return (
        <RoleGate allowedRoles={[UserRole.OWNER, UserRole.ADMIN]} fallback={fallback}>
            {children}
        </RoleGate>
    );
}
