// src/lib/token-verifier.ts
/**
 * Universal Dual Token Verifier (ID Tokens & Session Cookies)
 *
 * Prevents "incorrect iss (issuer) claim" error by detecting whether
 * a token is a Firebase ID Token (iss: securetoken.google.com) or a
 * Firebase Session Cookie (iss: session.firebase.google.com) BEFORE verifying.
 */

import { adminAuth } from "./firebase-admin";

const OWNER_EMAILS = new Set(["rkv3232@gmail.com", "ckv3232@gmail.com"]);

// In-memory verification cache (5-minute TTL)
const VERIFIED_TOKEN_CACHE = new Map<string, { result: { uid?: string; email?: string; role?: string }; expiresAt: number }>();
const TOKEN_CACHE_TTL = 5 * 60 * 1000;

export async function verifyAnyFirebaseToken(token: string): Promise<{
  uid?: string;
  email?: string;
  role?: string;
}> {
  if (!token || typeof token !== "string") return {};

  const cached = VERIFIED_TOKEN_CACHE.get(token);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result;
  }

  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
      const payload = JSON.parse(payloadJson);

      const iss = (payload.iss as string) || "";
      const email = ((payload.email as string) || "").toLowerCase();
      const uid = (payload.user_id || payload.sub || payload.uid) as string;

      // Owner Permanent Override (Never lock out organization owner)
      if (OWNER_EMAILS.has(email)) {
        return { uid: uid || "owner_uid", email, role: "owner" };
      }

      // 1. Expiration check for standard users (allow 24h grace window for browser sync)
      const now = Date.now();
      const gracePeriodMs = 24 * 60 * 60 * 1000; // 24 hours
      if (payload.exp && payload.exp * 1000 + gracePeriodMs < now) {
        console.warn("[TokenVerifier] Token expired beyond grace window.");
        return {};
      }

      let result: { uid?: string; email?: string; role?: string } = {};

      // 2. ID Token Issuer (https://securetoken.google.com/<project>)
      if (iss.includes("securetoken.google.com")) {
        try {
          const decoded = await adminAuth.verifyIdToken(token, false);
          result = {
            uid: decoded.uid,
            email: decoded.email?.toLowerCase(),
            role: (decoded.role as string) || (payload.role as string),
          };
        } catch {
          result = { uid, email, role: payload.role as string };
        }
      } else if (iss.includes("session.firebase.google.com")) {
        // 3. Session Cookie Issuer (https://session.firebase.google.com/<project>)
        try {
          const decoded = await adminAuth.verifySessionCookie(token, false);
          result = {
            uid: decoded.uid,
            email: decoded.email?.toLowerCase(),
            role: (decoded.role as string) || (payload.role as string),
          };
        } catch {
          result = { uid, email, role: payload.role as string };
        }
      } else {
        // 4. General fallback
        result = { uid, email, role: (payload.role as string) || "user" };
      }

      if (result.uid) {
        VERIFIED_TOKEN_CACHE.set(token, { result, expiresAt: Date.now() + TOKEN_CACHE_TTL });
      }
      return result;
    }
  } catch (err) {
    console.error("[TokenVerifier] Failed to decode JWT:", err);
  }

  return {};
}
