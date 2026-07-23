// ============================================================
// lib/firestore/reporters.ts
// Firestore operations for the Digital Press Identity &
// Verification System (DPIVS) — reporters + audit log.
// ============================================================

import { db } from "@/lib/firebase";
import {
    collection,
    query,
    orderBy,
    where,
    limit,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from "firebase/firestore";
import type {
    Reporter,
    ReporterInput,
    ReporterStatus,
    AuditAction,
    AuditEntry,
    DpivsStats,
} from "@/types/dpivs";

const REPORTERS = "reporters";
const AUDIT = "dpivsAudit";

// ──────────────────────────────────────────────
//  HELPERS
// ──────────────────────────────────────────────

/** Number of days from today until the given ISO date (negative = past). */
export function daysUntil(isoDate?: string): number {
    if (!isoDate) return Infinity;
    const target = new Date(isoDate);
    if (isNaN(target.getTime())) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Derives the effective status of a reporter, accounting for expiry.
 * Suspended stays suspended; otherwise an expired validTill overrides.
 */
export function resolveStatus(reporter: Pick<Reporter, "status" | "validTill">): ReporterStatus {
    if (reporter.status === "suspended") return "suspended";
    if (reporter.status === "pending") return "pending";
    if (daysUntil(reporter.validTill) < 0) return "expired";
    return reporter.status === "expired" ? "expired" : "active";
}

/** Generates the next unique reporter ID like SB-2026-0007. */
async function generateReporterId(): Promise<string> {
    const year = new Date().getFullYear();
    const snapshot = await getDocs(collection(db, REPORTERS));
    const prefix = `SB-${year}-`;
    let max = 0;
    snapshot.forEach((d) => {
        const rid: string = d.data().reporterId || "";
        if (rid.startsWith(prefix)) {
            const n = parseInt(rid.slice(prefix.length), 10);
            if (!isNaN(n) && n > max) max = n;
        }
    });
    return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

// ──────────────────────────────────────────────
//  AUDIT LOG
// ──────────────────────────────────────────────

export async function addAuditEntry(entry: {
    reporterDocId: string;
    reporterId: string;
    reporterName: string;
    action: AuditAction;
    details?: string;
    actor?: string;
}): Promise<void> {
    try {
        await addDoc(collection(db, AUDIT), {
            ...entry,
            details: entry.details || "",
            actor: entry.actor || "System",
            createdAt: serverTimestamp(),
        });
    } catch (err) {
        console.error("[DPIVS] Failed to write audit entry:", err);
    }
}

export async function fetchAuditLog(max = 50): Promise<AuditEntry[]> {
    try {
        const q = query(collection(db, AUDIT), orderBy("createdAt", "desc"), limit(max));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditEntry));
    } catch (err) {
        console.error("[DPIVS] Failed to fetch audit log:", err);
        return [];
    }
}

// ──────────────────────────────────────────────
//  REPORTER CRUD
// ──────────────────────────────────────────────

export async function fetchReporters(): Promise<Reporter[]> {
    const q = query(collection(db, REPORTERS), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
        const data = d.data() as Omit<Reporter, "id">;
        return { id: d.id, ...data, status: resolveStatus(data) };
    });
}

export async function fetchReporter(id: string): Promise<Reporter | null> {
    const snap = await getDoc(doc(db, REPORTERS, id));
    if (!snap.exists()) return null;
    const data = snap.data() as Omit<Reporter, "id">;
    return { id: snap.id, ...data, status: resolveStatus(data) };
}

/** Public verification lookup by the human-readable reporterId. */
export async function fetchReporterByReporterId(
    reporterId: string
): Promise<Reporter | null> {
    const q = query(
        collection(db, REPORTERS),
        where("reporterId", "==", reporterId),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    const data = d.data() as Omit<Reporter, "id">;
    return { id: d.id, ...data, status: resolveStatus(data) };
}

export async function createReporter(
    input: ReporterInput,
    actor?: string
): Promise<Reporter> {
    const reporterId = input.reporterId || (await generateReporterId());
    const status: ReporterStatus = input.status || "active";

    const payload = {
        ...input,
        reporterId,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, REPORTERS), payload);

    await addAuditEntry({
        reporterDocId: docRef.id,
        reporterId,
        reporterName: input.fullName,
        action: "created",
        details: `Reporter registered with status ${status}`,
        actor,
    });

    return { id: docRef.id, ...(payload as any), status };
}

export async function updateReporter(
    id: string,
    input: Partial<ReporterInput>,
    reporterName: string,
    reporterId: string,
    actor?: string
): Promise<void> {
    await updateDoc(doc(db, REPORTERS, id), {
        ...input,
        updatedAt: serverTimestamp(),
    });

    await addAuditEntry({
        reporterDocId: id,
        reporterId,
        reporterName,
        action: "updated",
        details: "Reporter profile updated",
        actor,
    });
}

export async function deleteReporter(
    id: string,
    reporterName: string,
    reporterId: string,
    actor?: string
): Promise<void> {
    await deleteDoc(doc(db, REPORTERS, id));
    await addAuditEntry({
        reporterDocId: id,
        reporterId,
        reporterName,
        action: "deleted",
        details: "Reporter record permanently deleted",
        actor,
    });
}

export async function setReporterStatus(
    id: string,
    status: ReporterStatus,
    reporterName: string,
    reporterId: string,
    actor?: string
): Promise<void> {
    await updateDoc(doc(db, REPORTERS, id), { status, updatedAt: serverTimestamp() });
    await addAuditEntry({
        reporterDocId: id,
        reporterId,
        reporterName,
        action: status === "suspended" ? "suspended" : "activated",
        details: `Status changed to ${status}`,
        actor,
    });
}

/** Renews a reporter: extends validity and reactivates. */
export async function renewReporter(
    id: string,
    validFrom: string,
    validTill: string,
    reporterName: string,
    reporterId: string,
    actor?: string
): Promise<void> {
    await updateDoc(doc(db, REPORTERS, id), {
        validFrom,
        validTill,
        status: "active",
        updatedAt: serverTimestamp(),
    });
    await addAuditEntry({
        reporterDocId: id,
        reporterId,
        reporterName,
        action: "renewed",
        details: `Renewed — valid ${validFrom} to ${validTill}`,
        actor,
    });
}

/** Records that a printable ID card was issued/generated. */
export async function logIdIssued(
    id: string,
    reporterName: string,
    reporterId: string,
    actor?: string
): Promise<void> {
    await addAuditEntry({
        reporterDocId: id,
        reporterId,
        reporterName,
        action: "id_issued",
        details: "Digital Press ID generated",
        actor,
    });
}

// ──────────────────────────────────────────────
//  STATS
// ──────────────────────────────────────────────

export function computeStats(reporters: Reporter[]): DpivsStats {
    const stats: DpivsStats = {
        total: reporters.length,
        active: 0,
        expiringSoon: 0,
        expired: 0,
        pending: 0,
        suspended: 0,
    };

    reporters.forEach((r) => {
        const status = resolveStatus(r);
        if (status === "active") {
            stats.active += 1;
            const days = daysUntil(r.validTill);
            if (days >= 0 && days <= 30) stats.expiringSoon += 1;
        } else if (status === "expired") {
            stats.expired += 1;
        } else if (status === "pending") {
            stats.pending += 1;
        } else if (status === "suspended") {
            stats.suspended += 1;
        }
    });

    return stats;
}
