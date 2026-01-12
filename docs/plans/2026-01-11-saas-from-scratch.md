# Multi-Tenant SaaS Shipment Tracking Platform - From Scratch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-tenant SaaS shipment tracking platform from scratch that supports multiple companies with isolated data, role-based access control, and a complete shipment lifecycle workflow.

**Architecture:** React/TypeScript frontend with Supabase (PostgreSQL + Auth + Edge Functions) backend. Multi-tenancy achieved through Row-Level Security with `company_id` on all tables. Each company has isolated data, users, and settings. Platform admins can manage all companies.

**Tech Stack:** 
- Frontend: React 18, TypeScript, Vite, TailwindCSS, React Router v6
- Backend: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- Offline: IndexedDB, Service Worker (PWA)
- Build: Vite, Capacitor (Android APK)

---

## Project Overview

### Core Features
1. **Multi-Tenant Authentication** - Company signup, user management, role-based access
2. **Shipment Management** - Create, track, and process shipments through workflow
3. **Role-Based Dashboards** - Fleet Manager, Accountant, Admin dashboards
4. **Data Management** - Products, Drivers, Regions, Pricing
5. **Reporting & Export** - PDF/CSV exports, calculations
6. **Offline Support** - PWA with IndexedDB caching

### User Roles (per company)
- **مسؤول الحركة (Fleet Manager)** - Creates shipments
- **محاسب (Accountant)** - Reviews and processes shipments
- **ادمن (Admin)** - Company administration
- **مدير المنصة (Platform Admin)** - Cross-company management

### Shipment Workflow
```
Fleet Creates → Accountant Reviews → Admin Finalizes
     ↓              ↓  ↑              ↓
[FROM_SALES] → [DRAFT/SENT_TO_ADMIN] → [FINAL]
                    ↑                    ↓
              [RETURNED_FOR_EDIT]   [FINAL_MODIFIED]
```

---

## Phase 1: Project Setup & Database (Tasks 1-8)

### Task 1: Initialize Vite + React + TypeScript Project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`

**Step 1: Create new Vite project**

Run:
```bash
cd /home/faris/Documents/MyApps
mkdir nadport-saas && cd nadport-saas
npm create vite@latest . -- --template react-ts
npm install
```

**Step 2: Install dependencies**

Run:
```bash
npm install @supabase/supabase-js react-router-dom lucide-react date-fns jspdf html2canvas
npm install -D tailwindcss postcss autoprefixer @types/react @types/react-dom
npx tailwindcss init -p
```

**Step 3: Configure Tailwind in `tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

**Step 4: Update `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  direction: rtl;
}

body {
  font-family: 'IBM Plex Sans Arabic', sans-serif;
  @apply bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100;
}
```

**Step 5: Run dev server to verify**

Run: `npm run dev`
Expected: App runs at http://localhost:5173

**Step 6: Commit**

```bash
git init && git add . && git commit -m "feat: initialize Vite + React + TypeScript + Tailwind project"
```

---

### Task 2: Initialize Supabase Project

**Files:**
- Create: `supabase/config.toml`
- Create: `.env.local`
- Create: `src/utils/supabaseClient.ts`

**Step 1: Initialize Supabase**

Run:
```bash
npx supabase init
```

**Step 2: Create `.env.local`**

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: Create `src/utils/supabaseClient.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

**Step 4: Commit**

```bash
git add . && git commit -m "feat: initialize Supabase configuration"
```

---

### Task 3: Create Database Schema - Companies Table

**Files:**
- Create: `supabase/migrations/00001_create_companies_table.sql`

**Step 1: Write migration**

```sql
-- Companies table (core tenant entity)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  address TEXT,
  phone TEXT,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5,
  max_shipments_per_month INTEGER DEFAULT 100,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_companies_slug ON public.companies(slug);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Commit**

```bash
git add . && git commit -m "feat(db): create companies table"
```

---

### Task 4: Create Database Schema - Users Table

**Files:**
- Create: `supabase/migrations/00002_create_users_table.sql`

**Step 1: Write migration**

```sql
-- Users table (linked to auth.users, scoped to company)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'مسؤول الحركة' CHECK (role IN ('مسؤول الحركة', 'محاسب', 'ادمن', 'مدير المنصة')),
  is_platform_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_company ON public.users(company_id);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT company_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT COALESCE(is_platform_admin, false) FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies
