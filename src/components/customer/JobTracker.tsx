import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Package, Clock, CheckCircle, TruckIcon, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface Job {
  id: number;
  title: string;
  description: string;
  quantity: number;
  status: string;
  tracking_code: string;
  created_at: string;
  service_id: number;
  services: {
    name: string;
    service_type: string;
  };
}

interface JobTrackerProps {
  userId?: string;
}

export const JobTracker = ({ userId }: JobTrackerProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [trackingCode, setTrackingCode] = useState("");
  const [trackedJob, setTrackedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchUserJobs();
    }
  }, [userId]);

  const fetchUserJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!customer) return;

    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        description,
        quantity,
        status,
        tracking_code,
        created_at,
        service_id,
        services (
          name,
          service_type
        )
      `)
      .eq("customer_uuid", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive",
      });
      return;
    }

    setJobs(data || []);
  };

  const trackJob = async () => {
    if (!trackingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a tracking code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        description,
        quantity,
        status,
        tracking_code,
        created_at,
        service_id,
        services (
          name,
          service_type
        )
      `)
      .eq("tracking_code", trackingCode.trim())
      .single();

    if (error || !data) {
      toast({
        title: "Error",
        description: "Job not found with this tracking code",
        variant: "destructive",
      });
      setTrackedJob(null);
    } else {
      setTrackedJob(data);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "received":
        return <Clock className="h-4 w-4" />;
      case "processing":
      case "printing":
      case "finishing":
        return <Package className="h-4 w-4" />;
      case "waiting for collection":
      case "out for delivery":
        return <TruckIcon className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
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

  const generateTrackingUrl = (trackingCode: string) => {
    return `${window.location.origin}/track/${trackingCode}`;
  };

  const canCancelJob = (status: string) => {
    const cancellableStatuses = ['Pending', 'Received', 'Processing'];
    return cancellableStatuses.includes(status);
  };

  const cancelJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to cancel this job?')) {
      return;
    }

    try {
      // Get the cancelled status ID from workflow_status
      const { data: cancelledStatus } = await supabase
        .from('workflow_status')
        .select('id')
        .eq('name', 'Cancelled')
        .single();

      const statusId = cancelledStatus?.id || 9; // Fallback to 9 if not found

      const { error } = await supabase
        .from('jobs')
        .update({ status: 'Cancelled', current_status: statusId })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Job cancelled",
        description: "Your job has been cancelled successfully.",
      });

      // Refresh jobs if user is logged in
      if (userId) {
        fetchUserJobs();
      }
      
      // Clear tracked job if it was the cancelled one
      if (trackedJob && trackedJob.id === jobId) {
        setTrackedJob(null);
        setTrackingCode("");
      }
    } catch (error) {
      console.error('Error cancelling job:', error);
      toast({
        title: "Error",
        description: "Failed to cancel job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const JobCard = ({ job }: { job: Job }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{job.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {job.services.name} • Qty: {job.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getStatusIcon(job.status)}
                {job.status}
              </Badge>
              {canCancelJob(job.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelJob(job.id)}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <Label className="text-xs text-muted-foreground">Tracking Code</Label>
            <p className="font-mono text-sm">{job.tracking_code}</p>
            <Label className="text-xs text-muted-foreground">Submitted</Label>
            <p className="text-sm">{new Date(job.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <Label className="text-xs text-muted-foreground mb-2">QR Code</Label>
            <QRCodeSVG
              value={generateTrackingUrl(job.tracking_code)}
              size={80}
              level="M"
              includeMargin={true}
            />
          </div>
          
          <div className="flex flex-col">
            <Label className="text-xs text-muted-foreground mb-2">Progress</Label>
            <div className="space-y-2">
              {["Pending", "Received", "Processing", "Printing", "Finishing", "Waiting for Collection", "Completed"].map((status, index) => {
                const currentIndex = ["Pending", "Received", "Processing", "Printing", "Finishing", "Waiting for Collection", "Out for Delivery", "Completed"].indexOf(job.status);
                const isActive = index <= currentIndex;
                const isCurrent = status === job.status;
                
                return (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      isCurrent ? getStatusColor(status) : 
                      isActive ? "bg-green-500" : "bg-gray-300"
                    }`} />
                    <span className={`text-xs ${
                      isCurrent ? "font-semibold" : 
                      isActive ? "text-muted-foreground" : "text-gray-400"
                    }`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Public Job Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Track Your Job
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="tracking">Tracking Code</Label>
              <Input
                id="tracking"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="Enter your tracking code"
                onKeyPress={(e) => e.key === 'Enter' && trackJob()}
              />
            </div>
            <Button onClick={trackJob} disabled={loading} className="mt-6">
              {loading ? "Searching..." : "Track"}
            </Button>
          </div>
          
          {trackedJob && (
            <div className="mt-4">
              <JobCard job={trackedJob} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* User's Jobs (if logged in) */}
      {userId && jobs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Jobs</h2>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {userId && jobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Jobs Yet</h3>
            <p className="text-muted-foreground">Submit your first print job to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};