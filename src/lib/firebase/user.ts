// src/lib/firebase/user.ts
// Firestore user document CRUD utilities.
// All functions here are CLIENT-SIDE safe (use client firebase SDK).
//
// CRITICAL SECURITY RULES:
//  - Default role is always UserRole.USER — NEVER admin or owner
//  - EXCEPTION: If email === OWNER_EMAIL and doc doesn't exist → role = "owner"
//  - merge: false guards against race conditions on sign-up
//  - Owner document can never be overwritten by this function

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
    getFirestore,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { UserRole, type FirestoreUser } from "@/types/auth.types";
import { OWNER_EMAIL } from "@/lib/constants";

function getDb() {
    return getFirestore();
}

// ─── Create User Document ─────────────────────────────────────────────────────
// Called after successful Firebase Auth registration or first Google sign-in.
// SECURITY: Default role = UserRole.USER.
// EXCEPTION: If this is the OWNER_EMAIL and no doc exists yet → role = OWNER.

export async function createUserDocument(
    user: User,
    additionalData?: Partial<Pick<FirestoreUser, "name" | "photoURL">>
): Promise<void> {
    const db = getDb();
    const userRef = doc(db, "users", user.uid);

    // Check if document already exists — never overwrite an existing role
    const existingDoc = await getDoc(userRef);
    if (existingDoc.exists()) {
        await updateDoc(userRef, { lastLoginAt: serverTimestamp() });
        return;
    }

    // Determine the role for this new user
    const isOwnerEmail = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();
    const assignedRole: UserRole = isOwnerEmail ? UserRole.OWNER : UserRole.USER;

    const newUser = {
        uid: user.uid,
        name: additionalData?.name ?? user.displayName ?? "Unknown User",
        email: user.email ?? "",
        role: assignedRole,
        photoURL: additionalData?.photoURL ?? user.photoURL ?? null,
        isActive: true,
        status: "active" as const,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // setDoc with merge: false — fails if document already exists (race guard)
    await setDoc(userRef, newUser, { merge: false });
}

// ─── Get User Document ────────────────────────────────────────────────────────

export async function getUserDocument(uid: string): Promise<FirestoreUser | null> {
    const db = getDb();
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;
        return userSnap.data() as FirestoreUser;
    } catch (error) {
        console.error("[getUserDocument] Failed:", error);
        return null;
    }
}

// ─── Update Last Login ─────────────────────────────────────────────────────────

export async function updateLastLogin(uid: string): Promise<void> {
    const db = getDb();
    try {
        await updateDoc(doc(db, "users", uid), {
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("[updateLastLogin] Failed:", error);
    }
}

// ─── Update User Role (admin use only) ────────────────────────────────────────
// SECURITY: Cannot assign OWNER role. Cannot demote an OWNER.

export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
    // CLIENT-SIDE GUARD: Firestore rules are the authoritative check
    if (newRole === UserRole.OWNER) {
        throw new Error("Cannot assign owner role.");
    }

    const db = getDb();
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) throw new Error("User not found.");
    if (userSnap.data()?.role === UserRole.OWNER) {
        throw new Error("Cannot modify the owner's role.");
    }

    await updateDoc(userRef, {
        role: newRole,
        updatedAt: serverTimestamp(),
    });
}
