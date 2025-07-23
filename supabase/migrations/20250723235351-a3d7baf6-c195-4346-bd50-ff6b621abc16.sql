-- Drop the existing check constraint if it exists
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_delivery_method_check;

-- Add the new constraint to allow only 'pickup' and 'delivery'
ALTER TABLE jobs ADD CONSTRAINT jobs_delivery_method_check 
  CHECK (delivery_method IN ('pickup', 'delivery'));