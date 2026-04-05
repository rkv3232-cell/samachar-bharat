// src/hooks/usePermissions.ts
// Granular permission checker functions for every RBAC operation.
// All functions are pure (no side effects) — safe to call anywhere.

"use client";

import { useRole } from "@/hooks/useRole";
import { UserRole } from "@/types/auth.types";
import { canActorManageRole } from "@/lib/permissions";
import { ASSIGNABLE_ROLES_BY_ROLE } from "@/lib/constants";

export function usePermissions() {
    const { role, isOwner, isAdmin, isEditor, isAuthenticated } = useRole();

    return {
        // ── Post permissions ────────────────────────────────────────────────────
        canCreatePost: (): boolean =>
            isEditor, // owner, admin, editor can create

        canEditPost: (authorId: string, currentUserId: string | undefined): boolean => {
            if (!currentUserId) return false;
            if (isAdmin) return true;                       // owner/admin edits anything
            if (isEditor && authorId === currentUserId) return true; // editor/reporter own posts
            return false;
        },

        canDeletePost: (authorId: string, currentUserId: string | undefined): boolean => {
            if (!currentUserId) return false;
            if (isAdmin) return true;                       // owner/admin deletes anything
            if (isEditor && authorId === currentUserId) return true; // editor own posts
            return false;
        },

        // ── User management permissions ─────────────────────────────────────────
        canManageUsers: (): boolean => isAdmin,

        canDeleteUser: (targetRole: UserRole): boolean => {
            if (!role) return false;
            // CRITICAL: Nobody can delete the owner
            if (targetRole === UserRole.OWNER) return false;
            // Owner can delete anyone (except owner — handled above)
            if (isOwner) return true;
            // Admin can delete roles strictly below admin (editor, reporter, user)
            if (role === UserRole.ADMIN) {
                return canActorManageRole(role, targetRole);
            }
            return false;
        },

        // ── Role assignment permissions ─────────────────────────────────────────
        canAssignRoles: (): boolean => isAdmin,

        canChangeRole: (targetRole: UserRole): boolean => {
            if (!role) return false;
            return canActorManageRole(role, targetRole);
        },

        // Returns the list of roles this actor is allowed to assign
        getAssignableRoles: (): UserRole[] => {
            if (!role) return [];
            const assignable = ASSIGNABLE_ROLES_BY_ROLE[role] ?? [];
            return assignable as UserRole[];
        },

        // ── Panel access permissions ────────────────────────────────────────────
        canAccessAdmin: (): boolean => isAdmin,
        canAccessEditor: (): boolean => isEditor,

        // ── General ─────────────────────────────────────────────────────────────
        isAuthenticated,
        isOwner,
        isAdmin,
        isEditor,
        role,
    };
}
