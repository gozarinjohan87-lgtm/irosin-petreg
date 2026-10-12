-- ====================================================================
-- Irosin Municipal Animal Registry & Rabies Surveillance System (PetReg)
-- Complete Supabase PostgreSQL Schema & Security Migration Script
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. ENUMS & DOMAINS
-- ====================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'operator', 'owner', 'bite_center', 'vet_clinic');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE pet_status AS ENUM ('owned', 'stray', 'deceased', 'quarantined');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE bite_exposure_category AS ENUM ('Category I', 'Category II', 'Category III');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ====================================================================
-- 3. PROFILES / USERS TABLE
-- Links with Supabase auth.users or functions as application profiles
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'owner',
    barangay TEXT NOT NULL DEFAULT 'San Julian',
    purok TEXT,
    contact_number TEXT,
    address TEXT,
    avatar_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    verification_status verification_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 4. PETS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.pets (
    id TEXT PRIMARY KEY DEFAULT ('PET-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8))),
    name TEXT NOT NULL,
    species pet_species NOT NULL DEFAULT 'dog',
    breed TEXT NOT NULL DEFAULT 'Aspin',
    color TEXT NOT NULL,
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female', 'neutered_male', 'spayed_female')),
    birth_date DATE,
    age_years NUMERIC(4, 1),
    weight_kg NUMERIC(5, 2),
    microchip_no TEXT UNIQUE,
    status pet_status NOT NULL DEFAULT 'owned',
    photo_url TEXT,
    barangay TEXT NOT NULL,
    purok TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    owner_name TEXT NOT NULL,
    owner_contact TEXT NOT NULL,
    owner_address TEXT,
    qr_code_data TEXT,
    previous_owners JSONB DEFAULT '[]'::jsonb,
    is_vaccinated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 5. VACCINATIONS TABLE
-- Tracks Anti-Rabies, 5-in-1, and Deworming records
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.vaccinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    vaccine_type TEXT NOT NULL DEFAULT 'anti-rabies',
    vaccine_name TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    date_administered DATE NOT NULL,
    next_booster_due DATE NOT NULL,
    administered_by TEXT NOT NULL,
    facility TEXT NOT NULL,
    certificate_url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'scheduled', 'overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 6. ANIMAL BITE INCIDENTS & QUARANTINE
-- Used by Rural Health Unit (RHU) and Animal Bite Treatment Center (ABTC)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bite_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE NOT NULL,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE SET NULL,
    victim_name TEXT NOT NULL,
    victim_contact TEXT NOT NULL,
    victim_age INTEGER,
    victim_barangay TEXT NOT NULL,
    incident_date DATE NOT NULL,
    bite_location_on_body TEXT,
    exposure_category bite_exposure_category NOT NULL DEFAULT 'Category II',
    biting_animal_status TEXT NOT NULL DEFAULT 'confined' CHECK (biting_animal_status IN ('confined', 'deceased', 'missing', 'vaccinated')),
    quarantine_start_date DATE,
    quarantine_end_date DATE,
    outcome TEXT NOT NULL DEFAULT 'under_observation' CHECK (outcome IN ('cleared', 'rabid', 'euthanized', 'under_observation')),
    post_exposure_prophylaxis BOOLEAN DEFAULT true,
    treating_facility TEXT NOT NULL DEFAULT 'Irosin Municipal Health Office - ABTC',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 7. STRAY ANIMAL REPORTS
-- Community reports with geolocation coordinates
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.stray_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species pet_species NOT NULL DEFAULT 'dog',
    description TEXT NOT NULL,
    photo_url TEXT,
    barangay TEXT NOT NULL,
    specific_location TEXT NOT NULL,
    coordinates JSONB, -- { "lat": 12.705, "lng": 124.032 }
    reporter_name TEXT,
    reporter_contact TEXT,
    status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'captured', 'impounded', 'resolved')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 8. PET ADOPTION BOARD & REQUESTS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.adoption_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    fee NUMERIC(8, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'pending', 'adopted', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.adoption_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.adoption_listings(id) ON DELETE CASCADE,
    pet_id TEXT NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    applicant_name TEXT NOT NULL,
    applicant_contact TEXT NOT NULL,
    applicant_address TEXT NOT NULL,
    home_environment TEXT,
    has_other_pets BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 9. PUROK TRANSFER REQUESTS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.purok_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_username TEXT,
    barangay TEXT NOT NULL,
    previous_purok TEXT,
    requested_purok TEXT NOT NULL,
    contact_number TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 10. IN-APP NOTIFICATIONS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pet_id TEXT REFERENCES public.pets(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 11. CELLULAR SMS & EMAIL DISPATCH LOGS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.offline_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'both')),
    destination TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 12. AUDIT TRAIL LOGS
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 13. INDEXES FOR PERFORMANCE & REAL-TIME
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_barangay ON public.pets(barangay);
CREATE INDEX IF NOT EXISTS idx_pets_status ON public.pets(status);
CREATE INDEX IF NOT EXISTS idx_vaccinations_pet_id ON public.vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_booster_due ON public.vaccinations(next_booster_due);
CREATE INDEX IF NOT EXISTS idx_bite_cases_barangay ON public.bite_cases(victim_barangay);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ====================================================================
-- 14. ROW-LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ====================================================================
CREATE OR REPLACE FUNCTION public.current_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_operator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE auth_user_id = auth.uid() AND role IN ('admin', 'operator') AND status = 'active'
  );
