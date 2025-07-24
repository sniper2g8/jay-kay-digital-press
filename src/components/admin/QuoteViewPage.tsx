import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Printer, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Quote {
  id: string;
  title: string;
  description: string;
  status: string;
  quoted_price: number | null;
  quantity: number;
  width: number | null;
  length: number | null;
  delivery_method: string;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  valid_until: string | null;
  validity_days: number;
  customers: {
    name: string;
    customer_display_id: string;
    email: string;
    address: string;
    phone: string;
  };
  services: {
    name: string;
  };
}

export const QuoteViewPage = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useCompanySettings();

  useEffect(() => {
    if (quoteId) {
      fetchQuote();
    }
  }, [quoteId]);

  const fetchQuote = async () => {
    try {
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (name, customer_display_id, email, address, phone),
          services (name)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId);

      if (itemsError) throw itemsError;

      setQuote(quoteData);
      setQuoteItems(itemsData || []);
    } catch (error: any) {
      console.error('Error fetching quote:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quote details",
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
      
      const element = document.querySelector('.quote-content');
      if (!element) return;

      const options = {
        margin: 1,
        filename: `quote-${quote?.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(options).from(element).save();
      
      toast({
        title: "Success",
        description: "Quote PDF downloaded successfully",
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

  const handleAcceptQuote = async () => {
    if (!quote) return;
    
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'approved' })
        .eq('id', quote.id);

      if (error) throw error;

      toast({
        title: "Quote Accepted",
        description: "Quote has been accepted. We'll start working on your project soon.",
      });

      fetchQuote(); // Refresh the quote
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast({
        title: "Error",
        description: "Failed to accept quote",
        variant: "destructive",
      });
    }
  };

  const handleRejectQuote = async () => {
    if (!quote) return;
    
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quote.id);

      if (error) throw error;

      toast({
        title: "Quote Rejected",
        description: "Quote has been rejected.",
      });

      fetchQuote(); // Refresh the quote
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast({
        title: "Error",
        description: "Failed to reject quote",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading quote details...</div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Quote Not Found</h2>
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
      case 'approved': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const canAcceptReject = quote.status === 'sent' || quote.status === 'reviewed';
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();

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
            {canAcceptReject && quote.quoted_price && !isExpired && (
              <>
                <Button
                  onClick={handleAcceptQuote}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Quote
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRejectQuote}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Quote
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quote */}
        <Card className="quote-content print:shadow-none print:border-none">
          <CardContent className="p-0">
            {/* Professional Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">QUOTE</h1>
                  <p className="text-primary-foreground/80 mt-2 text-lg">{quote.title}</p>
                </div>
                <div className="text-right">
                  <Badge 
                    className={`${getStatusColor(quote.status)} text-sm px-3 py-1`}
                    variant="secondary"
                  >
                    {quote.status.toUpperCase()}
                  </Badge>
                  {isExpired && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="text-xs">
                        EXPIRED
                      </Badge>
                    </div>
                  )}
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
                    <p className="text-xl font-bold text-foreground">{quote.customers.name}</p>
                    <p className="text-sm text-muted-foreground font-medium">Customer ID: {quote.customers.customer_display_id}</p>
                    {quote.customers.address && <p className="text-muted-foreground">{quote.customers.address}</p>}
                    <p className="text-muted-foreground">{quote.customers.email}</p>
                    {quote.customers.phone && <p className="text-muted-foreground">{quote.customers.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quote Date</p>
                  <p className="text-lg font-bold mt-1">{new Date(quote.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valid Until</p>
                  <p className="text-lg font-bold mt-1">{quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : `${quote.validity_days} days`}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Amount</p>
                  <p className="text-lg font-bold mt-1 text-primary">
                    {quote.quoted_price ? `Le ${quote.quoted_price.toFixed(2)}` : 'Pending Review'}
                  </p>
                </div>
              </div>

              <Separator className="my-8" />

              {/* Project Details */}
              <div className="mb-10">
                <h3 className="text-lg font-bold mb-6">Project Details</h3>
                <div className="bg-muted/20 p-6 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Service</p>
                      <p className="font-medium">{quote.services.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Quantity</p>
                      <p className="font-medium">{quote.quantity}</p>
                    </div>
                    {(quote.width || quote.length) && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Dimensions</p>
                        <p className="font-medium">
                          {quote.width}" × {quote.length}"
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Delivery Method</p>
                      <p className="font-medium capitalize">{quote.delivery_method}</p>
                    </div>
                  </div>
                  
                  {quote.description && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Description</p>
                      <p className="text-muted-foreground">{quote.description}</p>
                    </div>
                  )}

                  {quote.delivery_address && (
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground mb-2">Delivery Address</p>
                      <p className="text-muted-foreground">{quote.delivery_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Items */}
              {quoteItems.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-lg font-bold mb-6">Quote Items</h3>
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
                        {quoteItems.map((item, index) => (
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
              )}

              {/* Terms & Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-muted/20 p-6 rounded-lg">
                  <h4 className="font-semibold mb-3 text-foreground">Terms & Conditions</h4>
                  <p className="text-sm text-muted-foreground">
                    This quote is valid for {quote.validity_days} days from the date of issue. 
                    Prices may change after the validity period. Work will commence upon acceptance of this quote.
                  </p>
                </div>
                
                {quote.notes && (
                  <div className="bg-muted/20 p-6 rounded-lg">
                    <h4 className="font-semibold mb-3 text-foreground">Additional Notes</h4>
                    <p className="text-sm text-muted-foreground">{quote.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center mt-12 pt-8 border-t">
                <p className="text-sm text-muted-foreground">
                  Thank you for considering our services! For any questions regarding this quote, please contact us.
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