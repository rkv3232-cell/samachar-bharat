// src/lib/dpivs.ts
/**
 * Digital Press Identity & Verification System (DPIVS)
 * Core Business Logic Engine
 *
 * Implements:
 * - Press ID Generation (SB-REP-YYYY-XXXXXX format with collision checks)
 * - Input Validation Engine (regex for Indian mobile, blood group, PIN, Unicode names)
 * - Expiration & Validity Calculator (variable month lengths & leap years)
 * - State Machine & Status Transition Guard (RBAC state machine)
 * - QR Payload Generator & Hash Integrity Checksum (SHA-256)
 */

import crypto from "crypto";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { UserRole } from "@/types/auth.types";
import {
  BloodGroup,
  CreateReporterInput,
  DPIVSSettings,
  Gender,
  QRPayload,
  ReporterProfile,
  ReporterStatus,
} from "@/types/dpivs";

// ─── Default DPIVS Configuration Singleton Fallback ─────────────────────────

export const DEFAULT_DPIVS_SETTINGS: DPIVSSettings = {
  orgIdentity: {
    fullName: "Samachar Bharat Digital Media",
    shortName: "Samachar Bharat",
    website: "https://samacharbharat.in",
    logoUrl: "/icon.png",
    signatureUrl: "/images/dpivs/signature_placeholder.png",
    sealStampUrl: "/images/dpivs/seal_placeholder.png",
  },
  cardDefaults: {
    validityMonths: 12,
    idPrefix: "SB-REP",
  },
  behaviorFlags: {
    autoApprove: false,
    allowSelfServiceRenewal: false,
    enablePublicVerification: true,
  },
  notificationTemplates: {
    reminderSchedules: [30, 15, 7, 1],
  },
  legalTerms: {
    termsAndConditionsText:
      "This card is the official property of Samachar Bharat. If found, please return to the publisher address or notify via support@samacharbharat.in. Unauthorized duplication or misuse is punishable under IT Act 2000.",
    version: "1.0",
  },
  securitySettings: {
    qrSignatureEnabled: true,
    rateLimitPublicVerification: 20,
  },
};

// ─── 1. Press ID Generation Algorithm ────────────────────────────────────────

/**
 * Unambiguous character set for Press ID generation.
 * Excludes ambiguous chars: 0, O, 1, I, l, L.
 */
const UNAMBIGUOUS_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generates a random 6-character code from UNAMBIGUOUS_CHARSET.
 */

function generateRandomCode(length = 6): string {
  let result = "";
  const charsetLength = UNAMBIGUOUS_CHARSET.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charsetLength);
    result += UNAMBIGUOUS_CHARSET[randomIndex];
  }
  return result;
}

/**
 * Generates a unique Press ID Number formatted as: SB-REP-{YYYY}-{XXXXXX}
 * Uses Firestore transaction or lookup query with up to 5 retries to guarantee uniqueness.
 */
export async function generatePressIdNumber(
  prefix = "SB-REP",
  maxAttempts = 5
): Promise<string> {
  const year = new Date().getFullYear();
  const db = getFirestore();
  const reportersRef = collection(db, "reporters");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const randomCode = generateRandomCode(6);
    const candidateId = `${prefix}-${year}-${randomCode}`;

    // Query Firestore to verify collision freedom
    const q = query(reportersRef, where("pressIdNumber", "==", candidateId));
    const snap = await getDocs(q);

    if (snap.empty) {
      return candidateId;
    }
  }

  throw new Error(
    `[DPIVS] Failed to generate a unique Press ID Number after ${maxAttempts} attempts.`
  );
}