CREATE POLICY users_read_same_company ON public.users
  FOR SELECT USING (company_id = get_user_company_id() OR is_platform_admin());

CREATE POLICY users_admin_manage ON public.users
  FOR ALL USING (
    (company_id = get_user_company_id() AND get_user_role() = 'ادمن')
    OR is_platform_admin()
  );

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := NULLIF(NEW.raw_user_meta_data->>'company_id', '')::uuid;
  
  INSERT INTO public.users (id, company_id, username, email, role, is_platform_admin)
  VALUES (
    NEW.id,
    COALESCE(v_company_id, '00000000-0000-0000-0000-000000000001'::uuid),
    COALESCE(NEW.raw_user_meta_data->>'username', 'مستخدم جديد'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'مسؤول الحركة'),
    COALESCE((NEW.raw_user_meta_data->>'is_platform_admin')::boolean, false)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Commit**

```bash
git add . && git commit -m "feat(db): create users table with RLS and auth trigger"
```

---

### Task 5: Create Database Schema - Core Data Tables

**Files:**
- Create: `supabase/migrations/00003_create_core_tables.sql`

**Step 1: Write migration**

```sql
-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weight_kg NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_company ON public.products(company_id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation ON public.products
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Drivers table
CREATE TABLE public.drivers (
  id SERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_drivers_company ON public.drivers(company_id);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY drivers_tenant_isolation ON public.drivers
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Regions table
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_regions_company ON public.regions(company_id);
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY regions_tenant_isolation ON public.regions
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Region Configs (versioned pricing)
CREATE TABLE public.region_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  diesel_liter_price NUMERIC NOT NULL DEFAULT 0,
  diesel_liters NUMERIC NOT NULL DEFAULT 0,
  zaitri_fee NUMERIC DEFAULT 0,
  road_expenses NUMERIC DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_region_configs_company ON public.region_configs(company_id);
ALTER TABLE public.region_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY region_configs_tenant_isolation ON public.region_configs
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Product Prices (versioned)
CREATE TABLE public.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, region_id, product_id, effective_from)
);

CREATE INDEX idx_product_prices_company ON public.product_prices(company_id);
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_prices_tenant_isolation ON public.product_prices
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Deduction Prices (versioned)
CREATE TABLE public.deduction_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  shortage_price NUMERIC NOT NULL DEFAULT 0,
  damaged_price NUMERIC NOT NULL DEFAULT 0,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, product_id, effective_from)
);

CREATE INDEX idx_deduction_prices_company ON public.deduction_prices(company_id);
ALTER TABLE public.deduction_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY deduction_prices_tenant_isolation ON public.deduction_prices
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Commit**

```bash
git add . && git commit -m "feat(db): create products, drivers, regions, prices tables"
```

---

### Task 6: Create Database Schema - Shipments Tables

**Files:**
- Create: `supabase/migrations/00004_create_shipments_tables.sql`

**Step 1: Write migration**

```sql
-- Shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sales_order TEXT NOT NULL,
  order_date DATE NOT NULL,
  entry_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  region_id UUID NOT NULL REFERENCES public.regions(id),
  driver_id INTEGER NOT NULL REFERENCES public.drivers(id),
  status TEXT NOT NULL DEFAULT 'من مسؤول الحركة' CHECK (status IN (
    'من مسؤول الحركة', 'مسودة', 'مرسلة للادمن', 
    'طلب تعديل', 'مرتجعة لمسؤول الحركة', 'نهائي', 'نهائي معدل', 'تسديد دين'
  )),
  
  -- Calculated values
  total_diesel NUMERIC,
  total_wage NUMERIC,
  zaitri_fee NUMERIC,
  admin_expenses NUMERIC,
  due_amount NUMERIC,
  
  -- Accountant fields
  damaged_value NUMERIC DEFAULT 0,
  shortage_value NUMERIC DEFAULT 0,
  road_expenses NUMERIC,
  due_amount_after_discount NUMERIC,
  
  -- Admin fields
  other_amounts NUMERIC DEFAULT 0,
  improvement_bonds NUMERIC DEFAULT 0,
  evening_allowance NUMERIC DEFAULT 0,
  transfer_fee NUMERIC DEFAULT 0,
  total_due_amount NUMERIC,
  tax_rate NUMERIC DEFAULT 0,
  total_tax NUMERIC DEFAULT 0,
  transfer_number TEXT,
  transfer_date DATE,
  
  -- Tracking
  modified_by UUID REFERENCES public.users(id),
  modified_at TIMESTAMPTZ,
  deductions_edited_by UUID REFERENCES public.users(id),
  deductions_edited_at TIMESTAMPTZ,
  has_missing_prices BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  attachment_url TEXT,
  
  UNIQUE(company_id, sales_order)
);

