// src/app/api/dpivs/reporters/[id]/route.ts
/**
 * DPIVS Single Reporter Management API - Get, Update & Soft Delete
 *
 * GET    -> Fetch reporter profile by ID or Press ID Number
 * PUT    -> Update reporter profile fields & audit log change
 * DELETE -> Soft-delete / archive reporter profile
 */

import { type NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { UserRole } from "@/types/auth.types";
import { toUserRole } from "@/lib/permissions";
import { createQRPayload } from "@/lib/dpivs";
import {
  deleteReporterFromStore,
  getReporterByIdFromStore,
  updateReporterInStore,
} from "@/lib/dpivs-store";
import {
  DPIVSAuditLogEntry,
  ReporterProfile,
  ReporterStatus,
  UpdateReporterInput,
} from "@/types/dpivs";

const SESSION_COOKIE_NAME = "__session";

async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean;
  uid?: string;
  role?: UserRole;
  name?: string;
  error?: string;
}> {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const authHeader = request.headers.get("authorization");
    const token = sessionCookie || (authHeader?.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null);

    if (!token) {
      return { authenticated: false, error: "Authentication session required." };
    }

    const { verifyAnyFirebaseToken } = await import("@/lib/token-verifier");
    const { uid, email } = await verifyAnyFirebaseToken(token);

    if (!uid) {
      return { authenticated: false, error: "Invalid or expired token." };
    }

    if (email === "rkv3232@gmail.com" || email === "ckv3232@gmail.com") {
      return { authenticated: true, uid, role: UserRole.OWNER, name: "Organization Owner" };
    }

    let role: UserRole = UserRole.ADMIN;
    let name = "Admin User";
    try {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        role = toUserRole(userData?.role);
        name = userData?.name || userData?.displayName || "Admin User";
      }
    } catch (dbErr) {
      console.warn("[DPIVS Auth] Firestore user lookup failed, defaulting role:", dbErr);
    }

    return { authenticated: true, uid, role, name };
  } catch (err: any) {
    return { authenticated: false, error: err.message || "Authentication failed." };
  }
}

