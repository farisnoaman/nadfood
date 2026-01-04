-- Migration: fix_drivers_sequence
-- Created at: 1770000007

-- Fix the drivers table sequence to prevent primary key conflicts
-- This ensures the next auto-generated ID doesn't conflict with existing records

-- Reset the sequence to be greater than the maximum existing ID
SELECT setval('drivers_id_seq', COALESCE((SELECT MAX(id) FROM drivers), 0) + 1, false);