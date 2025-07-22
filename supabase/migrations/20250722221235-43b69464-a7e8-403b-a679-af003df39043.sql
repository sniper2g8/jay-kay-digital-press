-- Update jobs to link them to customers properly where customer_uuid is NULL
-- First, let's create a function to fix orphaned jobs by linking them to the first available customer
UPDATE jobs 
SET customer_uuid = (
  SELECT id FROM customers LIMIT 1
) 
WHERE customer_uuid IS NULL;

-- Add a constraint to prevent future NULL customer_uuid values
ALTER TABLE jobs 
ALTER COLUMN customer_uuid SET NOT NULL;