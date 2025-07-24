-- Make customer_id nullable in jobs table since we're using customer_uuid as the primary reference
ALTER TABLE public.jobs ALTER COLUMN customer_id DROP NOT NULL;