import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, CheckCircle, XCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type QuoteStatus = 'requested' | 'reviewed' | 'approved' | 'rejected' | 'expired' | 'sent' | 'converted';

interface Quote {
  id: string;
  title: string;
  status: QuoteStatus;
  quoted_price: number | null;
  quantity: number;
  created_at: string;
  customers: {
    name: string;
    customer_display_id: string;
  };
  services: {
    name: string;
    service_type: string;
  };
}

export const QuoteManagement = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customers (name, customer_display_id),
          services (name, service_type)
        `)
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

  const updateQuoteStatus = async (quoteId: string, newStatus: QuoteStatus, price?: number) => {
    try {
      const updateData: any = { status: newStatus, reviewed_at: new Date().toISOString() };
      if (price !== undefined) updateData.quoted_price = price;

      const { error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Quote ${newStatus} successfully`,
      });

      fetchQuotes();
    } catch (error) {
      console.error('Error updating quote:', error);
      toast({
        title: "Error",
        description: "Failed to update quote",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'requested': return 'default';
      case 'reviewed': return 'secondary';
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'sent': return 'secondary';
      case 'converted': return 'default';
      case 'expired': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quote.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Quote Management</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
        <CardTitle>Quote Management</CardTitle>
        <CardDescription>Review and approve customer quotes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>
                  <div className="font-medium">{quote.title}</div>
                  <div className="text-sm text-muted-foreground">Qty: {quote.quantity}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{quote.customers?.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {quote.customers?.customer_display_id}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{quote.services?.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(quote.status)}>
                    {quote.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {quote.status === 'requested' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => updateQuoteStatus(quote.id, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredQuotes.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            No quotes found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};