CREATE INDEX idx_shipments_company ON public.shipments(company_id);
CREATE INDEX idx_shipments_status ON public.shipments(status);
CREATE INDEX idx_shipments_order_date ON public.shipments(order_date);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Role-based RLS for shipments
CREATE POLICY shipments_fleet_read ON public.shipments
  FOR SELECT USING (
    company_id = get_user_company_id() 
    AND (get_user_role() IN ('مسؤول الحركة', 'محاسب', 'ادمن') OR is_platform_admin())
  );

CREATE POLICY shipments_fleet_create ON public.shipments
  FOR INSERT WITH CHECK (
    company_id = get_user_company_id()
    AND get_user_role() = 'مسؤول الحركة'
  );

CREATE POLICY shipments_accountant_update ON public.shipments
  FOR UPDATE USING (
    company_id = get_user_company_id()
    AND get_user_role() IN ('محاسب', 'ادمن')
  );

CREATE POLICY shipments_admin_all ON public.shipments
  FOR ALL USING (
    (company_id = get_user_company_id() AND get_user_role() = 'ادمن')
    OR is_platform_admin()
  );

-- Shipment Products table
CREATE TABLE public.shipment_products (
  id SERIAL PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  carton_count INTEGER NOT NULL DEFAULT 0,
  product_wage_price NUMERIC DEFAULT 0,
  shortage_cartons INTEGER DEFAULT 0,
  shortage_exemption_rate NUMERIC DEFAULT 0,
  shortage_value NUMERIC DEFAULT 0,
  damaged_cartons INTEGER DEFAULT 0,
  damaged_exemption_rate NUMERIC DEFAULT 0,
  damaged_value NUMERIC DEFAULT 0
);

CREATE INDEX idx_shipment_products_company ON public.shipment_products(company_id);
CREATE INDEX idx_shipment_products_shipment ON public.shipment_products(shipment_id);

ALTER TABLE public.shipment_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipment_products_tenant_isolation ON public.shipment_products
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Updated at trigger for shipments
CREATE TRIGGER shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Commit**

```bash
git add . && git commit -m "feat(db): create shipments and shipment_products tables with RLS"
```

---

### Task 7: Create Database Schema - Supporting Tables

**Files:**
- Create: `supabase/migrations/00005_create_supporting_tables.sql`

**Step 1: Write migration**

```sql
-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  read BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'النظام',
  target_roles TEXT[],
  target_user_ids UUID[]
);

CREATE INDEX idx_notifications_company ON public.notifications(company_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_tenant_isolation ON public.notifications
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Installments table
CREATE TABLE public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  payable_amount NUMERIC NOT NULL,
  remaining_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  installment_type TEXT DEFAULT 'regular',
  original_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_installments_company ON public.installments(company_id);
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY installments_tenant_isolation ON public.installments
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Installment Payments table
CREATE TABLE public.installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  received_date DATE NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_installment_payments_company ON public.installment_payments(company_id);
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY installment_payments_tenant_isolation ON public.installment_payments
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());

-- Company Settings table
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, setting_key)
);

CREATE INDEX idx_company_settings_company ON public.company_settings(company_id);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_settings_tenant_isolation ON public.company_settings
  FOR ALL USING (company_id = get_user_company_id() OR is_platform_admin());
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Commit**

```bash
git add . && git commit -m "feat(db): create notifications, installments, company_settings tables"
```

---

### Task 8: Create Default Company and Seed Data

**Files:**
- Create: `supabase/migrations/00006_seed_default_company.sql`

**Step 1: Write migration**

```sql
-- Create default company for initial setup
INSERT INTO public.companies (id, name, slug, subscription_tier, subscription_status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'الشركة الافتراضية',
  'default-company',
  'professional',
  'active'
);

