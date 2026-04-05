// ============================================================
// lib/firestore/comments.ts
// All Firestore operations for comment management
// Handles subcollection queries across all posts
// ============================================================

import { db } from "@/lib/firebase";
import {
    collectionGroup,
    query,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    Timestamp,
} from "firebase/firestore";
import { serializeData } from "@/lib/serialization";
import { Comment } from "@/types";

/**
 * Fetches ALL comments from ALL posts using collectionGroup query.
 * Also resolves post titles by reading parent post documents.
 */
export async function fetchAllComments(): Promise<Comment[]> {
    const commentsQuery = query(
        collectionGroup(db, "comments"),
        orderBy("createdAt", "desc")
    );

    const TITLE_CACHE: Record<string, string> = {}; // Local session cache

    try {
        const snapshot = await getDocs(commentsQuery);
        const postIds = new Set<string>();

        const rawComments = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const pathSegments = docSnap.ref.path.split("/");
            const postId = pathSegments[1];
            if (postId) postIds.add(postId);

            return serializeData({
                id: docSnap.id,
                postId,
                postTitle: "",
                name: data.name || data.authorName || "Anonymous",
                message: data.message || data.content || "",
                createdAt: data.createdAt,
                status: data.status || "pending",
            }) as Comment;
        });

        // Batch-fetch post titles (Optimized: Check cache first)
        const fetchTitle = async (postId: string) => {
            if (TITLE_CACHE[postId]) return TITLE_CACHE[postId];
            try {
                const postDoc = await getDoc(doc(db, "posts", postId));
                const title = postDoc.exists() ? postDoc.data().title : "Deleted Post";
                TITLE_CACHE[postId] = title;
                return title;
            } catch { return "Unknown Post"; }
        };

        const postTitleEntries = await Promise.all(
            Array.from(postIds).map(async (id) => [id, await fetchTitle(id)] as [string, string])
        );

        const postTitles = Object.fromEntries(postTitleEntries);

        return rawComments.map((comment) => ({
            ...comment,
            postTitle: postTitles[comment.postId] || "Unknown Post",
        }));
    } catch (error: any) {
        console.error("Firestore CollectionGroup Error:", error);
        if (error.message?.includes("index")) {
            console.error("Missing Index URL:", error.message);
        }
        throw error;
    }
}

/**
 * Updates a comment's status (approve/reject)
 */
export async function updateCommentStatus(
    postId: string,
    commentId: string,
    status: "approved" | "rejected"
): Promise<void> {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await updateDoc(commentRef, { status, isApproved: status === 'approved' });
}

/**
 * Permanently deletes a comment
 */
export async function deleteComment(
    postId: string,
    commentId: string
): Promise<void> {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await deleteDoc(commentRef);
}
