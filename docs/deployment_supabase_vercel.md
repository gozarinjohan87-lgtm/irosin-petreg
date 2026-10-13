# Supabase and Vercel deployment

## Supabase setup

1. Apply `supabase_schema_migration.sql` if the base schema is not already installed.
2. Apply `supabase_auth_profiles_trigger.sql`. It creates `profiles` rows for new Supabase Auth accounts and links existing profiles to Auth accounts by email.
3. Apply `supabase_security_hardening.sql` to remove anonymous access to private profile, pet, vaccination, and stray-report data.
4. Apply `supabase_app_records.sql` to create the application record store, role-scoped policies, profile-review RPC, and the owner profile access needed by operators.
5. In **Authentication → URL Configuration**, set the production Vercel URL as the Site URL and add it to the allowed redirect URLs.
6. Enable email confirmation if required by your registration policy.

## Vercel setup

Set these variables for Production, Preview, and Development as needed:

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the Supabase publishable/anon key. Never use a service-role key in a `VITE_` variable.
- `VITE_VAPID_PUBLIC_KEY`: optional; only needed when the server-side Web Push sender is configured.

Deploy with the repository defaults: Node.js 22, `npm ci`, `npm run build`, and `dist` as the output directory. The SPA rewrite is configured in `vercel.json`.

## Application data

The app now loads and saves pets, vaccinations, incidents, notifications, bite cases, adoption listings, stray reports, audit entries, SMS logs, purok requests, and dispatch records to `petreg_app_records`, with per-record ownership/barangay metadata and Supabase Row Level Security. Profiles remain in `public.profiles`; passwords are never stored in app records. Anonymous incident submissions are written directly to the cloud.

This is a compatibility record layer because the existing UI uses nested camelCase records while the base schema has normalized snake_case columns. Records are now shared and durable; the normalized base tables are not yet the source of truth for these UI operations. Existing browser-local demo records are intentionally not uploaded automatically to avoid overwriting live records or leaking test data. If you need those records, migrate/seed them deliberately after reviewing them.
