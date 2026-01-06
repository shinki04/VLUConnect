-- Function to safely mark a conversation as read by the current user
-- Bypasses the strict RLS on conversation_members update which restricts changes to admins
CREATE OR REPLACE FUNCTION mark_conversation_as_read(conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the function creator (admin)
SET search_path = public, auth -- Secure search path
AS $$
BEGIN
  -- Update the last_read_at timestamp for the current user in the specified conversation
  UPDATE public.conversation_members
  SET last_read_at = now()
  WHERE 
    conversation_members.conversation_id = mark_conversation_as_read.conversation_id
    AND conversation_members.user_id = auth.uid();
    
    -- We don't need to return anything. Attempting to update non-existent member will just do nothing, which is fine.
END;
$$;
