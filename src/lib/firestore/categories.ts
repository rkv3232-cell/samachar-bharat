// ============================================================
// lib/firestore/categories.ts
// All Firestore operations for category management
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
import { Category } from "@/types";

/**
 * Fetches all categories sorted alphabetically
 */
export async function fetchCategories(): Promise<Category[]> {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name,
        slug: docSnap.data().slug,
    }));
}

/**
 * Adds a new category with name and slug
 */
export async function addCategory(
    name: string,
    slug: string
): Promise<string> {
    const docRef = await addDoc(collection(db, "categories"), { name, slug });
    return docRef.id;
}

/**
 * Permanently deletes a category
 */
export async function deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(db, "categories", id));
}
