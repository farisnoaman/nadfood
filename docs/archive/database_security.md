# Database Security & Row Level Security (RLS) Policies

This document outlines the required Row Level Security policies for the Shipment Tracking application's Supabase database.

## Overview

Row Level Security (RLS) is crucial for protecting data in Supabase. Each table must have appropriate policies that restrict access based on user roles and authentication status.

## Required RLS Policies

### 1. Users Table (`users`)

**Purpose:** Stores user profiles and roles.

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all active users
CREATE POLICY "Users can view all active users"
ON users FOR SELECT
USING (is_active = true);

-- Policy: Only admins can insert new users
CREATE POLICY "Only admins can insert users"
ON users FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

-- Policy: Only admins can update user profiles
CREATE POLICY "Only admins can update users"
ON users FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

-- Policy: No direct deletions (use is_active instead)
CREATE POLICY "Prevent user deletion"
ON users FOR DELETE
USING (false);
```

---

### 2. Shipments Table (`shipments`)

**Purpose:** Core shipment data with multi-stage workflow.

```sql
-- Enable RLS
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shipments based on role
CREATE POLICY "Users view shipments by role"
ON shipments FOR SELECT
USING (
  CASE 
    -- Admins can view all shipments
    WHEN auth.uid() IN (SELECT id FROM users WHERE role = 'Admin') 
      THEN true
    
    -- Accountants can view shipments in their workflow stages
    WHEN auth.uid() IN (SELECT id FROM users WHERE role = 'Accountant') 
      THEN status IN ('From Sales', 'Draft', 'Sent to Admin', 'Revision Requested', 'Final', 'Final Modified')
    
    -- Sales can only view their own shipments
    WHEN auth.uid() IN (SELECT id FROM users WHERE role = 'Sales')
      THEN created_by = auth.uid()
    
    ELSE false
  END
);

-- Policy: Only sales can insert new shipments
CREATE POLICY "Sales can create shipments"
ON shipments FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Sales') AND
  created_by = auth.uid()
);

-- Policy: Update access based on role and shipment status
CREATE POLICY "Role-based shipment updates"
ON shipments FOR UPDATE
USING (
  CASE
    -- Admins can update any shipment
    WHEN auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
      THEN true
    
    -- Accountants can update shipments in specific statuses
    WHEN auth.uid() IN (SELECT id FROM users WHERE role = 'Accountant')
      THEN status IN ('From Sales', 'Draft', 'Revision Requested')
    
    -- Sales can update only their own shipments in FROM_SALES status
    WHEN auth.uid() IN (SELECT id FROM users WHERE role = 'Sales')
      THEN created_by = auth.uid() AND status = 'From Sales'
    
    ELSE false
  END
);

-- Policy: Only admins can delete shipments (soft delete preferred)
CREATE POLICY "Only admins can delete shipments"
ON shipments FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);
```

---

### 3. Products Table (`products`)

**Purpose:** Master data for products.

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active products
CREATE POLICY "All users can view active products"
ON products FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- Policy: Only admins can manage products
CREATE POLICY "Only admins can insert products"
ON products FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

CREATE POLICY "Only admins can update products"
ON products FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

-- Note: Use soft delete (is_active) instead of hard delete
CREATE POLICY "Prevent product deletion"
ON products FOR DELETE
USING (false);
```

---

### 4. Regions Table (`regions`)

**Purpose:** Geographic regions for shipments.

```sql
-- Enable RLS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active regions
CREATE POLICY "All users can view active regions"
ON regions FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- Policy: Only admins can manage regions
CREATE POLICY "Only admins can insert regions"
ON regions FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

CREATE POLICY "Only admins can update regions"
ON regions FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

CREATE POLICY "Prevent region deletion"
ON regions FOR DELETE
USING (false);
```

---

### 5. Drivers Table (`drivers`)

**Purpose:** Driver information.

