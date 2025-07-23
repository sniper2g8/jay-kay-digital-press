-- Check current workflow_status table structure and fix it
-- First drop the existing table if it exists but has wrong structure
DROP TABLE IF EXISTS workflow_status CASCADE;

-- Create workflow_status table with correct structure
CREATE TABLE workflow_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(20) DEFAULT 'blue',
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default workflow statuses
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
    (9, 'Cancelled', 'Job was cancelled', 'red', 9);

-- Enable RLS on workflow_status
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