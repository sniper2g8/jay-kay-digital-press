import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { CompanyLogo } from "@/components/common/LogoHeader";

interface JobProgress {
  id: number;
  title: string;
  tracking_code: string;
  status: string;
  created_at: string;
  due_date: string | null;
  customer_name: string;
  customer_display_id: string;
  progress_percentage: number;
}

const STATUS_ORDER = [
  "Pending",
  "Received", 
  "Processing",
  "Printing",
  "Finishing",
  "Waiting for Collection",
  "Out for Delivery",
  "Completed"
];

export const JobProgressDashboard = () => {
  const [jobs, setJobs] = useState<JobProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchJobProgress();
  }, []);

  const fetchJobProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          tracking_code,
          status,
          created_at,
          due_date,
          customers!jobs_customer_uuid_fkey (
            name,
            customer_display_id
          )
        `)
        .neq('status', 'Completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobsWithProgress = (data || []).map(job => {
        const statusIndex = STATUS_ORDER.indexOf(job.status);
        const progress = statusIndex >= 0 ? ((statusIndex + 1) / STATUS_ORDER.length) * 100 : 0;
        
        return {
          id: job.id,
          title: job.title || `Job #${job.id}`,
          tracking_code: job.tracking_code,
          status: job.status,
          created_at: job.created_at,
          due_date: job.due_date,
          customer_name: job.customers?.name || 'Unknown Customer',
          customer_display_id: job.customers?.customer_display_id || 'N/A',
          progress_percentage: progress
        };
      });

      setJobs(jobsWithProgress);

      // Calculate stats
      const total = jobsWithProgress.length;
      const pending = jobsWithProgress.filter(j => j.status === 'Pending').length;
      const inProgress = jobsWithProgress.filter(j => 
        !['Pending', 'Completed'].includes(j.status)
      ).length;
      const completed = jobsWithProgress.filter(j => j.status === 'Completed').length;
      const overdue = jobsWithProgress.filter(j => 
        j.due_date && new Date(j.due_date) < new Date() && j.status !== 'Completed'
      ).length;

      setStats({ total, pending, inProgress, completed, overdue });
    } catch (error) {
      // ...existing code...
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "secondary";
      case "received":
        return "default";
      case "processing":
      case "printing":
        return "default";
      case "finishing":
        return "default";
      case "waiting for collection":
      case "out for delivery":
        return "default";
      case "completed":
        return "default";
      default:
        return "secondary";
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <CompanyLogo className="h-10 w-auto" />
            <h1 className="text-xl sm:text-2xl font-bold">Job Progress Dashboard</h1>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Job Progress Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Jobs Completed!</h3>
                <p className="text-muted-foreground">
                  No jobs currently in progress.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(job.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.customer_display_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Progress value={job.progress_percentage} className="w-24" />
                          <p className="text-xs text-muted-foreground">
                            {Math.round(job.progress_percentage)}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.due_date ? (
                          <div className={isOverdue(job.due_date) ? "text-red-600" : ""}>
                            <p className="text-sm">
                              {new Date(job.due_date).toLocaleDateString()}
                            </p>
                            {isOverdue(job.due_date) && (
                              <p className="text-xs">Overdue</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {job.tracking_code}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};