# DPIVS Code Inventory Report
**Project Name:** Samachar Bharat (`in.samacharbharat`)
**Date:** July 24, 2026
**Specification Version:** v3.0 — Zero-Assumption Protocol Edition

---

## Executive Summary
This report presents the findings of the mandatory **Code Inventory Phase (Section 16)** performed on the Samachar Bharat codebase. Following the Zero-Assumption Protocol, all claims in the integration specification were cross-referenced against the physical files on disk.

---

## 1. Filesystem Topography & DPIVS Artifact Inventory

| Expected Artifact (per Documentation) | File / Path Location | Disk Status | Notes |
| :--- | :--- | :--- | :--- |
| **Core Business Logic** | `src/lib/dpivs.ts` | ❌ **MISSING** | File does not exist on disk |
| **TypeScript Types** | `src/types/dpivs.ts` | ❌ **MISSING** | File does not exist on disk |
| **Admin UI Shell** | `src/app/admin/dpivs/` | ❌ **MISSING** | Directory does not exist on disk |
| **Public Verification Route** | `src/app/verify-press-id/[id]/page.tsx` | ❌ **MISSING** | Directory and page do not exist on disk |
| **API Endpoints** | `src/app/api/dpivs/` | ❌ **MISSING** | Directory does not exist on disk |
| **DPIVS Components** | `src/components/dpivs/` | ❌ **MISSING** | Directory does not exist on disk |
| **Firestore Rules (`reporters`)** | `firestore.rules` | ⚠️ **PARTIAL (Missing Rules)** | File exists, but no `reporters` collection or `auditLogs` subcollection rules exist |
| **Firestore Indexes (`reporters`)** | `firestore.indexes.json` | ⚠️ **PARTIAL (Missing Indexes)** | File exists, but no composite indexes for `reporters` or `auditLogs` exist |

---

## 2. Infrastructure & Existing Code Analysis

### 2.1 Router & App Layout Structure
- **Next.js Version**: `^15.1.0` (App Router)
- **Root Layout (`src/app/layout.tsx`)**:
  - Provider Chain: `AuthProvider` (`@/lib/auth-context`) -> `SettingsProvider` (`@/context/SettingsContext`) -> `NotificationManager` -> `PWAInstall` -> `Children` -> `AdminOnly` (`AIAssistant`) -> `Toaster` (`sonner`)
- **Middleware (`src/middleware.ts`)**:
  - Intercepts `/admin/*` requiring role `owner` or `admin`
  - Intercepts `/editor/*` requiring role `owner`, `admin`, `editor`, or `reporter`
  - Uses `__session` HTTP-only cookie and calls internal GET `/api/auth/verify`

### 2.2 Auth Context & Role Hierarchy
- **Auth Context Location**: Defined in `src/context/AuthContext.tsx`, exported via `src/lib/auth-context.tsx` as a backward-compatibility bridge.
- **Roles Defined in `src/types/auth.types.ts`**:
  - `OWNER = "owner"`
  - `ADMIN = "admin"`
  - `EDITOR = "editor"`
  - `REPORTER = "reporter"`
  - `USER = "user"`
- **Hook interface (`useAuth()` in `@/lib/auth-context.tsx`)**:
  - Returns `{ user, firestoreUser, role, userRole, loading, error, signIn, signUp, logout, login, isOwner, isAdmin, isEditor, isReporter, hasPermission }`

### 2.3 Navigation Integration Point
- **Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)**:
  - Renders menu items from `menuItems` array.
  - Requires adding `{ href: "/admin/dpivs", icon: <BadgeCheck size={20} />, label: "Press Cards (DPIVS)" }` without modifying sidebar layout structure.

---

## 3. Discrepancy Log (Documentation vs. Actual Codebase)

