import { db } from "@/lib/firebase";
import {
    collection,
    query,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { User } from "@/types/admin";

// ─── FETCH ALL USERS ────────────────────────────────────────────
export async function fetchAllUsers(): Promise<User[]> {
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
            createdAt: data.createdAt,
        } as User;
    });
}

// ─── ADD NEW USER ───────────────────────────────────────────────
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

// ─── UPDATE USER ROLE ───────────────────────────────────────────
export async function updateUserRole(
    userId: string,
    role: "admin" | "editor" | "user"
): Promise<void> {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role });
}

// ─── DELETE USER ────────────────────────────────────────────────
export async function deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
}
