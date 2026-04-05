// src/types/auth.types.ts
// Central auth type definitions — single source of truth for the entire auth system.

import type { User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

// Plain FirestoreUser for client components
export interface PlainFirestoreUser {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    photoURL?: string | null;
    isActive: boolean;
    status?: "active" | "suspended";
    lastLoginAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface PlainUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
}

// ─── Role Enum ───────────────────────────────────────────────────────────────
// Ordered from HIGHEST privilege to LOWEST.
// OWNER is the single superuser — only ONE may exist.
// CRITICAL: Any change here MUST be reflected in Firestore rules.

export enum UserRole {
    OWNER = "owner",     // Unrestricted — cannot be deleted or demoted
    ADMIN = "admin",     // Full CMS control except owner management
    EDITOR = "editor",   // Create/edit/delete OWN posts, access editor panel
    REPORTER = "reporter",  // Create posts only (no edit/delete of others)
    USER = "user",      // Read, bookmark, comment
}

// ─── Permission Enum ─────────────────────────────────────────────────────────

export enum Permission {
    READ_POSTS = "read_posts",
    CREATE_POSTS = "create_posts",
    EDIT_OWN_POSTS = "edit_own_posts",
    EDIT_ALL_POSTS = "edit_all_posts",
    DELETE_OWN_POSTS = "delete_own_posts",
    DELETE_POSTS = "delete_posts",
    MANAGE_USERS = "manage_users",
    ACCESS_ADMIN = "access_admin",
    ACCESS_EDITOR = "access_editor",
    VIEW_ANALYTICS = "view_analytics",
    MANAGE_SETTINGS = "manage_settings",
    ASSIGN_ROLES = "assign_roles",
}

// ─── Firestore User Document ──────────────────────────────────────────────────

export interface FirestoreUser {
    uid: string;
    name: string;
    email: string;
    role: UserRole;
    photoURL?: string | null;
    isActive: boolean;
    status?: "active" | "suspended";
    lastLoginAt: Timestamp | string;
    createdAt: Timestamp | string;
    updatedAt: Timestamp | string;
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

export interface AuthContextType {
    user: PlainUser | null;
    firestoreUser: PlainFirestoreUser | null;
    role: UserRole | null;
    loading: boolean;
    error: Error | null;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signUp: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
    // Computed role booleans — checked against the full hierarchy
    isOwner: boolean;
    isAdmin: boolean;   // true if owner OR admin
    isEditor: boolean;  // true if owner, admin, OR editor
    isReporter: boolean;
    hasPermission: (permission: Permission) => boolean;
}

// ─── Session Verification (API layer) ─────────────────────────────────────────

export interface SessionVerifyResponse {
    authenticated: boolean;
    uid: string;
    role: UserRole;
}
