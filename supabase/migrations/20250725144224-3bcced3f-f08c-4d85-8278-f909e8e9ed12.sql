-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.process_invitation_signup(
  invite_token_param uuid,
  user_auth_id uuid,
  user_password text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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