-- Default company settings
INSERT INTO public.company_settings (company_id, setting_key, setting_value)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'appName', 'نظام تتبع الشحنات'),
  ('00000000-0000-0000-0000-000000000001', 'companyName', 'الشركة الافتراضية'),
  ('00000000-0000-0000-0000-000000000001', 'companyAddress', 'العنوان'),
  ('00000000-0000-0000-0000-000000000001', 'companyPhone', 'رقم الهاتف'),
  ('00000000-0000-0000-0000-000000000001', 'isPrintHeaderEnabled', 'true'),
  ('00000000-0000-0000-0000-000000000001', 'accountantPrintAccess', 'false'),
  ('00000000-0000-0000-0000-000000000001', 'isTimeWidgetVisible', 'true');
```

**Step 2: Apply migration**

Run: `npx supabase db push`

**Step 3: Generate TypeScript types**

Run: `npx supabase gen types typescript --local > src/supabase/database.types.ts`

**Step 4: Commit**

```bash
git add . && git commit -m "feat(db): seed default company and settings"
```

---

## Phase 2: TypeScript Types & Core Utilities (Tasks 9-12)

### Task 9: Create Core TypeScript Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Create types file**

```typescript
/**
 * Core TypeScript types for the SaaS Shipment Tracking Platform
 */

// Company (Tenant)
export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  address?: string;
  phone?: string;
  email?: string;
  subscriptionTier: 'free' | 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'trial' | 'suspended' | 'cancelled';
  trialEndsAt?: string;
  maxUsers: number;
  maxShipmentsPerMonth: number;
  features: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySetting {
  id: string;
  companyId: string;
  settingKey: string;
  settingValue: string | null;
  createdAt: string;
  updatedAt: string;
}

// User Roles
export enum Role {
  FLEET = 'مسؤول الحركة',
  ACCOUNTANT = 'محاسب',
  ADMIN = 'ادمن',
  PLATFORM_ADMIN = 'مدير المنصة',
}

// User
export interface User {
  id: string;
  companyId: string;
  username: string;
  email: string;
  role: Role;
  isPlatformAdmin?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

// Shipment Status
export enum ShipmentStatus {
  FROM_FLEET = 'من مسؤول الحركة',
  DRAFT = 'مسودة',
  SENT_TO_ADMIN = 'مرسلة للادمن',
  RETURNED_FOR_EDIT = 'طلب تعديل',
  RETURNED_TO_FLEET = 'مرتجعة لمسؤول الحركة',
  FINAL = 'نهائي',
  FINAL_MODIFIED = 'نهائي معدل',
  INSTALLMENTS = 'تسديد دين',
}

// Product
export interface Product {
  id: string;
  name: string;
  isActive?: boolean;
  weightKg?: number;
}

// Driver
export interface Driver {
  id: number;
  name: string;
  plateNumber: string;
  isActive?: boolean;
}

// Region
export interface Region {
  id: string;
  name: string;
}

// Region Config (versioned pricing)
export interface RegionConfig {
  id: string;
  regionId: string;
  dieselLiterPrice: number;
  dieselLiters: number;
  zaitriFee: number;
  roadExpenses: number;
  effectiveFrom: string;
}

// Product Price
export interface ProductPrice {
  id: string;
  regionId: string;
  productId: string;
  price: number;
  effectiveFrom: string;
}

// Deduction Price
export interface DeductionPrice {
  id: string;
  productId: string;
  shortagePrice: number;
  damagedPrice: number;
  effectiveFrom: string;
}

// Shipment Product
export interface ShipmentProduct {
  productId: string;
  productName: string;
  cartonCount: number;
  productWagePrice?: number;
  shortageCartons?: number;
  shortageExemptionRate?: number;
  shortageValue?: number;
  damagedCartons?: number;
  damagedExemptionRate?: number;
  damagedValue?: number;
}

// Shipment
export interface Shipment {
  id: string;
  salesOrder: string;
  orderDate: string;
  entryTimestamp: string;
  regionId: string;
  driverId: number;
  products: ShipmentProduct[];
  status: ShipmentStatus;
  
  // Calculated
  totalDiesel?: number;
  totalWage?: number;
  zaitriFee?: number;
  adminExpenses?: number;
  dueAmount?: number;
  
