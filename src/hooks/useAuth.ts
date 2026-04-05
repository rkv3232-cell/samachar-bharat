// src/hooks/useAuth.ts
// Typed hook that consumes AuthContext. Throws if used outside AuthProvider.

"use client";

import { useAuth as useAuthContext } from "@/context/AuthContext";
import type { AuthContextType } from "@/types/auth.types";

export function useAuth(): AuthContextType {
    return useAuthContext();
}
