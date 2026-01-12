-- Check what status values exist in the shipments table
SELECT DISTINCT status, COUNT(*) as count
FROM shipments
GROUP BY status
ORDER BY status;