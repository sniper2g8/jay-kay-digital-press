-- Add missing notification events to the constraint
ALTER TABLE public.notifications_log 
DROP CONSTRAINT notifications_log_notification_event_check;

ALTER TABLE public.notifications_log 
ADD CONSTRAINT notifications_log_notification_event_check 
CHECK (notification_event::text = ANY (ARRAY[
  'job_created'::character varying,
  'job_submitted'::character varying,
  'admin_job_submitted'::character varying,
  'job_status_changed'::character varying,
  'delivery_scheduled'::character varying,
  'delivery_in_transit'::character varying,
  'delivery_completed'::character varying,
  'delivery_failed'::character varying,
  'invoice_sent'::character varying,
  'promotional_messages'::character varying
]::text[]));