-- ============================================================
-- FIX ORPHAN INSTALLMENTS
-- Revert shipments stuck in 'installments' status without an actual installment record
-- ============================================================

UPDATE public.shipments
SET status = 'final'
WHERE status = 'installments'
AND id NOT IN (SELECT shipment_id FROM public.installments);
