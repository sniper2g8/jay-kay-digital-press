-- Update existing invalid event values
UPDATE notifications_log 
SET notification_event = 'promotional_message'
WHERE notification_event = 'promotional_messages';

-- Drop the existing constraint
ALTER TABLE notifications_log 
DROP CONSTRAINT IF EXISTS notifications_log_notification_event_check;

-- Add updated check constraint with all valid event types including the corrected one
ALTER TABLE notifications_log 
ADD CONSTRAINT notifications_log_notification_event_check 
CHECK (notification_event IN (
    'job_submitted',
    'status_updated', 
    'delivery_scheduled',
    'delivery_completed',
    'admin_job_submitted',
    'promotional_message',
    'test'
));