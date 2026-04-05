// src/app/api/auth/session/route.ts
// Session cookie management API.
//
// POST  → Verifies Firebase ID token, creates httpOnly session cookie (5 days)
// DELETE → Clears session cookie (sign-out)
//
// SECURITY:
//  - Cookie is httpOnly (JS cannot read it)
//  - Cookie is Secure in production (HTTPS only)
//  - Cookie is SameSite=Strict (CSRF protection)
//  - Session expiry: 5 days (Firebase Admin session cookies support up to 14d)

import { type NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

const SESSION_COOKIE_NAME = "__session";
const SESSION_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000; // 5 days in ms

// ─── POST: Create Session ─────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: unknown = await request.json();

        if (
            typeof body !== "object" ||
            body === null ||
            !("idToken" in body) ||
            typeof (body as Record<string, unknown>).idToken !== "string"
        ) {
            return NextResponse.json(
                { success: false, error: "idToken is required and must be a string." },
                { status: 400 }
            );
        }

        const idToken = (body as { idToken: string }).idToken;

        // Verify the ID token first to ensure it's valid
        const decodedToken = await adminAuth.verifyIdToken(idToken, true);

        // Create a Firebase session cookie (longer-lived than ID tokens)
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_EXPIRY_MS,
        });

        const response = NextResponse.json(
            { success: true, uid: decodedToken.uid },
            { status: 200 }
        );

        // Set the cookie with security flags
        response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
            maxAge: SESSION_EXPIRY_MS / 1000, // maxAge is in seconds
            httpOnly: true,                   // NOT accessible via JavaScript
            secure: process.env.NODE_ENV === "production", // HTTPS only in prod
            sameSite: "strict",               // CSRF protection
            path: "/",
        });

        return response;
    } catch (error) {
        console.error("[POST /api/auth/session] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create session. Token may be invalid." },
            { status: 401 }
        );
    }
}

// ─── DELETE: Clear Session ────────────────────────────────────────────────────
export async function DELETE(): Promise<NextResponse> {
    const response = NextResponse.json({ success: true }, { status: 200 });

    // Clear the cookie by setting maxAge to 0
    response.cookies.set(SESSION_COOKIE_NAME, "", {
        maxAge: 0,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });

    return response;
}
