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

// In-memory cache for categories (5-minute TTL)
let categoriesCache: { data: Category[]; expiresAt: number } | null = null;
const CATEGORIES_CACHE_TTL = 5 * 60 * 1000;

export function invalidateCategoriesCache() {
    categoriesCache = null;
}

/**
 * Fetches all categories sorted alphabetically with in-memory caching
 */
export async function fetchCategories(): Promise<Category[]> {
    if (categoriesCache && Date.now() < categoriesCache.expiresAt) {
        return categoriesCache.data;
    }

    try {
        const q = query(collection(db, "categories"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);

        const data: Category[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            name: docSnap.data().name,
            slug: docSnap.data().slug,
        }));

        categoriesCache = { data, expiresAt: Date.now() + CATEGORIES_CACHE_TTL };
        return data;
    } catch (err) {
        console.warn("[fetchCategories] Error, returning cached or empty:", err);
        return categoriesCache?.data || [];
    }
}

/**
 * Adds a new category with name and slug
 */
export async function addCategory(
    name: string,
    slug: string
): Promise<string> {
    invalidateCategoriesCache();
    const docRef = await addDoc(collection(db, "categories"), { name, slug });
    return docRef.id;
}

/**
 * Permanently deletes a category
 */
export async function deleteCategory(id: string): Promise<void> {
    invalidateCategoriesCache();
    await deleteDoc(doc(db, "categories", id));
}
