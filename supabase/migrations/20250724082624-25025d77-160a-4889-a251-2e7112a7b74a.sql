-- Fix storage policies for job file uploads
CREATE POLICY "Users can upload files to job-uploads bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'job-uploads' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view files in job-uploads bucket" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'job-uploads' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Staff can manage all files in job-uploads bucket" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'job-uploads' AND 
  is_staff_or_admin(auth.uid())
);