```sql
-- Enable RLS
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active drivers
CREATE POLICY "All users can view active drivers"
ON drivers FOR SELECT
USING (
  auth.uid() IS NOT NULL AND is_active = true
);

-- Policy: Only admins can manage drivers
CREATE POLICY "Only admins can insert drivers"
ON drivers FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

CREATE POLICY "Only admins can update drivers"
ON drivers FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

CREATE POLICY "Prevent driver deletion"
ON drivers FOR DELETE
USING (false);
```

---

### 6. Product Prices Table (`product_prices`)

**Purpose:** Region-specific product pricing.

```sql
-- Enable RLS
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

-- Policy: All users can view product prices
CREATE POLICY "All users can view product prices"
ON product_prices FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- Policy: Only admins can manage product prices
CREATE POLICY "Only admins can insert product prices"
ON product_prices FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

CREATE POLICY "Only admins can update product prices"
ON product_prices FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);

CREATE POLICY "Only admins can delete product prices"
ON product_prices FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);
```

---

### 7. Notifications Table (`notifications`)

**Purpose:** System notifications for users.

```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view notifications targeted to them
CREATE POLICY "Users view their notifications"
ON notifications FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  (
    -- Notifications for specific users
    auth.uid() = ANY(target_user_ids) OR
    -- Notifications for user's role
    (SELECT role FROM users WHERE id = auth.uid()) = ANY(target_roles) OR
    -- Global notifications (no specific targets)
    (target_user_ids IS NULL AND target_roles IS NULL)
  )
);

-- Policy: Authenticated users can create notifications
CREATE POLICY "Authenticated users can create notifications"
ON notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Policy: Users can mark their own notifications as read
CREATE POLICY "Users can update their notification status"
ON notifications FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  (
    auth.uid() = ANY(target_user_ids) OR
    (SELECT role FROM users WHERE id = auth.uid()) = ANY(target_roles)
  )
);

-- Policy: Only admins can delete notifications
CREATE POLICY "Only admins can delete notifications"
ON notifications FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'Admin')
);
```

---

## Security Best Practices

### 1. **Always Enable RLS**
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```
Never leave a table without RLS enabled in production.

### 2. **Use Soft Deletes**
Instead of deleting records, use an `is_active` boolean column:
```sql
UPDATE table_name SET is_active = false WHERE id = ?;
```

### 3. **Audit Trail**
Include audit columns in sensitive tables:
- `created_by` (UUID referencing users)
- `created_at` (TIMESTAMP)
- `modified_by` (UUID referencing users)
- `modified_at` (TIMESTAMP)

### 4. **Test Policies**
Always test policies with different user roles before deploying:
```sql
-- Test as sales user
SET role 'authenticated';
SET request.jwt.claim.sub = 'sales-user-uuid';
SELECT * FROM shipments; -- Should only see own shipments
```

### 5. **Principle of Least Privilege**
Grant only the minimum permissions required for each role:
- **Sales**: Create and view own shipments
- **Accountant**: Process and update shipments in workflow
- **Admin**: Full access to manage all data

---

## Deployment Checklist

Before deploying to production:

- [ ] All tables have RLS enabled
- [ ] Policies are tested for each role
- [ ] Service role key is stored securely (never in client code)
- [ ] Anon key is configured in environment variables
- [ ] Database backups are configured
- [ ] Audit logging is enabled for sensitive operations
- [ ] Test with actual user accounts for each role

---

## Troubleshooting

### Issue: "new row violates row-level security policy"

**Cause:** User attempting operation not allowed by RLS policies.

**Solution:** 
1. Verify user's role in `users` table
2. Check if policy conditions match user's context
3. Review `WITH CHECK` conditions for INSERT/UPDATE

### Issue: "permission denied for table X"

**Cause:** RLS is enabled but no policies grant access.

**Solution:**
1. Create appropriate SELECT policy for the user's role
2. Ensure user is authenticated (`auth.uid()` is not null)

### Issue: Edge Function can't access data

**Cause:** Edge Functions use service role, but policies still apply.

**Solution:**
Use service role key in Edge Function to bypass RLS:
```typescript
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') // Bypasses RLS
);
```

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/server-side-rendering)
