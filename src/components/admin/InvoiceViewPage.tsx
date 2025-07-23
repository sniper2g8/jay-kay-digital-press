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
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      
      const element = document.querySelector('.invoice-content');
      if (!element) return;

      const options = {
        margin: 1,
        filename: `invoice-${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(options).from(element).save();
      
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
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
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
          <CardContent className="p-0">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">INVOICE</h1>
                  <p className="text-primary-foreground/80 mt-2 text-lg">#{invoice.invoice_number}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    className={`${getStatusColor(invoice.status)} text-sm px-3 py-1`}
                    variant="secondary"
                  >
                    {invoice.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Company & Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">From</h3>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-foreground">{settings?.company_name || 'Loading...'}</p>
                    <p className="text-muted-foreground">{settings?.address || ''}</p>
                    <p className="text-muted-foreground">{settings?.email || ''}</p>
                    <p className="text-muted-foreground">{settings?.phone || ''}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">To</h3>
                  <div className="space-y-1">
                    <p className="text-xl font-bold text-foreground">{invoice.customers.name}</p>
                    <p className="text-sm text-muted-foreground font-medium">Customer ID: {invoice.customers.customer_display_id}</p>
                    {invoice.customers.address && <p className="text-muted-foreground">{invoice.customers.address}</p>}
                    <p className="text-muted-foreground">{invoice.customers.email}</p>
                    {invoice.customers.phone && <p className="text-muted-foreground">{invoice.customers.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Issue Date</p>
                  <p className="text-lg font-bold mt-1">{new Date(invoice.issued_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Due Date</p>
                  <p className="text-lg font-bold mt-1">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'Upon Receipt'}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Amount</p>
                  <p className="text-lg font-bold mt-1 text-primary">Le {invoice.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Invoice Items */}
              <div className="mb-10">
                <h3 className="text-lg font-bold mb-6">Items & Services</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-muted">
                        <th className="text-left py-4 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-sm">Description</th>
                        <th className="text-center py-4 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-sm">Qty</th>
                        <th className="text-right py-4 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-sm">Unit Price</th>
                        <th className="text-right py-4 px-2 font-semibold text-muted-foreground uppercase tracking-wide text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item, index) => (
                        <tr key={item.id} className={`border-b ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                          <td className="py-4 px-2 font-medium">{item.description}</td>
                          <td className="text-center py-4 px-2">{item.quantity}</td>
                          <td className="text-right py-4 px-2">Le {item.unit_price.toFixed(2)}</td>
                          <td className="text-right py-4 px-2 font-semibold">Le {item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end mb-10">
                <div className="w-full max-w-sm">
                  <div className="bg-muted/30 p-6 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">Le {invoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                      <span className="font-medium">Le {invoice.tax_amount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bold">Total Amount:</span>
                      <span className="font-bold text-primary">Le {invoice.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Terms & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-muted/20 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3 text-foreground">Payment Terms</h4>
                  <p className="text-sm text-muted-foreground">
                    Payment is due within 30 days of invoice date. Late payments may incur additional charges.
                  </p>
                </div>
                
                {invoice.notes && (
                  <div className="bg-muted/20 p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-foreground">Additional Notes</h4>
                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center mt-12 pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                  Thank you for your business! For any questions regarding this invoice, please contact us.
                </p>
                <div className="flex justify-center items-center gap-4 mt-4 text-xs text-muted-foreground">
                  <span>{settings?.email || ''}</span>
                  <span>•</span>
                  <span>{settings?.phone || ''}</span>
                  <span>•</span>
                  <span>{settings?.website || ''}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};