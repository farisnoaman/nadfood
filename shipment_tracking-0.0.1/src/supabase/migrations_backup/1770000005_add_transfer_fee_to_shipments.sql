-- Add transfer_fee column to shipments table
ALTER TABLE shipments ADD COLUMN transfer_fee DECIMAL(10,2) DEFAULT 0;