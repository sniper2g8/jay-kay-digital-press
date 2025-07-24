import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { QRCodeSVG } from 'qrcode.react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  issued_date: string;
  due_date: string;
  notes: string;
  job_id: number | null;
  customers: {
    name: string;
    customer_display_id: string;
    email: string;
    address: string;
    phone: string;
  };
}

export const InvoiceViewPage = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useCompanySettings();

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (name, customer_display_id, email, address, phone)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (itemsError) throw itemsError;

      setInvoice(invoiceData);
      setInvoiceItems(itemsData || []);
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!invoice) return;
    
    try {
      const { generateInvoicePDF } = await import('@/utils/pdfGenerator');
      
      // Transform invoice data to match PDF generator interface
      const invoiceData = {
        invoice_number: invoice.invoice_number,
        issued_date: invoice.issued_date,
        due_date: invoice.due_date,
        status: invoice.status,
        total_amount: invoice.total_amount,
        paid_amount: 0, // We don't have payment data here
        balance_due: invoice.total_amount,
        tax_amount: invoice.tax_amount,
        discount_amount: 0, // We don't have discount data
        subtotal: invoice.subtotal,
        notes: invoice.notes,
        customers: invoice.customers,
        invoice_items: invoiceItems
      };

      const pdfBlob = await generateInvoicePDF(invoiceData, {
        company_name: settings?.company_name || 'Print Shop',
        address: settings?.address || null,
        phone: settings?.phone || null,
        email: settings?.email || null,
        logo_url: settings?.logo_url || null,
        primary_color: settings?.primary_color || '#000000',
        currency_symbol: settings?.currency_symbol || 'Le'
      });

      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoice_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/invoices')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Invoice */}
        <Card className="invoice-content print:shadow-none print:border-none">
          <CardContent className="p-8">
            {/* Header with Company Info and Invoice Title */}
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-4">
                {settings?.logo_url && (
                  <img 
                    src={settings.logo_url} 
                    alt={settings.company_name}
                    className="h-16 w-auto"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{settings?.company_name || 'Loading...'}</h1>
                  <div className="text-sm text-muted-foreground space-y-1 mt-2">
                    {settings?.address && <p>{settings.address}</p>}
                    <p>Phone: {settings?.phone || ''}</p>
                    <p>Email: {settings?.email || ''}</p>
                    {settings?.website && <p>Website: {settings.website}</p>}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <h2 className="text-3xl font-bold text-foreground mb-2">INVOICE</h2>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Invoice #:</span> {invoice.invoice_number}</p>
                  <p><span className="font-medium">Date:</span> {new Date(invoice.issued_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Bill To and Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Bill To:</h3>
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{invoice.customers.name}</p>
                  <p className="text-sm text-muted-foreground">{invoice.customers.customer_display_id}</p>
                  <p className="text-sm text-muted-foreground">{invoice.customers.email}</p>
                  {invoice.customers.phone && <p className="text-sm text-muted-foreground">{invoice.customers.phone}</p>}
                  {invoice.customers.address && <p className="text-sm text-muted-foreground">{invoice.customers.address}</p>}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Invoice Details:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="ml-2">
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                  {invoice.job_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Related Job:</span>
                      <span className="font-medium">JOB-{invoice.job_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">Print Services</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Items:</h3>
              <div className="border border-muted rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                      <th className="text-center py-3 px-4 font-medium text-foreground">Quantity</th>
                      <th className="text-right py-3 px-4 font-medium text-foreground">Unit Price</th>
                      <th className="text-right py-3 px-4 font-medium text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.id} className="border-t border-muted">
                        <td className="py-3 px-4">{item.description}</td>
                        <td className="text-center py-3 px-4">{item.quantity}</td>
                        <td className="text-right py-3 px-4">Le {item.unit_price.toFixed(2)}</td>
                        <td className="text-right py-3 px-4 font-medium">Le {item.total_price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                <div className="space-y-2 text-right">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">Le {invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.tax_amount > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                      <span className="font-medium">Le {invoice.tax_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-muted pt-2">
                    <div className="flex justify-between py-2">
                      <span className="text-lg font-bold text-foreground">Total:</span>
                      <span className="text-lg font-bold text-foreground">Le {invoice.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Terms and QR Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div>
                <h4 className="font-bold text-foreground mb-2">Payment Terms:</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Payment is due within 30 days of invoice date.
                </p>
                <p className="text-sm text-muted-foreground">
                  Thank you for your business! For questions about this invoice, please contact us at {settings?.email || ''}.
                </p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="mb-2">
                  <QRCodeSVG
                    value={`${window.location.origin}/admin/invoices/${invoice.id}`}
                    size={80}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">Track Invoice</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground mt-8 pt-4 border-t border-muted">
              <p>Generated on {new Date().toLocaleDateString()} by {settings?.company_name || ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};