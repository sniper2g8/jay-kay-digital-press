-- Fix the security warning by setting the search_path for the function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;