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
import { Tag } from "@/types/admin";

// ─── FETCH ALL TAGS ─────────────────────────────────────────────
export async function fetchAllTags(): Promise<Tag[]> {
    const q = query(collection(db, "tags"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name || "",
    })) as Tag[];
}

// ─── ADD TAG ────────────────────────────────────────────────────
export async function addTag(name: string): Promise<string> {
    const docRef = await addDoc(collection(db, "tags"), { name });
    return docRef.id;
}

// ─── DELETE TAG ─────────────────────────────────────────────────
export async function deleteTag(tagId: string): Promise<void> {
    await deleteDoc(doc(db, "tags", tagId));
}
