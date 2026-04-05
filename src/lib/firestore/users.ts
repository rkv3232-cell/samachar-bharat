// ============================================================
// lib/firestore/users.ts
// All Firestore operations for user management
// ============================================================

import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
    serverTimestamp,
} from "firebase/firestore";
import { UserData } from "@/types";

/**
 * Fetches all users ordered by creation date (newest first)
 */
export async function fetchAllUsers(): Promise<UserData[]> {
    const usersQuery = query(
        collection(db, "users"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(usersQuery);

    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name || "",
            email: data.email || "",
            role: data.role || "user",
            createdAt:
                data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate()
                    : new Date(data.createdAt || Date.now()),
        };
    });
}

/**
 * Adds a new user document to Firestore
 */
export async function addUser(userData: {
    name: string;
    email: string;
    role: "admin" | "editor" | "user";
}): Promise<string> {
    const docRef = await addDoc(collection(db, "users"), {
        ...userData,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

/**
 * Updates a user's role
 */
export async function updateUserRole(
    userId: string,
    role: "admin" | "editor" | "user"
): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role });
}

/**
 * Permanently deletes a user document
 */
export async function deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
}
