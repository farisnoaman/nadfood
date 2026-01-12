# Platform Admin System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive Platform Admin Dashboard to manage tenants, subscription plans, quotas, and a master data catalog with hybrid inheritance.

**Architecture:**
-   **Hybrid Data Model:** "Master" tables for global catalog items. Tenant tables have a `master_source_id` link. When Tenants "use" a master item, it's copied to their partition.
-   **Subscription System:** `subscription_plans` define limits (users, products, storage). Database triggers/functions enforce these limits before INSERT.
-   **Admin Portal:** A specialized dashboard (protected route) for Super Admins to oversee the entire platform health and operations.

**Tech Stack:** Supabase (Schema, Triggers, Edge Functions), React/Vite (Dashboard UI), Recharts (KPIs).

---

## Phase 1: Foundation & Subscriptions

### Task 1: Subscription Schema
**Files:**
- Create: `supabase/migrations/20260105000000_subscription_schema.sql`

**Schema Changes:**
1.  **`subscription_plans` table**: `id`, `name` (Bronze/Silver/Gold), `max_users`, `max_products`, `max_storage_mb`, `monthly_price`.
2.  **`companies` update**: Add `plan_id` FK, `subscription_status` (active/past_due/trial).
3.  **Seed Data**: Insert default plans (Basic, Pro, Enterprise).

### Task 2: Quota Enforcement Logic
**Files:**
- Modify: `supabase/migrations/20260105000000_subscription_schema.sql` (or new file)

**Logic:**
1.  **Function `check_quota(company_id, resource_type)`**:
    -   Counts current usage.
    -   Compares against `subscription_plans` limit.
    -   Raises exception if limit reached.
2.  **Triggers**:
    -   `BEFORE INSERT ON public.users`: Call `check_quota`.
    -   `BEFORE INSERT ON public.products`: Call `check_quota`.

### Task 3: Platform Admin Layout
**Files:**
- Create: `src/layouts/PlatformLayout.tsx`
- Create: `src/pages/platform/Dashboard.tsx`

**Features:**
-   Distinct Sidebar (Companies, Plans, Master Catalog, System Health).
-   `SuperAdminGuard`: Strict check for `is_super_admin()`.

---

## Phase 2: Master Catalog (Hybrid Inheritance)

### Task 4: Master Data Schema
**Files:**
- Create: `supabase/migrations/20260105001000_master_catalog.sql`

**Schema Changes:**
1.  **`master_products` table**: Global product definitions.
2.  **`master_regions` table**: Global region definitions.
3.  **Tenant updates**: Add `master_source_id` (UUID, nullable) to `products` and `regions`.

### Task 5: "Copy from Master" Logic
**Files:**
- Create: `supabase/functions/clone-master-item/index.ts` (Edge Function)

**Workflow:**
1.  Tenant Admin selects items from "Global Catalog".
2.  Function fetches Master Item.
3.  Inserts into Tenant's table (copying fields), setting `master_source_id`.
4.  Result: Tenant owns the record, can edit it, but we know where it came from.

---

## Phase 3: Operations & Monitoring

### Task 6: Tenant Management UI
**Files:**
- Create: `src/pages/platform/Companies.tsx`
- Create: `src/pages/platform/CompanyDetails.tsx`

**Features:**
-   List all companies (Sort by Plan, Revenue, Activity).
-   "Login As" button (Impersonation).
-   Edit Plan / Override Quotas.

### Task 7: Data Snapshot (Backup)
**Files:**
- Create: `supabase/functions/snapshot-tenant/index.ts`

**Logic:**
1.  Select all data for `company_id`.
2.  Generate JSON payload.
3.  Upload to `sys-backups` bucket.
4.  Record entry in `public.backups` log.

### Task 8: KPI Dashboard
**Files:**
- Modify: `src/pages/platform/Dashboard.tsx`

**Metrics:**
-   Total MRR (Monthly Recurring Revenue).
-   New Tenants (Last 30 days).
-   System Load (Recent Sync Logs).

---

## Verification Plan

### Automated Tests
-   **Quota Test**: Try to insert User #6 when Plan limit is 5. Expect SQL Error.
-   **Inheritance Test**: Clone a master product, modify the copy. Verify Master is untouched.

### Manual Verification
1.  **Limits**: Assign "Bronze" plan to "TestCo". Spam creates products until blocked.
2.  **Catalog**: Create "Global Diesel". Import to "TestCo". Rename local copy to "My Diesel".
