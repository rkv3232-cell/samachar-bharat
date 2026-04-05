'use client';

import { useAuth } from "@/lib/auth-context";
import { Action, hasPermission } from "@/lib/rbac";
import { UserRole } from "@/types";
import { useEffect, useState } from "react";

export function usePermission(action: Action) {
    const { userRole, loading } = useAuth();
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        if (!loading) {
            setAllowed(hasPermission(userRole, action));
        }
    }, [userRole, loading, action]);

    return { allowed, loading };
}

export function ProtectedRoute({ children, requiredAction, fallback = null }: { children: React.ReactNode, requiredAction: Action, fallback?: React.ReactNode }) {
    const { allowed, loading } = usePermission(requiredAction);

    if (loading) return null;
    if (!allowed) return fallback;

    return <>{children}</>;
}
