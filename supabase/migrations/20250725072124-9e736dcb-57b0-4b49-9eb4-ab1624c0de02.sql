-- First, let's create default notification preferences for existing customers who don't have them
INSERT INTO notification_preferences (customer_id, email_notifications, sms_notifications, job_status_updates, delivery_updates, promotional_messages)
SELECT 
    c.id,
    true,  -- Enable email notifications by default
    false, -- Disable SMS by default (user can enable)
    true,  -- Enable job status updates
    true,  -- Enable delivery updates  
    false  -- Disable promotional messages by default
FROM customers c
LEFT JOIN notification_preferences np ON c.id = np.customer_id
WHERE np.id IS NULL;

-- Create a function to automatically create notification preferences for new customers
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default notification preferences for the new customer
    INSERT INTO notification_preferences (
        customer_id,
        email_notifications,
        sms_notifications,
        job_status_updates,
        delivery_updates,
        promotional_messages
    ) VALUES (
        NEW.id,
        true,  -- Enable email notifications by default
        false, -- Disable SMS by default 
        true,  -- Enable job status updates
        true,  -- Enable delivery updates
        false  -- Disable promotional messages by default
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create notification preferences for new customers
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON customers;
CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();