-- Phase 2: Database Migrations for Service Management
-- Create proper services management system

-- First, let's enhance the existing services table or create a new one if needed
-- Add missing columns to services table if they don't exist
DO $$
BEGIN
    -- Check if services table has the required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'available_subtypes') THEN
        ALTER TABLE services ADD COLUMN available_subtypes JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'available_paper_types') THEN
        ALTER TABLE services ADD COLUMN available_paper_types JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'available_paper_weights') THEN
        ALTER TABLE services ADD COLUMN available_paper_weights JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'available_finishes') THEN
        ALTER TABLE services ADD COLUMN available_finishes JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Create workflow_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT 'blue',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default workflow statuses if table is empty
INSERT INTO workflow_status (id, name, description, color, order_index) 
VALUES 
    (1, 'Pending', 'Job received, awaiting processing', 'yellow', 1),
    (2, 'Received', 'Job confirmed and files received', 'blue', 2),
    (3, 'Processing', 'Preparing files for printing', 'blue', 3),
    (4, 'Printing', 'Currently being printed', 'purple', 4),
    (5, 'Finishing', 'Adding finishing touches', 'orange', 5),
    (6, 'Waiting for Collection', 'Ready for customer pickup', 'green', 6),
    (7, 'Out for Delivery', 'Being delivered to customer', 'blue', 7),
    (8, 'Completed', 'Job completed successfully', 'green', 8),
    (9, 'Cancelled', 'Job was cancelled', 'red', 9)
ON CONFLICT (id) DO NOTHING;

-- Initialize default services if services table is empty
INSERT INTO services (name, description, service_type, base_price, requires_dimensions, available_subtypes, available_paper_types, available_paper_weights, available_finishes, is_active)
SELECT 
    'SAV (Save the Date)', 
    'Custom save the date cards for weddings and events', 
    'SAV', 
    25.00, 
    false, 
    '["Wedding SAV", "Birthday SAV", "Corporate SAV", "Event SAV", "Custom SAV"]'::jsonb,
    '["Cardstock", "Photo Paper"]'::jsonb,
    '["150gsm", "200gsm", "250gsm"]'::jsonb,
    '["lamination", "uv_coating"]'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'SAV (Save the Date)');

INSERT INTO services (name, description, service_type, base_price, requires_dimensions, available_subtypes, available_paper_types, available_paper_weights, available_finishes, is_active)
SELECT 
    'Banner Printing', 
    'High-quality banners for indoor and outdoor use', 
    'Banner', 
    35.00, 
    true, 
    '["Outdoor Banner", "Indoor Banner", "Vinyl Banner", "Mesh Banner", "Fabric Banner"]'::jsonb,
    '["Vinyl", "Fabric", "Canvas"]'::jsonb,
    '["200gsm", "250gsm", "300gsm"]'::jsonb,
    '["cutting", "embossing"]'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Banner Printing');

INSERT INTO services (name, description, service_type, base_price, requires_dimensions, available_subtypes, available_paper_types, available_paper_weights, available_finishes, is_active)
SELECT 
    'Business Cards', 
    'Professional business cards with premium finishes', 
    'Business Card', 
    15.00, 
    false, 
    '["Standard", "Premium", "Luxury"]'::jsonb,
    '["Cardstock"]'::jsonb,
    '["200gsm", "250gsm", "300gsm"]'::jsonb,
    '["lamination", "uv_coating", "embossing"]'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Business Cards');

INSERT INTO services (name, description, service_type, base_price, requires_dimensions, available_subtypes, available_paper_types, available_paper_weights, available_finishes, is_active)
SELECT 
    'Flyers & Leaflets', 
    'Eye-catching flyers for marketing and promotions', 
    'Flyer', 
    12.00, 
    false, 
    '["A4 Flyer", "A5 Flyer", "Custom Size"]'::jsonb,
    '["A4 Paper", "A5 Paper", "Cardstock"]'::jsonb,
    '["80gsm", "100gsm", "120gsm", "150gsm"]'::jsonb,
    '["folding", "cutting", "lamination"]'::jsonb,
    true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Flyers & Leaflets');

-- Enable RLS on new tables
ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow_status
CREATE POLICY "Anyone can view workflow status" 
ON workflow_status FOR SELECT USING (true);

CREATE POLICY "Staff can manage workflow status" 
ON workflow_status FOR ALL 
USING (is_staff_or_admin(auth.uid()));

-- Add updated_at trigger to workflow_status
CREATE TRIGGER update_workflow_status_updated_at
    BEFORE UPDATE ON workflow_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();