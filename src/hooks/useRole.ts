// src/hooks/useRole.ts
// Provides convenient role-access booleans and the raw role value.
// isAdmin and isEditor are INCLUSIVE (owner satisfies them too).

"use client";

import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/auth.types";

export interface UseRoleReturn {
    user: ReturnType<typeof useAuth>["user"];
    role: UserRole | null;
    loading: boolean;
    isOwner: boolean;
    isAdmin: boolean;       // true if owner OR admin
    isEditor: boolean;      // true if owner, admin, OR editor
    isReporter: boolean;    // true if owner, admin, editor, OR reporter
    isUser: boolean;        // true for any authenticated user
    isAuthenticated: boolean;
}

export function useRole(): UseRoleReturn {
    const { user, role, loading, isOwner, isAdmin, isEditor, isReporter } = useAuth();

    return {
        user,
        role,
        loading,
        isOwner,
        isAdmin,
        isEditor,
        isReporter,
        isUser: user !== null,
        isAuthenticated: user !== null,
    };
}
