-- Update the job deletion policy to allow system users (staff/admin) to delete jobs
DROP POLICY IF EXISTS "Only admins can delete jobs" ON jobs;

CREATE POLICY "Staff and admins can delete jobs" 
ON jobs 
FOR DELETE 
USING (is_staff_or_admin(auth.uid()));