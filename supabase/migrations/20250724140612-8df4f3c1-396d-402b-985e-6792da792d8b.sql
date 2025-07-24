-- Fix service options and workflow status structure
-- First check what columns exist in workflow_status
-- Then update services properly

-- Insert default workflow statuses without position column
INSERT INTO public.workflow_status (id, name, description) VALUES 
(1, 'Pending', 'Job is pending review'),
(2, 'Received', 'Job has been received and logged'),
(3, 'Processing', 'Job is being processed'),
(4, 'Printing', 'Job is currently being printed'),
(5, 'Finishing', 'Job is in finishing stage'),
(6, 'Waiting for Collection', 'Job is ready for customer pickup'),
(7, 'Out for Delivery', 'Job is out for delivery'),
(8, 'Completed', 'Job has been completed and delivered'),
(9, 'Cancelled', 'Job has been cancelled')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Update services table with proper Jay Kay Digital Press service types
-- First, let's update existing services with better structure
UPDATE public.services SET 
  available_subtypes = jsonb_build_array(
    jsonb_build_object('name', 'Reflective SAV', 'description', 'High visibility reflective vinyl for road signs'),
    jsonb_build_object('name', 'Standard SAV', 'description', 'Standard self-adhesive vinyl for general use'),
    jsonb_build_object('name', 'PVC Banner', 'description', 'Durable PVC banner material for outdoor use'),
    jsonb_build_object('name', 'Mesh Banner', 'description', 'Wind-resistant mesh banner for large displays')
  ),
  available_paper_types = jsonb_build_array('Reflective Vinyl', 'Standard Vinyl', 'PVC', 'Mesh'),
  available_paper_weights = jsonb_build_array('Standard Grade', 'Heavy Duty', 'Premium Grade'),
  requires_dimensions = true
WHERE name ILIKE '%sav%' OR name ILIKE '%vinyl%' OR name ILIKE '%banner%' OR service_type IN ('SAV', 'Banner');

-- Update document printing services
UPDATE public.services SET 
  available_paper_types = jsonb_build_array('A4 Paper', 'A3 Paper', 'Letter Size', 'Legal Size', 'Cardstock'),
  available_subtypes = jsonb_build_array(
    jsonb_build_object('name', 'Single Sided', 'description', 'Print on one side only'),
    jsonb_build_object('name', 'Double Sided', 'description', 'Print on both sides'),
    jsonb_build_object('name', 'Color Printing', 'description', 'Full color printing'),
    jsonb_build_object('name', 'Black & White', 'description', 'Monochrome printing')
  ),
  available_paper_weights = jsonb_build_array('80gsm', '90gsm', '100gsm', '120gsm'),
  requires_dimensions = false
WHERE name ILIKE '%document%' OR name ILIKE '%print%' OR service_type ILIKE '%print%';