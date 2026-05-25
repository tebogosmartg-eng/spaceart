-- Bootstrap SPACEART primary admin (idempotent).
-- Promotes existing profile + auto-assigns admin on first signup for the designated email.

UPDATE profiles
SET role = 'admin'::user_role
WHERE lower(trim(email)) = lower('info.hasaawards@gmail.com');

CREATE OR REPLACE FUNCTION public.profiles_bootstrap_spaceart_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(trim(NEW.email)) = lower('info.hasaawards@gmail.com') THEN
    NEW.role := 'admin'::user_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_bootstrap_spaceart_admin ON profiles;
CREATE TRIGGER profiles_bootstrap_spaceart_admin
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_bootstrap_spaceart_admin();
