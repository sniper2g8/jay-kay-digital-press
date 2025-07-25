-- Check current constraint on notifications_log table
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'notifications_log'::regclass 
AND contype = 'c';

-- Update the check constraint to include all valid notification events
ALTER TABLE notifications_log 
DROP CONSTRAINT IF EXISTS notifications_log_notification_event_check;

-- Add updated check constraint with all valid event types
ALTER TABLE notifications_log 
ADD CONSTRAINT notifications_log_notification_event_check 
CHECK (notification_event IN (
    'job_submitted',
    'status_updated', 
    'delivery_scheduled',
    'delivery_completed',
    'admin_job_submitted',
    'test'
));