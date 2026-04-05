import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Atomically increments the view count for a post.
 * Uses fire-and-forget pattern. Does NOT block rendering.
 */
export const incrementPostView = async (postId: string) => {
    if (!postId) return;

    try {
        const docRef = doc(db, 'posts', postId);
        await updateDoc(docRef, {
            views: increment(1),
            lastViewedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to increment view count:", error);
    }
};

/**
 * Format numbers for clean UI display (e.g. 1500 -> 1.5K)
 */
export const formatViewCount = (count: number | undefined | null): string => {
    if (count === undefined || count === null) return '0';
    if (count < 1000) return count.toString();
    if (count < 1000000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
};
