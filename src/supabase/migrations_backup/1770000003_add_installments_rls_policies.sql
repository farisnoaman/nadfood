-- Migration: add_installments_rls_policies
-- Created at: 1770000003

-- Enable RLS on installments and installment_payments tables
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;

-- Installments table policies
-- Admins can do everything with installments
CREATE POLICY "admin_full_access_installments" ON installments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ادمن'
  )
);

-- Users can view installments related to their shipments
CREATE POLICY "users_view_own_installments" ON installments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM shipments
    WHERE shipments.id = installments.shipment_id
    AND (
      shipments.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role IN ('ادمن', 'محاسب')
      )
    )
  )
);

-- Installment Payments table policies
-- Admins can do everything with installment payments
CREATE POLICY "admin_full_access_installment_payments" ON installment_payments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ادمن'
  )
);

-- Users can view installment payments related to their installments
CREATE POLICY "users_view_own_installment_payments" ON installment_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM installments
    WHERE installments.id = installment_payments.installment_id
    AND EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = installments.shipment_id
      AND (
        shipments.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('ادمن', 'محاسب')
        )
      )
    )
  )
);

-- Users can insert installment payments for their installments
CREATE POLICY "users_insert_own_installment_payments" ON installment_payments
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM installments
    WHERE installments.id = installment_payments.installment_id
    AND EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = installments.shipment_id
      AND (
        shipments.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.role IN ('ادمن', 'محاسب')
        )
      )
    )
  )
);