// ─── 2. Input Validation Engine ──────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// Regex patterns per Section 6.4
export const VALIDATION_PATTERNS = {
  indianMobile: /^[6-9]\d{9}$/,
  bloodGroup: /^(A|B|AB|O)[+-]$/,
  pinCode: /^\d{6}$/,
  aadhaar: /^\d{4}\s?\d{4}\s?\d{4}$/,
  fullName: /^[a-zA-Z\u0900-\u097F\s\.]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

/**
 * Validates reporter creation input against business rules.
 */
export function validateReporterInput(input: CreateReporterInput): ValidationResult {
  const errors: Record<string, string> = {};

  // Full Name validation
  if (!input.fullName || !input.fullName.trim()) {
    errors.fullName = "Full name is required";
  } else if (!VALIDATION_PATTERNS.fullName.test(input.fullName.trim())) {
    errors.fullName = "Full name contains invalid characters (Only English/Devanagari letters allowed)";
  }

  // Father Name validation
  if (!input.fatherName || !input.fatherName.trim()) {
    errors.fatherName = "Father's name is required";
  }

  // Designation validation
  if (!input.designation || !input.designation.trim()) {
    errors.designation = "Designation is required";
  }

  // Mobile number validation
  if (!input.mobile) {
    errors.mobile = "Mobile number is required";
  } else if (!VALIDATION_PATTERNS.indianMobile.test(input.mobile.trim())) {
    errors.mobile = "Invalid 10-digit Indian mobile number (Must start with 6, 7, 8, or 9)";
  }

  // Aadhaar validation (optional but validated if provided)
  if (input.aadhaarNumber && !VALIDATION_PATTERNS.aadhaar.test(input.aadhaarNumber.trim())) {
    errors.aadhaarNumber = "Aadhaar number must be exactly 12 digits";
  }

  // Alternate mobile (optional validation)
  if (input.alternateMobile && !VALIDATION_PATTERNS.indianMobile.test(input.alternateMobile.trim())) {
    errors.alternateMobile = "Invalid alternate mobile number";
  }

  // Email (optional validation)
  if (input.email && !VALIDATION_PATTERNS.email.test(input.email.trim())) {
    errors.email = "Invalid email address format";
  }

  // Blood Group validation
  if (!input.bloodGroup) {
    errors.bloodGroup = "Blood group is required";
  } else if (!VALIDATION_PATTERNS.bloodGroup.test(input.bloodGroup.trim())) {
    errors.bloodGroup = "Invalid blood group (Expected: A+, A-, B+, B-, AB+, AB-, O+, O-)";
  }

  // PIN Code validation (if address provided)
  if (input.address?.pinCode && !VALIDATION_PATTERNS.pinCode.test(input.address.pinCode.trim())) {
    errors.pinCode = "PIN code must be exactly 6 digits";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ─── 3. Expiration Calculation Engine ────────────────────────────────────────

/**
 * Calculates validUntil timestamp given an issueDate and duration in months.
 * ValidUntil is set to the last millisecond of the calculated end date (23:59:59.999).
 * Standard bounds: 1 to 60 months (default: 12).
 */
export function calculateExpiryDate(
  issueDate: Date | string = new Date(),
  validityMonths = 12
): { issueDateIso: string; validUntilIso: string; daysRemaining: number } {
  const startDate = typeof issueDate === "string" ? new Date(issueDate) : new Date(issueDate);
  const cappedMonths = Math.max(1, Math.min(60, validityMonths));

  const targetDate = new Date(startDate);
  targetDate.setMonth(targetDate.getMonth() + cappedMonths);

  // Set time to end of day 23:59:59.999
  targetDate.setHours(23, 59, 59, 999);

  const issueDateIso = startDate.toISOString();
  const validUntilIso = targetDate.toISOString();

  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    issueDateIso,
    validUntilIso,
    daysRemaining,
  };
}

// ─── 4. QR Payload & SHA-256 Integrity Engine ─────────────────────────────

/**
 * Calculates SHA-256 hash across immutable reporter payload fields to prevent tampering.
 */
export function generateIntegrityHash(
  pressId: string,
  fullName: string,
  issueDate: string,
  validUntil: string,
  status: string
): string {
  const rawString = `${pressId}|${fullName}|${issueDate}|${validUntil}|${status}`;
  return crypto.createHash("sha256").update(rawString).digest("hex");
}

/**
 * Creates Base64-encoded QR Payload string.
 */
export function createQRPayload(reporter: Partial<ReporterProfile>): string {
  const pressId = reporter.pressIdNumber ?? "";
  const fullName = reporter.fullName ?? "";
  const issueDate = reporter.issueDate ?? new Date().toISOString();
  const validUntil = reporter.validUntil ?? new Date().toISOString();
  const status = reporter.status ?? ReporterStatus.PENDING;

  const integrityHash = generateIntegrityHash(pressId, fullName, issueDate, validUntil, status);

  const payload: QRPayload = {
    v: 1,
    pressId,
    reporterId: reporter.id ?? "",
    fullName,
    org: DEFAULT_DPIVS_SETTINGS.orgIdentity.shortName,
    issueDate,
    validUntil,
    status,
    integrityHash,
  };

  const jsonString = JSON.stringify(payload);
  return Buffer.from(jsonString, "utf-8").toString("base64");
}

/**
 * Decodes and verifies Base64 QR Payload.
 */
export function decodeQRPayload(base64Payload: string): {
  valid: boolean;
  payload?: QRPayload;
  error?: string;
} {
  try {
    const jsonString = Buffer.from(base64Payload, "base64").toString("utf-8");
    const payload = JSON.parse(jsonString) as QRPayload;

    if (!payload.pressId || !payload.integrityHash) {
      return { valid: false, error: "Malformed QR payload structure" };
    }

    const expectedHash = generateIntegrityHash(
      payload.pressId,
      payload.fullName,
      payload.issueDate,
      payload.validUntil,
      payload.status
    );

    if (expectedHash !== payload.integrityHash) {
      return { valid: false, payload, error: "QR integrity checksum verification failed" };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: "Invalid base64 encoding or JSON structure" };
  }
}

// ─── 5. Status Transition & State Machine Guard ─────────────────────────────

// Allowed status transitions per Section 6.3
const ALLOWED_TRANSITIONS: Record<ReporterStatus, ReporterStatus[]> = {
  [ReporterStatus.PENDING]: [ReporterStatus.ACTIVE, ReporterStatus.REVOKED],
  [ReporterStatus.ACTIVE]: [
    ReporterStatus.SUSPENDED,
    ReporterStatus.EXPIRED,
    ReporterStatus.REVOKED,
    ReporterStatus.RENEWED_ACTIVE,
  ],
  [ReporterStatus.SUSPENDED]: [ReporterStatus.ACTIVE, ReporterStatus.REVOKED],
  [ReporterStatus.EXPIRED]: [ReporterStatus.RENEWED_ACTIVE, ReporterStatus.REVOKED],
  [ReporterStatus.RENEWED_ACTIVE]: [
    ReporterStatus.SUSPENDED,
    ReporterStatus.EXPIRED,
    ReporterStatus.REVOKED,
  ],
  [ReporterStatus.REVOKED]: [], // Terminal state
};

export interface StatusTransitionGuardResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates whether a status transition is permitted given current state, target state, and acting user role.
 */
export function validateStatusTransition(
  currentStatus: ReporterStatus,
  targetStatus: ReporterStatus,
  userRole: UserRole | string | null,
  reasonInput?: string
): StatusTransitionGuardResult {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // Check state machine valid next states
  const validNextStates = ALLOWED_TRANSITIONS[currentStatus] ?? [];
  if (!validNextStates.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `Invalid transition from state '${currentStatus}' to '${targetStatus}'`,
    };
  }

  // Check Role Authorization Matrix
  const roleStr = userRole ? userRole.toLowerCase() : "";

  // Revocation requires OWNER role strictly
  if (targetStatus === ReporterStatus.REVOKED) {
    if (roleStr !== UserRole.OWNER) {
      return {
        allowed: false,
        reason: "Only the Organization Owner can revoke a press identity credential.",
      };
    }
  } else {
    // Other transitions require ADMIN or OWNER
    if (roleStr !== UserRole.ADMIN && roleStr !== UserRole.OWNER) {
      return {
        allowed: false,
        reason: "Admin or Owner privileges are required to modify reporter status.",
      };
    }
  }

  // Destructive states require typed reason
  const destructiveStates = [
    ReporterStatus.SUSPENDED,
    ReporterStatus.REVOKED,
  ];

  if (destructiveStates.includes(targetStatus) && (!reasonInput || !reasonInput.trim())) {
    return {
      allowed: false,
      reason: `A detailed reason is required when placing credentials in '${targetStatus}' state.`,
    };
  }

  return { allowed: true };
}
