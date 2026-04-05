#!/usr/bin/env npx tsx
// scripts/setup-owner.ts
// Securely creates the system owner account using the Firebase Admin SDK.
// Run this server-side only.

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// ─── Owner Configurations ─────────────────────────────────────────────────────
const OWNER_EMAIL = "rkv3232@gmail.com";
const OWNER_PASSWORD = "Raj@3232";
const OWNER_NAME = "Raj";

function formatPrivateKey(key: string): string {
    return key.replace(/\\n/g, "\n");
}

if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error("❌  Missing Firebase Admin credentials in .env.local.");
        process.exit(1);
    }

    initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: formatPrivateKey(privateKey) }),
    });
}

const auth = getAuth();
const db = getFirestore();

// ─── Main ─────────────────────────────────────────────────────────────────────

async function setupOwner(): Promise<void> {
    let uid: string;

    console.log(`🔍 Checking if owner account (${OWNER_EMAIL}) exists in Firebase Auth...`);

    try {
        const userRecord = await auth.getUserByEmail(OWNER_EMAIL);
        uid = userRecord.uid;
        console.log(`✅ User already exists in Auth: ${uid}`);
        console.log(`Updating password for ${OWNER_EMAIL}...`);
        await auth.updateUser(uid, { password: OWNER_PASSWORD });
        console.log(`✅ Password updated successfully.`);
    } catch (error: any) {
        if (error.code === "auth/user-not-found") {
            console.log(`Creating new user in Firebase Auth for ${OWNER_EMAIL}...`);
            const createdUser = await auth.createUser({
                email: OWNER_EMAIL,
                password: OWNER_PASSWORD,
                displayName: OWNER_NAME,
            });
            uid = createdUser.uid;
            console.log(`✅ Created new user in Auth: ${uid}`);
        } else {
            throw error;
        }
    }

    console.log(`\n🔍 Checking Firestore document for user: ${uid}...`);
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        console.log(`Creating new Firestore document for owner...`);
        await userRef.set({
            uid,
            name: OWNER_NAME,
            email: OWNER_EMAIL,
            role: "owner",
            isActive: true,
            status: "active",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ Owner Firestore document successfully created.`);
    } else {
        console.log(`Firestore document already exists. Updating role to "owner"...`);
        await userRef.update({
            role: "owner",
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`✅ Owner role successfully updated in existing document.`);
    }

    console.log(`\n🎉 Owner account setup complete!`);
    console.log(`   Email: ${OWNER_EMAIL}`);
    console.log(`   You can now log in to the admin panel.`);
}

setupOwner()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
