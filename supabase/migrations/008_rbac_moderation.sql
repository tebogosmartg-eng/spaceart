-- RBAC moderation: roles (user/moderator/admin), audit columns, admin RPCs, RLS hardening
-- Idempotent — safe to run multiple times in Supabase SQL Editor.
--
-- IMPORTANT (Postgres enum): run 008a_rbac_enum_values.sql in a separate transaction
-- before this file. New enum labels must commit before they can be cast/assigned.

-- ---------------------------------------------------------------------------
-- 1. Role enum migration (requires 008a committed first)
-- ---------------------------------------------------------------------------
UPDATE profiles SET role = 'user'::user_role
WHERE role::text IN ('visitor', 'creative');

ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- ---------------------------------------------------------------------------
-- 2. Audit + verification columns
-- ---------------------------------------------------------------------------
ALTER TABLE creatives
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_creatives_status_created
  ON creatives(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON listings(status, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Authorization helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_approve_content()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_approve_content() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Admin RPCs (session-based moderation)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_approve_creative(p_creative_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin required';
  END IF;

  UPDATE creatives
  SET
    status = 'approved',
    approved_at = NOW(),
    approved_by = auth.uid(),
    rejected_at = NULL,
    rejected_by = NULL,
    rejection_note = NULL
  WHERE id = p_creative_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'creative not found or not pending';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_creative(
  p_creative_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin required';
  END IF;

  UPDATE creatives
  SET
    status = 'rejected',
    rejected_at = NOW(),
    rejected_by = auth.uid(),
    rejection_note = NULLIF(trim(p_reason), ''),
    approved_at = NULL,
    approved_by = NULL
  WHERE id = p_creative_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'creative not found or not pending';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_listing(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin required';
  END IF;

  UPDATE listings
  SET
    status = 'published',
    published_at = NOW(),
    approved_at = NOW(),
    approved_by = auth.uid(),
    rejected_at = NULL,
    rejected_by = NULL,
    rejection_note = NULL
  WHERE id = p_listing_id AND status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing not found or not pending review';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_reject_listing(
  p_listing_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin required';
  END IF;

  UPDATE listings
  SET
    status = 'rejected',
    rejected_at = NOW(),
    rejected_by = auth.uid(),
    rejection_note = NULLIF(trim(p_reason), ''),
    approved_at = NULL,
    approved_by = NULL,
    published_at = NULL
  WHERE id = p_listing_id AND status = 'pending_review';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing not found or not pending review';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_creative_verified(
  p_creative_id UUID,
  p_verified BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin required';
  END IF;

  UPDATE creatives
  SET verified = p_verified
  WHERE id = p_creative_id AND status = 'approved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'creative not found or not approved';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_approve_creative(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_creative(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_listing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reject_listing(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_creative_verified(UUID, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Triggers: privilege escalation + moderation field protection
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profiles_prevent_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      -- First admin bootstrap when no admin exists yet (service-role / SQL Editor)
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

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_prevent_privilege_escalation();

CREATE OR REPLACE FUNCTION public.protect_creative_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      NEW.status = 'pending'
      AND OLD.status IN ('pending', 'rejected')
    ) THEN
      RAISE EXCEPTION 'forbidden: invalid status transition';
    END IF;
  END IF;

  IF NEW.verified IS DISTINCT FROM OLD.verified THEN
    RAISE EXCEPTION 'forbidden: cannot change verified';
  END IF;
  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured THEN
    RAISE EXCEPTION 'forbidden: cannot change featured';
  END IF;
  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at THEN
    RAISE EXCEPTION 'forbidden: cannot change approved_at';
  END IF;
  IF NEW.approved_by IS DISTINCT FROM OLD.approved_by THEN
    RAISE EXCEPTION 'forbidden: cannot change approved_by';
  END IF;
  IF NEW.rejected_at IS DISTINCT FROM OLD.rejected_at THEN
    RAISE EXCEPTION 'forbidden: cannot change rejected_at';
  END IF;
  IF NEW.rejected_by IS DISTINCT FROM OLD.rejected_by THEN
    RAISE EXCEPTION 'forbidden: cannot change rejected_by';
  END IF;

  IF NEW.rejection_note IS DISTINCT FROM OLD.rejection_note THEN
    IF NOT (NEW.status = 'pending' AND OLD.status = 'rejected') THEN
      RAISE EXCEPTION 'forbidden: cannot change rejection_note';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_creative_moderation_fields ON creatives;
CREATE TRIGGER protect_creative_moderation_fields
  BEFORE UPDATE ON creatives
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_creative_moderation_fields();

CREATE OR REPLACE FUNCTION public.protect_listing_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      NEW.status = 'pending_review'
      AND OLD.status IN ('draft', 'rejected')
    ) AND NOT (
      NEW.status = 'draft'
      AND OLD.status IN ('draft', 'rejected')
    ) THEN
      RAISE EXCEPTION 'forbidden: invalid listing status transition';
    END IF;
  END IF;

  IF NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
     OR NEW.rejected_by IS DISTINCT FROM OLD.rejected_by
     OR NEW.published_at IS DISTINCT FROM OLD.published_at
     OR NEW.is_trending IS DISTINCT FROM OLD.is_trending THEN
    RAISE EXCEPTION 'forbidden: cannot change moderation fields';
  END IF;

  IF NEW.rejection_note IS DISTINCT FROM OLD.rejection_note THEN
    IF NOT (NEW.status = 'pending_review' AND OLD.status IN ('draft', 'rejected')) THEN
      RAISE EXCEPTION 'forbidden: cannot change rejection_note';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_listing_moderation_fields ON listings;
CREATE TRIGGER protect_listing_moderation_fields
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_listing_moderation_fields();

CREATE OR REPLACE FUNCTION public.enforce_listing_publish_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creative_status approval_status;
BEGIN
  IF NEW.status IN ('pending_review', 'published') THEN
    SELECT c.status INTO v_creative_status
    FROM creatives c
    WHERE c.id = NEW.creative_id;

    IF v_creative_status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'creative profile must be approved before publishing listings';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_publish_guard_insert ON listings;
CREATE TRIGGER enforce_listing_publish_guard_insert
  BEFORE INSERT ON listings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listing_publish_guard();

DROP TRIGGER IF EXISTS enforce_listing_publish_guard_update ON listings;
CREATE TRIGGER enforce_listing_publish_guard_update
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listing_publish_guard();

-- ---------------------------------------------------------------------------
-- 6. RLS: staff read access + admin update policies
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all creatives" ON creatives;
CREATE POLICY "Staff can view all creatives"
  ON creatives FOR SELECT
  USING (public.is_staff());

DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
CREATE POLICY "Staff can view all listings"
  ON listings FOR SELECT
  USING (public.is_staff());

DROP POLICY IF EXISTS "Admins can update creatives" ON creatives;
CREATE POLICY "Admins can update creatives"
  ON creatives FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update listings" ON listings;
CREATE POLICY "Admins can update listings"
  ON listings FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all listing media" ON listing_media;
DROP POLICY IF EXISTS "Staff can view all listing media" ON listing_media;
CREATE POLICY "Staff can view all listing media"
  ON listing_media FOR SELECT
  USING (public.is_staff());

CREATE POLICY "Admins can manage all listing media"
  ON listing_media FOR ALL
  USING (public.is_admin());

-- Future: moderation_events, reports
-- CREATE TABLE moderation_events (...);
