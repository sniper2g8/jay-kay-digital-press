-- Create analytics tables for tracking business metrics

-- Analytics events table for detailed tracking
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'job_created', 'job_completed', 'revenue_generated', 'customer_registered'
  event_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Analytics summary table for aggregated metrics
CREATE TABLE public.analytics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL, -- 'daily_revenue', 'monthly_jobs', 'active_customers', etc.
  metric_value DECIMAL(10,2),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for analytics (admin only)
CREATE POLICY "Admin can view analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "System can insert analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can view analytics summary" 
ON public.analytics_summary 
FOR SELECT 
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "System can manage analytics summary" 
ON public.analytics_summary 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_user_created ON public.analytics_events(user_id, created_at);
CREATE INDEX idx_analytics_summary_metric_period ON public.analytics_summary(metric_name, period_start, period_end);