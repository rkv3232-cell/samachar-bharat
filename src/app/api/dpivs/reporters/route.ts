// src/app/api/dpivs/reporters/route.ts
/**
 * DPIVS Reporter Management API - List & Create
 *
 * GET  -> Paginated search, filter, and list of reporter profiles
 * POST -> Create a new reporter profile with validation & press ID generation
 */

import { type NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { UserRole } from "@/types/auth.types";
import { toUserRole } from "@/lib/permissions";
import {
  calculateExpiryDate,
  createQRPayload,
  DEFAULT_DPIVS_SETTINGS,
  generatePressIdNumber,
  validateReporterInput,
} from "@/lib/dpivs";
import { addReporterToStore, getReportersFromStore } from "@/lib/dpivs-store";
import {
  CreateReporterInput,
  DPIVSAuditLogEntry,
  ReporterProfile,
  ReporterStatus,
} from "@/types/dpivs";

const SESSION_COOKIE_NAME = "__session";

// ── Auth Helper ──────────────────────────────────────────────────────────────

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

    // Owner override
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

// ── GET: Search, Filter & List Reporters ─────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: auth.error, timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") as ReporterStatus | null;
  const searchQuery = searchParams.get("search")?.toLowerCase().trim() || "";

  try {
    const districtParam = searchParams.get("district")?.trim() || "";
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);

    let queryRef: FirebaseFirestore.Query = adminDb.collection("reporters");

    if (statusParam && statusParam !== ("ALL" as any)) {
      queryRef = queryRef.where("status", "==", statusParam);
    }

    if (districtParam) {
      queryRef = queryRef.where("address.district", "==", districtParam);
    }

    queryRef = queryRef.orderBy("createdAt", "desc").limit(limitParam);

    const { normalizeReporter } = await import("@/lib/firebase/reporters");
    const snapshot = await queryRef.get();
    let reporters: ReporterProfile[] = [];

    snapshot.forEach((docSnap) => {
      const item = normalizeReporter(docSnap.data(), docSnap.id);
      reporters.push(item);
      addReporterToStore(item);
    });

    if (searchQuery) {
      reporters = reporters.filter((r) => {
        return (
          r.fullName?.toLowerCase().includes(searchQuery) ||
          r.pressIdNumber?.toLowerCase().includes(searchQuery) ||
          r.mobile?.includes(searchQuery) ||
          r.designation?.toLowerCase().includes(searchQuery)
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: reporters,
      count: reporters.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn("[DPIVS GET] Admin DB query failed/unauthenticated. Using store fallback:", error.message);
    const storeReporters = getReportersFromStore(statusParam || undefined, searchQuery);
    return NextResponse.json({
      success: true,
      data: storeReporters,
      count: storeReporters.length,
      fallback: true,
      timestamp: new Date().toISOString(),
    });
  }
}

// ── POST: Create Reporter Profile ────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: auth.error, timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  // Check admin or owner role
  if (auth.role !== UserRole.OWNER && auth.role !== UserRole.ADMIN) {
    return NextResponse.json(
      {
        success: false,
        error: "FORBIDDEN",
        message: "Only administrators or owners can create reporter credentials.",
        timestamp: new Date().toISOString(),
      },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as CreateReporterInput;

    // Validate Input
    const validation = validateReporterInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_FAILED",
          message: "Reporter input validation failed.",
          details: validation.errors,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Generate unique Press ID Number (SB-REP-YYYY-XXXXXX)
    const year = new Date().getFullYear();
    const prefix = DEFAULT_DPIVS_SETTINGS.cardDefaults.idPrefix;
    const pressIdNumber = `${prefix}-${year}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate dates
    const validityMonths = body.validityMonths || DEFAULT_DPIVS_SETTINGS.cardDefaults.validityMonths;
    const { issueDateIso, validUntilIso, daysRemaining } = calculateExpiryDate(
      new Date(),
      validityMonths
    );

    const docId = `rep_${Date.now()}`;
    const nowIso = new Date().toISOString();

    const partialReporter: Partial<ReporterProfile> = {
      id: docId,
      pressIdNumber,
      fullName: body.fullName.trim(),
      fatherName: body.fatherName.trim(),
      designation: body.designation.trim(),
      status: ReporterStatus.PENDING,
      issueDate: issueDateIso,
      validUntil: validUntilIso,
    };

    // Encode QR Payload
    const qrCodeData = createQRPayload(partialReporter);

    const reporterData: ReporterProfile = {
      id: docId,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: auth.uid || "system",
      updatedBy: auth.uid || "system",

      pressIdNumber,
      status: ReporterStatus.PENDING,
      qrCodeData,

      linkedUserId: body.linkedUserId || null,
      userEmail: body.email || null,

      fullName: body.fullName.trim(),
      fatherName: body.fatherName.trim(),
      aadhaarNumber: body.aadhaarNumber?.trim() || "",
      dateOfBirth: body.dateOfBirth || "",
      gender: body.gender || "male",

      designation: body.designation.trim(),
      department: body.department?.trim() || "",
      beat: body.beat?.trim() || "",
      joiningDate: body.joiningDate || "",
      experience: body.experience || 1,
      employeeId: body.employeeId?.trim() || "",

      mobile: body.mobile.trim(),
      alternateMobile: body.alternateMobile?.trim() || "",
      email: body.email?.trim() || "",
      address: body.address || {},

      bloodGroup: body.bloodGroup,
      emergencyContact: body.emergencyContact || {},

      photoURL: body.photoURL || "",
      signatureImageURL: body.signatureImageURL || "",
      stampImageURL: body.stampImageURL || "",

      generatedCards: [],
      currentCardVersion: 0,

      issueDate: issueDateIso,
      validUntil: validUntilIso,
      daysRemaining,

      notes: body.notes?.trim() || "",
      schemaVersion: "1.0",
    };

    // Always add to local memory store
    addReporterToStore(reporterData);

    // Try saving to Firestore Admin DB
    try {
      const newDocRef = adminDb.collection("reporters").doc(docId);
      await newDocRef.set(reporterData);

      const auditLogRef = newDocRef.collection("auditLogs").doc();
      const auditLog: DPIVSAuditLogEntry = {
        id: auditLogRef.id,
        timestamp: nowIso,
        actionPerformed: "CREATE_REPORTER",
        performedByUserId: auth.uid || "",
        performedByName: auth.name || "Admin",
        performedByRole: auth.role || "admin",
        newSnapshot: reporterData,
        reason: "Initial profile registration",
      };
      await auditLogRef.set(auditLog);
    } catch (dbErr: any) {
      console.warn("[DPIVS POST] Admin DB write failed/unauthenticated. Saved to store fallback:", dbErr.message);
    }

    return NextResponse.json(
      {
        success: true,
        data: reporterData,
        message: `Reporter credential profile created successfully for ${reporterData.fullName}.`,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[DPIVS POST /api/dpivs/reporters] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "CREATION_FAILED",
        message: error.message || "Failed to create reporter profile.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