  // Accountant fields
  damagedValue?: number;
  shortageValue?: number;
  roadExpenses?: number;
  dueAmountAfterDiscount?: number;
  
  // Admin fields
  otherAmounts?: number;
  improvementBonds?: number;
  eveningAllowance?: number;
  transferFee?: number;
  totalDueAmount?: number;
  taxRate?: number;
  totalTax?: number;
  transferNumber?: string;
  transferDate?: string;
  
  // Tracking
  modifiedBy?: string;
  modifiedAt?: string;
  deductionsEditedBy?: string;
  deductionsEditedAt?: string;
  hasMissingPrices: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  attachmentUrl?: string;
}

// Notification
export enum NotificationCategory {
  USER_ACTION = 'إجراءات المستخدم',
  PRICE_ALERT = 'تنبيهات الأسعار',
  SYSTEM = 'النظام',
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
  targetRoles?: Role[];
  targetUserIds?: string[];
}

// Installment
export interface Installment {
  id: string;
  shipmentId: string;
  payableAmount: number;
  remainingAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  installmentType?: 'regular' | 'debt_collection';
  originalAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Installment Payment
export interface InstallmentPayment {
  id: string;
  installmentId: string;
  amount: number;
  receivedDate: string;
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}
```

**Step 2: Commit**

```bash
git add . && git commit -m "feat(types): create core TypeScript types"
```

---

### Task 10: Create Data Mapping Utilities

**Files:**
- Create: `src/utils/dataMappers.ts`

**Step 1: Create mapping functions**

```typescript
import type { Database } from '../supabase/database.types';
import { 
  Company, User, Product, Driver, Region, RegionConfig, 
  ProductPrice, DeductionPrice, Shipment, ShipmentProduct,
  Notification, Installment, InstallmentPayment, CompanySetting,
  Role, ShipmentStatus, NotificationCategory
} from '../types';

// Row type aliases
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type RegionRow = Database['public']['Tables']['regions']['Row'];
type RegionConfigRow = Database['public']['Tables']['region_configs']['Row'];
type ProductPriceRow = Database['public']['Tables']['product_prices']['Row'];
type ShipmentRow = Database['public']['Tables']['shipments']['Row'];
type ShipmentProductRow = Database['public']['Tables']['shipment_products']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];

// Company mappings
export const companyFromRow = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  logoUrl: row.logo_url ?? undefined,
  primaryColor: row.primary_color ?? '#3B82F6',
  address: row.address ?? undefined,
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  subscriptionTier: row.subscription_tier as Company['subscriptionTier'],
  subscriptionStatus: row.subscription_status as Company['subscriptionStatus'],
  trialEndsAt: row.trial_ends_at ?? undefined,
  maxUsers: row.max_users ?? 5,
  maxShipmentsPerMonth: row.max_shipments_per_month ?? 100,
  features: (row.features as Record<string, boolean>) ?? {},
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// User mappings
export const userFromRow = (row: UserRow): User => ({
  id: row.id,
  companyId: row.company_id,
  username: row.username,
  email: row.email ?? '',
  role: row.role as Role,
  isPlatformAdmin: row.is_platform_admin ?? false,
  isActive: row.is_active ?? true,
  createdAt: row.created_at ?? undefined,
});

// Product mappings
export const productFromRow = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active ?? true,
  weightKg: row.weight_kg ?? 0,
});

// Driver mappings
export const driverFromRow = (row: DriverRow): Driver => ({
  id: row.id,
  name: row.name,
  plateNumber: row.plate_number,
  isActive: row.is_active ?? true,
});

// Region mappings
export const regionFromRow = (row: RegionRow): Region => ({
  id: row.id,
  name: row.name,
});

// Region Config mappings
export const regionConfigFromRow = (row: RegionConfigRow): RegionConfig => ({
  id: row.id,
  regionId: row.region_id,
  dieselLiterPrice: Number(row.diesel_liter_price),
  dieselLiters: Number(row.diesel_liters),
  zaitriFee: Number(row.zaitri_fee),
  roadExpenses: Number(row.road_expenses),
  effectiveFrom: row.effective_from,
});

// Product Price mappings
export const productPriceFromRow = (row: ProductPriceRow): ProductPrice => ({
  id: row.id,
  regionId: row.region_id,
  productId: row.product_id,
  price: Number(row.price),
  effectiveFrom: row.effective_from,
});

