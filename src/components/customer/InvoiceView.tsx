import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Download, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  balance_due: number | null;
  issued_date: string;
  due_date: string | null;
  created_at: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  notes: string | null;
  customers: {
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    customer_display_id: string;
  };
}

interface InvoiceViewProps {
  userId: string;
}

export const InvoiceView = ({ userId }: InvoiceViewProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();
  const { settings } = useCompanySettings();

  useEffect(() => {
    fetchInvoices();
  }, [userId]);

  const fetchInvoices = async () => {
    try {
      // First get the customer ID
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (!customer) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            address,
            customer_display_id
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (!settings) {
      toast({
        title: "Error",
        description: "Company settings not loaded",
        variant: "destructive",
      });
      return;
    }

    setDownloading(invoice.id);
    
    try {
      // Fetch invoice items
      const { data: invoiceItems, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (itemsError) throw itemsError;

      // Prepare data for PDF generation
      const invoiceData = {
        ...invoice,
        invoice_items: invoiceItems || []
      };

      const companySettings = {
        company_name: settings.company_name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        logo_url: settings.logo_url,
        primary_color: settings.primary_color || '#000000',
        currency_symbol: settings.currency_symbol || 'Le'
      };

      // Dynamically import PDF generator to reduce bundle size
      const { generateInvoicePDF } = await import('@/utils/pdfGenerator');
      const pdfBlob = await generateInvoicePDF(invoiceData, companySettings);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      case 'sent': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          My Invoices
        </CardTitle>
        <CardDescription>
          View and manage your invoices and payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No invoices found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">Le {invoice.total_amount}</div>
                    {invoice.balance_due && invoice.balance_due > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Balance: Le {invoice.balance_due}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.issued_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice)}
                        disabled={downloading === invoice.id}
                      >
                        <Download className="h-4 w-4" />
                        {downloading === invoice.id ? "..." : ""}
                      </Button>
                      {invoice.status !== 'paid' && invoice.balance_due && invoice.balance_due > 0 && (
                        <Button size="sm">
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};