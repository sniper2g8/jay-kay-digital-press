-- Add missing columns to services table for Phase 5 features
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS service_type VARCHAR DEFAULT 'Other';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS requires_dimensions BOOLEAN DEFAULT false;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS available_subtypes JSONB;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS available_paper_types JSONB;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS available_paper_weights JSONB;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS available_finishes JSONB;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to jobs table for Phase 5 features
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS title VARCHAR;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS service_subtype VARCHAR;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS paper_type VARCHAR;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS paper_weight VARCHAR;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS finishing_options JSONB DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS tracking_code VARCHAR UNIQUE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Pending';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS quoted_price DECIMAL(10,2);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS final_price DECIMAL(10,2);
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Generate tracking codes for existing jobs
UPDATE public.jobs SET tracking_code = encode(gen_random_bytes(8), 'hex') WHERE tracking_code IS NULL;

-- Update services with Phase 5 data
UPDATE public.services SET 
  service_type = CASE 
    WHEN name ILIKE '%SAV%' OR name ILIKE '%vinyl%' THEN 'SAV'
    WHEN name ILIKE '%banner%' THEN 'Banner'
    WHEN name ILIKE '%business%card%' THEN 'Business Cards'
    WHEN name ILIKE '%flyer%' THEN 'Flyers'
    WHEN name ILIKE '%poster%' THEN 'Posters'
    ELSE 'Other'
  END,
  requires_dimensions = CASE 
    WHEN name ILIKE '%SAV%' OR name ILIKE '%banner%' THEN true
    ELSE false
  END,
  available_subtypes = CASE 
    WHEN name ILIKE '%SAV%' THEN '["Reflective", "Transparent", "One Way Vision", "Normal SAV"]'::jsonb
    WHEN name ILIKE '%banner%' THEN '["PVC", "Canvas", "Normal Banner"]'::jsonb
    ELSE null
  END,
  available_paper_types = CASE 
    WHEN name ILIKE '%SAV%' THEN '["Premium Vinyl", "Standard Vinyl", "Outdoor Vinyl"]'::jsonb
    WHEN name ILIKE '%banner%' THEN '["PVC Material", "Canvas Material", "Fabric"]'::jsonb
    WHEN name ILIKE '%business%card%' THEN '["Glossy", "Matte", "Textured"]'::jsonb
    WHEN name ILIKE '%flyer%' THEN '["Glossy", "Matte", "Recycled"]'::jsonb
    WHEN name ILIKE '%poster%' THEN '["Photo Paper", "Matte Paper", "Canvas"]'::jsonb
    ELSE '["Standard Paper"]'::jsonb
  END,
  available_paper_weights = CASE 
    WHEN name ILIKE '%SAV%' THEN '["100gsm", "120gsm", "150gsm"]'::jsonb
    WHEN name ILIKE '%banner%' THEN '["200gsm", "250gsm", "300gsm"]'::jsonb
    WHEN name ILIKE '%business%card%' THEN '["250gsm", "300gsm"]'::jsonb
    WHEN name ILIKE '%flyer%' THEN '["80gsm", "100gsm", "120gsm"]'::jsonb
    WHEN name ILIKE '%poster%' THEN '["150gsm", "200gsm", "250gsm"]'::jsonb
    ELSE '["80gsm", "100gsm"]'::jsonb
  END,
  available_finishes = CASE 
    WHEN name ILIKE '%SAV%' THEN '["None", "Lamination", "Cutting"]'::jsonb
    WHEN name ILIKE '%banner%' THEN '["None", "Cutting", "Binding"]'::jsonb
    WHEN name ILIKE '%business%card%' THEN '["None", "Lamination"]'::jsonb
    WHEN name ILIKE '%flyer%' THEN '["None", "Folding"]'::jsonb
    ELSE '["None", "Lamination"]'::jsonb
  END
WHERE service_type IS NULL OR service_type = 'Other';

-- Create storage bucket for job files if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('job-uploads', 'job-uploads', false, 52428800, ARRAY['image/jpeg', 'image/png', 'application/pdf', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job files
CREATE POLICY "Customers can upload job files" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'job-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Customers can view their job files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'job-uploads' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff can view all job files" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'job-uploads' AND 
  is_internal_user(auth.uid())
);

CREATE POLICY "Staff can manage job files" ON storage.objects 
FOR ALL USING (
  bucket_id = 'job-uploads' AND 
  is_internal_user(auth.uid())
);