$$;

-- ====================================================================
-- 15. ENABLE RLS ON ALL TABLES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bite_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stray_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purok_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 16. RLS POLICIES
-- ====================================================================

-- PROFILES
CREATE POLICY "Public profiles can be viewed by all authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow public read of basic profile info for verify"
ON public.profiles FOR SELECT
TO anon
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins full manage profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin());

-- PETS
CREATE POLICY "Allow public read for QR and registry verification"
ON public.pets FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Owners can insert pets"
ON public.pets FOR INSERT
TO authenticated
WITH CHECK (owner_id = public.current_user_profile_id() OR public.is_operator_or_admin());

CREATE POLICY "Owners can update their own pets"
ON public.pets FOR UPDATE
TO authenticated
USING (owner_id = public.current_user_profile_id() OR public.is_operator_or_admin());

CREATE POLICY "Operators and admins can delete pets"
ON public.pets FOR DELETE
TO authenticated
USING (public.is_operator_or_admin());

-- VACCINATIONS
CREATE POLICY "Allow read vaccination records"
ON public.vaccinations FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Vets, operators and admins can insert vaccinations"
ON public.vaccinations FOR INSERT
TO authenticated
WITH CHECK (
  public.is_operator_or_admin() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('vet_clinic', 'bite_center'))
);

CREATE POLICY "Vets, operators and admins can update vaccinations"
ON public.vaccinations FOR UPDATE
TO authenticated
USING (
  public.is_operator_or_admin() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('vet_clinic', 'bite_center'))
);

-- NOTIFICATIONS
CREATE POLICY "Users view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = public.current_user_profile_id() OR public.is_admin());

CREATE POLICY "Users can mark own notifications read"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = public.current_user_profile_id());

CREATE POLICY "System and admins insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- BITE CASES
CREATE POLICY "Health and admin roles view bite cases"
ON public.bite_cases FOR SELECT
TO authenticated
USING (
  public.is_operator_or_admin() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role IN ('bite_center', 'vet_clinic'))
);

CREATE POLICY "Bite centers and admins manage bite cases"
ON public.bite_cases FOR ALL
TO authenticated
USING (
  public.is_admin() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE auth_user_id = auth.uid() AND role = 'bite_center')
);

-- STRAY REPORTS
CREATE POLICY "Anyone can report stray animals"
ON public.stray_reports FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view reported strays"
ON public.stray_reports FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Operators and admins manage stray reports"
ON public.stray_reports FOR UPDATE
TO authenticated
USING (public.is_operator_or_admin());

-- ====================================================================
-- 17. STORAGE BUCKETS (File and Photo Uploads)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('pet-photos', 'pet-photos', true),
    ('vaccine-certs', 'vaccine-certs', true),
    ('incident-evidence', 'incident-evidence', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to pet photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'pet-photos');

CREATE POLICY "Allow authenticated uploads to pet photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pet-photos');

CREATE POLICY "Allow public read access to vaccine certs"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vaccine-certs');

CREATE POLICY "Allow authenticated uploads to vaccine certs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vaccine-certs');
