-- Create app_settings table for storing application configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on setting_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin-only access
-- Only users with admin role can read settings
CREATE POLICY "Allow admins to read app settings" ON public.app_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ادمن'
            AND users.is_active = true
        )
    );

-- Only users with admin role can insert settings
CREATE POLICY "Allow admins to insert app settings" ON public.app_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ادمن'
            AND users.is_active = true
        )
    );

-- Only users with admin role can update settings
CREATE POLICY "Allow admins to update app settings" ON public.app_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ادمن'
            AND users.is_active = true
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ادمن'
            AND users.is_active = true
        )
    );

-- Only users with admin role can delete settings
CREATE POLICY "Allow admins to delete app settings" ON public.app_settings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ادمن'
            AND users.is_active = true
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER handle_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert default settings
INSERT INTO public.app_settings (setting_key, setting_value) VALUES
    ('appName', 'تتبع الشحنات'),
    ('companyName', 'اسم الشركة'),
    ('companyAddress', 'عنوان الشركة'),
    ('companyPhone', 'رقم الهاتف'),
    ('companyLogo', ''),
    ('isPrintHeaderEnabled', 'false'),
    ('accountantPrintAccess', 'false'),
    ('isTimeWidgetVisible', 'true')
ON CONFLICT (setting_key) DO NOTHING;