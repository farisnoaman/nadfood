-- Allow public read access to active companies
-- Required for loading tenant branding on login page (before authentication)

CREATE POLICY "Allow public read access to active companies" ON public.companies
  FOR SELECT
  USING (is_active = true);
