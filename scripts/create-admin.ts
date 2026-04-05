// scripts/create-admin.ts
// Run with: npx tsx scripts/create-admin.ts

import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
    console.log("Missing firebase admin env variables");
    process.exit(1);
}

const app = initializeApp({
    credential: cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
});

const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
    const email = "admin@yourdomain.com";
    const password = "Admin@123456";
    const name = "Super Admin";

    console.log("🚀 Creating admin user...\n");

    try {
        // Create in Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            emailVerified: true,
        });

        console.log(`✅ Auth user created: ${userRecord.uid}`);

        // Set custom claims
        await auth.setCustomUserClaims(userRecord.uid, { role: "admin" });
        console.log("✅ Custom claims set");

        // Save to Firestore
        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            role: "admin",
            status: "active",
            createdAt: new Date().toISOString(),
        });

        console.log("✅ Firestore document created");
        console.log("\n🎉 Admin user created successfully!");
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   UID:      ${userRecord.uid}`);
    } catch (err: any) {
        if (err.code === "auth/email-already-exists") {
            console.log("⚠️  User already exists with this email");
        } else {
            console.error("❌ Error:", err.message);
        }
    }

    process.exit(0);
}

createAdmin();
