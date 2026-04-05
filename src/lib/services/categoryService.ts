import { db } from "@/lib/firebase";
import {
    collection,
    query,
    getDocs,
    doc,
    addDoc,
    deleteDoc,
    orderBy,
} from "firebase/firestore";
import { Category } from "@/types/admin";

// ─── SLUG GENERATOR ────────────────────────────────────────────
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

// ─── FETCH ALL CATEGORIES ──────────────────────────────────────
export async function fetchAllCategories(): Promise<Category[]> {
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            name: data.name || "",
            slug: data.slug || "",
        } as Category;
    });
}

// ─── ADD CATEGORY ───────────────────────────────────────────────
export async function addCategory(name: string): Promise<string> {
    const slug = generateSlug(name);
    const docRef = await addDoc(collection(db, "categories"), { name, slug });
    return docRef.id;
}

// ─── DELETE CATEGORY ────────────────────────────────────────────
export async function deleteCategory(categoryId: string): Promise<void> {
    await deleteDoc(doc(db, "categories", categoryId));
}
