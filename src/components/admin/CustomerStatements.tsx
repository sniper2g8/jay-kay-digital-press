import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  FileText, 
  Send, 
  Download, 
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  Eye
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  customer_display_id: string;
  created_at: string;
}

interface StatementData {
  customer: Customer;
  jobs: any[];
  invoices: any[];
  payments: any[];
  totalJobs: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
}

export const CustomerStatements = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [loading, setLoading] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, customer_display_id, created_at')
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers.",
        variant: "destructive"
      });
    }
  };

  const generateStatement = async (customer: Customer) => {
    setLoading(true);
    try {
      // Calculate period dates
      const today = new Date();
      let startDate: Date, endDate: Date;
      
      switch (selectedPeriod) {
        case "current_month":
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
          break;
        case "last_3_months":
          startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
          endDate = endOfMonth(today);
          break;
        case "last_6_months":
          startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
          endDate = endOfMonth(today);
          break;
        default:
          startDate = startOfMonth(today);
          endDate = endOfMonth(today);
      }

      // Load jobs for the period
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          services(name)
        `)
        .eq('customer_uuid', customer.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Load invoices for the period
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      // Load payments for the period
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          *,
          invoices!inner(customer_id)
        `)
        .eq('invoices.customer_id', customer.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Calculate totals
      const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const totalPaid = payments?.reduce((sum, pay) => sum + (pay.amount || 0), 0) || 0;
      const outstandingBalance = totalInvoiced - totalPaid;

      const statement: StatementData = {
        customer,
        jobs: jobs || [],
        invoices: invoices || [],
        payments: payments || [],
        totalJobs: jobs?.length || 0,
        totalInvoiced,
        totalPaid,
        outstandingBalance
      };

      setStatementData(statement);
      setSelectedCustomer(customer);
      setIsStatementOpen(true);
    } catch (error) {
      console.error('Error generating statement:', error);
      toast({
        title: "Error",
        description: "Failed to generate statement.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadStatement = async () => {
    if (!statementData) return;
    
    try {
      // Create a more comprehensive PDF content
      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Customer Statement</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .customer-info { margin-bottom: 20px; }
            .summary { display: flex; gap: 20px; margin: 20px 0; }
            .summary-card { border: 1px solid #ddd; padding: 15px; flex: 1; text-align: center; }
            .jobs-list { margin-top: 30px; }
            .job-item { border-bottom: 1px solid #eee; padding: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Customer Statement</h1>
            <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
          </div>
          
          <div class="customer-info">
            <h2>Customer Details</h2>
            <p><strong>Name:</strong> ${statementData.customer.name}</p>
            <p><strong>Email:</strong> ${statementData.customer.email}</p>
            <p><strong>Customer ID:</strong> ${statementData.customer.customer_display_id}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <h3>Total Jobs</h3>
              <p style="font-size: 24px; margin: 0;">${statementData.totalJobs}</p>
            </div>
            <div class="summary-card">
              <h3>Total Invoiced</h3>
              <p style="font-size: 24px; margin: 0;">Le ${statementData.totalInvoiced.toLocaleString()}</p>
            </div>
            <div class="summary-card">
              <h3>Total Paid</h3>
              <p style="font-size: 24px; margin: 0;">Le ${statementData.totalPaid.toLocaleString()}</p>
            </div>
            <div class="summary-card">
              <h3>Outstanding</h3>
              <p style="font-size: 24px; margin: 0; color: ${statementData.outstandingBalance > 0 ? 'red' : 'green'};">Le ${statementData.outstandingBalance.toLocaleString()}</p>
            </div>
          </div>
          
          <div class="jobs-list">
            <h2>Jobs Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${statementData.jobs.map(job => `
                  <tr>
                    <td>${job.tracking_code}</td>
                    <td>${job.services?.name || 'N/A'}</td>
                    <td>${job.status}</td>
                    <td>${format(new Date(job.created_at), 'MMM dd, yyyy')}</td>
                    <td>Le ${(job.final_price || job.quoted_price || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `;
      
      // Create a blob and download
      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement_${statementData.customer.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Statement downloaded",
        description: "Statement has been generated and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download statement.",
        variant: "destructive"
      });
    }
  };

  const sendStatement = async () => {
    if (!statementData) return;
    
    try {
      // Generate statement content for email
      const statementContent = `
        Customer Statement for ${statementData.customer.name}
        
        Statement Period: ${selectedPeriod}
        Generated on: ${format(new Date(), 'MMMM dd, yyyy')}
        
        Customer Details:
        - Name: ${statementData.customer.name}
        - Email: ${statementData.customer.email}
        - Customer ID: ${statementData.customer.customer_display_id}
        
        Summary:
        - Total Jobs: ${statementData.totalJobs}
        - Total Invoiced: Le ${statementData.totalInvoiced.toLocaleString()}
        - Total Paid: Le ${statementData.totalPaid.toLocaleString()}
        - Outstanding Balance: Le ${statementData.outstandingBalance.toLocaleString()}
        
        Jobs Details:
        ${statementData.jobs.map(job => `
        - Job ${job.tracking_code}: ${job.services?.name || 'N/A'} - ${job.status} - Le ${(job.final_price || job.quoted_price || 0).toLocaleString()}
        `).join('')}
      `;

      // Send email via edge function
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'email',
          recipient: statementData.customer.email,
          subject: `Customer Statement - ${statementData.customer.name}`,
          message: statementContent,
          customer_id: statementData.customer.id
        }
      });

      if (error) throw error;
      
      toast({
        title: "Statement sent",
        description: `Statement has been sent to ${statementData.customer.email}`,
      });
      setIsStatementOpen(false);
    } catch (error) {
      console.error('Error sending statement:', error);
      toast({
        title: "Error",
        description: "Failed to send statement.",
        variant: "destructive"
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customer_display_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatementDialog = () => {
    if (!statementData) return null;

    const { customer, jobs, invoices, payments, totalJobs, totalInvoiced, totalPaid, outstandingBalance } = statementData;

    return (
      <Dialog open={isStatementOpen} onOpenChange={setIsStatementOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Customer Statement</DialogTitle>
            <DialogDescription>
              Statement for {customer.name} ({customer.customer_display_id})
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh]">
            <div className="space-y-6 p-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Customer Details</h3>
                  <p>{customer.name}</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                  <p className="text-sm text-muted-foreground">ID: {customer.customer_display_id}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Statement Period</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPeriod === "current_month" ? "Current Month" :
                     selectedPeriod === "last_3_months" ? "Last 3 Months" :
                     "Last 6 Months"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Generated on {format(new Date(), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Jobs</p>
                        <p className="text-xl font-bold">{totalJobs}</p>
                      </div>
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Invoiced</p>
                        <p className="text-xl font-bold">Le {totalInvoiced.toLocaleString()}</p>
                      </div>
                      <FileText className="h-6 w-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Paid</p>
                        <p className="text-xl font-bold">Le {totalPaid.toLocaleString()}</p>
                      </div>
                      <CreditCard className="h-6 w-6 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-xl font-bold">Le {outstandingBalance.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-6 w-6 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Jobs */}
              {jobs.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Jobs ({jobs.length})</h3>
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">JKDP-{job.id.toString().padStart(4, '0')}</p>
                          <p className="text-sm text-muted-foreground">{job.services?.name}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{job.status}</Badge>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(job.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {invoices.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Invoices ({invoices.length})</h3>
                  <div className="space-y-2">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Le {invoice.total_amount?.toLocaleString()}</p>
                          <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {payments.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Payments ({payments.length})</h3>
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Payment #{payment.reference_number || payment.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">Le {payment.amount?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{payment.payment_method}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsStatementOpen(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={() => downloadStatement()}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={sendStatement}>
              <Send className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Statements</h2>
          <p className="text-muted-foreground">Generate and send customer account statements</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Current Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="p-4 text-left font-medium">Customer</th>
                  <th className="p-4 text-left font-medium">Contact</th>
                  <th className="p-4 text-left font-medium">Customer ID</th>
                  <th className="p-4 text-left font-medium">Joined</th>
                  <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="p-4">{customer.email}</td>
                    <td className="p-4">
                      <Badge variant="outline">{customer.customer_display_id}</Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateStatement(customer)}
                          disabled={loading}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Statement
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <StatementDialog />
    </div>
  );
};