// Shipment Product mappings
export const shipmentProductFromRow = (row: ShipmentProductRow): ShipmentProduct => ({
  productId: row.product_id,
  productName: row.product_name,
  cartonCount: row.carton_count,
  productWagePrice: row.product_wage_price ?? undefined,
  shortageCartons: row.shortage_cartons ?? undefined,
  shortageExemptionRate: row.shortage_exemption_rate ?? undefined,
  shortageValue: row.shortage_value ?? undefined,
  damagedCartons: row.damaged_cartons ?? undefined,
  damagedExemptionRate: row.damaged_exemption_rate ?? undefined,
  damagedValue: row.damaged_value ?? undefined,
});

// Shipment mappings
export const shipmentFromRow = (row: ShipmentRow, products: ShipmentProduct[]): Shipment => ({
  id: row.id,
  salesOrder: row.sales_order,
  orderDate: row.order_date,
  entryTimestamp: row.entry_timestamp,
  regionId: row.region_id,
  driverId: row.driver_id,
  status: row.status as ShipmentStatus,
  products,
  totalDiesel: row.total_diesel ?? undefined,
  totalWage: row.total_wage ?? undefined,
  zaitriFee: row.zaitri_fee ?? undefined,
  adminExpenses: row.admin_expenses ?? undefined,
  dueAmount: row.due_amount ?? undefined,
  damagedValue: row.damaged_value ?? undefined,
  shortageValue: row.shortage_value ?? undefined,
  roadExpenses: row.road_expenses ?? undefined,
  dueAmountAfterDiscount: row.due_amount_after_discount ?? undefined,
  otherAmounts: row.other_amounts ?? undefined,
  improvementBonds: row.improvement_bonds ?? undefined,
  eveningAllowance: row.evening_allowance ?? undefined,
  transferFee: row.transfer_fee ?? undefined,
  totalDueAmount: row.total_due_amount ?? undefined,
  taxRate: row.tax_rate ?? undefined,
  totalTax: row.total_tax ?? undefined,
  transferNumber: row.transfer_number ?? undefined,
  transferDate: row.transfer_date ?? undefined,
  modifiedBy: row.modified_by ?? undefined,
  modifiedAt: row.modified_at ?? undefined,
  deductionsEditedBy: row.deductions_edited_by ?? undefined,
  deductionsEditedAt: row.deductions_edited_at ?? undefined,
  hasMissingPrices: row.has_missing_prices,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
  notes: row.notes ?? undefined,
  attachmentUrl: row.attachment_url ?? undefined,
});

// Notification mappings
export const notificationFromRow = (row: NotificationRow): Notification => ({
  id: row.id,
  message: row.message,
  timestamp: row.timestamp,
  read: row.read ?? false,
  category: row.category as NotificationCategory,
  targetRoles: row.target_roles as Role[] ?? undefined,
  targetUserIds: row.target_user_ids ?? undefined,
});
```

**Step 2: Commit**

```bash
git add . && git commit -m "feat(utils): create data mapping utilities"
```

---

### Task 11: Create Calculation Utilities

**Files:**
- Create: `src/utils/calculations.ts`

**Step 1: Create calculations file**

```typescript
import { Shipment, ShipmentProduct, Region, RegionConfig, ProductPrice, DeductionPrice } from '../types';

/**
 * Get the effective region config for a given date
 */
export const getEffectiveRegionConfig = (
  regionId: string,
  orderDate: string,
  regionConfigs: RegionConfig[]
): RegionConfig | undefined => {
  return regionConfigs
    .filter(rc => rc.regionId === regionId && rc.effectiveFrom <= orderDate)
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];
};

/**
 * Get the effective product price for a given date
 */
export const getEffectiveProductPrice = (
  regionId: string,
  productId: string,
  orderDate: string,
  productPrices: ProductPrice[]
): ProductPrice | undefined => {
  return productPrices
    .filter(pp => 
      pp.regionId === regionId && 
      pp.productId === productId && 
      pp.effectiveFrom <= orderDate
    )
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];
};

/**
 * Get the effective deduction price for a given date
 */
