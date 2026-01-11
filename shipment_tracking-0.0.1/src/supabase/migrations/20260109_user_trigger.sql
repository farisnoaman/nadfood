-- ============================================
-- AUTO-CREATE PUBLIC USER PROFILE
-- Trigger to insert into public.users when auth.users is created
-- ============================================

-- 1. Create Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, role, company_id, is_active)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'role',
    (new.raw_user_meta_data->>'company_id')::uuid,
    (new.raw_user_meta_data->>'is_active')::boolean
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
-- Drop if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
