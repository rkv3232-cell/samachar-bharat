// src/lib/permissions.ts
// Role-to-permission mapping — the canonical RBAC matrix for this CMS.
// OWNER is the superuser with all permissions.
// This is consumed by AuthContext, RoleGate, PermissionGate, and middleware.

import { Permission, UserRole } from "@/types/auth.types";

// ─── Role → Permission Map ────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.OWNER]: [
        // Owner has ALL permissions
        Permission.READ_POSTS,
        Permission.CREATE_POSTS,
        Permission.EDIT_OWN_POSTS,
        Permission.EDIT_ALL_POSTS,
        Permission.DELETE_OWN_POSTS,
        Permission.DELETE_POSTS,
        Permission.MANAGE_USERS,
        Permission.ACCESS_ADMIN,
        Permission.ACCESS_EDITOR,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_SETTINGS,
        Permission.ASSIGN_ROLES,
    ],
    [UserRole.ADMIN]: [
        Permission.READ_POSTS,
        Permission.CREATE_POSTS,
        Permission.EDIT_OWN_POSTS,
        Permission.EDIT_ALL_POSTS,
        Permission.DELETE_POSTS,
        Permission.MANAGE_USERS,
        Permission.ACCESS_ADMIN,
        Permission.ACCESS_EDITOR,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_SETTINGS,
        Permission.ASSIGN_ROLES,
    ],
    [UserRole.EDITOR]: [
        Permission.READ_POSTS,
        Permission.CREATE_POSTS,
        Permission.EDIT_OWN_POSTS,
        Permission.DELETE_OWN_POSTS,
        Permission.ACCESS_EDITOR,
        Permission.VIEW_ANALYTICS,
    ],
    [UserRole.REPORTER]: [
        Permission.READ_POSTS,
        Permission.CREATE_POSTS,
        Permission.EDIT_OWN_POSTS,
        Permission.ACCESS_EDITOR,
    ],
    [UserRole.USER]: [
        Permission.READ_POSTS,
    ],
};

// ─── Utility: Check a single permission ──────────────────────────────────────

export function hasPermission(
    role: UserRole | null | undefined,
    permission: Permission
): boolean {
    if (!role) return false;
    const permissions = ROLE_PERMISSIONS[role];
    return permissions ? permissions.includes(permission) : false;
}

// ─── Role Hierarchy Level (higher = more privileged) ─────────────────────────

const ROLE_LEVEL: Record<UserRole, number> = {
    [UserRole.OWNER]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.EDITOR]: 3,
    [UserRole.REPORTER]: 2,
    [UserRole.USER]: 1,
};

export function getRoleLevel(role: UserRole): number {
    return ROLE_LEVEL[role] ?? 0;
}

// ─── Utility: Check if role meets or exceeds minimum required level ───────────

export function hasMinimumRole(
    userRole: UserRole | null | undefined,
    minimumRole: UserRole
): boolean {
    if (!userRole) return false;
    return getRoleLevel(userRole) >= getRoleLevel(minimumRole);
}

// ─── Utility: Coerce a raw string to UserRole safely ─────────────────────────

export function toUserRole(raw: string | undefined | null): UserRole {
    const ALL_ROLES = Object.values(UserRole) as string[];
    if (raw && ALL_ROLES.includes(raw)) {
        return raw as UserRole;
    }
    return UserRole.USER; // Safe default — never elevates
}

// ─── Utility: Check if actor can manage target role ──────────────────────────
// SECURITY: Owner can never be modified by anyone including another owner.

export function canActorManageRole(
    actorRole: UserRole | null | undefined,
    targetRole: UserRole
): boolean {
    if (!actorRole) return false;
    // Nobody can target the owner role or assign it
    if (targetRole === UserRole.OWNER) return false;
    // Actor must be strictly more privileged than target
    return getRoleLevel(actorRole) > getRoleLevel(targetRole);
}
