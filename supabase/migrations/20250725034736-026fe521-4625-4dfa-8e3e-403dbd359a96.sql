-- Drop the existing foreign key constraint
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS notifications_log_delivery_schedule_id_fkey;

-- Add the foreign key constraint with CASCADE delete
ALTER TABLE notifications_log 
ADD CONSTRAINT notifications_log_delivery_schedule_id_fkey 
FOREIGN KEY (delivery_schedule_id) 
REFERENCES delivery_schedules(id) 
ON DELETE CASCADE;