-- Create storage policies for job files access using the correct format

-- Allow admins/staff to select files from job-files bucket
CREATE POLICY "Admins can download job files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'job-files' AND is_staff_or_admin(auth.uid()));

-- Allow admins/staff to select files from job-uploads bucket  
CREATE POLICY "Admins can download job uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-uploads' AND is_staff_or_admin(auth.uid()));

-- Allow customers to download their own job files
-- Files are organized by job ID, so check if job belongs to customer
CREATE POLICY "Customers can download their job files"
ON storage.objects
FOR SELECT  
USING (
  bucket_id = 'job-files' AND
  (storage.foldername(name))[1] IN (
    SELECT j.id::text 
    FROM jobs j 
    JOIN customers c ON j.customer_uuid = c.id 
    WHERE c.auth_user_id = auth.uid()
  )
);

-- Allow customers to download their own job uploads
CREATE POLICY "Customers can download their job uploads"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'job-uploads' AND
  (storage.foldername(name))[1] IN (
    SELECT j.id::text 
    FROM jobs j 
    JOIN customers c ON j.customer_uuid = c.id 
    WHERE c.auth_user_id = auth.uid()
  )
);