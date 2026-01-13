
SELECT s.id, s.sales_order, s.status, s.company_id
FROM shipments s
LEFT JOIN installments i ON s.id = i.shipment_id
WHERE s.status = 'installments'
AND i.id IS NULL;