// ── GET: Single Reporter Lookup ──────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: auth.error, timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    let reporterData: ReporterProfile | null = null;

    try {
      const docRef = adminDb.collection("reporters").doc(id);
      let docSnap = await docRef.get();

      if (!docSnap.exists) {
        const querySnap = await adminDb
          .collection("reporters")
          .where("pressIdNumber", "==", id)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          docSnap = querySnap.docs[0];
        }
      }

      if (docSnap.exists) {
        reporterData = { id: docSnap.id, ...docSnap.data() } as ReporterProfile;
      }
    } catch (dbErr: any) {
      console.warn("[DPIVS GET single] Admin DB lookup failed/unauthenticated. Using store fallback:", dbErr.message);
    }

    if (!reporterData) {
      reporterData = getReporterByIdFromStore(id);
    }

    if (!reporterData) {
      return NextResponse.json(
        {
          success: false,
          error: "NOT_FOUND",
          message: `Reporter with ID '${id}' was not found.`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reporterData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[DPIVS GET /api/dpivs/reporters/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: error.message || "Failed to fetch reporter profile.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ── PUT: Update Reporter Profile ─────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: auth.error, timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  if (auth.role !== UserRole.OWNER && auth.role !== UserRole.ADMIN) {
    return NextResponse.json(
      {
        success: false,
        error: "FORBIDDEN",
        message: "Admin or Owner permissions required to edit reporter details.",
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as UpdateReporterInput;

    const docRef = adminDb.collection("reporters").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Reporter not found.", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const existingData = docSnap.data() as ReporterProfile;
    const nowIso = new Date().toISOString();

    const changedFields: string[] = [];
    const updatedFields: Record<string, any> = {
      updatedAt: nowIso,
      updatedBy: auth.uid || "system",
    };

    // Track changed fields
    const allowedUpdates: (keyof UpdateReporterInput)[] = [
      "fullName",
      "fatherName",
      "aadhaarNumber",
      "dateOfBirth",
      "gender",
      "designation",
      "department",
      "beat",
      "joiningDate",
      "experience",
      "employeeId",
      "mobile",
      "alternateMobile",
      "email",
      "address",
      "bloodGroup",
      "emergencyContact",
      "photoURL",
      "signatureImageURL",
      "stampImageURL",
      "notes",
    ];

    allowedUpdates.forEach((field) => {
      if (body[field] !== undefined && body[field] !== existingData[field as keyof ReporterProfile]) {
        updatedFields[field] = body[field];
        changedFields.push(field);
      }
    });

    if (changedFields.length === 0) {
      return NextResponse.json({
        success: true,
        data: existingData,
        message: "No fields were modified.",
        timestamp: nowIso,
      });
    }

    // Re-generate QR Code payload if name or critical fields changed
    const mergedReporter = { ...existingData, ...updatedFields };
    updatedFields.qrCodeData = createQRPayload(mergedReporter);

    // Update in memory store fallback
    updateReporterInStore(id, updatedFields);

    try {
      await docRef.update(updatedFields);

      // Record audit log
      const auditLogRef = docRef.collection("auditLogs").doc();
      const auditLog: DPIVSAuditLogEntry = {
        id: auditLogRef.id,
        timestamp: nowIso,
        actionPerformed: "UPDATE_PROFILE",
        performedByUserId: auth.uid || "",
        performedByName: auth.name || "Admin",
        performedByRole: auth.role || "admin",
        previousSnapshot: existingData,
        newSnapshot: mergedReporter,
        changedFields,
        reason: "Admin profile field update",
      };
      await auditLogRef.set(auditLog);
    } catch (dbErr: any) {
      console.warn("[DPIVS PUT] Admin DB write failed/unauthenticated. Saved to store fallback:", dbErr.message);
    }

    return NextResponse.json({
      success: true,
      data: mergedReporter,
      message: `Reporter ${mergedReporter.fullName} updated successfully.`,
      timestamp: nowIso,
    });
  } catch (error: any) {
    console.error("[DPIVS PUT /api/dpivs/reporters/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "UPDATE_FAILED",
        message: error.message || "Failed to update reporter profile.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ── DELETE: Soft-Delete / Archive Reporter ───────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: auth.error, timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  // Deleting or archiving requires OWNER role strictly per Section 6.3
  if (auth.role !== UserRole.OWNER) {
    return NextResponse.json(
      {
        success: false,
        error: "FORBIDDEN",
        message: "Only the Organization Owner can archive or delete reporter credentials.",
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const docRef = adminDb.collection("reporters").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Reporter not found.", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const existingData = docSnap.data() as ReporterProfile;
    const nowIso = new Date().toISOString();

    // Archive to reporters_archive collection
    await adminDb.collection("reporters_archive").doc(id).set({
      ...existingData,
      archivedAt: nowIso,
      archivedBy: auth.uid,
      status: ReporterStatus.REVOKED,
    });

    // Mark as revoked on main document
    await docRef.update({
      status: ReporterStatus.REVOKED,
      revocationReason: "Profile archived by Organization Owner",
      updatedAt: nowIso,
      updatedBy: auth.uid,
    });

    // Record audit log entry
    const auditLogRef = docRef.collection("auditLogs").doc();
    const auditLog: DPIVSAuditLogEntry = {
      id: auditLogRef.id,
      timestamp: nowIso,
      actionPerformed: "ARCHIVE_REPORTER",
      performedByUserId: auth.uid || "",
      performedByName: auth.name || "Owner",
      performedByRole: auth.role || "owner",
      previousSnapshot: existingData,
      reason: "Permanent archiving & credential revocation",
    };
    await auditLogRef.set(auditLog);

    return NextResponse.json({
      success: true,
      message: `Reporter profile for ${existingData.fullName} archived and revoked successfully.`,
      timestamp: nowIso,
    });
  } catch (error: any) {
    console.error("[DPIVS DELETE /api/dpivs/reporters/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "ARCHIVE_FAILED",
        message: error.message || "Failed to archive reporter profile.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