export const getEffectiveDeductionPrice = (
  productId: string,
  orderDate: string,
  deductionPrices: DeductionPrice[]
): DeductionPrice | undefined => {
  return deductionPrices
    .filter(dp => dp.productId === productId && dp.effectiveFrom <= orderDate)
    .sort((a, b) => new Date(b.effectiveFrom).getTime() - new Date(a.effectiveFrom).getTime())[0];
};

/**
 * Calculate total wage for products
 */
export const calculateTotalWage = (products: ShipmentProduct[]): number => {
  return products.reduce((sum, p) => sum + (p.productWagePrice ?? 0), 0);
};

/**
 * Calculate total deductions (shortage + damaged)
 */
export const calculateTotalDeductions = (products: ShipmentProduct[]): { shortage: number; damaged: number } => {
  return products.reduce(
    (acc, p) => ({
      shortage: acc.shortage + (p.shortageValue ?? 0),
      damaged: acc.damaged + (p.damagedValue ?? 0),
    }),
    { shortage: 0, damaged: 0 }
  );
};

/**
 * Calculate initial shipment values when created by fleet manager
 */
export const calculateInitialShipmentValues = (
  shipment: Omit<Shipment, 'id' | 'entryTimestamp' | 'status'>,
  regionConfigs: RegionConfig[],
  productPrices: ProductPrice[]
): Partial<Shipment> => {
  const regionConfig = getEffectiveRegionConfig(shipment.regionId, shipment.orderDate, regionConfigs);
  
  if (!regionConfig) {
    return { hasMissingPrices: true };
  }

  let hasMissingPrices = false;
  const calculatedProducts = shipment.products.map(p => {
    const price = getEffectiveProductPrice(shipment.regionId, p.productId, shipment.orderDate, productPrices);
    if (!price) {
      hasMissingPrices = true;
      return { ...p, productWagePrice: 0 };
    }
    return { ...p, productWagePrice: price.price * p.cartonCount };
  });

  const totalWage = calculateTotalWage(calculatedProducts);
  const totalDiesel = regionConfig.dieselLiterPrice * regionConfig.dieselLiters;
  const zaitriFee = regionConfig.zaitriFee;
  const adminExpenses = 0; // Set by admin later
  const dueAmount = totalWage - totalDiesel - zaitriFee - adminExpenses;

  return {
    products: calculatedProducts,
    totalWage,
    totalDiesel,
    zaitriFee,
    adminExpenses,
    dueAmount,
    roadExpenses: regionConfig.roadExpenses,
    hasMissingPrices,
  };
};

/**
 * Calculate final amounts after deductions and admin additions
 */
export const calculateFinalAmounts = (shipment: Shipment): Partial<Shipment> => {
  const { shortage, damaged } = calculateTotalDeductions(shipment.products);
  const shortageValue = shortage;
  const damagedValue = damaged;
  
  const dueAmountAfterDiscount = 
    (shipment.dueAmount ?? 0) - 
    shortageValue - 
    damagedValue - 
    (shipment.roadExpenses ?? 0);

  const beforeAdminAdjustments = dueAmountAfterDiscount;
  const adminAdjustments = 
    (shipment.improvementBonds ?? 0) + 
    (shipment.eveningAllowance ?? 0) + 
    (shipment.transferFee ?? 0) - 
    (shipment.otherAmounts ?? 0);
  
  const totalDueAmount = beforeAdminAdjustments + adminAdjustments;
  const totalTax = totalDueAmount * ((shipment.taxRate ?? 0) / 100);

  return {
    shortageValue,
    damagedValue,
    dueAmountAfterDiscount,
    totalDueAmount,
    totalTax,
  };
};
```

**Step 2: Commit**

```bash
git add . && git commit -m "feat(utils): create calculation utilities"
```

---

### Task 12: Create Constants & Configuration

**Files:**
- Create: `src/utils/constants.ts`

**Step 1: Create constants file**

```typescript
/**
 * Application constants
 */

// IndexedDB store names
export const STORES = {
  USERS: 'users',
  PRODUCTS: 'products',
  DRIVERS: 'drivers',
  REGIONS: 'regions',
  SHIPMENTS: 'shipments',
  PRODUCT_PRICES: 'productPrices',
  REGION_CONFIGS: 'regionConfigs',
  NOTIFICATIONS: 'notifications',
  INSTALLMENTS: 'installments',
  INSTALLMENT_PAYMENTS: 'installmentPayments',
  SETTINGS: 'settings',
  MUTATION_QUEUE: 'mutationQueue',
} as const;

