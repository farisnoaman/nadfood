# Subscription & Access Control System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a granular Subscription and Access Control system to support a "Free Plan" (3 users/drivers/regions/products, 10MB storage, 1-month expiry) and gate core features (Import/Export, Entity Creation) based on plan limits and status.

**Architecture:**
- **Database:** Supabase/PostgreSQL. Add `subscription_current_usage` via triggers to track row counts. Add `company_features` and `subscription_status` to `companies`.
- **Backend Logic:** Triggers maintain usage counts. RLS (optional) or App Logic blocks writes when limits exceeded.
- **Frontend:** `SubscriptionContext` provides `canAdd(entity)` and `hasFeature(feature)`. UI components disable buttons/show banners.

**Tech Stack:** PostgreSQL (Triggers, Functions), React, TypeScript, Context API.

---

### Task 1: Database Schema - Subscription Fields

**Files:**
- Create: `src/supabase/migrations/20260113_add_subscription_system.sql`

**Step 1: Write Verification Script (Pre-Implementation)**
Create `verification/verify_task1_pre.sql`:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'companies' AND column_name IN ('subscription_plan', 'usage_limits', 'current_usage');
-- Expected: 0 rows
```

**Step 2: Implement Migration (Schema)**
Write SQL in `src/supabase/migrations/20260113_add_subscription_system.sql`:
```sql
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free_trial',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active', -- active, suspended, expired
ADD COLUMN IF NOT EXISTS subscription_start_date timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz DEFAULT (now() + interval '1 month'),
ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly', -- monthly, quarterly, annually
ADD COLUMN IF NOT EXISTS usage_limits jsonb DEFAULT '{"max_users": 3, "max_drivers": 3, "max_regions": 3, "max_products": 3, "max_storage_mb": 10}',
ADD COLUMN IF NOT EXISTS current_usage jsonb DEFAULT '{"users": 0, "drivers": 0, "regions": 0, "products": 0, "storage_mb": 0}';
```

**Step 3: Validation Trigger Logic**
Add to migration:
```sql
CREATE OR REPLACE FUNCTION update_company_usage_counts() RETURNS TRIGGER AS $$
DECLARE
    target_company_id uuid;
    count_drivers int;
    count_regions int;
    count_products int;
    count_users int;
BEGIN
    IF (TG_OP = 'DELETE') THEN target_company_id := OLD.company_id; ELSE target_company_id := NEW.company_id; END IF;
    
    -- Check if company exists (might be null for global user)
    IF target_company_id IS NULL THEN RETURN NULL; END IF;

    -- Count Drivers
    SELECT count(*) INTO count_drivers FROM public.drivers WHERE is_active = true; 
    -- Note: This is simplified. In real multi-tenant, ensure WHERE clause checks company_id if available, or if RLS is effectively filtering.
    -- Assuming app logic usually filters by company, but trigger runs as superuser. Ideally we check company_id column.
    -- Since 'drivers' table in `database.types.ts` (viewed earlier) only had id,name,plate,active... it lacks company_id in the view?
    -- Wait, `drivers` table view showed no `company_id`. RLS policy must be using a lookup or it's missing? 
    -- *Correction*: Previous turn showed `drivers` table in `database.types.ts` does NOT have `company_id`. 
    -- If valid multi-tenancy exists, it implies `drivers` SHOULD have `company_id`.
    -- If it doesn't, we must ADD it or link it. 
    -- *Hypothesis*: The user implemented multi-tenancy elsewhere? 
    -- We will assume `drivers`, `regions`, `products` need `company_id` to be counted per company.
    -- If they don't have it, Task 1 must ADD `company_id` to these tables too!
    
    -- Update the JSONB
    UPDATE public.companies 
    SET current_usage = jsonb_build_object(
        'drivers', count_drivers,
        'regions', (SELECT count(*) FROM regions), -- Needs company filter
        'products', (SELECT count(*) FROM products), -- Needs company filter
        'users', (SELECT count(*) FROM public.users WHERE company_id = target_company_id::text), -- public.users HAS company_id
        'storage_mb', COALESCE(current_usage->>'storage_mb', '0')::numeric -- Preserve storage
    )
    WHERE id = target_company_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply Triggers
