// src/lib/auth-context.tsx
// Backward-compatibility bridge for the new AuthContext system.
// Existing components that use: import { useAuth } from "@/lib/auth-context"
// continue to work unchanged via this shim.

"use client";

export { AuthProvider } from "@/context/AuthContext";
import { useAuth as useNewAuth } from "@/context/AuthContext";
import type { User } from "firebase/auth";
import type { UserRole } from "@/types/auth.types";

interface LegacyAuthContextType {
    user: any;
    userRole: UserRole | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export function useAuth(): LegacyAuthContextType & { isAdmin: boolean } {
    const ctx = useNewAuth();
    return {
        user: ctx.user,
        userRole: ctx.role,
        loading: ctx.loading,
        login: ctx.signIn,
        logout: ctx.signOut,
        isAdmin: ctx.isAdmin,
    };
}
