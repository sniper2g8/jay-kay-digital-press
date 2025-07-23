-- First, update existing data to match the new constraint values
UPDATE jobs 
SET delivery_method = CASE 
  WHEN delivery_method IN ('Collection', 'Pickup') THEN 'pickup'
  WHEN delivery_method IN ('Local Delivery', 'Nationwide Delivery', 'Express Delivery', 'Delivery') THEN 'delivery'
  ELSE 'pickup'  -- Default fallback
END;

-- Now add the constraint
ALTER TABLE jobs ADD CONSTRAINT jobs_delivery_method_check 
  CHECK (delivery_method IN ('pickup', 'delivery'));