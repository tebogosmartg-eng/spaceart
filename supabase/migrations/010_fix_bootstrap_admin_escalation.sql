-- Allow first admin bootstrap when no admin exists (SQL Editor / service role).
CREATE OR REPLACE FUNCTION public.profiles_prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      IF lower(trim(NEW.email)) = lower('info.hasaawards@gmail.com')
         AND NEW.role = 'admin'::user_role
         AND NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin'::user_role) THEN
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'forbidden: cannot change role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Backfill primary admin if auth user exists without profile row
INSERT INTO profiles (id, email, role, onboarding_completed, full_name)
SELECT
  u.id,
  u.email,
  'admin'::user_role,
  true,
  COALESCE(u.raw_user_meta_data->>'full_name', 'SPACEART Admin')
FROM auth.users u
WHERE lower(trim(u.email)) = lower('info.hasaawards@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'admin'::user_role,
  onboarding_completed = true;
