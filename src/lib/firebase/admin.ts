// src/lib/firebase/admin.ts
// Firebase Admin SDK initialization — SERVER-SIDE ONLY.
// Used by the auth API routes to mint/verify session cookies and read roles.
//
// Requires these environment variables (already provisioned):
//   FIREBASE_ADMIN_PROJECT_ID
//   FIREBASE_ADMIN_CLIENT_EMAIL
//   FIREBASE_ADMIN_PRIVATE_KEY

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function normalizePrivateKey(key: string | undefined): string {
    if (!key) return "";
    // Env vars often store the key with literal "\n" sequences — convert to real newlines.
    return key.replace(/\\n/g, "\n");
}

let adminApp: App;

function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0]!;
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            "[firebase-admin] Missing credentials. Ensure FIREBASE_ADMIN_PROJECT_ID, " +
            "FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set."
        );
    }

    adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });

    return adminApp;
}

export function getAdminAuth(): Auth {
    return getAuth(getAdminApp());
}

export function getAdminFirestore(): Firestore {
    return getFirestore(getAdminApp());
}
