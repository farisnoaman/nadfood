-- Add attachment_url column to shipments table
ALTER TABLE public.shipments
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.shipments.attachment_url IS 'URL to attachment file (PDF or image) stored in Supabase Storage';

-- Create storage bucket for shipment attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shipment-attachments',
  'shipment-attachments',
  true,
  1048576, -- 1MB limit (1024 * 1024)
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
CREATE POLICY "Public read access for shipment attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'shipment-attachments');

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Authenticated users can upload shipment attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shipment-attachments');

-- Allow authenticated users to update/delete their uploads
CREATE POLICY "Authenticated users can update shipment attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shipment-attachments');

CREATE POLICY "Authenticated users can delete shipment attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shipment-attachments');
