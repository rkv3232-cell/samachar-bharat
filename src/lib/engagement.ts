// src/lib/engagement.ts
// Handles user likes and bookmarks via server-side API to bypass client-side security restrictions.

/**
 * Toggles a like status via server-side API.
 */
export const toggleLikeStatus = async (postId: string, userId: string | null, isLiking: boolean) => {
    if (!postId) return;
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
 * Checks if an authenticated user has liked a post via server-side API.
 * This is safer than client-side direct getDoc which might fail permissions.
 */
export const fetchUserHasLiked = async (postId: string, userId: string): Promise<boolean> => {
    if (!postId || !userId) return false;
    try {
        const response = await fetch('/api/engagement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch-status', postId, userId })
        });
        const data = await response.json();
        return !!data.hasLiked;
    } catch (error) {
        return false;
    }
};

/**
 * Checks if an authenticated user has bookmarked a post via server-side API.
 */
export const fetchUserHasBookmarked = async (postId: string, userId: string): Promise<boolean> => {
    if (!postId || !userId) return false;
    try {
        const response = await fetch('/api/engagement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch-status', postId, userId })
        });
        const data = await response.json();
        return !!data.hasBookmarked;
    } catch (error) {
        return false;
    }
};

/**
 * Toggles a bookmark status via server-side API.
 */
export const toggleBookmarkStatus = async (postId: string, userId: string | null, isBookmarking: boolean) => {
    if (!postId || !userId) return;
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
