-- Drop the existing foreign key constraint
ALTER TABLE public.notifications_log 
DROP CONSTRAINT IF EXISTS notifications_log_job_id_fkey;

-- Add the foreign key constraint with CASCADE deletion
ALTER TABLE public.notifications_log 
ADD CONSTRAINT notifications_log_job_id_fkey 
FOREIGN KEY (job_id) 
REFERENCES public.jobs(id) 
ON DELETE CASCADE;