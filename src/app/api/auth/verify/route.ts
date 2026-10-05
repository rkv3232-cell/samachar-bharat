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
const ROLE_CACHE = new Map<string, { role: UserRole; expiresAt: number }>();

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { authenticated: false, error: "No session cookie found." },
                { status: 401 }
            );
        }

        const { verifyAnyFirebaseToken } = await import("@/lib/token-verifier");
        const { uid, email } = await verifyAnyFirebaseToken(sessionCookie);

        if (!uid) {
            return NextResponse.json(
                { authenticated: false, error: "Invalid or expired session token." },
                { status: 401 }
            );
        }

        // ── CRITICAL OWNER BYPASS ─────────────────────────────────────────────
        if (email === "rkv3232@gmail.com" || email === "ckv3232@gmail.com") {
            return NextResponse.json(
                { authenticated: true, uid, role: UserRole.OWNER },
                { status: 200 }
            );
        }

        // Fetch the role from Firestore with in-memory caching (authoritative source for everyone else)
        let role: UserRole = UserRole.ADMIN;
        const cachedRole = ROLE_CACHE.get(uid);
        if (cachedRole && Date.now() < cachedRole.expiresAt) {
            role = cachedRole.role;
        } else {
            try {
                const userDoc = await adminDb.collection("users").doc(uid).get();
                if (userDoc.exists) {
                    const rawRole = userDoc.data()?.role as string | undefined;
                    role = toUserRole(rawRole);
                    ROLE_CACHE.set(uid, { role, expiresAt: Date.now() + 5 * 60 * 1000 });
                }
            } catch (dbErr) {
                console.warn("[GET /api/auth/verify] Firestore query failed, defaulting role:", dbErr);
            }
        }

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
