// scripts/seed-analytics.ts
// Run with: npx tsx scripts/seed-analytics.ts

import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    addDoc,
    Timestamp,
    setDoc,
    doc,
} from "firebase/firestore";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
    "Politics",
    "Technology",
    "Sports",
    "Entertainment",
    "Business",
];

function randomDate(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
    d.setHours(Math.floor(Math.random() * 24));
    return Timestamp.fromDate(d);
}

async function seed() {
    console.log("🌱 Seeding Firestore analytics data...");

    // Posts
    for (let i = 1; i <= 25; i++) {
        await addDoc(collection(db, "posts"), {
            title: `Breaking News Story #${i}: Major Event Unfolds`,
            slug: `news-story-${i}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            views: Math.floor(Math.random() * 5000) + 100,
            author: `Author ${Math.ceil(i / 5)}`,
            createdAt: randomDate(30),
        });
        console.log(`  ✅ Post ${i} created`);
    }

    // Users
    for (let i = 1; i <= 15; i++) {
        await addDoc(collection(db, "users"), {
            name: `User ${i}`,
            email: `user${i}@example.com`,
            role: i === 1 ? "admin" : "user",
            createdAt: randomDate(30),
        });
        console.log(`  ✅ User ${i} created`);
    }

    // Comments
    for (let i = 1; i <= 30; i++) {
        await addDoc(collection(db, "comments"), {
            message: `This is comment #${i}. Very insightful article!`,
            postId: `post_${Math.ceil(i / 3)}`,
            userId: `user_${Math.ceil(Math.random() * 15)}`,
            userName: `User ${Math.ceil(Math.random() * 15)}`,
            createdAt: randomDate(30),
        });
        console.log(`  ✅ Comment ${i} created`);
    }

    // Default settings
    await setDoc(doc(db, "settings", "global"), {
        siteName: "NewsHub",
        logoUrl: "",
        theme: "light",
        language: "en",
        contactEmail: "admin@newshub.com",
        primaryColor: "#2563eb",
        autoSave: false,
    });
    console.log("  ✅ Settings created");

    console.log("\n🎉 Seeding complete!");
    process.exit(0);
}

seed().catch(console.error);
