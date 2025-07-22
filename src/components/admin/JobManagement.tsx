import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Eye, Edit, Trash2, Package, Filter } from "lucide-react";

interface Job {
  id: number;
  title: string;
  quantity: number;
  status: string;
  tracking_code: string;
  created_at: string;
  quoted_price: number | null;
  final_price: number | null;
  customers: {
    name: string;
    customer_display_id: string;
  };
  services: {
    name: string;
    service_type: string;
  };
}

const STATUS_OPTIONS = [
  "Pending",
  "Received",
  "Processing",
  "Printing",
  "Finishing",
  "Waiting for Collection",
  "Out for Delivery",
  "Completed"
];

export const JobManagement = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();
  const { sendStatusUpdateNotification } = useNotifications();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        quantity,
        status,
        tracking_code,
        created_at,
        quoted_price,
        final_price,
        customers (
          name,
          customer_display_id
        ),
        services (
          name,
          service_type
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      });
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  };

  const updateJobStatus = async (jobId: number, newStatus: string) => {
    try {
      // Get job details for notification
      const { data: job } = await supabase
        .from("jobs")
        .select("customer_uuid, title")
        .eq("id", jobId)
        .single();

      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) throw error;

      // Send status update notification
      if (job?.customer_uuid && job?.title) {
        try {
          await sendStatusUpdateNotification(job.customer_uuid, jobId, job.title, newStatus);
        } catch (notificationError) {
          console.warn('Notification failed:', notificationError);
        }
      }

      toast({
        title: "Success",
        description: "Job status updated successfully",
      });

      fetchJobs(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update job status",
        variant: "destructive",
      });
    }
  };

  const deleteJob = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    const { error } = await supabase
      .from("jobs")
      .delete()
      .eq("id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      fetchJobs();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500";
      case "received":
        return "bg-blue-500";
      case "processing":
      case "printing":
        return "bg-orange-500";
      case "finishing":
        return "bg-purple-500";
      case "waiting for collection":
      case "out for delivery":
        return "bg-indigo-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredJobs = statusFilter === "all" 
    ? jobs 
    : jobs.filter(job => job.status.toLowerCase() === statusFilter.toLowerCase());

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p>Loading jobs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Job Management</h2>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status.toLowerCase()}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Jobs ({filteredJobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Jobs Found</h3>
              <p className="text-muted-foreground">
                {statusFilter === "all" 
                  ? "No jobs have been submitted yet." 
                  : `No jobs with status "${statusFilter}"`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking Code</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{job.customers.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.customers.customer_display_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{job.services.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.services.service_type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{job.quantity}</TableCell>
                    <TableCell>
                      <Select
                        value={job.status}
                        onValueChange={(value) => updateJobStatus(job.id, value)}
                      >
                        <SelectTrigger className="w-auto">
                          <Badge variant="secondary" className="cursor-pointer">
                            {job.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {job.tracking_code}
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(job.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {job.final_price ? (
                        <span className="font-medium">
                          ${job.final_price.toFixed(2)}
                        </span>
                      ) : job.quoted_price ? (
                        <span className="text-muted-foreground">
                          ~${job.quoted_price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteJob(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};