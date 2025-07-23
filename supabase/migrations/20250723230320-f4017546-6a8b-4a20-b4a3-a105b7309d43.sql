-- Fix delivery method constraint to match the constants
ALTER TABLE jobs 
DROP CONSTRAINT IF EXISTS jobs_delivery_method_check;

ALTER TABLE jobs 
ADD CONSTRAINT jobs_delivery_method_check 
CHECK (delivery_method IN ('Collection', 'Local Delivery', 'Nationwide Delivery', 'Express Delivery'));