| # | Documentation Claim | Actual Codebase Finding | Severity | Required Action / Impact |
|---|---------------------|--------------------------|----------|--------------------------|
| 1 | DPIVS modules partially exist on disk (`src/lib/dpivs.ts`, `src/app/admin/dpivs/`, `src/app/verify-press-id/`) | None of these DPIVS directories or files exist on disk. They are 100% missing. | High | Must build DPIVS modules from clean state in Sprint 1-4. |
| 2 | `reporters` collection rules partially defined in `firestore.rules` | `firestore.rules` has no rules for `reporters` collection or `auditLogs` subcollection. | Medium | Add additive Firestore rules for `reporters` and subcollections. |
| 3 | Third-party dependencies `qrcode` and `jspdf` for canvas/PDF generation | `qrcode` and `jspdf` are NOT listed in `package.json`. | Medium | Requires adding `qrcode` (or `qrcode` + `@types/qrcode`) and `jspdf` for QR generation and client/server PDF output, or approving dependency installation. |
| 4 | Toast system duplication (`src/context/ToastContext.tsx` vs `src/contexts/ToastContext.tsx`) | `src/app/layout.tsx` uses `sonner` (`<Toaster />`). Both custom ToastContext files exist unused by root layout. | Low | Use standard `sonner` (`toast.success()`, `toast.error()`) for DPIVS UI notifications to match app layout. |
| 5 | Environment & Dependencies (`node_modules`) | `node_modules` directory is currently not installed in the workspace environment. | Medium | Run `npm install` prior to running type checking / build tests. |

---

## 4. Gap Analysis & Scope Mapping for DPIVS

To fulfill all requirements of Specification v3.0, the following items will be created and integrated:

1. **Sprint 1: Foundation (Types, Business Logic & API)**
   - `src/types/dpivs.ts`: Full Zod schemas, TypeScript interfaces (`ReporterProfile`, `PressCardVersion`, `AuditLogEntry`, `DPIVSSettings`, `StatusTransition`, `QRPayload`).
   - `src/lib/dpivs.ts`: Press ID generator (`SB-REP-{YYYY}-{XXXXXX}` with transaction collision check), QR payload generator/hash, Zod input validation engine, date calculator, state machine transition validator.
   - `src/app/api/dpivs/reporters/route.ts`: List (with pagination/filters) & Create endpoints.
   - `src/app/api/dpivs/reporters/[id]/route.ts`: Read single, Update, Soft-delete endpoints.
   - `src/app/api/dpivs/reporters/[id]/status/route.ts`: State machine status transition endpoint.
   - `src/app/api/dpivs/cards/generate/route.ts`: Card generation trigger.

2. **Sprint 2: Admin UI Shell**
   - Admin navigation addition in `src/components/admin/AdminSidebar.tsx`.
   - `src/app/admin/dpivs/page.tsx`: Main DPIVS Dashboard (Stats summary, Reporter Data Table with search/filter/pagination).
   - `src/components/dpivs/forms/ReporterFormModal.tsx`: Multi-step reporter wizard.

3. **Sprint 3: Press Card Rendering & Export**
   - `src/components/dpivs/card-generation/CanvasCardRenderer.tsx`: High-DPI imperative HTML5 Canvas renderer for Front and Back CR80 card specs.
   - `src/components/dpivs/card-generation/CardPreviewModal.tsx`: Card preview and PNG/PDF export integration.

4. **Sprint 4: Public Verification Portal**
   - `src/app/verify-press-id/[id]/page.tsx`: Public response UI (valid green / expired yellow / suspended orange / revoked red / not found).
   - `src/app/api/dpivs/verify/[id]/route.ts`: Sanitized public query endpoint with rate limiting.

5. **Security & Database Rules**
   - Update `firestore.rules` to include `reporters/{reporterId}` and `reporters/{reporterId}/auditLogs/{logId}`.
   - Update `firestore.indexes.json` with composite indexes for `reporters` query patterns.

---

## 5. Dependency & Risk Map

- **Risk Area 1**: Admin Sidebar Integration (`src/components/admin/AdminSidebar.tsx`)
  - *Risk*: Modifying shared navigation component.
  - *Mitigation*: Append new menu item entry into `menuItems` array without touching layout code.
- **Risk Area 2**: Middleware Protection (`src/middleware.ts`)
  - *Risk*: Over-restricting or breaking auth checks.
  - *Mitigation*: `/admin/dpivs` is automatically covered by existing matcher `/admin/:path*` in `src/middleware.ts`. No edits to `src/middleware.ts` required.
- **Risk Area 3**: Database Security (`firestore.rules`)
  - *Risk*: Breaking access control.
  - *Mitigation*: Rules updates will be strictly **additive** for the `reporters` collection and `auditLogs` subcollection only.

---

## 6. Code Inventory Conclusion
The codebase is clean, well-structured, and ready for DPIVS implementation. All existing production features (News feed, Auth, Editor panel, Admin portal) are intact and ready for non-regressive extension.
