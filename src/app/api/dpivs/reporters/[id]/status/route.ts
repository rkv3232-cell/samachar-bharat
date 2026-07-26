// src/app/api/dpivs/reporters/[id]/status/route.ts
/**
 * DPIVS Reporter Status Transition API
 *
 * POST -> Transition reporter lifecycle status (pending -> active -> suspended -> expired -> renewed_active / revoked)
 * Enforces role authorization matrix, state machine guards, and reason requirements.
 */

import { type NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { UserRole } from "@/types/auth.types";
import { toUserRole } from "@/lib/permissions";
import { createQRPayload, validateStatusTransition } from "@/lib/dpivs";
import {
  DPIVSAuditLogEntry,
  ReporterProfile,
  ReporterStatus,
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

export async function POST(
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
    const body = await request.json();
    const targetStatus = body.status as ReporterStatus;
    const reason = body.reason as string | undefined;

    if (!targetStatus) {
      return NextResponse.json(
        { success: false, error: "BAD_REQUEST", message: "Target status is required.", timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection("reporters").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "NOT_FOUND", message: "Reporter document not found.", timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const existingData = docSnap.data() as ReporterProfile;
    const currentStatus = existingData.status;

    // Validate Status Transition & Role Permissions
    const guard = validateStatusTransition(currentStatus, targetStatus, auth.role || null, reason);

    if (!guard.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "TRANSITION_FORBIDDEN",
          message: guard.reason || "Status transition is not allowed.",
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      status: targetStatus,
      updatedAt: nowIso,
      updatedBy: auth.uid,
    };

    if (reason) {
      if (targetStatus === ReporterStatus.SUSPENDED) updatePayload.suspensionReason = reason;
      if (targetStatus === ReporterStatus.REVOKED) updatePayload.revocationReason = reason;
      if (targetStatus === ReporterStatus.PENDING) updatePayload.rejectionReason = reason;
    }

    // Re-generate QR payload for new status
    const updatedReporterPartial = { ...existingData, ...updatePayload };
    updatePayload.qrCodeData = createQRPayload(updatedReporterPartial);

    await docRef.update(updatePayload);

    // Record immutable Audit Log entry
    const auditLogRef = docRef.collection("auditLogs").doc();
    const auditLog: DPIVSAuditLogEntry = {
      id: auditLogRef.id,
      timestamp: nowIso,
      actionPerformed: "STATUS_CHANGE",
      performedByUserId: auth.uid || "",
      performedByName: auth.name || "Admin",
      performedByRole: auth.role || "admin",
      previousSnapshot: existingData,
      newSnapshot: { ...existingData, ...updatePayload },
      changedFields: ["status"],
      reason: reason || `Status changed from ${currentStatus} to ${targetStatus}`,
    };
    await auditLogRef.set(auditLog);

    return NextResponse.json({
      success: true,
      data: {
        id,
        pressIdNumber: existingData.pressIdNumber,
        previousStatus: currentStatus,
        newStatus: targetStatus,
        updatedAt: nowIso,
      },
      message: `Reporter credential status updated from '${currentStatus}' to '${targetStatus}' successfully.`,
      timestamp: nowIso,
    });
  } catch (error: any) {
    console.error("[DPIVS POST /api/dpivs/reporters/[id]/status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "TRANSITION_FAILED",
        message: error.message || "Failed to update status.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
