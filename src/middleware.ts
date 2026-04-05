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
            const response = NextResponse.redirect(new URL("/login", request.url));
            response.cookies.set(SESSION_COOKIE_NAME, "", { maxAge: 0, path: "/" });
            return response;
        }

        if (!ADMIN_ROLES.has(verifyResult.role ?? "")) {
            // Authenticated but insufficient role — check if they have editor access
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

// ─── Verify session cookie via internal API ────────────────────────────────────

async function verifySession(request: NextRequest): Promise<{
    authenticated: boolean;
    uid?: string;
    role?: string;
}> {
    try {
        const verifyUrl = new URL("/api/auth/verify", request.url);
        const response = await fetch(verifyUrl.toString(), {
            method: "GET",
            headers: { cookie: request.headers.get("cookie") ?? "" },
        });

        if (!response.ok) return { authenticated: false };

        const data = (await response.json()) as {
            authenticated: boolean;
            uid?: string;
            role?: string;
        };
        return data;
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
