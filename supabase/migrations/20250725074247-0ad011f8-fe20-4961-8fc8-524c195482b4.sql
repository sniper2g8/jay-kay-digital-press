-- Enable real-time updates for notifications_log table
ALTER TABLE public.notifications_log REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_log;