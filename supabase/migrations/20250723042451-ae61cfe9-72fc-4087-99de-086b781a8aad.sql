-- Fix workflow_status table creation
-- Create workflow_status table if it doesn't exist (without description column first)
CREATE TABLE IF NOT EXISTS workflow_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT 'blue',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workflow_status' AND column_name = 'description') THEN
        ALTER TABLE workflow_status ADD COLUMN description TEXT;
    END IF;
END $$;

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

-- Enable RLS on workflow_status if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'workflow_status' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE workflow_status ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies for workflow_status (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view workflow status" ON workflow_status;
DROP POLICY IF EXISTS "Staff can manage workflow status" ON workflow_status;

CREATE POLICY "Anyone can view workflow status" 
ON workflow_status FOR SELECT USING (true);

CREATE POLICY "Staff can manage workflow status" 
ON workflow_status FOR ALL 
USING (is_staff_or_admin(auth.uid()));

-- Add updated_at trigger to workflow_status
DROP TRIGGER IF EXISTS update_workflow_status_updated_at ON workflow_status;
CREATE TRIGGER update_workflow_status_updated_at
    BEFORE UPDATE ON workflow_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();