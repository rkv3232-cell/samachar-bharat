// src/lib/rbac.ts
// Legacy RBAC module — updated for the new 5-role system with owner support.
// Kept for backward compatibility with usePermission.tsx and existing code.

import { UserRole, Permission } from "@/types/auth.types";
import { hasPermission as checkPermission, ROLE_PERMISSIONS } from "@/lib/permissions";

// Re-export Action type for backward compatibility
export type Action =
    | "view_dashboard"
    | "create_post"
    | "edit_own_post"
    | "edit_any_post"
    | "delete_post"
    | "publish_post"
    | "manage_users"
    | "manage_settings"
    | "manage_roles";

// Map old Action strings to new Permission enum values
const ACTION_TO_PERMISSION: Record<Action, Permission> = {
    view_dashboard: Permission.ACCESS_ADMIN,
    create_post: Permission.CREATE_POSTS,
    edit_own_post: Permission.EDIT_OWN_POSTS,
    edit_any_post: Permission.EDIT_ALL_POSTS,
    delete_post: Permission.DELETE_POSTS,
    publish_post: Permission.CREATE_POSTS,
    manage_users: Permission.MANAGE_USERS,
    manage_settings: Permission.MANAGE_SETTINGS,
    manage_roles: Permission.ASSIGN_ROLES,
};

// Backward-compatible hasPermission for old Action-based callers
export const hasPermission = (
    userRole: UserRole | string | undefined | null,
    action: Action
): boolean => {
    if (!userRole) return false;
    const permission = ACTION_TO_PERMISSION[action];
    return checkPermission(userRole as UserRole, permission);
};

// Re-export for anyone importing from rbac.ts
export { UserRole, Permission, ROLE_PERMISSIONS };
