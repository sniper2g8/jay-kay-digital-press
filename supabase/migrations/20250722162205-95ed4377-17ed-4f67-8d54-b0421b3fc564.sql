-- Create quotes and invoices system with proper workflow

-- First, create quote_status enum
CREATE TYPE quote_status AS ENUM ('requested', 'reviewed', 'approved', 'rejected', 'converted');

-- Create invoice_status enum  
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Create payment_method enum
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'mobile_money', 'credit_card');

-- Create quotes table
CREATE TABLE public.quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    service_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    width NUMERIC,
    length NUMERIC,
    delivery_method VARCHAR NOT NULL,
    delivery_address TEXT,
    status quote_status DEFAULT 'requested',
    quoted_price NUMERIC,
    validity_days INTEGER DEFAULT 30,
    valid_until DATE,
    notes TEXT,
    created_by UUID,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    converted_to_job_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create quote_items table for detailed breakdown
CREATE TABLE public.quote_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    finishing_option_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR NOT NULL,
    customer_id UUID NOT NULL,
    job_id INTEGER,
    quote_id UUID,
    status invoice_status DEFAULT 'draft',
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    tax_amount NUMERIC DEFAULT 0,
    discount_amount NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    paid_amount NUMERIC DEFAULT 0,
    balance_due NUMERIC,
    issued_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_number VARCHAR,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    next_num INTEGER;
    year_suffix TEXT;
BEGIN
    -- Use 2-digit year (e.g., 25 for 2025)
    year_suffix := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);
    
    -- Get next number for this year in format JK-YY-XXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'JK-' || year_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.invoices
    WHERE invoice_number LIKE 'JK-' || year_suffix || '-%';
    
    RETURN 'JK-' || year_suffix || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := public.generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invoice_number();

-- Add updated_at triggers
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotes
CREATE POLICY "Customers can view their own quotes" ON public.quotes
    FOR SELECT USING (customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Customers can create quotes" ON public.quotes
    FOR INSERT WITH CHECK (customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "Customers can update their own pending quotes" ON public.quotes
    FOR UPDATE USING (
        customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()) 
        AND status = 'requested'
    );

CREATE POLICY "Internal users can manage quotes" ON public.quotes
    FOR ALL USING (is_internal_user(auth.uid()));

-- RLS Policies for quote_items
CREATE POLICY "Customers can view their quote items" ON public.quote_items
    FOR SELECT USING (quote_id IN (
        SELECT id FROM quotes WHERE customer_id IN (
            SELECT id FROM customers WHERE auth_user_id = auth.uid()
        )
    ));

CREATE POLICY "Customers can manage their quote items" ON public.quote_items
    FOR ALL USING (quote_id IN (
        SELECT id FROM quotes 
        WHERE customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
        AND status = 'requested'
    ));

CREATE POLICY "Internal users can manage quote items" ON public.quote_items
    FOR ALL USING (is_internal_user(auth.uid()));

-- RLS Policies for invoices
CREATE POLICY "Customers can view their own invoices" ON public.invoices
    FOR SELECT USING (customer_id IN (
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
    ));

CREATE POLICY "System users can create and view invoices" ON public.invoices
    FOR SELECT USING (is_internal_user(auth.uid()));

CREATE POLICY "System users can create invoices" ON public.invoices
    FOR INSERT WITH CHECK (is_internal_user(auth.uid()));

CREATE POLICY "System users can update invoices" ON public.invoices
    FOR UPDATE USING (is_internal_user(auth.uid()));

CREATE POLICY "Admins can manage invoices" ON public.invoices
    FOR ALL USING (is_admin_user(auth.uid()));

-- RLS Policies for invoice_items
CREATE POLICY "Customers can view their invoice items" ON public.invoice_items
    FOR SELECT USING (invoice_id IN (
        SELECT id FROM invoices WHERE customer_id IN (
            SELECT id FROM customers WHERE auth_user_id = auth.uid()
        )
    ));

CREATE POLICY "Internal users can manage invoice items" ON public.invoice_items
    FOR ALL USING (is_internal_user(auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Customers can view their payments" ON public.payments
    FOR SELECT USING (invoice_id IN (
        SELECT id FROM invoices WHERE customer_id IN (
            SELECT id FROM customers WHERE auth_user_id = auth.uid()
        )
    ));

CREATE POLICY "Internal users can manage payments" ON public.payments
    FOR ALL USING (is_internal_user(auth.uid()));