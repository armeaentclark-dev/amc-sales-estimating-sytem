-- Hand-written migration (drizzle-kit only manages the `public` schema,
-- but this links `public.users` to Supabase's `auth.users` table).

-- Tie public.users.id to auth.users.id so a profile row can never
-- outlive its auth identity.
ALTER TABLE "users"
  ADD CONSTRAINT "users_id_auth_users_id_fk"
  FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- Auto-create a public.users profile row whenever a new Supabase Auth
-- user is created (e.g. via the dashboard's "Add user" flow — there's
-- no self-service registration in this app).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- These tables are only ever queried through Drizzle (direct Postgres
-- connection, which bypasses RLS). Enabling RLS with no policies keeps
-- them unreachable through Supabase's PostgREST/client-side API by
-- default, in case that's ever exposed to authenticated users.
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_settings" ENABLE ROW LEVEL SECURITY;
