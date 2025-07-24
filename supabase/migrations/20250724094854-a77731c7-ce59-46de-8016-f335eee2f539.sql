-- Fix the delivery_schedules created_by foreign key constraint
-- Remove the existing constraint and update it to reference auth.users instead of internal_users

-- First, let's see what constraint exists
SELECT tc.constraint_name, tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name 
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name 
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'delivery_schedules' AND kcu.column_name = 'created_by';

-- Drop the existing foreign key constraint
ALTER TABLE delivery_schedules DROP CONSTRAINT IF EXISTS delivery_schedules_created_by_fkey;

-- Add new constraint referencing auth.users
ALTER TABLE delivery_schedules 
ADD CONSTRAINT delivery_schedules_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;