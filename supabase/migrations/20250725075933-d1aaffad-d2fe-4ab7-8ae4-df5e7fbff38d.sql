-- Add default notification preferences for existing customers who don't have them

INSERT INTO notification_preferences (
    customer_id,
    email_notifications,
    sms_notifications,
    job_status_updates,
    delivery_updates,
    promotional_messages
)
SELECT 
    c.id as customer_id,
    true as email_notifications,      -- Enable email notifications by default
    false as sms_notifications,       -- Disable SMS by default
    true as job_status_updates,       -- Enable job status updates
    true as delivery_updates,         -- Enable delivery updates
    false as promotional_messages     -- Disable promotional messages by default
FROM customers c
LEFT JOIN notification_preferences np ON c.id = np.customer_id
WHERE np.customer_id IS NULL;  -- Only insert for customers without existing preferences