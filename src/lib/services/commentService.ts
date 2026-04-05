import { db } from "@/lib/firebase";
import {
    collectionGroup,
    query,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    orderBy,
} from "firebase/firestore";
import { Comment } from "@/types/admin";

// ─── FETCH ALL COMMENTS FROM ALL POSTS ─────────────────────────
export async function fetchAllComments(): Promise<Comment[]> {
    const commentsQuery = query(
        collectionGroup(db, "comments"),
        orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(commentsQuery);

    return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const postRef = docSnap.ref.parent.parent;

        return {
            id: docSnap.id,
            postId: postRef?.id || "",
            postTitle: data.postTitle || "Untitled Post",
            name: data.name || data.authorName || "Anonymous",
            message: data.message || data.content || "",
            createdAt: data.createdAt,
            status: data.status ? data.status : (data.isApproved === false ? "pending" : "approved"),
        } as Comment;
    });
}

// ─── UPDATE COMMENT STATUS ─────────────────────────────────────
export async function updateCommentStatus(
    postId: string,
    commentId: string,
    status: "approved" | "pending" | "rejected"
): Promise<void> {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await updateDoc(commentRef, { status, isApproved: status === 'approved' });
}

// ─── DELETE COMMENT ─────────────────────────────────────────────
export async function deleteComment(
    postId: string,
    commentId: string
): Promise<void> {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await deleteDoc(commentRef);
}
