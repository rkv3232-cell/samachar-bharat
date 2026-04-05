#!/usr/bin/env npx tsx
// scripts/make-admin.ts
// CLI script to change a user's role in Firestore using Firebase Admin SDK.
//
// USAGE:
//   npx tsx scripts/make-admin.ts --uid=UID --role=admin
//   npx tsx scripts/make-admin.ts --email=user@example.com --role=editor
//   npx tsx scripts/make-admin.ts --email=user@example.com           (defaults to admin)
//
// VALID ROLES: admin, editor, reporter, user
// NOTE: "owner" is NEVER assignable via this script — it's email-based only.
//
// REQUIREMENTS:
//   FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in .env.local

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const VALID_ROLES = ["admin", "editor", "reporter", "user"] as const;
type AssignableRole = (typeof VALID_ROLES)[number];

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

const adminAuth = getAuth();
const adminDb = getFirestore();

// ─── Parse CLI Arguments ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const uidArg = args.find((a) => a.startsWith("--uid="))?.split("=")[1];
const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1];
const roleArg = (args.find((a) => a.startsWith("--role="))?.split("=")[1] ?? "admin") as AssignableRole;

if (!uidArg && !emailArg) {
    console.error("❌  Usage: npx tsx scripts/make-admin.ts --uid=UID [--role=admin]");
    console.error("          npx tsx scripts/make-admin.ts --email=EMAIL [--role=editor]");
    process.exit(1);
}

if (!VALID_ROLES.includes(roleArg)) {
    console.error(`❌  Invalid role: "${roleArg}". Valid roles: ${VALID_ROLES.join(", ")}`);
    console.error('    NOTE: "owner" is auto-assigned by email — never assignable via script.');
    process.exit(1);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function changeRole(): Promise<void> {
    let uid: string;

    if (uidArg) {
        uid = uidArg;
        console.log(`🔍  Using provided UID: ${uid}`);
    } else {
        console.log(`🔍  Looking up user by email: ${emailArg}`);
        const userRecord = await adminAuth.getUserByEmail(emailArg!);
        uid = userRecord.uid;
        console.log(`✅  Found: ${userRecord.displayName ?? emailArg} (${uid})`);
    }

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        console.error(`❌  No Firestore document found for uid: ${uid}. User must sign in first.`);
        process.exit(1);
    }

    const currentData = userSnap.data();
    const currentRole = currentData?.role ?? "unknown";

    // SAFETY: Never modify the owner
    if (currentRole === "owner") {
        console.error("❌  Cannot change role of the owner. Owner role is immutable.");
        process.exit(1);
    }

    console.log(`📄  Current role: ${currentRole} → New role: ${roleArg}`);

    if (currentRole === roleArg) {
        console.log("ℹ️   Role is already set to that value. No changes made.");
        return;
    }

    await userRef.update({
        role: roleArg,
        updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅  Successfully changed role from "${currentRole}" to "${roleArg}"!`);
    console.log("⚠️   User must sign out and sign back in for the change to take effect.");
}

changeRole()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
        console.error("❌  Script failed:", error);
        process.exit(1);
    });
