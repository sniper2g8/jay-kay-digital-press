import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Search, Plus, Eye, Download, Send, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InvoiceCreationDialog } from "./InvoiceCreationDialog";
import { InvoiceEditDialog } from "./InvoiceEditDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

interface Invoice {
  id: string;
  invoice_number: string;
  status: InvoiceStatus;
  total_amount: number;
  paid_amount: number;
  balance_due: number | null;
  issued_date: string;
  due_date: string | null;
  created_at: string;
  customer_id: string;
  job_id: number | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  notes: string | null;
  customers: {
    name: string;
    customer_display_id: string;
    email: string;
  };
}

export const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (name, customer_display_id, email)
        `)
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

  const updateInvoiceStatus = async (invoiceId: string, newStatus: InvoiceStatus) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Invoice ${newStatus} successfully`,
      });

      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    // Open invoice in a new tab/window for viewing
    window.open(`/invoice/${invoiceId}`, '_blank');
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!deletingInvoice) return;
    
    try {
      // Delete invoice items first
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', deletingInvoice.id);

      // Delete payments
      await supabase
        .from('payments')
        .delete()
        .eq('invoice_id', deletingInvoice.id);

      // Delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', deletingInvoice.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });

      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    } finally {
      setDeletingInvoice(null);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      // Fetch full invoice data including items and customer details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            email,
            phone,
            address,
            customer_display_id
          ),
          invoice_items (
            description,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoiceData) {
        throw new Error('Failed to fetch invoice data');
      }

      // Fetch company settings
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (!companySettings) {
        throw new Error('Company settings not found');
      }

      // Dynamically import the PDF generator to reduce bundle size
      const { generateInvoicePDF } = await import('@/utils/pdfGenerator');
      
      // Generate PDF
      const pdfBlob = await generateInvoicePDF(invoiceData, companySettings);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Invoice ${invoiceNumber} downloaded successfully`,
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'sent': return 'default';
      case 'paid': return 'default';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return '✓';
      case 'overdue': return '⚠';
      case 'cancelled': return '✗';
      default: return '';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customers?.customer_display_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice Management</CardTitle>
        </CardHeader>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>Create, send, and track customer invoices</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search invoices..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="font-medium">{invoice.invoice_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{invoice.customers?.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {invoice.customers?.customer_display_id}
                    </Badge>
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
                      {getStatusIcon(invoice.status)} {invoice.status}
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
                        onClick={() => handleViewInvoice(invoice.id)}
                        title="View Invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditInvoice(invoice)}
                        title="Edit Invoice"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadInvoice(invoice.id, invoice.invoice_number)}
                        title="Download Invoice"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDeletingInvoice(invoice)}
                        title="Delete Invoice"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'draft' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                          title="Send Invoice"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No invoices found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceCreationDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onInvoiceCreated={fetchInvoices}
      />

      <InvoiceEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingInvoice(null);
        }}
        onInvoiceUpdated={fetchInvoices}
        invoice={editingInvoice}
      />

      <AlertDialog open={!!deletingInvoice} onOpenChange={() => setDeletingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {deletingInvoice?.invoice_number}? This action cannot be undone and will remove all associated data including payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};