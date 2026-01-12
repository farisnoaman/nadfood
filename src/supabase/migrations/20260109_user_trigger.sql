-- ============================================
-- AUTO-CREATE PUBLIC USER PROFILE
-- Trigger to insert into public.users when auth.users is created
-- ============================================

-- 1. Create Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Extract company_id from metadata, validate it's a proper UUID
  BEGIN
    v_company_id := (new.raw_user_meta_data->>'company_id')::uuid;
  EXCEPTION
    WHEN others THEN
      v_company_id := NULL;
  END;

  -- Log for debugging
  RAISE NOTICE 'Creating user % with company_id from metadata: %', new.id, v_company_id;

  INSERT INTO public.users (id, username, role, company_id, is_active, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'موظف مبيعات'),
    v_company_id,
    COALESCE((new.raw_user_meta_data->>'is_active')::boolean, true),
    new.email
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
