import { db } from "@/lib/firebase";
import { serializeData } from "./serialization";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    serverTimestamp,
    doc,
    updateDoc,
    increment
} from "firebase/firestore";

export interface ForumPost {
    id?: string;
    title: string;
    content: string;
    userId: string;
    userName: string;
    category: string;
    createdAt: any;
    likes: number;
    commentCount: number;
    likedBy?: string[]; // Track who liked it
}

export interface ForumComment {
    id?: string;
    postId: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: any;
}

const FORUM_POSTS = "forum_posts";
const FORUM_COMMENTS = "forum_comments";

export async function createForumPost(post: Omit<ForumPost, 'id' | 'createdAt' | 'likes' | 'commentCount' | 'likedBy'>) {
    return await addDoc(collection(db, FORUM_POSTS), {
        ...post,
        createdAt: serverTimestamp(),
        likes: 0,
        commentCount: 0,
        likedBy: []
    });
}

export async function deleteForumPost(postId: string) {
    const { deleteDoc, doc } = await import("firebase/firestore");
    return await deleteDoc(doc(db, FORUM_POSTS, postId));
}

export async function likeForumPost(postId: string, userId: string) {
    const { arrayUnion } = await import("firebase/firestore");
    const postRef = doc(db, FORUM_POSTS, postId);
    return await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
    });
}

export async function getForumPosts(category?: string, limitCount = 50) {
    const coll = collection(db, FORUM_POSTS);
    let q;

    if (category && category !== 'all') {
        q = query(
            coll,
            where("category", "==", category),
            limit(limitCount)
        );
    } else {
        q = query(
            coll,
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
    }

    const snap = await getDocs(q);
    const posts = snap.docs.map(d => serializeData({
        id: d.id,
        ...d.data(),
        likes: d.data().likes || 0,
        commentCount: d.data().commentCount || 0,
        likedBy: d.data().likedBy || []
    }) as ForumPost);

    return posts.sort((a: any, b: any) => {
        // Fallback local sort if search query forced us to remove orderBy locally
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA;
    });
}

export async function addForumComment(comment: Omit<ForumComment, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, FORUM_COMMENTS), {
        ...comment,
        createdAt: serverTimestamp()
    });

    // Update post count
    const postRef = doc(db, FORUM_POSTS, comment.postId);
    await updateDoc(postRef, {
        commentCount: increment(1)
    });

    return docRef;
}
export async function getForumComments(postId: string) {
    const q = query(
        collection(db, FORUM_COMMENTS),
        where("postId", "==", postId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => serializeData({ id: d.id, ...d.data() }) as ForumComment)
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}
