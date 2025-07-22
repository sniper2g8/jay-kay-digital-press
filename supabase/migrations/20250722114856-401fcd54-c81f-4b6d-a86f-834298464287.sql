-- Create enum types for services and job statuses
CREATE TYPE service_type AS ENUM ('SAV', 'Banner', 'Business Cards', 'Flyers', 'Posters', 'Brochures', 'Stickers', 'Other');
CREATE TYPE sav_subtype AS ENUM ('Reflective', 'Transparent', 'One Way Vision', 'Normal SAV');
CREATE TYPE banner_subtype AS ENUM ('PVC', 'Canvas', 'Normal Banner');
CREATE TYPE job_status AS ENUM ('Pending', 'Received', 'Processing', 'Printing', 'Finishing', 'Waiting for Collection', 'Out for Delivery', 'Completed');
CREATE TYPE paper_weight AS ENUM ('80gsm', '100gsm', '120gsm', '150gsm', '200gsm', '250gsm', '300gsm');
CREATE TYPE finishing_type AS ENUM ('None', 'Lamination', 'Binding', 'Cutting', 'Folding', 'Perforation');

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  service_type service_type NOT NULL,
  base_price DECIMAL(10,2) DEFAULT 0.00,
  requires_dimensions BOOLEAN DEFAULT false,
  available_subtypes JSONB, -- For SAV and Banner subtypes
  available_paper_types JSONB,
  available_paper_weights paper_weight[],
  available_finishes finishing_type[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number VARCHAR UNIQUE NOT NULL DEFAULT 'JK-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEXTVAL('job_number_seq')::TEXT, 4, '0'),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  service_id UUID NOT NULL REFERENCES public.services(id),
  
  -- Job details
  title VARCHAR NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Service-specific options
  service_subtype VARCHAR, -- For SAV/Banner subtypes
  paper_type VARCHAR,
  paper_weight paper_weight,
  finishing_options finishing_type[],
  
  -- Dimensions (required for SAV and Banner)
  width_mm DECIMAL(8,2),
  height_mm DECIMAL(8,2),
  
  -- Pricing
  quoted_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  
  -- Status and tracking
  status job_status DEFAULT 'Pending',
  tracking_code VARCHAR UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  
  -- Files
  files JSONB DEFAULT '[]', -- Array of file URLs from Supabase storage
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Staff assignment
  assigned_to UUID REFERENCES public.internal_users(id),
  created_by UUID REFERENCES public.internal_users(id)
);

-- Create job_status_history table for tracking status changes
CREATE TABLE public.job_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  old_status job_status,
  new_status job_status NOT NULL,
  changed_by UUID REFERENCES public.internal_users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Create sequence for job numbers
CREATE SEQUENCE job_number_seq START 1;

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Only admins can manage services" ON public.services FOR ALL USING (is_admin_user(auth.uid()));

-- RLS Policies for jobs
CREATE POLICY "Customers can view their own jobs" ON public.jobs FOR SELECT USING (
  customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Customers can create jobs" ON public.jobs FOR INSERT WITH CHECK (
  customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Staff can view all jobs" ON public.jobs FOR SELECT USING (is_internal_user(auth.uid()));
CREATE POLICY "Staff can manage jobs" ON public.jobs FOR ALL USING (is_internal_user(auth.uid()));

-- RLS Policies for job status history
CREATE POLICY "Customers can view their job history" ON public.job_status_history FOR SELECT USING (
  job_id IN (
    SELECT j.id FROM public.jobs j 
    JOIN public.customers c ON j.customer_id = c.id 
    WHERE c.auth_user_id = auth.uid()
  )
);
CREATE POLICY "Staff can manage job history" ON public.job_status_history FOR ALL USING (is_internal_user(auth.uid()));

-- Insert default services
INSERT INTO public.services (name, description, service_type, base_price, requires_dimensions, available_subtypes, available_paper_types, available_paper_weights, available_finishes) VALUES
('SAV Printing', 'Self-Adhesive Vinyl printing for various applications', 'SAV', 50.00, true, 
 '["Reflective", "Transparent", "One Way Vision", "Normal SAV"]', 
 '["Premium Vinyl", "Standard Vinyl", "Outdoor Vinyl"]',
 ARRAY['100gsm', '120gsm', '150gsm'], 
 ARRAY['None', 'Lamination', 'Cutting']),

('Banner Printing', 'Large format banner printing for outdoor and indoor use', 'Banner', 75.00, true,
 '["PVC", "Canvas", "Normal Banner"]',
 '["PVC Material", "Canvas Material", "Fabric"]',
 ARRAY['200gsm', '250gsm', '300gsm'],
 ARRAY['None', 'Cutting', 'Binding']),

('Business Cards', 'Professional business card printing', 'Business Cards', 15.00, false, null,
 '["Glossy", "Matte", "Textured"]',
 ARRAY['250gsm', '300gsm'],
 ARRAY['None', 'Lamination']),

('Flyers', 'Single and double-sided flyer printing', 'Flyers', 10.00, false, null,
 '["Glossy", "Matte", "Recycled"]',
 ARRAY['80gsm', '100gsm', '120gsm'],
 ARRAY['None', 'Folding']),

('Posters', 'Large format poster printing', 'Posters', 25.00, false, null,
 '["Photo Paper", "Matte Paper", "Canvas"]',
 ARRAY['150gsm', '200gsm', '250gsm'],
 ARRAY['None', 'Lamination']);

-- Create trigger to update job updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_timestamp_trigger
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_timestamp();

-- Create trigger to log status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.job_status_history (job_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_job_status_change_trigger
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION log_job_status_change();