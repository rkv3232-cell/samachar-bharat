// src/types/dpivs.ts
/**
 * Digital Press Identity & Verification System (DPIVS)
 * Complete Professional Type Definitions & Data Models
 */

export enum ReporterStatus {
  PENDING = "pending",
  ACTIVE = "active",
  SUSPENDED = "suspended",
  EXPIRED = "expired",
  RENEWED_ACTIVE = "renewed_active",
  REVOKED = "revoked",
}

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Gender = "male" | "female" | "other";

export interface ReporterAddress {
  street?: string;
  villageCity?: string;
  district?: string;
  state?: string;
  pinCode?: string;
}

export interface EmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface PressCardVersion {
  id: string;
  version: number;
  generatedAt: string;
  format: "png" | "pdf" | "both";
  frontCardURL: string;
  backCardURL: string;
  combinedPdfURL?: string;
  generatedBy: string;
  fileSizeBytes?: number;
  checksumSHA256?: string;
}

export interface RenewalRecord {
  renewalId: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  previousValidUntil: string;
  newValidUntil: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

// ─── Complete Reporter Profile Document (`reporters/{reporterId}`) ───────────

export interface ReporterProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  // Identity
  pressIdNumber: string; // Auto Generated Reporter Code e.g. SB-REP-2026-XXXXXX
  status: ReporterStatus;
  qrCodeData: string;

  // Personal Information
  aadhaarNumber?: string;
  fullName: string; // English & Devanagari
  fatherName: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup: BloodGroup;

  // Professional Information
  employeeId?: string;
  designation: string;
  department?: string;
  beat?: string; // Coverage Area / Beat
  joiningDate?: string;
  experience?: number; // Years of experience

  // Contact Information
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address?: ReporterAddress;

  // Emergency Information
  emergencyContact?: EmergencyContact;

  // Media Documents (Cloudinary URLs)
  photoURL?: string;
  signatureImageURL?: string;
  stampImageURL?: string;

  // Optional Account Linkage
  linkedUserId?: string | null;
  userEmail?: string | null;

  // Card & Versioning
  generatedCards: PressCardVersion[];
  currentCardVersion: number;

  // Validity
  issueDate: string;
  validUntil: string;
  daysRemaining?: number;

  // Administrative Notes & Reasons
  notes?: string;
  internalComments?: string[];
  rejectionReason?: string;
  suspensionReason?: string;
  revocationReason?: string;

  // Workflow
  renewalHistory?: RenewalRecord[];
  lastRenewedAt?: string;
  pendingRenewalRequest?: boolean;

  customFields?: Record<string, any>;
  tags?: string[];
  schemaVersion: string;
}

// ─── Comprehensive Form Input DTO (Creation & Edits) ─────────────────────────

export interface CreateReporterInput {
  aadhaarNumber?: string;
  fullName: string;
  fatherName: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup: BloodGroup;

  employeeId?: string;
  designation: string;
  department?: string;
  beat?: string;
  joiningDate?: string;
  experience?: number;

  mobile: string;
  alternateMobile?: string;
  email?: string;
  address?: ReporterAddress;

  emergencyContact?: EmergencyContact;

  photoURL?: string; // Cloudinary URL
  signatureImageURL?: string; // Cloudinary URL
  stampImageURL?: string; // Cloudinary URL

  validityMonths?: number;
  linkedUserId?: string;
  notes?: string;
}

export interface UpdateReporterInput extends Partial<CreateReporterInput> {
  id: string;
}

export interface DPIVSAuditLogEntry {
  id: string;
  timestamp: string;
  actionPerformed: string;
  performedByUserId: string;
  performedByName: string;
  performedByRole: string;
  previousSnapshot?: Partial<ReporterProfile>;
  newSnapshot?: Partial<ReporterProfile>;
  changedFields?: string[];
  reason?: string;
}

export interface QRPayload {
  v: number;
  pressId: string;
  reporterId: string;
  fullName: string;
  org: string;
  issueDate: string;
  validUntil: string;
  status: ReporterStatus;
  integrityHash: string;
}

export interface PublicVerificationResult {
  success: boolean;
  verified: boolean;
  status: ReporterStatus | "expired" | "not_found" | "invalid";
  reporter?: {
    pressIdNumber: string;
    fullName: string;
    designation: string;
    organization: string;
    photoURL?: string;
    issueDate: string;
    validUntil: string;
    status: ReporterStatus;
  };
  warningMessage?: string;
  errorMessage?: string;
  verificationTimestamp: string;
  fraudReportLink?: string;
}

export interface DPIVSSettings {
  orgIdentity: {
    fullName: string;
    shortName: string;
    website: string;
    logoUrl: string;
    signatureUrl: string;
    sealStampUrl: string;
  };
  cardDefaults: {
    validityMonths: number;
    idPrefix: string;
    idSuffix?: string;
  };
  behaviorFlags: {
    autoApprove: boolean;
    allowSelfServiceRenewal: boolean;
    enablePublicVerification: boolean;
  };
  notificationTemplates: {
    fcmTemplateIds?: Record<string, string>;
    reminderSchedules?: number[];
  };
  legalTerms: {
    termsAndConditionsText: string;
    version: string;
  };
  securitySettings: {
    qrSignatureEnabled: boolean;
    rateLimitPublicVerification: number;
  };
  visualTheme?: Record<string, string>;
}
