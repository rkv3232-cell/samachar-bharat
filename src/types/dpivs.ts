// ============================================================
// types/dpivs.ts
// Digital Press Identity & Verification System (DPIVS)
// Central type definitions for reporters, press IDs & audit log
// ============================================================

export type ReporterStatus = "pending" | "active" | "suspended" | "expired";

export interface Reporter {
    id: string; // Firestore document ID
    reporterId: string; // Unique human-readable ID e.g. SB-2026-0001
    fullName: string;
    photoUrl?: string;
    signatureUrl?: string;
    aadhaar?: string; // optional
    mobile: string;
    email: string;
    designation: string;
    bureau?: string;
    district?: string;
    state?: string;
    bloodGroup?: string;
    joiningDate?: string; // ISO date string (yyyy-mm-dd)
    validFrom: string; // ISO date string
    validTill: string; // ISO date string
    status: ReporterStatus;
    createdAt?: any;
    updatedAt?: any;
}

// Payload used when creating / editing a reporter (no server-managed fields)
export type ReporterInput = Omit<
    Reporter,
    "id" | "reporterId" | "createdAt" | "updatedAt" | "status"
> & {
    reporterId?: string;
    status?: ReporterStatus;
};

export type AuditAction =
    | "created"
    | "updated"
    | "deleted"
    | "suspended"
    | "activated"
    | "renewed"
    | "id_issued";

export interface AuditEntry {
    id: string;
    reporterDocId: string;
    reporterId: string;
    reporterName: string;
    action: AuditAction;
    details?: string;
    actor?: string; // email / name of admin performing action
    createdAt: any;
}

export interface DpivsStats {
    total: number;
    active: number;
    expiringSoon: number; // active but expiring within 30 days
    expired: number;
    pending: number;
    suspended: number;
}
