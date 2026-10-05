import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getMessaging, Messaging } from "firebase-admin/messaging";

function formatPrivateKey(key: string): string {
    let cleaned = key.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
    }
    return cleaned.replace(/\\n/g, "\n");
}

let app: App;

if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.warn(
            "Firebase Admin SDK environment variables are missing. " +
            "Check FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, " +
            "and FIREBASE_ADMIN_PRIVATE_KEY in your .env.local file. Proceeding with dummy values for dev."
        );
    }

    try {
        app = initializeApp({
            credential: cert({
                projectId: projectId || "dummy",
                clientEmail: clientEmail || "dummy@dummy.iam.gserviceaccount.com",
                privateKey: formatPrivateKey(privateKey || "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADAN\n-----END PRIVATE KEY-----\n"),
            }),
        });
    } catch (e) { /* ignore in local dev if it errors without certs */ }
} else {
    app = getApps()[0];
}

export const adminAuth: Auth = getAuth(app!);
export const adminDb: Firestore = getFirestore(app!);
export const adminMessaging: Messaging = getMessaging(app!);
export default app!;
