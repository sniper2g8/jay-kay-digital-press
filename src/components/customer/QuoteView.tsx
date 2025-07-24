import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCompanySettings } from "@/hooks/useCompanySettings";

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
  customer_id: string;
  services: {
    name: string;
  };
}

interface QuoteViewProps {
  userId: string;
}

export const QuoteView = ({ userId }: QuoteViewProps) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();
  const { settings } = useCompanySettings();

  useEffect(() => {
    fetchQuotes();
  }, [userId]);

  const fetchQuotes = async () => {
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
        .from('quotes')
        .select(`
          *,
          services (name)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadQuote = async (quote: Quote) => {
    if (!settings) {
      toast({
        title: "Error",
        description: "Company settings not loaded",
        variant: "destructive",
      });
      return;
    }

    setDownloading(quote.id);
    
    try {
      // Fetch quote items and customer details
      const { data: quoteItems, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quote.id);

      if (itemsError) throw itemsError;

      // Get customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('name, customer_display_id, email, address, phone')
        .eq('id', quote.customer_id)
        .single();

      if (customerError) throw customerError;

      // Prepare data for PDF generation - simplified for now
      const quoteData = {
        ...quote,
        quote_items: quoteItems || [],
        customers: customerData
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

      // For now, let's use the existing invoice PDF generator as a fallback
      // You can create a specific quote PDF generator later
      const { generateInvoicePDF } = await import('@/utils/pdfGenerator');
      const pdfBlob = await generateInvoicePDF(quoteData as any, companySettings);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Quote downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading quote:', error);
      toast({
        title: "Error",
        description: "Failed to download quote",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'approved' })
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Quote Accepted",
        description: "Quote has been accepted. We'll start working on your project soon.",
      });

      fetchQuotes(); // Refresh the list
    } catch (error) {
      console.error('Error accepting quote:', error);
      toast({
        title: "Error",
        description: "Failed to accept quote",
        variant: "destructive",
      });
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'rejected' })
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Quote Rejected",
        description: "Quote has been rejected.",
      });

      fetchQuotes(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast({
        title: "Error",
        description: "Failed to reject quote",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'expired': return 'secondary';
      case 'converted': return 'default';
      case 'sent': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const canAcceptReject = (status: string) => {
    return status === 'sent' || status === 'reviewed';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Quotes</CardTitle>
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
          <FileText className="h-5 w-5" />
          My Quotes
        </CardTitle>
        <CardDescription>
          View and manage your project quotes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {quotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No quotes found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{quote.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {quote.quantity}
                        {quote.width && quote.length && (
                          <span> • {quote.width}" × {quote.length}"</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {quote.services.name}
                  </TableCell>
                  <TableCell>
                    {quote.quoted_price ? (
                      <div className="font-medium">Le {quote.quoted_price.toFixed(2)}</div>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(quote.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(quote.status)}
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {quote.quoted_price && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadQuote(quote)}
                          disabled={downloading === quote.id}
                        >
                          <Download className="h-4 w-4" />
                          {downloading === quote.id ? "..." : ""}
                        </Button>
                      )}
                      
                      {canAcceptReject(quote.status) && quote.quoted_price && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptQuote(quote.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectQuote(quote.id)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
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