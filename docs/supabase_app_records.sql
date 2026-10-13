-- Apply after the base schema, auth profile trigger, and security-hardening
-- migrations. Stores the app's complete client record shapes in a typed,
-- per-record table while the legacy UI is migrated to normalized tables.

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_profile_barangay()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT barangay
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
    AND status = 'active'
  LIMIT 1;
$$;

CREATE TABLE IF NOT EXISTS public.petreg_app_records (
  record_type text NOT NULL CHECK (
    record_type IN (
      'pets',
      'vaccinations',
      'incidents',
      'notifications',
      'biteCases',
      'adoptionListings',
      'straySightings',
      'auditLogs',
      'smsLogs',
      'purokRequests',
      'offlineDispatches'
    )
  ),
  record_id text NOT NULL,
  owner_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  barangay text,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (record_type, record_id)
);

CREATE INDEX IF NOT EXISTS idx_petreg_app_records_owner
  ON public.petreg_app_records(owner_profile_id, record_type);
CREATE INDEX IF NOT EXISTS idx_petreg_app_records_barangay
  ON public.petreg_app_records(barangay, record_type);

ALTER TABLE public.petreg_app_records ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.petreg_app_records TO authenticated;
GRANT INSERT ON public.petreg_app_records TO anon;

DROP POLICY IF EXISTS "PetReg records are visible by role" ON public.petreg_app_records;
CREATE POLICY "PetReg records are visible by role"
  ON public.petreg_app_records FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.current_profile_role() = 'operator'
      AND barangay IS NOT NULL
      AND lower(barangay) = lower(public.current_profile_barangay())
    )
    OR (
      public.current_profile_role() = 'owner'
      AND (
        owner_profile_id = public.current_user_profile_id()
        OR record_type = 'adoptionListings'
      )
    )
    OR (
      public.current_profile_role() = 'bite_center'
      AND record_type IN ('biteCases', 'pets', 'notifications')
    )
    OR (
      public.current_profile_role() = 'vet_clinic'
      AND record_type IN ('vaccinations', 'pets', 'notifications')
    )
  );

DROP POLICY IF EXISTS "PetReg records can be inserted by role" ON public.petreg_app_records;
CREATE POLICY "PetReg records can be inserted by role"
  ON public.petreg_app_records FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (
      record_type IN ('incidents', 'straySightings')
      AND auth.uid() IS NULL
      AND owner_profile_id IS NULL
    )
    OR (
      auth.uid() IS NOT NULL
      AND (
        public.is_admin()
        OR (
          public.current_profile_role() = 'operator'
          AND barangay IS NOT NULL
          AND lower(barangay) = lower(public.current_profile_barangay())
        )
        OR (
          record_type = 'pets'
          AND public.current_profile_role() = 'owner'
          AND owner_profile_id = public.current_user_profile_id()
        )
        OR (
          record_type IN ('biteCases')
          AND public.current_profile_role() = 'bite_center'
        )
        OR (
          record_type IN ('vaccinations')
          AND public.current_profile_role() IN ('vet_clinic', 'bite_center')
        )
        OR (
          record_type IN ('incidents', 'straySightings')
          AND public.current_profile_role() IN ('owner', 'operator', 'bite_center', 'vet_clinic')
        )
        OR (
          record_type = 'adoptionListings'
          AND public.current_profile_role() = 'owner'
          AND owner_profile_id = public.current_user_profile_id()
        )
        OR (
          record_type = 'purokRequests'
          AND public.current_profile_role() = 'owner'
          AND owner_profile_id = public.current_user_profile_id()
        )
        OR (
          record_type IN ('notifications', 'auditLogs', 'smsLogs', 'offlineDispatches')
          AND public.current_profile_role() IN ('operator', 'bite_center', 'vet_clinic')
        )
      )
    )
  );