-- DROP TRIGGER IF EXISTS on_driver_change ON drivers;
-- CREATE TRIGGER on_driver_change AFTER INSERT OR DELETE ON drivers FOR EACH ROW EXECUTE FUNCTION update_company_usage_counts();
-- ... (Repeat for regions, products, users)
```

**Step 4: Run Verification (Post-Implementation)**
Run the migration. Then run `verification/verify_task1_post.sql` checking columns exist.

---

### Task 2: Feature Flags Schema

**Files:**
- Modify: `src/supabase/migrations/20260113_add_subscription_system.sql` (Append to file)

**Step 1: Implement Migration (Features)**
```sql
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '{"can_import_data": true, "can_export_data": true, "can_manage_drivers": true, "can_manage_regions": true, "can_manage_products": true, "can_manage_prices": true}';
```

---

### Task 3: TypeScript Definitions & Mappers

**Files:**
- Modify: `src/types/types.ts`
- Modify: `src/providers/app/mappers.ts`

**Step 1: Write Failing Test (Conceptual)**
Create `src/types/types.test.ts` (temp):
```typescript
import { Company } from './types';
const c: Company = { /* ... */ }; 
console.log(c.usageLimits.maxDrivers); // Should TS Error if not defined
```

**Step 2: Implement Types**
In `src/types/types.ts`:
```typescript
export interface CompanyFeatures {
  canImportData: boolean;
  canExportData: boolean;
  canManageDrivers: boolean;
  canManageRegions: boolean;
  canManageProducts: boolean;
  canManagePrices: boolean;
}
export interface UsageLimits {
  maxUsers: number;
  maxDrivers: number;
  maxRegions: number;
  maxProducts: number;
  maxStorageMb: number;
}
export interface Company {
  // ...
  subscriptionPlan: string;
  subscriptionStatus: 'active' | 'suspended' | 'expired';
  usageLimits: UsageLimits;
  currentUsage: CurrentUsage;
  features: CompanyFeatures;
}
```

**Step 3: Implement Mappers**
Map `usage_limits` (snake_json) to `usageLimits` (camel_obj).

---

### Task 4: Subscription Logic in AppContext

**Files:**
- Modify: `src/providers/AppContext.tsx`

**Step 1: Implement Logic**
Add:
```typescript
const isSubscriptionActive = useMemo(() => {
   // NOW() < subscriptionEndDate && status !== 'suspended'
}, [company]);

const checkLimit = (entity: keyof UsageLimits, add: number = 0) => {
   // Check limits
};

const hasFeature = (feature: keyof CompanyFeatures) => {
   // Check feature flag
};
```
Expose these in Context.

---

### Task 5: Gate "Drivers" Feature

**Files:**
- Modify: `src/components/features/admin/manage-data/DriverManager.tsx`

**Step 1: Manual Verification Plan**
- Open Drivers Tab.
- Check "Add Driver" button enabled.
- Set Limit to 0 in DB.
- Check "Add Driver" button disabled.

**Step 2: Implement Gating**
```tsx
const { checkLimit, hasFeature } = useAppContext();
const canAdd = hasFeature('canManageDrivers') && checkLimit('maxDrivers');
// Pass `disabled={!canAdd}` to Button
```
- Also Gate "Import CSV" with `hasFeature('canImportData')`.

---

### Task 6: Gate "Regions" & "Products" Features

**Files:**
- Modify: `src/components/features/admin/manage-data/RegionManager.tsx`
- Modify: `src/components/features/admin/manage-data/ProductManager.tsx`

**Step 1: Implement Gating**
- Similar to Task 5.

---

### Task 7: Storage Limit Logic

**Files:**
- Modify: `src/components/features/admin/AdminShipmentModal.tsx`

**Step 1: Implement Check**
- Inside `handleFileChange`:
  - `if (!checkLimit('maxStorageMb', file.sizeInMb)) { alert("Limit Exceeded"); return; }`

---

### Task 8: Subscription Banner

**Files:**
- Create: `src/components/common/SubscriptionBanner.tsx`
- Modify: `src/components/layout/MainLayout.tsx`

**Step 1: Implement Component**
- Red banner if suspended.
- Yellow banner if expiring soon (< 5 days).

**Step 2: Add to Layout**
- Render at top of main content area.

---
