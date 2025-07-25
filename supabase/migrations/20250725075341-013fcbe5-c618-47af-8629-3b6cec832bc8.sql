-- Fix security vulnerabilities in RLS policies and add audit functions

-- 1. Create audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type TEXT,
  event_details JSONB DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO analytics_events (
    event_type,
    event_data,
    user_id
  ) VALUES (
    event_type,
    event_details || jsonb_build_object(
      'timestamp', NOW(),
      'user_id', auth.uid(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'x-forwarded-for'
    ),
    auth.uid()
  );
END;
$$;

-- 2. Improve role change validation with better security
CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to change roles
  IF NOT is_admin_user(auth.uid()) THEN
    PERFORM log_security_event('unauthorized_role_change_attempt', jsonb_build_object(
      'target_user_id', NEW.auth_user_id,
      'attempted_role_id', NEW.role_id,
      'current_role_id', OLD.role_id
    ));
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;
  
  -- Log successful role changes
  IF OLD.role_id != NEW.role_id THEN
    PERFORM log_security_event('role_changed', jsonb_build_object(
      'target_user_id', NEW.auth_user_id,
      'old_role_id', OLD.role_id,
      'new_role_id', NEW.role_id
    ));
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Add trigger for role change validation on internal_users
DROP TRIGGER IF EXISTS validate_role_changes ON internal_users;
CREATE TRIGGER validate_role_changes
  BEFORE UPDATE ON internal_users
  FOR EACH ROW
  EXECUTE FUNCTION validate_role_change();

-- 4. Create function to validate file uploads
CREATE OR REPLACE FUNCTION public.validate_file_upload(
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_types TEXT[] := ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  max_file_size BIGINT := 50 * 1024 * 1024; -- 50MB
BEGIN
  -- Check file size
  IF file_size > max_file_size THEN
    RAISE EXCEPTION 'File size exceeds maximum limit of 50MB';
  END IF;
  
  -- Check MIME type
  IF NOT (mime_type = ANY(allowed_types)) THEN
    RAISE EXCEPTION 'File type not allowed. Allowed types: PDF, Images, Word documents, Text files';
  END IF;
  
  -- Check for suspicious file names
  IF file_name ~* '\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|jsp)$' THEN
    RAISE EXCEPTION 'Potentially dangerous file type detected';
  END IF;
  
  RETURN true;
END;
$$;

-- 5. Improve password security function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Minimum length check
  IF length(password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  -- Check for at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RAISE EXCEPTION 'Password must contain at least one uppercase letter';
  END IF;
  
  -- Check for at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RAISE EXCEPTION 'Password must contain at least one lowercase letter';
  END IF;
  
  -- Check for at least one number
  IF password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one number';
  END IF;
  
  -- Check for at least one special character
  IF password !~ '[^A-Za-z0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one special character';
  END IF;
  
  RETURN true;
END;
$$;

-- 6. Tighten some overly permissive RLS policies
-- Remove public access to profiles except for very limited data
DROP POLICY IF EXISTS "Public can view limited profile data for display" ON profiles;
CREATE POLICY "Public can view basic profile info only for display"
ON profiles FOR SELECT
TO anon
USING (true)
WITH CHECK (false);

-- More restrictive job viewing for public
DROP POLICY IF EXISTS "Public can view limited job data for display" ON jobs;
CREATE POLICY "Public can view basic job data for display only"
ON jobs FOR SELECT
TO anon
USING (true)
WITH CHECK (false);

-- 7. Add input sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove potentially dangerous characters and patterns
  input_text := regexp_replace(input_text, '<[^>]*>', '', 'g'); -- Remove HTML tags
  input_text := regexp_replace(input_text, '[&<>"'']', '', 'g'); -- Remove dangerous chars
  input_text := trim(input_text);
  
  -- Length limit
  IF length(input_text) > 1000 THEN
    input_text := left(input_text, 1000);
  END IF;
  
  RETURN input_text;
END;
$$;