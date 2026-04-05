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

import { PostStatus, AuthorInfo, SEOMeta } from '@/types/admin';

export interface Post {
    id?: string;
    title: string;
    content: string;
    image: string; // This can be an image or video URL now
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

/**
 * Serializes a post object to be JSON-friendly for Next.js Server-to-Client communication.
 * Converts Timestamp, Date, etc., to primitives (numbers/strings).
 */
export function serializePost(post: any): Post {
    return serializeData(post);
}

// Add a new post
export async function addPost(postData: Omit<Post, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'posts'), {
        ...postData,
        status: postData.status || 'published', // defaults to published for now
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

// Get all posts
export async function getAllPosts(includeDrafts = false): Promise<Post[]> {
    // Admin function: fetches everything, sorted by date.
    // Relies on the user being authenticated for permissions.
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => serializePost({
        id: doc.id,
        ...doc.data(),
    }));

    if (!includeDrafts) {
        return posts.filter(p => !p.status || p.status === 'published');
    }
    return posts;
}

// Get posts by category
export async function getPostsByCategory(category: string, limitCount = 20): Promise<Post[]> {
    const q = query(
        collection(db, 'posts'),
        where('category', '==', category),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => serializePost({
        id: doc.id,
        ...doc.data(),
    }));
    return posts;
}

// Get latest posts (for homepage)
export async function getLatestPosts(limitCount = 10): Promise<Post[]> {
    const q = query(
        collection(db, 'posts'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => serializePost({
        id: doc.id,
        ...doc.data(),
    }));
    return posts;
}

// Search posts by keyword (Basic Text Match over latest posts)
export async function searchPostsLocally(keyword: string, searchLimit = 50): Promise<Post[]> {
    // Note: Since Firestore lacks full text search, we pull latest and filter.
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
        p.title.toLowerCase().includes(kw) ||
        p.content.toLowerCase().includes(kw)
    );
}

// Get a single post by ID
export async function getPostById(id: string): Promise<Post | null> {
    const docRef = doc(db, 'posts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return serializePost({ id: docSnap.id, ...docSnap.data() });
    }
    return null;
}

// Update a post
export async function updatePost(id: string, postData: Partial<Post>): Promise<void> {
    const docRef = doc(db, 'posts', id);
    await updateDoc(docRef, { ...postData });
}

// Delete a post
export async function deletePost(id: string): Promise<void> {
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

    if (isNaN(date.getTime())) return 'कुछ समय पहले'; // Fallback to "Some time ago" in Hindi

    return date.toLocaleDateString('hi-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}
