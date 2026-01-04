-- Function to sync global_role to auth.users JWT metadata
CREATE OR REPLACE FUNCTION public.sync_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = 
    jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{global_role}',
      to_jsonb(NEW.global_role)
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to execute the function on profile changes
DROP TRIGGER IF EXISTS trg_sync_role_to_jwt ON public.profiles;

CREATE TRIGGER trg_sync_role_to_jwt
AFTER INSERT OR UPDATE OF global_role ON public.profiles
FOR EACH ROW
WHEN (OLD.global_role IS DISTINCT FROM NEW.global_role)
EXECUTE FUNCTION public.sync_role_to_jwt();
