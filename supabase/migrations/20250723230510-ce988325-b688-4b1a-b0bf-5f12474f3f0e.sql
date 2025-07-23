-- Drop the existing constraint completely
ALTER TABLE jobs DROP CONSTRAINT jobs_delivery_method_check;

-- Update existing jobs 
UPDATE jobs 
SET delivery_method = 'Collection'
WHERE delivery_method = 'Pickup' OR delivery_method IS NULL OR delivery_method = '';

-- Add the new constraint
ALTER TABLE jobs 
ADD CONSTRAINT jobs_delivery_method_check 
CHECK (delivery_method IN ('Collection', 'Local Delivery', 'Nationwide Delivery', 'Express Delivery'));