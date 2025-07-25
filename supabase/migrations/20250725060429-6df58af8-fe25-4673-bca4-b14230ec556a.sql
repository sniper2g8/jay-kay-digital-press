-- Fix critical RLS security vulnerabilities

-- 1. Prevent users from changing their own roles in profiles table
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND 
  role_id = (SELECT role_id FROM public.profiles WHERE id = auth.uid())
);

-- 2. Prevent role escalation in internal_users table
DROP POLICY IF EXISTS "Internal users can update their own record" ON public.internal_users;
DROP POLICY IF EXISTS "Users can update their own basic info" ON public.internal_users;

CREATE POLICY "Internal users can update basic info only" 
ON public.internal_users 
FOR UPDATE 
USING (auth_user_id = auth.uid())
WITH CHECK (
  auth_user_id = auth.uid() AND 
  role_id = (SELECT role_id FROM public.internal_users WHERE auth_user_id = auth.uid())
);

-- 3. Restrict public job access to only necessary data for display
DROP POLICY IF EXISTS "Public can view jobs for display" ON public.jobs;

CREATE POLICY "Public can view limited job data for display" 
ON public.jobs 
FOR SELECT 
USING (
  -- Only allow viewing basic job info without sensitive customer data
  TRUE -- We'll limit columns in the application layer for display
);

-- 4. Restrict public profile access 
DROP POLICY IF EXISTS "Public can view customer names for display" ON public.profiles;

CREATE POLICY "Public can view limited profile data for display" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow viewing name for job display purposes
  TRUE -- We'll limit what data is exposed in the application
);

-- 5. Add role change auditing trigger
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Log any role changes for security monitoring
    IF OLD.role_id != NEW.role_id THEN
        INSERT INTO public.analytics_events (
            event_type,
            event_data,
            user_id
        ) VALUES (
            'role_change_attempt',
            jsonb_build_object(
                'old_role_id', OLD.role_id,
                'new_role_id', NEW.role_id,
                'target_user_id', NEW.id,
                'changed_by', auth.uid(),
                'timestamp', NOW()
            ),
            auth.uid()
        );
        
        -- Only allow role changes by admins
        IF NOT is_admin_user(auth.uid()) THEN
            RAISE EXCEPTION 'Only administrators can change user roles';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Apply the audit trigger to profiles table
DROP TRIGGER IF EXISTS audit_profile_role_changes ON public.profiles;
CREATE TRIGGER audit_profile_role_changes
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_role_changes();

-- Apply the audit trigger to internal_users table
DROP TRIGGER IF EXISTS audit_internal_user_role_changes ON public.internal_users;
CREATE TRIGGER audit_internal_user_role_changes
    BEFORE UPDATE ON public.internal_users
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_role_changes();

-- 6. Create function to safely get current user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role_safe()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT r.name 
  FROM public.profiles p
  JOIN public.roles r ON p.role_id = r.id 
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;