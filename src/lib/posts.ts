import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    serverTimestamp,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { db, uploadToCloudinary } from './firebase';
import { serializeData } from './serialization';

import { PostStatus, SEOMeta } from '@/types/admin';

export interface Post {
    id?: string;
    title: string;
    content: string;
    image: string; // Primary image URL (legacy fallback)
    images?: string[]; // Array of up to 5 image URLs
    video?: string; // Optional video URL
    category: string;
    createdAt?: Timestamp | Date | null;
    slug?: string;
    status?: PostStatus;
    authorId?: string;
    authorName?: string;
    tags?: string[];
    views?: number;
    likes?: number;
    isFeatured?: boolean;
    seo?: SEOMeta;
}

export { uploadToCloudinary };

// ── In-Memory Fast Cache for Instant Page Transitions ────────────────────────
const POSTS_CACHE = new Map<string, { data: any; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30s cache TTL

function getCached<T>(key: string): T | null {
    const entry = POSTS_CACHE.get(key);
    if (entry && Date.now() < entry.expiresAt) {
        return entry.data as T;
    }
    return null;
}

function setCached<T>(key: string, data: T, ttlMs = CACHE_TTL_MS): void {
    POSTS_CACHE.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearPostsCache(): void {
    POSTS_CACHE.clear();
}

/**
 * Serializes a post object to be JSON-friendly for Next.js Server-to-Client communication.
 * Converts Timestamp, Date, etc., to primitives (numbers/strings).
 */
export function serializePost(post: any): Post {
    return serializeData(post);
}

// Add a new post
export async function addPost(postData: Omit<Post, 'id' | 'createdAt'>): Promise<string> {
    clearPostsCache();
    const docRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        status: postData.status || 'published',
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

// ── Fast Timeout Wrapper for Firestore Reads ────────────────────────────────
const QUERY_TIMEOUT_MS = 1200;

async function withQueryTimeout<T>(promise: Promise<T>, timeoutMs = QUERY_TIMEOUT_MS): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore query timeout")), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
}

// Get all posts (Admin function)
export async function getAllPosts(includeDrafts = false): Promise<Post[]> {
    const cacheKey = `all_${includeDrafts}`;
    const cached = getCached<Post[]>(cacheKey);
    if (cached) return cached;

    try {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await withQueryTimeout(getDocs(q));
        const posts = querySnapshot.docs.map((doc) => serializePost({
            id: doc.id,
            ...doc.data(),
        }));

        const result = includeDrafts ? posts : posts.filter(p => !p.status || p.status === 'published');
        setCached(cacheKey, result, 15 * 1000); // 15s for admin
        return result;
    } catch (_err) {
        return [];
    }
}

// Get posts by category
export async function getPostsByCategory(category: string, limitCount = 20): Promise<Post[]> {
    const cacheKey = `cat_${category}_${limitCount}`;
    const cached = getCached<Post[]>(cacheKey);
    if (cached) return cached;

    try {
        const q = query(
            collection(db, 'posts'),
            where('category', '==', category),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await withQueryTimeout(getDocs(q));
        const posts = querySnapshot.docs.map((doc) => serializePost({
            id: doc.id,
            ...doc.data(),
        }));
        setCached(cacheKey, posts);
        return posts;
    } catch (_err) {
        try {
            const fallbackQ = query(
                collection(db, 'posts'),
                where('category', '==', category),
                limit(limitCount)
            );
            const querySnapshot = await withQueryTimeout(getDocs(fallbackQ), 800);
            const posts = querySnapshot.docs.map((doc) => serializePost({
                id: doc.id,
                ...doc.data(),
            })).filter(p => !p.status || p.status === 'published');
            setCached(cacheKey, posts);
            return posts;
        } catch {
            return [];
        }
    }
}

// Get latest posts (for homepage)
export async function getLatestPosts(limitCount = 10): Promise<Post[]> {
    const cacheKey = `latest_${limitCount}`;
    const cached = getCached<Post[]>(cacheKey);
    if (cached) return cached;

    try {
        const q = query(
            collection(db, 'posts'),
            where('status', '==', 'published'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const querySnapshot = await withQueryTimeout(getDocs(q));
        const posts = querySnapshot.docs.map((doc) => serializePost({
            id: doc.id,
            ...doc.data(),
        }));
        setCached(cacheKey, posts);
        return posts;
    } catch (_err) {
        try {
            const fallbackQ = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await withQueryTimeout(getDocs(fallbackQ), 800);
            const posts = querySnapshot.docs.map((doc) => serializePost({
                id: doc.id,
                ...doc.data(),
            })).filter(p => !p.status || p.status === 'published');
            setCached(cacheKey, posts);
            return posts;
        } catch {
            return [];
        }
    }
}

// Search posts by keyword (Basic Text Match over latest posts)
export async function searchPostsLocally(keyword: string, searchLimit = 50): Promise<Post[]> {
    const q = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(searchLimit)
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Post[];

    const kw = keyword.toLowerCase();
    return posts.filter(p =>
        (p.title || '').toLowerCase().includes(kw) ||
        (p.content || '').toLowerCase().includes(kw)
    );
}

// Get a single post by ID
export async function getPostById(id: string): Promise<Post | null> {
    const cacheKey = `post_${id}`;
    const cached = getCached<Post>(cacheKey);
    if (cached) return cached;

    try {
        const docRef = doc(db, 'posts', id);
        const docSnap = await withQueryTimeout(getDoc(docRef), 1500);
        if (docSnap.exists()) {
            const post = serializePost({ id: docSnap.id, ...docSnap.data() });
            setCached(cacheKey, post, 60 * 1000); // 60s
            return post;
        }
    } catch (_e) {
        // Fallback null
    }
    return null;
}

// Update a post
export async function updatePost(id: string, postData: Partial<Post>): Promise<void> {
    clearPostsCache();
    const docRef = doc(db, 'posts', id);
    await updateDoc(docRef, { ...postData });
}

// Delete a post
export async function deletePost(id: string): Promise<void> {
    clearPostsCache();
    const docRef = doc(db, 'posts', id);
    await deleteDoc(docRef);
}

// Format Firestore timestamp to readable date
export function formatDate(timestamp: any): string {
    if (!timestamp) return '';

    let date: Date;
    if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'object' && (timestamp.seconds !== undefined || timestamp._seconds !== undefined)) {
        const seconds = timestamp.seconds !== undefined ? timestamp.seconds : timestamp._seconds;
        date = new Date(seconds * 1000);
    } else {
        date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'कुछ समय पहले';

    return date.toLocaleDateString('hi-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
