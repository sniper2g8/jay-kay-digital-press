-- Create storage policies to allow admins to access job files for printing

-- Drop existing policies if they exist for job-files bucket
DROP POLICY IF EXISTS "Admin can access job files" ON storage.objects;
DROP POLICY IF EXISTS "Admin can download job files" ON storage.objects;

-- Create policy for admins to view and download job files
CREATE POLICY "Admin can access job files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id IN ('job-files', 'job-uploads') 
  AND (
    public.is_admin_user(auth.uid()) 
    OR public.is_staff_or_admin(auth.uid())
  )
);

-- Create policy for admins to manage job files 
CREATE POLICY "Admin can manage job files" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id IN ('job-files', 'job-uploads') 
  AND (
    public.is_admin_user(auth.uid()) 
    OR public.is_staff_or_admin(auth.uid())
  )
) 
WITH CHECK (
  bucket_id IN ('job-files', 'job-uploads') 
  AND (
    public.is_admin_user(auth.uid()) 
    OR public.is_staff_or_admin(auth.uid())
  )
);