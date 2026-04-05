// ============================================================
// firebase.js — Firebase v9 Modular SDK Initialization
// Project: samachar-bharat
// ============================================================

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, getDoc, updateDoc, where, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ─── Firebase Config (Using Environment Variables) ───────────
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debugging logs to verify env variables loading
console.log("🔥 Firebase Connection Status:", {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✅ Loaded" : "❌ Missing",
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "✅ Loaded" : "❌ Missing",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "✅ Loaded" : "❌ Missing",
});

// Safety check for missing environment variables
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    console.error("❌ CRITICAL: Firebase environment variables are missing! Please check your .env.local file.");
}

// ─── App Initialization (Ensuring it only initializes once) ──
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ─── Service Exports ──────────────────────────────────────────
export const db = getFirestore(app);   // Firestore database
export const auth = getAuth(app);         // Firebase Authentication

// ─────────────────────────────────────────────────────────────
//  CRUD FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * addPost — Add a new news post to Firestore.
 *
 * @param {string} title    - Headline of the news article
 * @param {string} content  - Full body text / HTML of the article
 * @param {string} image    - Public URL of the cover image
 * @param {string} category - Category slug (e.g. "desh", "crime")
 * @returns {Promise<string>} The Firestore document ID of the new post
 *
 * @example
 *   const id = await addPost("Breaking News", "Full story...", "https://...", "desh");
 */
export async function addPost(title, content, image, category) {
    const postsRef = collection(db, 'posts');

    const docRef = await addDoc(postsRef, {
        title,
        content,
        image,
        category,
        createdAt: serverTimestamp(), // Firestore server-side timestamp (auto-set)
    });

    return docRef.id;
}

/**
 * getPosts — Fetch all posts from the collection.
 * 
 * @returns {Promise<Array<{id: string, ...}>>}
 */
export async function getPosts() {
    const postsRef = collection(db, 'posts');

    // Temporarily removed orderBy("createdAt", "desc") to avoid composite index errors
    // fetching without explicit order for now.
    const querySnapshot = await getDocs(postsRef);

    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

/**
 * getPostById — Fetch a single post by its Firestore document ID.
 *
 * @param {string} id - The Firestore document ID
 * @returns {Promise<{id: string, ...}|null>} Post object or null if not found
 *
 * @example
 *   const post = await getPostById("abc123");
 *   if (post) console.log(post.title);
 */
export async function getPostById(id) {
    const docRef = doc(db, 'posts', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    }

    return null; // Document not found
}

/**
 * getPostsByCategory — Fetch posts filtered by a specific category.
 *
 * @param {string} category   - Category slug to filter by (e.g. "crime")
 * @param {number} [max=20]   - Maximum number of posts to return
 * @returns {Promise<Array>} Array of matching post objects
 *
 * @example
 *   const crimePosts = await getPostsByCategory("crime", 10);
 */
export async function getPostsByCategory(category, max = 20) {
    const postsRef = collection(db, 'posts');

    const q = query(
        postsRef,
        where('category', '==', category),
        limit(max)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

/**
 * getLatestPosts — Fetch the N most recent posts across all categories.
 *
 * @param {number} [max=10] - Number of posts to return
 * @returns {Promise<Array>} Array of post objects
 *
 * @example
 *   const latest = await getLatestPosts(6);
 */
export async function getLatestPosts(max = 10) {
    const postsRef = collection(db, 'posts');

    const q = query(
        postsRef,
        limit(max)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}

/**
 * updatePost — Update specific fields of an existing post.
 *
 * @param {string} id     - The Firestore document ID to update
 * @param {Object} fields - Key-value pairs of fields to update
 * @returns {Promise<void>}
 *
 * @example
 *   await updatePost("abc123", { title: "Updated Title", category: "desh" });
 */
export async function updatePost(id, fields) {
    const docRef = doc(db, 'posts', id);
    await updateDoc(docRef, fields);
}

/**
 * deletePost — Permanently delete a post document from Firestore.
 *
 * @param {string} id - The Firestore document ID to delete
 * @returns {Promise<void>}
 *
 * @example
 *   await deletePost("abc123");
 */
export async function deletePost(id) {
    const docRef = doc(db, 'posts', id);
    await deleteDoc(docRef);
}

// ─────────────────────────────────────────────────────────────
//  CLOUDINARY UPLOAD SYSTEM (UNSIGNED)
// ─────────────────────────────────────────────────────────────

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dtm7hhsys/auto/upload";
const CLOUDINARY_UPLOAD_PRESET = "news_upload";

/**
 * uploadToCloudinary — Unsigned upload of files to Cloudinary.
 * 
 * @param {File} file - The image or video file to upload.
 * @returns {Promise<string>} Secure URL of the uploaded resource.
 */
export async function uploadToCloudinary(file) {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Cloudinary upload failed');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Cloudinary Error:", error);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────
//  UTILITY HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * formatDate — Convert a Firestore Timestamp to a human-readable Hindi date.
 *
 * @param {import('firebase/firestore').Timestamp|Date|null} timestamp
 * @returns {string} Formatted date string, e.g., "28 मार्च 2026"
 *
 * @example
 *   const label = formatDate(post.createdAt); // "28 मार्च 2026"
 */
export function formatDate(timestamp) {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

    return date.toLocaleDateString('hi-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default app;
