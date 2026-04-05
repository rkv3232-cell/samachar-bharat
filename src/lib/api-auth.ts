import { NextRequest } from "next/server";
import { adminAuth } from "./firebase-admin";

/**
 * Verifies the incoming request is from an authenticated admin user.
 *
 * Supports two strategies:
 *  1. Bearer token (Firebase ID token) — verifies the token AND checks
 *     Firestore custom claims or the users collection for role === "admin"
 *  2. API secret header — for server-to-server or simple setups
 */

export async function verifyAdminRequest(
    request: NextRequest
): Promise<{ authorized: boolean; uid?: string; error?: string }> {
    // ── Strategy 1: Bearer Token ──
    const authHeader = request.headers.get("authorization");

    if (authHeader?.startsWith("Bearer ")) {
        const idToken = authHeader.split("Bearer ")[1];

        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            const uid = decodedToken.uid;

            // Check custom claim
            if (decodedToken.role === "admin") {
                return { authorized: true, uid };
            }

            // Fallback: check Firestore document
            const { adminDb } = await import("./firebase-admin");
            const userDoc = await adminDb.collection("users").doc(uid).get();

            if (userDoc.exists && userDoc.data()?.role === "admin") {
                return { authorized: true, uid };
            }

            return {
                authorized: false,
                error: "User does not have admin privileges",
            };
        } catch (err: any) {
            return {
                authorized: false,
                error: `Invalid token: ${err.message}`,
            };
        }
    }

    // ── Strategy 2: API Secret ──
    const apiSecret = request.headers.get("x-api-secret");
    const expectedSecret = process.env.ADMIN_API_SECRET || process.env.NEXT_PUBLIC_ADMIN_API_SECRET;

    if (apiSecret && expectedSecret && apiSecret === expectedSecret) {
        return { authorized: true, uid: "api-secret" };
    }

    return {
        authorized: false,
        error: "No valid authorization provided. Send a Bearer token or x-api-secret header.",
    };
}
