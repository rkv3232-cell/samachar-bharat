// ============================================================
// lib/firestore/tags.ts
// All Firestore operations for tag management
// ============================================================

import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { Tag } from "@/types";

/**
 * Fetches all tags sorted alphabetically
 */
export async function fetchTags(): Promise<Tag[]> {
    const q = query(collection(db, "tags"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name,
    }));
}

/**
 * Adds a new tag
 */
export async function addTag(name: string): Promise<string> {
    const docRef = await addDoc(collection(db, "tags"), { name });
    return docRef.id;
}

/**
 * Permanently deletes a tag
 */
export async function deleteTag(id: string): Promise<void> {
    await deleteDoc(doc(db, "tags", id));
}
