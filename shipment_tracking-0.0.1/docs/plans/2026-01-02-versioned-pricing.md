# Versioned Pricing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable product prices to change over time by associating them with an effective date, ensuring shipments use the correct price based on their `orderDate`.

**Architecture:**
- Update `product_prices` table to include an `effective_from` date column.
- Modify the database unique constraint from `(region_id, product_id)` to `(region_id, product_id, effective_from)`.
- Update the pricing lookup logic in `calculations.ts` and `AppContext.tsx` to find the most recent price that is less than or equal to the shipment's `orderDate`.
- Enhance the Admin `PriceManager` UI to allow adding prices with specific start dates and viewing pricing history.

**Tech Stack:** React, TypeScript, Supabase (PostgreSQL), AppContext (Global State).

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/1770000014_add_price_versioning.sql`

**Step 1: Write SQL to add effective_from and update constraints**
```sql
-- Add effective_from column with a default value of current epoch
ALTER TABLE public.product_prices 
ADD COLUMN IF NOT EXISTS effective_from DATE NOT NULL DEFAULT CURRENT_DATE;

-- Drop existing unique constraint if it exists (assuming it was on region_id, product_id)
-- Note: You may need to find the exact constraint name using \d product_prices
ALTER TABLE public.product_prices 
DROP CONSTRAINT IF EXISTS product_prices_region_id_product_id_key;

-- Add new unique constraint including effective_from
ALTER TABLE public.product_prices 
ADD CONSTRAINT product_prices_region_id_product_id_effective_from_key 
UNIQUE (region_id, product_id, effective_from);

-- Update RLS policies if necessary (usually not needed if just adding a column)
```

**Step 2: Apply migration**
Run: `npx supabase db push` (or run manually in dashboard)

---

### Task 2: Type and AppContext Updates

**Files:**
- Modify: `types.ts`
- Modify: `providers/AppContext.tsx`

**Step 1: Update ProductPrice interface**
```typescript
// types.ts
export interface ProductPrice {
  id: string;
  regionId: string;
  productId: string;
  price: number;
  effectiveFrom: string; // Add this line
}
```

**Step 2: Update AppContext mappings**
- Update `priceFromRow` and `priceToRow` to include `effectiveFrom`.

---

### Task 3: Pricing Lookup Logic

**Files:**
- Modify: `utils/calculations.ts`

**Step 1: Update calculateInitialShipmentValues to accept orderDate**
```typescript
export const calculateInitialShipmentValues = (
    shipment: Omit<Shipment, 'entryTimestamp' | 'id' | 'status'>,
    regions: Region[],
    productPrices: ProductPrice[]
): Partial<Shipment> => {
    const orderDate = shipment.orderDate;
    
    const calculatedProducts = shipment.products.map(p => {
        // Find all prices for this product and region
        const relevantPrices = productPrices.filter(pp => 
            pp.regionId === shipment.regionId && 
            pp.productId === p.productId &&
            pp.effectiveFrom <= orderDate
        );

        // Sort by date descending and pick the first
        const latestPrice = relevantPrices.sort((a, b) => 
            new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime()
        )[0];

        const productWage = latestPrice ? latestPrice.price : 0;
        // ... rest of logic
```

---

### Task 4: Admin UI Enhancement (PriceManager)

**Files:**
- Modify: `components/features/admin/manage-data/PriceManager.tsx`

**Step 1: Add effectiveFrom to formData and Modal**
- Add `effectiveFrom` field to `priceFormData`.
- Add `ArabicDatePicker` or standard date input to the Modal.
- Update `handleSavePrice` to include the date.

**Step 2: Update display to show effective date**
- Show "Effective From: YYYY-MM-DD" in the price list item.
- (Optional) Group prices by Product/Region to show history.

---

### Task 5: Shipment Form Integration

**Files:**
- Modify: `components/features/fleet/NewFleetShipmentForm.tsx`

**Step 1: Trigger recalculation on orderDate change**
- Add a `useEffect` that calls `calculateInitialShipmentValues` whenever `orderDate` changes, ensuring the price reflects the selected date.

---

**Plan complete and saved to `docs/plans/2026-01-02-versioned-pricing.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
