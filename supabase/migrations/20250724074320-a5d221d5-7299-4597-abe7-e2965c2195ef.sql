-- Check and fix the delivery method constraint
-- First, let's see what values are in the jobs table
SELECT DISTINCT delivery_method FROM jobs WHERE delivery_method IS NOT NULL;

-- Drop the existing constraint if it exists
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_delivery_method_check;

-- Add the correct constraint that allows 'pickup' and 'delivery'
ALTER TABLE jobs ADD CONSTRAINT jobs_delivery_method_check 
CHECK (delivery_method IN ('pickup', 'delivery'));