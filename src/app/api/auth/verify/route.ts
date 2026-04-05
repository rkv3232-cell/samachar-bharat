// src/app/api/auth/verify/route.ts
// Session verification endpoint — used by middleware to verify admin sessions.
//
// GET → Reads session cookie, verifies with Firebase Admin, returns uid + role.
//
// SECURITY: This route reads only from httpOnly cookies — no client-supplied data
// is trusted for role resolution. Role is fetched fresh from Firestore.

import { type NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { UserRole } from "@/types/auth.types";
import { toUserRole } from "@/lib/permissions";

const SESSION_COOKIE_NAME = "__session";

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { authenticated: false, error: "No session cookie found." },
                { status: 401 }
            );
        }

        // Verify the session cookie using Firebase Admin SDK
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        const uid = decodedClaims.uid;
        const email = decodedClaims.email?.toLowerCase();

        // ── CRITICAL OWNER BYPASS ─────────────────────────────────────────────
        // If the email matches the hardcoded owner, bypass Firestore check.
        // This prevents lockout if the auto-create document flow fails.
        if (email === "rkv3232@gmail.com") {
            return NextResponse.json(
                { authenticated: true, uid, role: UserRole.OWNER },
                { status: 200 }
            );
        }

        // Fetch the role from Firestore (authoritative source for everyone else)
        const userDoc = await adminDb.collection("users").doc(uid).get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { authenticated: false, error: "User document not found." },
                { status: 401 }
            );
        }

        const rawRole = userDoc.data()?.role as string | undefined;
        const role: UserRole = toUserRole(rawRole);

        return NextResponse.json(
            { authenticated: true, uid, role },
            { status: 200 }
        );
    } catch (error) {
        // Session cookie is expired or tampered
        console.error("[GET /api/auth/verify] Verification failed:", error);
        return NextResponse.json(
            { authenticated: false, error: "Session verification failed." },
            { status: 401 }
        );
    }
}
