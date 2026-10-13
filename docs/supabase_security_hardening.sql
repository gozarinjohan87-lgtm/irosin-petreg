-- Apply after the base schema and auth profile trigger migration.
-- The original policies allow anonymous reads of full profile/pet records,
-- including contact details. These replacements protect those records.

DROP POLICY IF EXISTS "Public profiles can be viewed by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read of basic profile info for verify" ON public.profiles;
CREATE POLICY "Users can view their own profile and admins can view all"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_admin());

-- Authenticated users may edit only non-privileged profile fields. Role,
-- status, and verification changes must be made through trusted administration.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (name, username, barangay, purok, contact_number, address, avatar_url)
  ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "Allow public read for QR and registry verification" ON public.pets;
CREATE POLICY "Users can view owned pets and registry staff can view all"
  ON public.pets FOR SELECT
  TO authenticated
  USING (owner_id = public.current_user_profile_id() OR public.is_operator_or_admin());

DROP POLICY IF EXISTS "Owners can update their own pets" ON public.pets;
CREATE POLICY "Owners can update their own pets"
  ON public.pets FOR UPDATE
  TO authenticated
  USING (owner_id = public.current_user_profile_id() OR public.is_operator_or_admin())
  WITH CHECK (owner_id = public.current_user_profile_id() OR public.is_operator_or_admin());

DROP POLICY IF EXISTS "Allow read vaccination records" ON public.vaccinations;
CREATE POLICY "Owners and authorized staff can view vaccinations"
  ON public.vaccinations FOR SELECT
  TO authenticated
  USING (
    public.is_operator_or_admin()
    OR EXISTS (
      SELECT 1
      FROM public.pets
      WHERE pets.id = vaccinations.pet_id
        AND pets.owner_id = public.current_user_profile_id()
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.role IN ('vet_clinic', 'bite_center')
        AND profiles.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Anyone can view reported strays" ON public.stray_reports;
CREATE POLICY "Registry staff can view stray reports"
  ON public.stray_reports FOR SELECT
  TO authenticated
  USING (public.is_operator_or_admin());
