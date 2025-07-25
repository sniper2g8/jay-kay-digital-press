-- First, let's see what invalid values exist
SELECT DISTINCT notification_event, COUNT(*) 
FROM notifications_log 
GROUP BY notification_event 
ORDER BY notification_event;

-- Remove the constraint temporarily  
ALTER TABLE notifications_log 
DROP CONSTRAINT IF EXISTS notifications_log_notification_event_check;

-- Update the invalid 'promotional_messages' to singular form
UPDATE notifications_log 
SET notification_event = 'promotional_message'
WHERE notification_event = 'promotional_messages';

-- Now add the constraint with all valid event types
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