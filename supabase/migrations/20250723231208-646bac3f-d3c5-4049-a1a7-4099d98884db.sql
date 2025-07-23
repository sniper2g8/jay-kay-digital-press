-- Create storage policies for job files access
-- Policy for admins/staff to download files from job-files bucket
INSERT INTO storage.policies (id, bucket_id, name, command, definition, check_expression)
VALUES 
  ('admin_job_files_select', 'job-files', 'Admins can download job files', 'SELECT', 'is_staff_or_admin(auth.uid())', NULL)
ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition;

-- Policy for admins/staff to download files from job-uploads bucket
INSERT INTO storage.policies (id, bucket_id, name, command, definition, check_expression)
VALUES 
  ('admin_job_uploads_select', 'job-uploads', 'Admins can download job uploads', 'SELECT', 'is_staff_or_admin(auth.uid())', NULL)
ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition;

-- Policy for customers to download their own job files
INSERT INTO storage.policies (id, bucket_id, name, command, definition, check_expression)
VALUES 
  ('customer_job_files_select', 'job-files', 'Customers can download their job files', 'SELECT', 
   '(storage.foldername(name))[1]::uuid IN (SELECT j.id::text FROM jobs j JOIN customers c ON j.customer_uuid = c.id WHERE c.auth_user_id = auth.uid())', NULL)
ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition;

-- Policy for customers to download their own job uploads
INSERT INTO storage.policies (id, bucket_id, name, command, definition, check_expression)
VALUES 
  ('customer_job_uploads_select', 'job-uploads', 'Customers can download their job uploads', 'SELECT',
   '(storage.foldername(name))[1]::uuid IN (SELECT j.id::text FROM jobs j JOIN customers c ON j.customer_uuid = c.id WHERE c.auth_user_id = auth.uid())', NULL)
ON CONFLICT (id) DO UPDATE SET
  definition = EXCLUDED.definition;