DROP POLICY IF EXISTS "PetReg records can be updated by role" ON public.petreg_app_records;
CREATE POLICY "PetReg records can be updated by role"
  ON public.petreg_app_records FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.current_profile_role() = 'operator'
      AND barangay IS NOT NULL
      AND lower(barangay) = lower(public.current_profile_barangay())
    )
    OR (
      record_type = 'pets'
      AND public.current_profile_role() = 'owner'
      AND owner_profile_id = public.current_user_profile_id()
    )
    OR (
      record_type IN ('biteCases')
      AND public.current_profile_role() = 'bite_center'
    )
    OR (
      record_type = 'vaccinations'
      AND public.current_profile_role() IN ('vet_clinic', 'bite_center')
    )
    OR (
      record_type = 'adoptionListings'
      AND public.current_profile_role() = 'owner'
      AND owner_profile_id = public.current_user_profile_id()
    )
    OR (
      record_type = 'notifications'
      AND owner_profile_id = public.current_user_profile_id()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR (
      public.current_profile_role() = 'operator'
      AND barangay IS NOT NULL
      AND lower(barangay) = lower(public.current_profile_barangay())
    )
    OR (
      record_type = 'pets'
      AND public.current_profile_role() = 'owner'
      AND owner_profile_id = public.current_user_profile_id()
    )
    OR (
      record_type = 'biteCases'
      AND public.current_profile_role() = 'bite_center'
    )
    OR (
      record_type = 'vaccinations'
      AND public.current_profile_role() IN ('vet_clinic', 'bite_center')
    )
    OR (
      record_type = 'adoptionListings'
      AND public.current_profile_role() = 'owner'
      AND owner_profile_id = public.current_user_profile_id()
    )
    OR (
      record_type = 'notifications'
      AND owner_profile_id = public.current_user_profile_id()
    )
  );

DROP POLICY IF EXISTS "PetReg records can be deleted by registry staff" ON public.petreg_app_records;
CREATE POLICY "PetReg records can be deleted by registry staff"
  ON public.petreg_app_records FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.current_profile_role() = 'operator'
      AND barangay IS NOT NULL
      AND lower(barangay) = lower(public.current_profile_barangay())
    )
  );

DROP POLICY IF EXISTS "Users can view their own profile and admins can view all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles can be viewed by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read of basic profile info for verify" ON public.profiles;
CREATE POLICY "Users and local registry staff can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR public.is_admin()
    OR (
      public.current_profile_role() = 'operator'
      AND lower(barangay) = lower(public.current_profile_barangay())
    )
  );

DROP POLICY IF EXISTS "Owners can insert their own notification records" ON public.petreg_app_records;
CREATE POLICY "Owners can insert their own notification records"
  ON public.petreg_app_records FOR INSERT
  TO authenticated
  WITH CHECK (
    record_type = 'notifications'
    AND owner_profile_id = public.current_user_profile_id()
    AND public.current_profile_role() = 'owner'
  );

CREATE OR REPLACE FUNCTION public.review_owner_verification(
  target_profile_id uuid,
  new_verification_status verification_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_role user_role;
  reviewer_barangay text;
BEGIN
  SELECT role, barangay
    INTO reviewer_role, reviewer_barangay
  FROM public.profiles
  WHERE auth_user_id = auth.uid()
    AND status = 'active';

  IF reviewer_role IS NULL THEN
    RAISE EXCEPTION 'An active PetReg profile is required';
  END IF;

  IF reviewer_role <> 'admin' AND reviewer_role <> 'operator' THEN
    RAISE EXCEPTION 'Only registry administrators and operators can review owners';
  END IF;

  UPDATE public.profiles AS target
  SET verification_status = new_verification_status,
      updated_at = now()
  WHERE target.id = target_profile_id
    AND target.role = 'owner'
    AND (
      reviewer_role = 'admin'
      OR lower(target.barangay) = lower(reviewer_barangay)
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Owner profile not found or outside the reviewer jurisdiction';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_owner_verification(uuid, verification_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_owner_verification(uuid, verification_status) TO authenticated;
