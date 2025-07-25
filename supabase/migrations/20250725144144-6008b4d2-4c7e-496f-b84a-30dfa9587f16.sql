-- Create table for storing user invitations
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_token uuid NOT NULL UNIQUE,
  invited_email text NOT NULL,
  invited_name text NOT NULL,
  invited_phone text,
  invited_role_id integer NOT NULL REFERENCES public.roles(id),
  invited_by uuid REFERENCES auth.users(id),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for user_invitations
CREATE POLICY "Admins can manage invitations" 
ON public.user_invitations 
FOR ALL 
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

CREATE POLICY "Staff can view invitations" 
ON public.user_invitations 
FOR SELECT 
USING (is_staff_or_admin(auth.uid()));

-- Create function to handle invitation signup
CREATE OR REPLACE FUNCTION public.process_invitation_signup(
  invite_token_param uuid,
  user_auth_id uuid,
  user_password text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  result jsonb;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE invite_token = invite_token_param
  AND expires_at > now()
  AND used_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Mark invitation as used
  UPDATE public.user_invitations
  SET used_at = now()
  WHERE invite_token = invite_token_param;
  
  -- Create appropriate user record based on role
  IF invitation_record.invited_role_id = (SELECT id FROM public.roles WHERE name = 'Customer') THEN
    -- Create customer record
    INSERT INTO public.customers (
      auth_user_id,
      name,
      email,
      phone
    ) VALUES (
      user_auth_id,
      invitation_record.invited_name,
      invitation_record.invited_email,
      invitation_record.invited_phone
    );
  ELSE
    -- Create internal user record
    INSERT INTO public.internal_users (
      auth_user_id,
      name,
      email,
      phone,
      role_id
    ) VALUES (
      user_auth_id,
      invitation_record.invited_name,
      invitation_record.invited_email,
      invitation_record.invited_phone,
      invitation_record.invited_role_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'role', (SELECT name FROM public.roles WHERE id = invitation_record.invited_role_id)
  );
END;
$$;