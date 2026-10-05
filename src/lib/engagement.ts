// src/lib/engagement.ts
// Handles user likes and bookmarks via server-side API with instant local caching.
// ZERO network calls on card mount -> prevents server socket starvation and delays.

function getLocalSet(key: string): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
        const raw = localStorage.getItem(key);
        return new Set(raw ? JSON.parse(raw) : []);
    } catch {
        return new Set();
    }
}

function saveLocalSet(key: string, set: Set<string>): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(Array.from(set)));
    } catch { }
}

export function isPostLikedLocally(postId: string, userId: string | null): boolean {
    const key = userId ? `sb_likes_${userId}` : 'liked_posts';
    return getLocalSet(key).has(postId);
}

export function setPostLikedLocally(postId: string, userId: string | null, liked: boolean): void {
    const key = userId ? `sb_likes_${userId}` : 'liked_posts';
    const set = getLocalSet(key);
    if (liked) set.add(postId);
    else set.delete(postId);
    saveLocalSet(key, set);
}

export function isPostBookmarkedLocally(postId: string, userId: string | null): boolean {
    const key = userId ? `sb_bookmarks_${userId}` : 'bookmarked_posts';
    return getLocalSet(key).has(postId);
}

export function setPostBookmarkedLocally(postId: string, userId: string | null, bookmarked: boolean): void {
    const key = userId ? `sb_bookmarks_${userId}` : 'bookmarked_posts';
    const set = getLocalSet(key);
    if (bookmarked) set.add(postId);
    else set.delete(postId);
    saveLocalSet(key, set);
}

/**
 * Toggles a like status via server-side API.
 */
export const toggleLikeStatus = async (postId: string, userId: string | null, isLiking: boolean) => {
    if (!postId) return;
    setPostLikedLocally(postId, userId, isLiking);
    try {
        const response = await fetch('/api/engagement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle-like', postId, userId, isLiking })
        });
        if (!response.ok) throw new Error('API Toggle Failed');
        return await response.json();
    } catch (error) {
        console.error("Failed to toggle like on post:", error);
        throw error;
    }
};

/**
 * Checks if an authenticated user has liked a post (cached first, never blocks).
 */
export const fetchUserHasLiked = async (postId: string, userId: string): Promise<boolean> => {
    if (!postId || !userId) return false;
    return isPostLikedLocally(postId, userId);
};

/**
 * Checks if an authenticated user has bookmarked a post (cached first, never blocks).
 */
export const fetchUserHasBookmarked = async (postId: string, userId: string): Promise<boolean> => {
    if (!postId || !userId) return false;
    return isPostBookmarkedLocally(postId, userId);
};

/**
 * Toggles a bookmark status via server-side API.
 */
export const toggleBookmarkStatus = async (postId: string, userId: string | null, isBookmarking: boolean) => {
    if (!postId || !userId) return;
    setPostBookmarkedLocally(postId, userId, isBookmarking);
    try {
        const response = await fetch('/api/engagement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle-bookmark', postId, userId, isBookmarking })
        });
        if (!response.ok) throw new Error('API Toggle Failed');
        return await response.json();
    } catch (error) {
        console.error("Failed to toggle bookmark on post:", error);
        throw error;
    }
};
