
SELECT 
    tgname AS trigger_name,
    proname AS function_name,
    tgtype,
    tgenabled
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'public.companies'::regclass;
