-- Migration: add_road_expenses_to_regions
-- Created at: 2025-11-22
-- Purpose: Add road_expenses field to regions table for fixed road cost deductions

-- Add road_expenses column to regions table with default value of 0
ALTER TABLE regions 
ADD COLUMN IF NOT EXISTS road_expenses NUMERIC DEFAULT 0 NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN regions.road_expenses IS 'Fixed road expenses for this region (خرج الطريق)';
