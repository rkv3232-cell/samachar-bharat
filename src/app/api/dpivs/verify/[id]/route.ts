// src/app/api/dpivs/verify/[id]/route.ts
/**
 * DPIVS Public Verification API Endpoint (Rate-Limited & Sanitized)
 *
 * GET -> Decodes QR payload or resolves pressIdNumber/reporterId.
 * Checks date expiration, integrity checksum, and returns sanitized public profile.
 */

import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { decodeQRPayload, DEFAULT_DPIVS_SETTINGS } from "@/lib/dpivs";
import { getReporterByIdFromStore } from "@/lib/dpivs-store";
import { PublicVerificationResult, ReporterProfile, ReporterStatus } from "@/types/dpivs";

// Simple sliding window rate-limiting map (in-memory per node instance)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const limitWindow = 60 * 1000; // 60 seconds
  const maxRequests = DEFAULT_DPIVS_SETTINGS.securitySettings.rateLimitPublicVerification || 20;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + limitWindow });
    return false;
  }

  if (entry.count >= maxRequests) {
    return true;
  }

  entry.count += 1;
  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        verified: false,
        status: "invalid",
        errorMessage: "Rate limit exceeded. Please wait 60 seconds before trying again.",
        verificationTimestamp: new Date().toISOString(),
      } as PublicVerificationResult,
      { status: 429 }
    );
  }

  try {
    const { id } = await params;
    let pressIdNumber: string | null = null;
    let decodedStatus: ReporterStatus | null = null;

    // 1. Try Base64 QR decoding first
    if (!id.startsWith("SB-REP-")) {
      const qrCheck = decodeQRPayload(id);
      if (qrCheck.valid && qrCheck.payload) {
        pressIdNumber = qrCheck.payload.pressId;
        decodedStatus = qrCheck.payload.status;
      }
    }

    if (!pressIdNumber) {
      pressIdNumber = id;
    }

    let data: ReporterProfile | null = null;

    // 2. Fetch reporter from Firestore or Store Fallback
    try {
      let docSnap = await adminDb.collection("reporters").doc(pressIdNumber).get();

      if (!docSnap.exists) {
        const querySnap = await adminDb
          .collection("reporters")
          .where("pressIdNumber", "==", pressIdNumber)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          docSnap = querySnap.docs[0];
        }
      }

      if (docSnap.exists) {
        data = { id: docSnap.id, ...docSnap.data() } as ReporterProfile;
      }
    } catch (dbErr: any) {
      console.warn("[DPIVS Verify] Admin DB lookup failed/unauthenticated. Trying store fallback:", dbErr.message);
    }

    if (!data) {
      data = getReporterByIdFromStore(pressIdNumber);
    }

    if (!data) {
      return NextResponse.json(
        {
          success: true,
          verified: false,
          status: "not_found",
          errorMessage: "Press Credential ID not found in Samachar Bharat registry.",
          verificationTimestamp: new Date().toISOString(),
          fraudReportLink: "https://samacharbharat.in/report-fraud",
        } as PublicVerificationResult,
        { status: 404 }
      );
    }
    const now = new Date();
    const validUntilDate = new Date(data.validUntil);

    // Date Expiration Override
    let effectiveStatus: ReporterStatus | "expired" = data.status;
    if (now > validUntilDate && data.status !== ReporterStatus.REVOKED) {
      effectiveStatus = "expired";
    }

    const isVerified =
      effectiveStatus === ReporterStatus.ACTIVE ||
      effectiveStatus === ReporterStatus.RENEWED_ACTIVE;

    const result: PublicVerificationResult = {
      success: true,
      verified: isVerified,
      status: effectiveStatus,
      reporter: {
        pressIdNumber: data.pressIdNumber,
        fullName: data.fullName,
        designation: data.designation,
        organization: DEFAULT_DPIVS_SETTINGS.orgIdentity.fullName,
        photoURL: data.photoURL,
        issueDate: data.issueDate,
        validUntil: data.validUntil,
        status: data.status,
      },
      verificationTimestamp: new Date().toISOString(),
      fraudReportLink: "https://samacharbharat.in/report-fraud",
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[DPIVS GET /api/dpivs/verify/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        verified: false,
        status: "invalid",
        errorMessage: "Verification service temporarily unavailable.",
        verificationTimestamp: new Date().toISOString(),
      } as PublicVerificationResult,
      { status: 500 }
    );
  }
}
