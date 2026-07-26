// src/lib/auth-context.tsx
// Backward-compatibility bridge for the new AuthContext system.
// Existing components that use: import { useAuth } from "@/lib/auth-context"
// continue to work unchanged via this shim.

"use client";

export { AuthProvider } from "@/context/AuthContext";
import { useAuth as useNewAuth, type AuthContextType } from "@/context/AuthContext";
import type { User } from "firebase/auth";
import type { UserRole } from "@/types/auth.types";

interface LegacyAuthContextType {
    user: any;
    userRole: UserRole | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

import { useMemo } from "react";

export function useAuth(): AuthContextType & { login: any; logout: any; userRole: any; firestoreUser: any } {
    const ctx = useNewAuth();
    return useMemo(
        () => ({
            ...ctx,
            firestoreUser: ctx.firestoreUser,
            login: ctx.signIn,
            logout: ctx.signOut,
            userRole: ctx.role,
        }),
        [ctx]
    );
}
