-- Fix the foreign key constraint issues in jobs table
-- Remove the redundant customer_id column and ensure customer_uuid has proper foreign key

-- First, update any null customer_uuid values (if any) from customer_id
UPDATE public.jobs 
SET customer_uuid = customer_id 
WHERE customer_uuid IS NULL AND customer_id IS NOT NULL;

-- Remove the redundant customer_id column
ALTER TABLE public.jobs DROP COLUMN IF EXISTS customer_id;

-- Add foreign key constraint for customer_uuid
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_customer_uuid_fkey 
FOREIGN KEY (customer_uuid) REFERENCES public.customers(id) 
ON DELETE CASCADE;

-- Ensure proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_jobs_customer_uuid ON public.jobs(customer_uuid);
CREATE INDEX IF NOT EXISTS idx_jobs_service_id ON public.jobs(service_id);
CREATE INDEX IF NOT EXISTS idx_jobs_current_status ON public.jobs(current_status);

-- Fix any other potential foreign key issues
-- Ensure workflow_status table exists and jobs.current_status references it properly
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_current_status_fkey 
FOREIGN KEY (current_status) REFERENCES public.workflow_status(id);

-- Ensure services foreign key is proper
ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_service_id_fkey 
FOREIGN KEY (service_id) REFERENCES public.services(id);