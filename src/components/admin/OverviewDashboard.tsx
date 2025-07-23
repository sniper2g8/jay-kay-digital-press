import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface OverviewStats {
  totalJobs: number;
  activeJobs: number;
  totalCustomers: number;
  totalInvoices: number;
  totalRevenue: number;
  pendingInvoices: number;
  overdue: number;
  recentJobs: any[];
  recentCustomers: any[];
}

export const OverviewDashboard = () => {
  const [stats, setStats] = useState<OverviewStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalCustomers: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    overdue: 0,
    recentJobs: [],
    recentCustomers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      // Fetch jobs data
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          status,
          created_at,
          customers!jobs_customer_uuid_fkey (name, customer_display_id)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (jobsError) throw jobsError;

      // Fetch customers data
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id, name, email, created_at")
        .order('created_at', { ascending: false })
        .limit(5);

      if (customersError) throw customersError;

      // Fetch invoices data
      const { data: invoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, total_amount, status, created_at");

      if (invoicesError) throw invoicesError;

      // Calculate stats
      const totalJobs = jobs?.length || 0;
      const activeJobs = jobs?.filter(j => j.status !== 'Completed').length || 0;
      const totalCustomers = customers?.length || 0;
      const totalInvoices = invoices?.length || 0;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
      const pendingInvoices = invoices?.filter(inv => inv.status === 'sent').length || 0;
      const overdue = invoices?.filter(inv => inv.status === 'overdue').length || 0;

      setStats({
        totalJobs,
        activeJobs,
        totalCustomers,
        totalInvoices,
        totalRevenue,
        pendingInvoices,
        overdue,
        recentJobs: jobs || [],
        recentCustomers: customers || []
      });

    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.totalJobs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeJobs} active
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
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total registered
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">Le {stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalInvoices} invoices
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingInvoices}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.overdue} overdue
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentJobs.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No jobs yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium">{job.title || `Job #${job.id}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.customers?.name || 'Unknown Customer'}
                        </p>
                      </div>
                    </div>
                    <Badge variant={job.status === 'Completed' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No customers yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <Package className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">New Job</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <Users className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Add Customer</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">Create Invoice</span>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg border hover:bg-muted/50 cursor-pointer">
              <TrendingUp className="h-8 w-8 text-primary mb-2" />
              <span className="text-sm font-medium">View Reports</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};