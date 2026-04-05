// scripts/seed.ts
// Run: npx ts-node --project tsconfig.json scripts/seed.ts
// Or create a temporary API route to call this

import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    serverTimestamp,
} from "firebase/firestore";

async function seed() {
    // ─── Seed Categories ────────────────────────
    const categories = [
        { name: "Technology", slug: "technology" },
        { name: "Design", slug: "design" },
        { name: "Business", slug: "business" },
        { name: "Lifestyle", slug: "lifestyle" },
        { name: "Travel", slug: "travel" },
    ];

    for (const cat of categories) {
        await addDoc(collection(db, "categories"), cat);
    }
    console.log("✅ Categories seeded");

    // ─── Seed Tags ──────────────────────────────
    const tags = [
        "React",
        "Next.js",
        "TypeScript",
        "Firebase",
        "Tailwind CSS",
        "Node.js",
        "Python",
        "AI",
        "Web Development",
        "Mobile",
    ];

    for (const name of tags) {
        await addDoc(collection(db, "tags"), { name });
    }
    console.log("✅ Tags seeded");

    // ─── Seed Users ─────────────────────────────
    const users = [
        { name: "Admin User", email: "admin@example.com", role: "admin" },
        { name: "Editor Smith", email: "editor@example.com", role: "editor" },
        { name: "John Doe", email: "john@example.com", role: "user" },
        { name: "Jane Wilson", email: "jane@example.com", role: "user" },
    ];

    for (const user of users) {
        await addDoc(collection(db, "users"), {
            ...user,
            createdAt: serverTimestamp(),
        });
    }
    console.log("✅ Users seeded");

    // ─── Seed a Post with Comments ──────────────
    const postRef = await addDoc(collection(db, "posts"), {
        title: "Getting Started with Next.js 14",
        content: "This is a sample post...",
        createdAt: serverTimestamp(),
    });

    const comments = [
        {
            name: "Alice",
            message: "Great article! Very helpful.",
            status: "approved",
        },
        {
            name: "Bob",
            message: "Can you explain more about server components?",
            status: "pending",
        },
        {
            name: "Charlie",
            message: "This is spam content",
            status: "rejected",
        },
        {
            name: "Diana",
            message: "Loved the examples. Keep up the good work!",
            status: "pending",
        },
    ];

    for (const comment of comments) {
        await addDoc(collection(db, "posts", postRef.id, "comments"), {
            ...comment,
            createdAt: serverTimestamp(),
        });
    }
    console.log("✅ Post with comments seeded");

    console.log("\n🎉 All seed data created successfully!");
}

seed().catch(console.error);