// Status colors for UI
export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'من مسؤول الحركة': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-300' },
  'مسودة': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', border: 'border-yellow-300' },
  'مرسلة للادمن': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-300' },
  'طلب تعديل': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-300' },
  'مرتجعة لمسؤول الحركة': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', border: 'border-red-300' },
  'نهائي': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', border: 'border-green-300' },
  'نهائي معدل': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-300', border: 'border-teal-300' },
  'تسديد دين': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300', border: 'border-gray-300' },
};

// Role colors
export const ROLE_COLORS: Record<string, string> = {
  'مسؤول الحركة': 'bg-blue-500',
  'محاسب': 'bg-green-500',
  'ادمن': 'bg-purple-500',
  'مدير المنصة': 'bg-red-500',
};

// Subscription tier limits
export const TIER_LIMITS: Record<string, { maxUsers: number; maxShipments: number }> = {
  free: { maxUsers: 3, maxShipments: 50 },
  starter: { maxUsers: 10, maxShipments: 500 },
  professional: { maxUsers: 50, maxShipments: 5000 },
  enterprise: { maxUsers: -1, maxShipments: -1 }, // Unlimited
};

// Default settings
export const DEFAULT_SETTINGS = {
  appName: 'نظام تتبع الشحنات',
  companyName: 'الشركة',
  companyAddress: 'العنوان',
  companyPhone: 'رقم الهاتف',
  companyLogo: '',
  isPrintHeaderEnabled: true,
  accountantPrintAccess: false,
  isTimeWidgetVisible: true,
};
```

**Step 2: Commit**

```bash
git add . && git commit -m "feat(utils): create constants and configuration"
```

---

## Phase 3: Context & State Management (Tasks 13-16)

### Task 13: Create Auth Context

**Files:**
- Create: `src/contexts/AuthContext.tsx`

*(This task creates the authentication context for login/signup/logout)*

### Task 14: Create Company Context

**Files:**
- Create: `src/contexts/CompanyContext.tsx`

*(This task creates the company/tenant context)*

### Task 15: Create Data Context

**Files:**
- Create: `src/contexts/DataContext.tsx`

*(This task creates the data context for products, drivers, shipments, etc.)*

### Task 16: Create Combined App Provider

**Files:**
- Create: `src/providers/AppProvider.tsx`

*(This task combines all contexts into a single provider)*

---

## Phase 4: UI Components (Tasks 17-30)

### Task 17-20: Common UI Components
- Layout components (Header, Sidebar, Footer)
- Form components (Input, Select, DatePicker)
- Display components (Card, Modal, Table, StatusBadge)
- Feedback components (Toast, Loading, Error)

### Task 21-24: Authentication Pages
- Login page
- Company signup page
- User invite page
- Password reset page

### Task 25-27: Dashboard Pages
- Fleet Dashboard (create shipments)
- Accountant Dashboard (review shipments)
- Admin Dashboard (manage everything)

### Task 28-30: Admin Features
- User management
- Data management (products, drivers, regions, prices)
- Company settings

---

## Phase 5: Platform Admin (Tasks 31-34)

### Task 31: Platform Admin Dashboard
### Task 32: Company Management
### Task 33: Subscription Management
### Task 34: Platform Analytics

---

## Phase 6: PWA & Offline Support (Tasks 35-38)

### Task 35: IndexedDB Setup
### Task 36: Service Worker
### Task 37: Offline Sync Queue
### Task 38: Background Sync

---

## Phase 7: Testing & Deployment (Tasks 39-42)

### Task 39: Manual Testing Checklist
### Task 40: Build Configuration
### Task 41: Deployment Setup
### Task 42: Documentation

---

## Summary

This plan covers building a complete multi-tenant SaaS shipment tracking platform from scratch with:

- **42 tasks** organized into 7 phases
- **Multi-tenancy** built in from day one via Row-Level Security
- **Role-based access control** for Fleet, Accountant, Admin, and Platform Admin
- **Complete shipment workflow** with status transitions
- **Offline-first PWA** with IndexedDB and background sync

---

**Plan complete and saved to `docs/plans/2026-01-11-saas-from-scratch.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
