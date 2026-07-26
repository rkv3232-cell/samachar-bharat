// src/lib/firebase/reporters.ts
/**
 * DPIVS Firestore Client Service & Field Normalization Layer
 *
 * Provides direct, authenticated Firestore persistence for DPIVS reporter credentials.
 * Normalizes legacy field names (`name` vs `fullName`, `reporterId` vs `pressIdNumber`,
 * `photoUrl` vs `photoURL`, `validTill` vs `validUntil`, `validFrom` vs `issueDate`).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  calculateExpiryDate,
  createQRPayload,
  DEFAULT_DPIVS_SETTINGS,
} from "@/lib/dpivs";
import {
  CreateReporterInput,
  ReporterProfile,
  ReporterStatus,
  UpdateReporterInput,
} from "@/types/dpivs";

// ── Field Normalizer ─────────────────────────────────────────────────────────

export function normalizeReporter(raw: any, docId: string): ReporterProfile {
  const statusStr = (raw.status || "pending").toLowerCase();
  let status = ReporterStatus.PENDING;

  if (statusStr === "active" || statusStr === "renewed_active") {
    status = ReporterStatus.ACTIVE;
  } else if (statusStr === "suspended") {
    status = ReporterStatus.SUSPENDED;
  } else if (statusStr === "expired") {
    status = ReporterStatus.EXPIRED;
  } else if (statusStr === "revoked") {
    status = ReporterStatus.REVOKED;
  }

  // Handle timestamp conversion
  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (typeof val === "string") return val;
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (val?.seconds) return new Date(val.seconds * 1000).toISOString();
    return new Date().toISOString();
  };

  const fullName = raw.fullName || raw.name || "Reporter";
  const pressIdNumber = raw.pressIdNumber || raw.reporterId || `SB-REP-${docId}`;
  const photoURL = raw.photoURL || raw.photoUrl || "";
  const signatureImageURL = raw.signatureImageURL || raw.signatureUrl || "";
  const stampImageURL = raw.stampImageURL || raw.stampUrl || "";
  const issueDate = parseDate(raw.issueDate || raw.validFrom);
  const validUntil = parseDate(raw.validUntil || raw.validTill);

  const address = raw.address || {
    street: raw.street || "",
    villageCity: raw.bureau || raw.city || "",
    district: raw.district || "Ghazipur",
    state: raw.state || "Uttar Pradesh",
    pinCode: raw.pinCode || "",
  };

  const partial: Partial<ReporterProfile> = {
    id: docId,
    pressIdNumber,
    fullName,
    fatherName: raw.fatherName || "",
    designation: raw.designation || "Staff Reporter",
    status,
    issueDate,
    validUntil,
  };

  const qrCodeData = raw.qrCodeData || createQRPayload(partial);

  return {
    id: docId,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
    createdBy: raw.createdBy || "system",
    updatedBy: raw.updatedBy || "system",

    pressIdNumber,
    status,
    qrCodeData,

    linkedUserId: raw.linkedUserId || null,
    userEmail: raw.email || raw.userEmail || null,

    fullName,
    fatherName: raw.fatherName || "",
    aadhaarNumber: raw.aadhaarNumber || raw.aadhaar || "",
    dateOfBirth: raw.dateOfBirth || "",
    gender: raw.gender || "male",

    designation: raw.designation || "Staff Reporter",
    department: raw.department || raw.bureau || "Editorial",
    beat: raw.beat || "",
    joiningDate: raw.joiningDate || "",
    experience: raw.experience || 1,
    employeeId: raw.employeeId || "",

    mobile: raw.mobile || "",
    alternateMobile: raw.alternateMobile || "",
    email: raw.email || "",
    address,

    bloodGroup: raw.bloodGroup || "O+",
    emergencyContact: raw.emergencyContact || {
      name: raw.fatherName || "",
      phone: raw.mobile || "",
    },

    photoURL,
    signatureImageURL,
    stampImageURL,

    generatedCards: raw.generatedCards || [],
    currentCardVersion: raw.currentCardVersion || 1,

    issueDate,
    validUntil,
    daysRemaining: raw.daysRemaining || 365,

    notes: raw.notes || "",
    schemaVersion: "1.0",
  };
}

// ── Generate Press ID ────────────────────────────────────────────────────────

export function generateClientPressId(): string {
  const year = new Date().getFullYear();
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let randomCode = "";
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SB-REP-${year}-${randomCode}`;
}

// ── Create Reporter in Firestore ──────────────────────────────────────────────

export async function createReporterInFirestore(
  input: CreateReporterInput,
  createdByUid: string
): Promise<ReporterProfile> {
  const docId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const pressIdNumber = generateClientPressId();
  const validityMonths = input.validityMonths || 12;
  const { issueDateIso, validUntilIso, daysRemaining } = calculateExpiryDate(
    new Date(),
    validityMonths
  );

  const nowIso = new Date().toISOString();

  const partialReporter: Partial<ReporterProfile> = {
    id: docId,
    pressIdNumber,
    fullName: input.fullName.trim(),
    fatherName: input.fatherName.trim(),
    designation: input.designation.trim(),
    status: ReporterStatus.PENDING,
    issueDate: issueDateIso,
    validUntil: validUntilIso,
  };

  const qrCodeData = createQRPayload(partialReporter);

  const reporterProfile: ReporterProfile = {
    id: docId,
    createdAt: nowIso,
    updatedAt: nowIso,
    createdBy: createdByUid || "system",
    updatedBy: createdByUid || "system",

    pressIdNumber,
    status: ReporterStatus.PENDING,
    qrCodeData,

    linkedUserId: input.linkedUserId || null,
    userEmail: input.email || null,

    fullName: input.fullName.trim(),
    fatherName: input.fatherName.trim(),
    aadhaarNumber: input.aadhaarNumber?.trim() || "",
    dateOfBirth: input.dateOfBirth || "",
    gender: input.gender || "male",

    designation: input.designation.trim(),
    department: input.department?.trim() || "Editorial",
    beat: input.beat?.trim() || "",
    joiningDate: input.joiningDate || "",
    experience: input.experience || 1,
    employeeId: input.employeeId?.trim() || "",

    mobile: input.mobile.trim(),
    alternateMobile: input.alternateMobile?.trim() || "",
    email: input.email?.trim() || "",
    address: input.address || {
      street: "",
      villageCity: "",
      district: "Ghazipur",
      state: "Uttar Pradesh",
      pinCode: "",
    },

    bloodGroup: input.bloodGroup,
    emergencyContact: input.emergencyContact || {},

    photoURL: input.photoURL || "",
    signatureImageURL: input.signatureImageURL || "",
    stampImageURL: input.stampImageURL || "",

    generatedCards: [],
    currentCardVersion: 0,

    issueDate: issueDateIso,
    validUntil: validUntilIso,
    daysRemaining,

    notes: input.notes?.trim() || "",
    schemaVersion: "1.0",
  };

  // Prepare dual-compatible Firestore document payload
  const firestorePayload = {
    ...reporterProfile,
    // Dual field aliases for legacy query compatibility
    name: input.fullName.trim(),
    reporterId: pressIdNumber,
    photoUrl: input.photoURL || "",
    signatureUrl: input.signatureImageURL || "",
    stampUrl: input.stampImageURL || "",
    validFrom: issueDateIso,
    validTill: validUntilIso,
    district: input.address?.district || "Ghazipur",
    state: input.address?.state || "Uttar Pradesh",
    bureau: input.department?.trim() || "Editorial",
  };

  const docRef = doc(db, "reporters", docId);
  await setDoc(docRef, firestorePayload);

  return reporterProfile;
}

// ── Fetch Reporters from Firestore ──────────────────────────────────────────

export async function fetchReportersFromFirestore(
  selectedStatus?: string,
  searchQuery?: string
): Promise<ReporterProfile[]> {
  const reportersRef = collection(db, "reporters");
  const snap = await getDocs(reportersRef);

  let list: ReporterProfile[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const normalized = normalizeReporter(data, docSnap.id);
    list.push(normalized);
  });

  // Sort descending by createdAt
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (selectedStatus && selectedStatus !== "ALL") {
    list = list.filter((r) => r.status === selectedStatus);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(q) ||
        r.pressIdNumber?.toLowerCase().includes(q) ||
        r.mobile?.includes(q) ||
        r.designation?.toLowerCase().includes(q) ||
        r.address?.district?.toLowerCase().includes(q)
    );
  }

  return list;
}

// ── Update Reporter in Firestore ──────────────────────────────────────────────

export async function updateReporterInFirestore(
  id: string,
  updates: Partial<ReporterProfile>,
  updatedByUid: string
): Promise<void> {
  const docRef = doc(db, "reporters", id);
  const nowIso = new Date().toISOString();

  const payload: any = {
    ...updates,
    updatedAt: nowIso,
    updatedBy: updatedByUid || "system",
  };

  if (updates.fullName) payload.name = updates.fullName;
  if (updates.pressIdNumber) payload.reporterId = updates.pressIdNumber;
  if (updates.photoURL) payload.photoUrl = updates.photoURL;
  if (updates.signatureImageURL) payload.signatureUrl = updates.signatureImageURL;
  if (updates.validUntil) payload.validTill = updates.validUntil;
  if (updates.issueDate) payload.validFrom = updates.issueDate;

  await updateDoc(docRef, payload);
}

// ── Soft Delete / Revoke Reporter in Firestore ────────────────────────────────

export async function deleteReporterInFirestore(
  id: string,
  revokedByUid: string
): Promise<void> {
  const docRef = doc(db, "reporters", id);
  const nowIso = new Date().toISOString();

  await updateDoc(docRef, {
    status: ReporterStatus.REVOKED,
    revocationReason: "Revoked by Organization Owner",
    updatedAt: nowIso,
    updatedBy: revokedByUid,
  });
}
