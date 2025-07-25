import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNotifications } from "@/hooks/useNotifications";
import { JobEditDialog } from "./JobEditDialog";
import { JobCreationDialog } from "./JobCreationDialog";
import { JobViewDialog } from "./JobViewDialog";
import { Eye, Edit, Trash2, Package, Filter, Plus, Paperclip, Download } from "lucide-react";

interface Job {
  id: number;
  title: string;
  quantity: number;
  status: string;
  tracking_code: string;
  created_at: string;
  quoted_price: number | null;
  final_price: number | null;
  customers?: {
    name: string;
    customer_display_id: string;
  } | null;
  services?: {
    name: string;
    service_type: string;
  } | null;
  file_count?: number;
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
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [viewingJobId, setViewingJobId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const { sendStatusUpdateNotification } = useNotifications();
  const { trackJobCompleted } = useAnalytics();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
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
          customer_uuid,
          customers!jobs_customer_uuid_fkey (
            name,
            customer_display_id
          ),
          services (
            name,
            service_type
          ),
          job_files!job_files_job_id_fkey (
            count
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        toast({
          title: "Error",
          description: "Failed to load jobs",
          variant: "destructive",
        });
        setJobs([]);
      } else {
        // Jobs fetched successfully
        // Add file count to each job
        const jobsWithFileCount = (data || []).map(job => ({
          ...job,
          file_count: job.job_files?.length || 0
        }));
        setJobs(jobsWithFileCount);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: number, newStatus: string) => {
    try {
      // Get job details for notification and analytics
      const { data: job } = await supabase
        .from("jobs")
        .select("customer_uuid, title, final_price")
        .eq("id", jobId)
        .single();

      const { error } = await supabase
        .from("jobs")
        .update({ status: newStatus })
        .eq("id", jobId);

      if (error) throw error;

      // Send status update notification and track analytics
      if (job?.customer_uuid && job?.title) {
        try {
          await sendStatusUpdateNotification(job.customer_uuid, jobId, job.title, newStatus);
          
          // Track completion if job is completed
          if (newStatus === 'Completed' && job.final_price) {
            await trackJobCompleted(jobId, Number(job.final_price));
          }
        } catch (notificationError) {
          console.warn('Notification or analytics failed:', notificationError);
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

    try {
      // Starting deletion of job
      
      // Delete all related records in the correct order to avoid foreign key constraints
      
      // 1. Delete notification logs first (they reference job_id)
      const { error: notificationError } = await supabase
        .from("notifications_log")
        .delete()
        .eq("job_id", jobId);
      
      if (notificationError) {
        console.error('Error deleting notification logs:', notificationError);
        throw notificationError;
      }

      // 2. Delete customer feedback
      const { error: feedbackError } = await supabase
        .from("customer_feedback")
        .delete()
        .eq("job_id", jobId);
      
      if (feedbackError) {
        console.error('Error deleting customer feedback:', feedbackError);
        throw feedbackError;
      }

      // 3. Delete delivery schedules and their history
      const { data: deliverySchedules, error: deliverySelectError } = await supabase
        .from("delivery_schedules")
        .select("id")
        .eq("job_id", jobId);

      if (deliverySelectError) {
        console.error('Error selecting delivery schedules:', deliverySelectError);
        throw deliverySelectError;
      }

      if (deliverySchedules && deliverySchedules.length > 0) {
        for (const schedule of deliverySchedules) {
          // Delete delivery history for schedule
          const { error: historyError } = await supabase
            .from("delivery_history")
            .delete()
            .eq("delivery_schedule_id", schedule.id);
          
          if (historyError) {
            console.error('Error deleting delivery history:', historyError);
            throw historyError;
          }
        }
        
        // Delete delivery schedules
        const { error: scheduleError } = await supabase
          .from("delivery_schedules")
          .delete()
          .eq("job_id", jobId);
        
        if (scheduleError) {
          console.error('Error deleting delivery schedules:', scheduleError);
          throw scheduleError;
        }
      }

      // 4. Delete job files
      const { error: filesError } = await supabase
        .from("job_files")
        .delete()
        .eq("job_id", jobId);
      
      if (filesError) {
        console.error('Error deleting job files:', filesError);
        throw filesError;
      }

      // 5. Delete job finishing options
      const { error: finishingError } = await supabase
        .from("job_finishing_options")
        .delete()
        .eq("job_id", jobId);
      
      if (finishingError) {
        console.error('Error deleting job finishing options:', finishingError);
        throw finishingError;
      }

      // 6. Delete job history
      const { error: historyError } = await supabase
        .from("job_history")
        .delete()
        .eq("job_id", jobId);
      
      if (historyError) {
        console.error('Error deleting job history:', historyError);
        throw historyError;
      }

      // 7. Update any quotes that reference this job
      const { error: quotesError } = await supabase
        .from("quotes")
        .update({ converted_to_job_id: null })
        .eq("converted_to_job_id", jobId);
      
      if (quotesError) {
        console.error('Error updating quotes:', quotesError);
        throw quotesError;
      }

      // 8. Delete any invoices for this job
      const { data: invoices, error: invoiceSelectError } = await supabase
        .from("invoices")
        .select("id")
        .eq("job_id", jobId);

      if (invoiceSelectError) {
        console.error('Error selecting invoices:', invoiceSelectError);
        throw invoiceSelectError;
      }

      if (invoices && invoices.length > 0) {
        for (const invoice of invoices) {
          // Delete invoice items first
          const { error: itemsError } = await supabase
            .from("invoice_items")
            .delete()
            .eq("invoice_id", invoice.id);
          
          if (itemsError) {
            console.error('Error deleting invoice items:', itemsError);
            throw itemsError;
          }
          
          // Delete payments
          const { error: paymentsError } = await supabase
            .from("payments")
            .delete()
            .eq("invoice_id", invoice.id);
          
          if (paymentsError) {
            console.error('Error deleting payments:', paymentsError);
            throw paymentsError;
          }
        }
        
        // Delete invoices
        const { error: invoiceDeleteError } = await supabase
          .from("invoices")
          .delete()
          .eq("job_id", jobId);
        
        if (invoiceDeleteError) {
          console.error('Error deleting invoices:', invoiceDeleteError);
          throw invoiceDeleteError;
        }
      }

      // 9. Finally delete the job
      const { error: jobError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (jobError) {
        console.error('Error deleting job:', jobError);
        throw jobError;
      }

      // Successfully deleted job
      toast({
        title: "Success",
        description: "Job and all related data deleted successfully",
      });
      fetchJobs();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: `Failed to delete job: ${error.message}`,
        variant: "destructive",
      });
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
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job
          </Button>
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
                  <TableHead>Files</TableHead>
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
                     <TableCell className="font-medium">
                       {job.title || `Job #${job.id}`}
                     </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {job.customers?.name || 'Unknown Customer'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.customers?.customer_display_id || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{job.services?.name || 'Unknown Service'}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.services?.service_type || 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                     <TableCell>{job.quantity}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1">
                           <Paperclip className="h-4 w-4 text-muted-foreground" />
                           <span className="text-sm">{job.file_count || 0}</span>
                         </div>
                         {job.file_count > 0 && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               setViewingJobId(job.id);
                               setIsViewDialogOpen(true);
                             }}
                             title="View/Download Files"
                           >
                             <Download className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                     </TableCell>
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
                          Le {job.final_price.toFixed(2)}
                        </span>
                      ) : job.quoted_price ? (
                        <span className="text-muted-foreground">
                          ~Le {job.quoted_price.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => {
                             setViewingJobId(job.id);
                             setIsViewDialogOpen(true);
                           }}
                           title="View Job Details"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEditingJobId(job.id);
                            setIsEditDialogOpen(true);
                          }}
                        >
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
      
      <JobViewDialog
        jobId={viewingJobId}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setViewingJobId(null);
        }}
      />
      
      <JobEditDialog
        jobId={editingJobId}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingJobId(null);
        }}
        onJobUpdated={fetchJobs}
      />
      
      <JobCreationDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onJobCreated={fetchJobs}
      />
    </div>
  );
};