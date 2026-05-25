-- Promote SPACEART primary admin (run in Supabase SQL Editor as postgres / service role).
-- Safe to re-run: only affects the designated email.

BEGIN;

UPDATE profiles
SET role = 'admin'::user_role
WHERE lower(trim(email)) = lower('info.hasaawards@gmail.com');

-- Verify (expect one row with role = admin after the account exists):
SELECT id, email, role, created_at
FROM profiles
WHERE lower(trim(email)) = lower('info.hasaawards@gmail.com');

COMMIT;
