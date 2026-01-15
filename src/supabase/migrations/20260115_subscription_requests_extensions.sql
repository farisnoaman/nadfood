ALTER TABLE public.subscription_requests 
ADD COLUMN IF NOT EXISTS effective_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS effective_end_date TIMESTAMP WITH TIME ZONE;
