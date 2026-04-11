// src/lib/constants.ts
// Central constants for the RBAC system.
// OWNER_EMAIL is the single source of truth for the owner account.
// Never allow this to be changed at runtime.

// ─── Owner Configuration ──────────────────────────────────────────────────────
// CRITICAL: This is the ONE user who can never be deleted or demoted.
// Change this to your actual owner email before deployment.
export const OWNER_EMAIL = "ckv3232@gmail.com";

// ─── Role Hierarchy (numeric levels for comparison) ──────────────────────────
export const ROLE_HIERARCHY = {
    owner: 5,
    admin: 4,
    editor: 3,
    reporter: 2,
    user: 1,
} as const;

// ─── Route → Minimum Required Role ───────────────────────────────────────────
export const ROUTE_ROLE_MAP: Record<string, string> = {
    "/admin": "admin",
    "/editor": "editor",
};

// ─── Assignable Roles by Actor ────────────────────────────────────────────────
// Defines which roles each actor is allowed to assign.
// CRITICAL: "owner" must NEVER appear in any assignable list.
export const ASSIGNABLE_ROLES_BY_ROLE: Record<string, string[]> = {
    owner: ["admin", "editor", "reporter", "user"],
    admin: ["editor", "reporter", "user"],
    editor: [],
    reporter: [],
    user: [],
};
