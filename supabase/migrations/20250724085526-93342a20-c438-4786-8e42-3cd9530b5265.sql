-- Ensure the invoice number generation trigger is properly set up
DROP TRIGGER IF EXISTS set_invoice_number_trigger ON public.invoices;

CREATE TRIGGER set_invoice_number_trigger
    BEFORE INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_invoice_number();

-- Update any existing invoices that don't have invoice numbers
UPDATE public.invoices 
SET invoice_number = public.generate_invoice_number()
WHERE invoice_number IS NULL OR invoice_number = '';

-- Ensure the function works as expected by testing the pattern
DO $$
DECLARE
    test_number TEXT;
BEGIN
    test_number := public.generate_invoice_number();
    RAISE NOTICE 'Generated invoice number: %', test_number;
END
$$;