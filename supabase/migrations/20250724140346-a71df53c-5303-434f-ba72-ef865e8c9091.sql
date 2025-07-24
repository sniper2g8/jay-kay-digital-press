-- Create/update service options and improve job workflow
-- Add proper service categories and options

-- Insert default workflow statuses if they don't exist
INSERT INTO public.workflow_status (id, name, description, position) VALUES 
(1, 'Pending', 'Job is pending review', 1),
(2, 'Received', 'Job has been received and logged', 2),
(3, 'Processing', 'Job is being processed', 3),
(4, 'Printing', 'Job is currently being printed', 4),
(5, 'Finishing', 'Job is in finishing stage', 5),
(6, 'Waiting for Collection', 'Job is ready for customer pickup', 6),
(7, 'Out for Delivery', 'Job is out for delivery', 7),
(8, 'Completed', 'Job has been completed and delivered', 8),
(9, 'Cancelled', 'Job has been cancelled', 9)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  position = EXCLUDED.position;

-- Update services table with better structure for Jay Kay Digital Press
UPDATE public.services SET 
  available_subtypes = jsonb_build_array(
    jsonb_build_object('name', 'SAV - Reflective', 'description', 'Self-Adhesive Vinyl - Reflective'),
    jsonb_build_object('name', 'SAV - Standard', 'description', 'Self-Adhesive Vinyl - Standard'),
    jsonb_build_object('name', 'PVC Banner', 'description', 'PVC Banner Material'),
    jsonb_build_object('name', 'Mesh Banner', 'description', 'Mesh Banner Material')
  ),
  available_paper_types = jsonb_build_array('PVC', 'Vinyl', 'Mesh', 'Canvas'),
  available_paper_weights = jsonb_build_array('Standard', 'Heavy Duty', 'Premium'),
  requires_dimensions = true
WHERE service_type IN ('SAV', 'Banner') OR name ILIKE '%vinyl%' OR name ILIKE '%banner%';

-- Update printing services with proper paper options
UPDATE public.services SET 
  available_paper_types = jsonb_build_array(
    jsonb_build_object('name', 'A4 Paper', 'weight_options', jsonb_build_array('80gsm', '90gsm', '100gsm')),
    jsonb_build_object('name', 'A3 Paper', 'weight_options', jsonb_build_array('80gsm', '90gsm', '100gsm')),
    jsonb_build_object('name', 'Cardstock', 'weight_options', jsonb_build_array('200gsm', '250gsm', '300gsm')),
    jsonb_build_object('name', 'Photo Paper', 'weight_options', jsonb_build_array('Premium', 'Standard'))
  ),
  available_subtypes = jsonb_build_array(
    jsonb_build_object('name', 'Single Sided', 'description', 'Printing on one side only'),
    jsonb_build_object('name', 'Double Sided', 'description', 'Printing on both sides'),
    jsonb_build_object('name', 'Color', 'description', 'Full color printing'),
    jsonb_build_object('name', 'Black & White', 'description', 'Black and white printing only')
  ),
  requires_dimensions = false
WHERE service_type IN ('Document Printing', 'Photo Printing', 'Business Cards') 
   OR name ILIKE '%print%' OR name ILIKE '%document%' OR name ILIKE '%photo%';

-- Insert default services if they don't exist
INSERT INTO public.services (name, description, service_type, base_price, requires_dimensions, available_subtypes, available_paper_types, is_active) VALUES 
('SAV Printing', 'Self-Adhesive Vinyl printing for signs and labels', 'SAV', 50.00, true, 
  jsonb_build_array(
    jsonb_build_object('name', 'Reflective SAV', 'description', 'High visibility reflective vinyl'),
    jsonb_build_object('name', 'Standard SAV', 'description', 'Standard self-adhesive vinyl')
  ),
  jsonb_build_array('Reflective Vinyl', 'Standard Vinyl'),
  true),
('Banner Printing', 'Large format banner printing for outdoor and indoor use', 'Banner', 75.00, true,
  jsonb_build_array(
    jsonb_build_object('name', 'PVC Banner', 'description', 'Durable PVC banner material'),
    jsonb_build_object('name', 'Mesh Banner', 'description', 'Wind-resistant mesh banner')
  ),
  jsonb_build_array('PVC', 'Mesh'),
  true),
('Document Printing', 'Standard document and paper printing services', 'Document Printing', 2.00, false,
  jsonb_build_array(
    jsonb_build_object('name', 'Single Sided', 'description', 'Print on one side'),
    jsonb_build_object('name', 'Double Sided', 'description', 'Print on both sides')
  ),
  jsonb_build_array('A4 Paper', 'A3 Paper', 'Letter Size'),
  true),
('Business Cards', 'Professional business card printing', 'Business Cards', 25.00, false,
  jsonb_build_array(
    jsonb_build_object('name', 'Standard', 'description', 'Standard business cards'),
    jsonb_build_object('name', 'Premium', 'description', 'Premium quality with special finish')
  ),
  jsonb_build_array('Cardstock 250gsm', 'Cardstock 300gsm'),
  true)
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description,
  service_type = EXCLUDED.service_type,
  base_price = EXCLUDED.base_price,
  requires_dimensions = EXCLUDED.requires_dimensions,
  available_subtypes = EXCLUDED.available_subtypes,
  available_paper_types = EXCLUDED.available_paper_types,
  is_active = EXCLUDED.is_active;