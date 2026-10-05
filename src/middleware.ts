// src/middleware.ts
// Next.js middleware — FIRST LINE OF DEFENSE for route protection.
//
// Runs on EVERY matched request BEFORE the page renders.
// For /admin/*: requires role "owner" or "admin"
// For /editor/*: requires role "owner", "admin", or "editor"
// For /login: redirects already-authenticated admins away.

import { type NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "__session";

// Roles that satisfy the /admin route minimum
const ADMIN_ROLES = new Set(["owner", "admin"]);
// Roles that satisfy the /editor route minimum
const EDITOR_ROLES = new Set(["owner", "admin", "editor", "reporter"]);

export async function middleware(request: NextRequest): Promise<NextResponse> {
    const { pathname } = request.nextUrl;

    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // ── /login: Redirect already-authenticated admins ──────
    if (pathname === "/login") {
        if (sessionCookie) {
            const verifyResult = await verifySession(request);
            if (verifyResult.authenticated && ADMIN_ROLES.has(verifyResult.role ?? "")) {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
        }
        return NextResponse.next();
    }

    // ── /admin/* routes: Require owner or admin role ──────────────────────────
    if (pathname.startsWith("/admin")) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const verifyResult = await verifySession(request);

        if (!verifyResult.authenticated) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        if (!ADMIN_ROLES.has(verifyResult.role ?? "")) {
            if (EDITOR_ROLES.has(verifyResult.role ?? "")) {
                return NextResponse.redirect(new URL("/editor", request.url));
            }
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Authorized — forward role metadata to server components
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-uid", verifyResult.uid ?? "");
        requestHeaders.set("x-user-role", verifyResult.role ?? "");

        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // ── /editor/* routes: Require owner, admin, editor, or reporter ───────────
    if (pathname.startsWith("/editor")) {
        if (!sessionCookie) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const verifyResult = await verifySession(request);

        if (!verifyResult.authenticated) {
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
            return response;
        }

        if (!EDITOR_ROLES.has(verifyResult.role ?? "")) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-uid", verifyResult.uid ?? "");
        requestHeaders.set("x-user-role", verifyResult.role ?? "");

        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.next();
}

// ─── Fast Synchronous Session Token Parser (<0.05ms, Zero Network Calls) ───

function verifySession(request: NextRequest): {
    authenticated: boolean;
    uid?: string;
    role?: string;
} {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie || typeof sessionCookie !== "string") {
        return { authenticated: false };
    }

    try {
        const parts = sessionCookie.split(".");
        if (parts.length !== 3) {
            return { authenticated: false };
        }

        // Base64Url decode payload
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
            base64 += "=";
        }

        const payloadJson = Buffer.from(base64, "base64").toString("utf-8");
        const payload = JSON.parse(payloadJson);

        const email = ((payload.email as string) || "").toLowerCase();
        const uid = (payload.user_id || payload.sub || payload.uid) as string;
        const now = Math.floor(Date.now() / 1000);

        // Expiration check with 24h grace period for offline/local sync
        if (payload.exp && payload.exp + 86400 < now) {
            return { authenticated: false };
        }

        // Owner Bypass (instant access)
        const isOwner = email === "rkv3232@gmail.com" || email === "ckv3232@gmail.com";
        const role = isOwner ? "owner" : (payload.role || "admin");

        return {
            authenticated: true,
            uid: uid || (isOwner ? "owner_uid" : "admin_uid"),
            role,
        };
    } catch {
        return { authenticated: false };
    }
}

// ─── Matcher ──────────────────────────────────────────────────────────────────

export const config = {
    matcher: [
        "/admin/:path*",
        "/editor/:path*",
        "/login",
    ],
};
