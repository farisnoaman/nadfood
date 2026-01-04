# Multi-Tenancy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform single-tenant app to multi-tenant SaaS with company isolation, branding, and dynamic PWA.

**Architecture:** Row-Level Multitenancy with `company_id` on all data tables, RLS enforcement, subdomain routing.

**Tech Stack:** Supabase (DB, Auth, RLS, Edge Functions), React/Vite, Tailwind

---

## Task 1: Create Companies Table

**Files:**
- Create: `supabase/migrations/1780000001_create_companies_table.sql`

**Step 1: Write migration**

```sql
-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT DEFAULT '#3b82f6',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX idx_companies_slug ON public.companies(slug);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Only super_admin can manage companies
CREATE POLICY "Super admin can manage companies" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Authenticated users can read their own company
CREATE POLICY "Users can read own company" ON public.companies
  FOR SELECT USING (
    id = (SELECT company_id FROM public.users WHERE id = auth.uid())
  );
```

**Step 2: Run migration**

Run: `supabase db push`
Expected: Migration applied successfully

**Step 3: Commit**

```bash
git add supabase/migrations/1780000001_create_companies_table.sql
git commit -m "feat: add companies table for multi-tenancy"
```

---

## Task 2: Add company_id to Users Table

**Files:**
- Create: `supabase/migrations/1780000002_add_company_id_to_users.sql`

**Step 1: Write migration**

```sql
-- Add company_id to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Add super_admin role option
-- First, need to check existing role constraint and update
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE public.users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

-- Add new constraint with super_admin
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('مسؤول الحركة', 'محاسب', 'ادمن', 'super_admin'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
```

**Step 2: Run migration**

Run: `supabase db push`
Expected: Column added successfully

**Step 3: Commit**

```bash
git add supabase/migrations/1780000002_add_company_id_to_users.sql
git commit -m "feat: add company_id to users table"
```

---

## Task 3: Add company_id to Data Tables

**Files:**
- Create: `supabase/migrations/1780000003_add_company_id_to_data_tables.sql`

**Step 1: Write migration**

```sql
-- Add company_id to all data tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.regions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.product_prices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.deduction_prices ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.installment_payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON public.drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_regions_company_id ON public.regions(company_id);
CREATE INDEX IF NOT EXISTS idx_shipments_company_id ON public.shipments(company_id);
CREATE INDEX IF NOT EXISTS idx_product_prices_company_id ON public.product_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_deduction_prices_company_id ON public.deduction_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_installments_company_id ON public.installments(company_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_company_id ON public.installment_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_company_id ON public.app_settings(company_id);
```

**Step 2: Run migration**

Run: `supabase db push`
Expected: All columns added

**Step 3: Commit**

```bash
git add supabase/migrations/1780000003_add_company_id_to_data_tables.sql
git commit -m "feat: add company_id to all data tables"
```

---

## Task 4: Create Default Company & Backfill Data

**Files:**
- Create: `supabase/migrations/1780000004_create_default_company_and_backfill.sql`

**Step 1: Write migration**

```sql
-- Insert default company for existing data
INSERT INTO public.companies (id, name, slug, brand_color)
VALUES ('00000000-0000-0000-0000-000000000001', 'بلغيث للنقل', 'balgaith', '#3b82f6')
ON CONFLICT (slug) DO NOTHING;

-- Backfill all existing data with default company
UPDATE public.users SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.products SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.drivers SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.regions SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.shipments SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.product_prices SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.deduction_prices SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.installments SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.installment_payments SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
UPDATE public.app_settings SET company_id = '00000000-0000-0000-0000-000000000001' WHERE company_id IS NULL;
```

**Step 2: Run migration**

Run: `supabase db push`
Expected: Default company created and data backfilled

**Step 3: Commit**

```bash
git add supabase/migrations/1780000004_create_default_company_and_backfill.sql
git commit -m "feat: create default company and backfill existing data"
```

---

## Task 5: Update RLS Policies for Multi-Tenancy

**Files:**
- Create: `supabase/migrations/1780000005_update_rls_for_multitenancy.sql`

**Step 1: Write migration**

```sql
-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- Drop existing policies and create new ones for products
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.products;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.products;

CREATE POLICY "Users can read own company products" ON public.products
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert own company products" ON public.products
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update own company products" ON public.products
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete own company products" ON public.products
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Repeat for regions
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.regions;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.regions;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.regions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.regions;

CREATE POLICY "Users can read own company regions" ON public.regions
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert own company regions" ON public.regions
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update own company regions" ON public.regions
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete own company regions" ON public.regions
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Repeat for drivers
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.drivers;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.drivers;

CREATE POLICY "Users can read own company drivers" ON public.drivers
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert own company drivers" ON public.drivers
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update own company drivers" ON public.drivers
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete own company drivers" ON public.drivers
  FOR DELETE USING (company_id = public.get_user_company_id());
```

