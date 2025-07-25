import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, Package } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: number;
  tracking_code: string;
  title: string;
  status: string;
  customer_uuid: string;
  estimated_completion: string;
  created_at: string;
  profiles: {
    name: string;
    customer_display_id: string;
  };
}

export const WaitingArea = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { settings } = useCompanySettings();
  const { toast } = useToast();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        // Fetching active jobs
        const { data: active, error: activeError } = await supabase
          .from('jobs')
          .select(`
            id,
            tracking_code,
            title,
            status,
            customer_uuid,
            estimated_completion,
            created_at,
            profiles:customer_uuid (
              name,
              customer_display_id
            )
          `)
          .in('status', ['Pending', 'Received', 'Processing', 'Printing', 'Finishing'])
          .order('created_at', { ascending: true })
          .limit(10);

        // Fetching completed jobs
        const { data: completed, error: completedError } = await supabase
          .from('jobs')
          .select(`
            id,
            tracking_code,
            title,
            status,
            customer_uuid,
            estimated_completion,
            created_at,
            profiles:customer_uuid (
              name,
              customer_display_id
            )
          `)
          .in('status', ['Waiting for Collection', 'Out for Delivery', 'Completed'])
          .order('updated_at', { ascending: false })
          .limit(5);

        if (activeError) {
          toast({
            title: "Error",
            description: "Failed to fetch active jobs",
            variant: "destructive"
          });
        } else {
          setActiveJobs(active || []);
        }

        if (completedError) {
          toast({
            title: "Error", 
            description: "Failed to fetch completed jobs",
            variant: "destructive"
          });
        } else {
          setCompletedJobs(completed || []);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Unexpected error fetching jobs",
          variant: "destructive"
        });
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'received': return <Package className="h-5 w-5 text-blue-500" />;
      case 'processing': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'printing': return <Package className="h-5 w-5 text-blue-500" />;
      case 'finishing': return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'waiting for collection': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'out for delivery': return <Package className="h-5 w-5 text-blue-600" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 10;
      case 'received': return 20;
      case 'processing': return 35;
      case 'printing': return 60;
      case 'finishing': return 80;
      case 'waiting for collection': return 95;
      case 'out for delivery': return 95;
      case 'completed': return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">{settings?.company_name || 'Loading...'}</h1>
            <p className="text-muted-foreground">Live Job Progress</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Time</p>
            <p className="text-lg font-semibold">{currentTime.toLocaleTimeString()}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Jobs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Jobs in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeJobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No jobs currently in progress</p>
                  ) : (
                    activeJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-4 space-y-3">
                         <div className="flex justify-between items-start">
                           <div>
                             <h4 className="font-semibold">{job.title || `Job #${job.tracking_code.slice(-6)}`}</h4>
                             <p className="text-sm text-muted-foreground">
                               {job.profiles?.name || 'Unknown Customer'} • {job.profiles?.customer_display_id || 'N/A'}
                             </p>
                             <p className="text-xs text-muted-foreground">#{job.tracking_code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <Badge variant="outline">{job.status}</Badge>
                          </div>
                        </div>
                        <Progress value={getStatusProgress(job.status)} className="h-2" />
                        {job.estimated_completion && (
                          <p className="text-xs text-muted-foreground">
                            Est. completion: {new Date(job.estimated_completion).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Completed Jobs */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Ready for Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedJobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No jobs ready for collection</p>
                  ) : (
                    completedJobs.map((job) => (
                      <div key={job.id} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(job.status)}
                          <Badge variant={job.status === 'Completed' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>
                         <h5 className="font-medium text-sm">{job.title || `Job #${job.tracking_code.slice(-6)}`}</h5>
                         <p className="text-xs text-muted-foreground">
                           {job.profiles?.name || 'Unknown Customer'} • {job.profiles?.customer_display_id || 'N/A'}
                         </p>
                         <p className="text-xs text-muted-foreground">#{job.tracking_code}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Today's Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Today's Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Jobs Completed:</span>
                    <span className="font-semibold">{completedJobs.filter(j => j.status === 'Completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">In Progress:</span>
                    <span className="font-semibold">{activeJobs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Ready for Collection:</span>
                    <span className="font-semibold">{completedJobs.filter(j => j.status === 'Waiting for Collection' || j.status === 'Out for Delivery').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};