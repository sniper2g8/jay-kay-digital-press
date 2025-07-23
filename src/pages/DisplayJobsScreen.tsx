import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Package, CheckCircle, TruckIcon, Calendar, User } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface Job {
  id: number;
  title: string;
  status: string;
  tracking_code: string;
  created_at: string;
  estimated_completion: string | null;
  quantity: number;
  customers: {
    name: string;
    customer_display_id: string;
  };
  services: {
    name: string;
    service_type: string;
  };
}

export const DisplayJobsScreen = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { settings } = useCompanySettings();

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000); // Refresh every 30 seconds
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          status,
          tracking_code,
          created_at,
          estimated_completion,
          quantity,
          customers (
            name,
            customer_display_id
          ),
          services (
            name,
            service_type
          )
        `)
        .not("status", "eq", "Completed")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "received":
        return <Clock className="h-6 w-6" />;
      case "processing":
      case "printing":
      case "finishing":
        return <Package className="h-6 w-6" />;
      case "waiting for collection":
      case "out for delivery":
        return <TruckIcon className="h-6 w-6" />;
      case "completed":
        return <CheckCircle className="h-6 w-6" />;
      default:
        return <Clock className="h-6 w-6" />;
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

  const groupJobsByStatus = () => {
    const groups = {
      "In Progress": jobs.filter(job => ["Processing", "Printing", "Finishing"].includes(job.status)),
      "Ready for Collection": jobs.filter(job => job.status === "Waiting for Collection"),
      "Out for Delivery": jobs.filter(job => job.status === "Out for Delivery"),
      "Recently Submitted": jobs.filter(job => ["Pending", "Received"].includes(job.status)),
    };
    return groups;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {settings?.company_name || "Loading..."}
        </h1>
        <p className="text-xl text-gray-600 mb-4">Live Job Progress Display</p>
        <div className="flex justify-center items-center gap-4 text-lg text-gray-700">
          <Calendar className="h-5 w-5" />
          <span>{currentTime.toLocaleDateString()}</span>
          <Clock className="h-5 w-5" />
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Job Status Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(groupJobsByStatus()).map(([statusGroup, groupJobs]) => (
          <Card key={statusGroup} className="shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl text-center text-gray-800">
                {statusGroup} ({groupJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {groupJobs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No jobs in this category</p>
                  </div>
                ) : (
                  groupJobs.map((job) => (
                    <Card key={job.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-800 mb-1">
                              {job.title}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              {job.services.name} • Qty: {job.quantity}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={`${getStatusColor(job.status)} text-white flex items-center gap-2 px-3 py-1`}
                          >
                            {getStatusIcon(job.status)}
                            {job.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{job.customers.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{job.customers.customer_display_id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="font-mono text-gray-700">{job.tracking_code}</span>
                          </div>
                        </div>

                        {job.estimated_completion && (
                          <div className="mt-3 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-blue-700">
                              <strong>Est. Completion:</strong> {new Date(job.estimated_completion).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-600">
        <p>This display updates automatically every 30 seconds</p>
        <p className="text-sm mt-1">
          For assistance, please visit our front desk or call {settings?.phone || "our office"}
        </p>
      </div>
    </div>
  );
};