**Step 2: Run migration**

Run: `supabase db push`
Expected: New RLS policies applied

**Step 3: Commit**

```bash
git add supabase/migrations/1780000005_update_rls_for_multitenancy.sql
git commit -m "feat: update RLS policies for multi-tenancy"
```

---

## Task 6: Create TenantContext Provider

**Files:**
- Create: `providers/TenantContext.tsx`

**Step 1: Write TenantContext**

```tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  settings: Record<string, unknown>;
}

interface TenantContextType {
  company: Company | null;
  loading: boolean;
  error: string | null;
  subdomain: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};

const getSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  // Handle localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check for subdomain in query param for dev
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant') || 'balgaith';
  }
  // Extract subdomain from hostname
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
};

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const subdomain = getSubdomain();

  useEffect(() => {
    const fetchCompany = async () => {
      if (!subdomain) {
        setError('No company subdomain found');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('slug', subdomain)
          .eq('is_active', true)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Company not found');

        setCompany(data);
        
        // Apply brand color to CSS
        document.documentElement.style.setProperty('--brand-color', data.brand_color);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load company');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [subdomain]);

  return (
    <TenantContext.Provider value={{ company, loading, error, subdomain }}>
      {children}
    </TenantContext.Provider>
  );
};
```

**Step 2: Verify file created**

Run: `cat providers/TenantContext.tsx | head -20`
Expected: File content visible

**Step 3: Commit**

```bash
git add providers/TenantContext.tsx
git commit -m "feat: add TenantContext for multi-tenancy"
```

---

## Task 7: Update App.tsx to Use TenantProvider

**Files:**
- Modify: `App.tsx`

**Step 1: Import and wrap with TenantProvider**

Add import:
```tsx
import { TenantProvider } from './providers/TenantContext';
```

Update App component:
```tsx
const App: React.FC = () => (
    <TenantProvider>
        <ThemeProvider>
            <AppProvider>
                <AppRoutes />
            </AppProvider>
        </ThemeProvider>
    </TenantProvider>
);
```

**Step 2: Verify app still runs**

Run: `npm run dev`
Expected: App loads without errors

**Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat: integrate TenantProvider into App"
```

---

## Task 8: Update TypeScript Types

**Files:**
- Modify: `types.ts`

**Step 1: Add Company type and update interfaces**

Add at top of file after existing enums:
```typescript
/**
 * Represents a company/tenant in the multi-tenant system.
 */
export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

Update User interface:
```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  role: Role | 'super_admin';
  companyId?: string;
  isActive?: boolean;
  createdAt?: string;
}
```

**Step 2: Commit**

```bash
git add types.ts
git commit -m "feat: add Company type and update User interface"
```

---

## Task 9: Create Dynamic Manifest Edge Function

**Files:**
- Create: `supabase/functions/serve-manifest/index.ts`

**Step 1: Write edge function**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug') || 'balgaith';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: company } = await supabase
      .from('companies')
      .select('name, logo_url, brand_color')
      .eq('slug', slug)
      .single();

    const manifest = {
      name: company?.name || 'Shipment Tracker',
      short_name: company?.name || 'Tracker',
      start_url: '/',
      display: 'standalone',
      background_color: company?.brand_color || '#3b82f6',
      theme_color: company?.brand_color || '#3b82f6',
      orientation: 'portrait',
      icons: [
        {
          src: company?.logo_url || '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: company?.logo_url || '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    };

    return new Response(JSON.stringify(manifest), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/manifest+json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 2: Deploy function**

Run: `supabase functions deploy serve-manifest`
Expected: Function deployed successfully

**Step 3: Commit**

```bash
git add supabase/functions/serve-manifest/index.ts
git commit -m "feat: add dynamic manifest edge function"
```

---

## Task 10: Update index.html for Dynamic Manifest

**Files:**
- Modify: `index.html`

**Step 1: Update manifest link**

Replace static manifest link:
```html
<link rel="manifest" href="/manifest.json">
```

With dynamic one:
```html
<script>
  (function() {
    const subdomain = window.location.hostname.split('.')[0];
    const isLocalhost = window.location.hostname === 'localhost';
    const slug = isLocalhost 
      ? new URLSearchParams(window.location.search).get('tenant') || 'balgaith'
      : subdomain;
    
    const manifestUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/serve-manifest?slug=${slug}`;
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestUrl;
    document.head.appendChild(link);
  })();
</script>
```

**Step 2: Verify in browser**

Run: `npm run dev`
Expected: Check DevTools → Application → Manifest shows dynamic content

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: use dynamic manifest for PWA"
```

---

## Verification Plan

### Automated Tests
- RLS test: Create user in Company A, verify cannot read Company B data
- Subdomain parser unit test

### Manual Verification
1. Run migrations, verify existing data has company_id set
2. Navigate to `balgaith.localhost`, verify branding loads
3. Create new company "testco", verify isolation
4. Install PWA from subdomain, check icon
