-- Migration: add_admin_policies_for_drivers
-- Created at: 1770000006

-- Add INSERT, UPDATE, DELETE policies for drivers table to allow admin management

-- Admin can insert new drivers
CREATE POLICY "admin_insert_drivers" ON drivers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ادمن'
  )
);

-- Admin can update drivers
CREATE POLICY "admin_update_drivers" ON drivers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ادمن'
  )
);

-- Admin can delete drivers
CREATE POLICY "admin_delete_drivers" ON drivers
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'ادمن'
  )
);