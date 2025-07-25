import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  Calendar,
  DollarSign,
  Package,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Eye
} from "lucide-react";
import { generateStatementPDF } from "@/utils/statementPdfGenerator";

interface StatementData {
  jobs: any[];
  invoices: any[];
  payments: any[];
  totalJobs: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
}

interface CustomerStatementProps {
  userId: string;
}

export const CustomerStatement = ({ userId }: CustomerStatementProps) => {
  const [statementData, setStatementData] = useState<StatementData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomerInfo();
  }, [userId]);

  useEffect(() => {
    if (customer) {
      generateStatement();
    }
  }, [customer, selectedPeriod]);

  const loadCustomerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
      
      if (error) throw error;
      setCustomer(data);
    } catch (error) {
      console.error('Error loading customer info:', error);
    }
  };

  const generateStatement = async () => {
    if (!customer) return;

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
        case "all_time":
          startDate = new Date(customer.created_at);
          endDate = new Date();
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
          services(name),
          workflow_status(name)
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

      setStatementData({
        jobs: jobs || [],
        invoices: invoices || [],
        payments: payments || [],
        totalJobs: jobs?.length || 0,
        totalInvoiced,
        totalPaid,
        outstandingBalance
      });
    } catch (error) {
      console.error('Error generating statement:', error);
      toast({
        title: "Error",
        description: "Failed to load statement data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadStatement = async () => {
    if (!statementData || !customer) return;

    try {
      // Load company settings
      const { data: companySettings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (settingsError) throw settingsError;

      toast({
        title: "Generating PDF",
        description: "Your statement is being prepared for download...",
      });

      const pdfBlob = await generateStatementPDF(
        statementData,
        customer,
        selectedPeriod,
        companySettings
      );

      // Download the PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `statement-${customer.customer_display_id}-${selectedPeriod}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download complete",
        description: "Your statement has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast({
        title: "Download failed",
        description: "Failed to generate statement PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!statementData) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No statement data available</p>
      </div>
    );
  }

  const { jobs, invoices, payments, totalJobs, totalInvoiced, totalPaid, outstandingBalance } = statementData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Statement</h2>
          <p className="text-muted-foreground">
            View your account activity and transactions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Statement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Statement Preview</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Statement Preview Content */}
                <div className="bg-white p-6 border rounded-lg">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold">Customer Statement</h3>
                      <p className="text-muted-foreground">
                        Period: {selectedPeriod === "current_month" ? "Current Month" :
                               selectedPeriod === "last_3_months" ? "Last 3 Months" :
                               selectedPeriod === "last_6_months" ? "Last 6 Months" : "All Time"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated: {format(new Date(), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Customer: {customer?.name}</p>
                      <p className="text-sm text-muted-foreground">ID: {customer?.customer_display_id}</p>
                    </div>
                  </div>

                  {/* Summary Cards in Preview */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded text-center">
                      <p className="text-sm text-muted-foreground">Total Jobs</p>
                      <p className="text-xl font-bold">{totalJobs}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded text-center">
                      <p className="text-sm text-muted-foreground">Total Invoiced</p>
                      <p className="text-xl font-bold">Le {totalInvoiced.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded text-center">
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-xl font-bold">Le {totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded text-center">
                      <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                      <p className={`text-xl font-bold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Le {outstandingBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Jobs Table in Preview */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold mb-3">Jobs Summary</h4>
                    <div className="border rounded">
                      <div className="grid grid-cols-7 gap-2 p-3 bg-gray-100 font-medium text-sm">
                        <div>Job ID</div>
                        <div>Service Type</div>
                        <div>Job Title</div>
                        <div>Qty</div>
                        <div>Status</div>
                        <div>Date</div>
                        <div className="text-right">Amount</div>
                      </div>
                      {jobs.map((job) => (
                        <div key={job.id} className="grid grid-cols-7 gap-2 p-3 border-t text-sm">
                          <div className="font-medium">
                            {job.tracking_code || `JKDP-${job.id.toString().padStart(4, '0')}`}
                          </div>
                          <div>{job.services?.name || 'N/A'}</div>
                          <div className="truncate">{job.title || job.description || 'N/A'}</div>
                          <div>{job.quantity || 1}</div>
                          <div>{job.workflow_status?.name || job.status}</div>
                          <div>{format(new Date(job.created_at), 'MMM dd, yyyy')}</div>
                          <div className="text-right">
                            {job.final_price ? `Le ${job.final_price.toLocaleString()}` : 
                             job.quoted_price ? `Le ${job.quoted_price.toLocaleString()}` : 'TBD'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={downloadStatement}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Account Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{totalJobs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPeriod === "current_month" ? "This month" :
                   selectedPeriod === "last_3_months" ? "Last 3 months" :
                   selectedPeriod === "last_6_months" ? "Last 6 months" : "All time"}
                </p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoiced</p>
                <p className="text-2xl font-bold">Le {totalInvoiced.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <p className="text-xs text-green-600">Billing summary</p>
                </div>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">Le {totalPaid.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <CreditCard className="h-3 w-3 text-green-500 mr-1" />
                  <p className="text-xs text-green-600">Payments received</p>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold">Le {outstandingBalance.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {outstandingBalance > 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-orange-500 mr-1" />
                      <p className="text-xs text-orange-600">Amount due</p>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                      <p className="text-xs text-green-600">Account current</p>
                    </>
                  )}
                </div>
              </div>
              <DollarSign className={`h-8 w-8 ${outstandingBalance > 0 ? 'text-orange-500' : 'text-green-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statement Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Jobs Summary ({jobs.length})
            </CardTitle>
            <CardDescription>Job ID, Service type, Job Title, Qty, status, date and Amount</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length > 0 ? (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-7 gap-2 p-3 bg-muted rounded-lg text-sm font-medium">
                  <div>Job ID</div>
                  <div>Service Type</div>
                  <div>Job Title</div>
                  <div>Qty</div>
                  <div>Status</div>
                  <div>Date</div>
                  <div className="text-right">Amount</div>
                </div>
                {/* Job Rows */}
                {jobs.map((job) => (
                  <div key={job.id} className="grid grid-cols-7 gap-2 p-3 border rounded-lg text-sm">
                    <div className="font-medium">
                      {job.tracking_code || `JKDP-${job.id.toString().padStart(4, '0')}`}
                    </div>
                    <div className="text-muted-foreground">
                      {job.services?.name || 'N/A'}
                    </div>
                    <div className="truncate" title={job.title || job.description}>
                      {job.title || job.description || 'N/A'}
                    </div>
                    <div>{job.quantity || 1}</div>
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {job.workflow_status?.name || job.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      {format(new Date(job.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-right font-medium">
                      {job.final_price ? `Le ${job.final_price.toLocaleString()}` : 
                       job.quoted_price ? `Le ${job.quoted_price.toLocaleString()}` : 'TBD'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No jobs in this period</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Invoices ({invoices.length})
            </CardTitle>
            <CardDescription>Billing history for the selected period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoices.length > 0 ? (
              invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">Le {invoice.total_amount?.toLocaleString()}</p>
                    <Badge variant={
                      invoice.status === 'paid' ? 'default' :
                      invoice.status === 'sent' ? 'secondary' :
                      invoice.status === 'overdue' ? 'destructive' : 'outline'
                    }>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No invoices in this period</p>
              </div>
            )}
            {invoices.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                And {invoices.length - 5} more invoices...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payments */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payments ({payments.length})
            </CardTitle>
            <CardDescription>Payment history for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Payment #{payment.reference_number || payment.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.payment_date), 'MMM dd, yyyy')} • {payment.payment_method}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">Le {payment.amount?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Payment received</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {outstandingBalance > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                    Outstanding Balance
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    You have an outstanding balance of Le {outstandingBalance.toLocaleString()}
                  </p>
                </div>
              </div>
              <Button variant="outline">
                Make Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};