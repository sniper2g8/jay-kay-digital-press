-- Drop the existing constraint
ALTER TABLE jobs DROP CONSTRAINT jobs_delivery_method_check;

-- Update existing data to use only 'pickup' or 'delivery'
UPDATE jobs 
SET delivery_method = CASE 
  WHEN delivery_method IN ('Collection', 'Pickup') THEN 'pickup'
  WHEN delivery_method IN ('Local Delivery', 'Nationwide Delivery', 'Express Delivery', 'Delivery') THEN 'delivery'
  ELSE 'pickup'
END;

-- Add the new constraint with only pickup and delivery
ALTER TABLE jobs ADD CONSTRAINT jobs_delivery_method_check 
  CHECK (delivery_method IN ('pickup', 'delivery'));