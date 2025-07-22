-- Create function to generate job tracking codes with JKDP-xxxx pattern
CREATE OR REPLACE FUNCTION public.generate_job_tracking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    next_num INTEGER;
BEGIN
    -- Get next job number for JKDP-xxxx format
    SELECT COALESCE(MAX(CAST(SUBSTRING(tracking_code FROM 'JKDP-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.jobs
    WHERE tracking_code LIKE 'JKDP-%';
    
    RETURN 'JKDP-' || LPAD(next_num::TEXT, 4, '0');
END;
$function$;

-- Create trigger function to set tracking code automatically
CREATE OR REPLACE FUNCTION public.set_job_tracking_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.tracking_code IS NULL OR NEW.tracking_code = '' THEN
        NEW.tracking_code := public.generate_job_tracking_code();
    END IF;
    RETURN NEW;
END;
$function$;

-- Create trigger to automatically set tracking code on job creation
CREATE TRIGGER set_job_tracking_code_trigger
    BEFORE INSERT ON public.jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_job_tracking_code();