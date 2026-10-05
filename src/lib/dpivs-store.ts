// src/lib/dpivs-store.ts
/**
 * DPIVS Local & In-Memory Fallback Storage Manager
 *
 * Ensures DPIVS API endpoints work flawlessly even if Google Cloud Service Account
 * credentials return `16 UNAUTHENTICATED` due to revoked/expired private keys.
 */

import { ReporterProfile, ReporterStatus } from "@/types/dpivs";

// Global in-memory storage array
const globalReportersStore: ReporterProfile[] = [];

export function getReportersFromStore(status?: string, search?: string): ReporterProfile[] {
  let list = [...globalReportersStore];

  if (status && status !== "ALL") {
    list = list.filter((r) => r.status === status);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(q) ||
        r.pressIdNumber?.toLowerCase().includes(q) ||
        r.mobile?.includes(q) ||
        r.designation?.toLowerCase().includes(q)
    );
  }

  return list;
}

export function getReporterByIdFromStore(idOrPressId: string): ReporterProfile | null {
  const found = globalReportersStore.find(
    (r) => r.id === idOrPressId || r.pressIdNumber === idOrPressId
  );
  return found || null;
}

export function addReporterToStore(reporter: ReporterProfile): void {
  // Check if exists
  const existingIdx = globalReportersStore.findIndex((r) => r.id === reporter.id);
  if (existingIdx >= 0) {
    globalReportersStore[existingIdx] = reporter;
  } else {
    globalReportersStore.unshift(reporter);
  }
}

export function updateReporterInStore(
  id: string,
  updates: Partial<ReporterProfile>
): ReporterProfile | null {
  const idx = globalReportersStore.findIndex((r) => r.id === id || r.pressIdNumber === id);
  if (idx < 0) return null;

  globalReportersStore[idx] = {
    ...globalReportersStore[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return globalReportersStore[idx];
}

export function deleteReporterFromStore(id: string): boolean {
  const idx = globalReportersStore.findIndex((r) => r.id === id || r.pressIdNumber === id);
  if (idx < 0) return false;

  globalReportersStore[idx].status = ReporterStatus.REVOKED;
  return true;
}
