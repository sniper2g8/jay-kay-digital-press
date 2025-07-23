-- First update existing jobs to use the correct delivery methods
UPDATE jobs 
SET delivery_method = CASE 
  WHEN delivery_method = 'Pickup' THEN 'Collection'
  WHEN delivery_method = 'Delivery' THEN 'Local Delivery'
  ELSE 'Collection'
END;

-- Now drop and recreate the constraint with correct values
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_delivery_method_check;

ALTER TABLE jobs 
ADD CONSTRAINT jobs_delivery_method_check 
CHECK (delivery_method IN ('Collection', 'Local Delivery', 'Nationwide Delivery', 'Express Delivery'));