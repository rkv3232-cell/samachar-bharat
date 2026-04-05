// src/hooks/useRequireAdmin.ts
// Specialized hook for admin-only pages.
// Non-admins are redirected immediately — no UI shows.

"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { UserRole } from "@/types/auth.types";

export function useRequireAdmin() {
    return useRequireAuth(UserRole.ADMIN);
}
