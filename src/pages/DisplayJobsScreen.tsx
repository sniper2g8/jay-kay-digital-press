import { Fragment, useState, useEffect } from "react";
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
  services: {
    name: string;
    service_type: string;
  };
}

export const DisplayJobsScreen = () => {
  // Status filter state
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { settings } = useCompanySettings();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);

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

  const getTotalJobCount = () => {
    return jobs.length;
  };

  // Status summary counts
  const statusSummary = [
    { label: "Pending", value: jobs.filter(j => j.status.toLowerCase() === "pending").length, color: "bg-yellow-500", icon: <Clock className="h-5 w-5" /> },
    { label: "Processing", value: jobs.filter(j => ["processing", "printing", "finishing"].includes(j.status.toLowerCase())).length, color: "bg-orange-500", icon: <Package className="h-5 w-5" /> },
    { label: "Out for Delivery", value: jobs.filter(j => ["out for delivery", "waiting for collection"].includes(j.status.toLowerCase())).length, color: "bg-indigo-500", icon: <TruckIcon className="h-5 w-5" /> },
    { label: "Completed", value: jobs.filter(j => j.status.toLowerCase() === "completed").length, color: "bg-green-500", icon: <CheckCircle className="h-5 w-5" /> },
  ];

  // Filter jobs by status if filter is set
  const visibleJobs = statusFilter ? jobs.filter(j => {
    switch (statusFilter) {
      case "Pending": return j.status.toLowerCase() === "pending";
      case "Processing": return ["processing", "printing", "finishing"].includes(j.status.toLowerCase());
      case "Out for Delivery": return ["out for delivery", "waiting for collection"].includes(j.status.toLowerCase());
      case "Completed": return j.status.toLowerCase() === "completed";
      default: return true;
    }
  }) : jobs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 relative">
      {/* SVG Watermark */}
      <svg className="absolute bottom-8 right-8 w-32 h-32 opacity-10 pointer-events-none z-0" viewBox="0 0 100 100">
        <text x="50%" y="50%" textAnchor="middle" fill="#6366f1" fontSize="22" fontWeight="bold" dy=".3em">Jay Kay</text>
      </svg>
      {/* Header & Summary Bar */}
      <div className="mb-8 text-center relative z-10">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-800 mb-2">
          {settings?.company_name || "Loading..."}
        </h1>
        <p className="text-xl text-gray-600 mb-2">Live Job Progress Display</p>
        <p className="text-sm text-indigo-500 mb-4 font-semibold tracking-wide">Your trusted digital press partner</p>
        <div className="flex justify-center items-center gap-6 text-lg text-gray-700 mb-4">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <span>{currentTime.toLocaleDateString()}</span>
          <Clock className="h-5 w-5 text-indigo-500" />
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
        <div className="backdrop-blur-md bg-white/40 rounded-2xl p-5 inline-block shadow-lg border border-white/20 mb-6">
          <p className="text-2xl font-bold text-primary bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Total Active Jobs: {getTotalJobCount()}
          </p>
        </div>
        {/* Status Summary Bar */}
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          {statusSummary.map((stat) => (
            <button
              key={stat.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-md transition-all duration-200 ${stat.color} bg-opacity-80 text-white hover:scale-105 hover:shadow-lg focus:outline-none ${statusFilter === stat.label ? 'ring-2 ring-indigo-400' : ''}`}
              onClick={() => setStatusFilter(statusFilter === stat.label ? null : stat.label)}
            >
              {stat.icon}
              <span>{stat.label}</span>
              <span className="ml-2 px-2 py-1 rounded bg-white/20 text-xs font-bold">{stat.value}</span>
            </button>
          ))}
        </div>
        {statusFilter && (
          <button className="mt-2 text-xs text-indigo-600 underline" onClick={() => setStatusFilter(null)}>
            Clear Filter
          </button>
        )}
      </div>

      {/* Unified Job Grid - No Scrolling, All Jobs Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
        {visibleJobs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50 text-indigo-400" />
            <p className="text-lg">No jobs available</p>
          </div>
        ) : (
          visibleJobs.map((job) => (
            <Card
              key={job.id}
              className="backdrop-blur-md bg-white/60 shadow-xl rounded-xl border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-200/20 hover:border-indigo-400 hover:scale-105 cursor-pointer"
              onClick={() => { setSelectedJob(job); setJobModalOpen(true); }}
            >
              <CardContent className="p-5 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-1">{job.title}</h3>
                    <p className="text-gray-600 text-sm">{job.services.name} • Qty: {job.quantity}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(job.status)} bg-opacity-90 backdrop-blur-sm text-white flex items-center gap-2 px-3 py-1 rounded-full shadow-sm cursor-pointer`} 
                    onClick={e => { e.stopPropagation(); setStatusFilter(job.status); }}
                  >
                    {getStatusIcon(job.status)}
                    {job.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    <span className="text-gray-700">{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <span className="font-mono text-gray-700">{job.tracking_code}</span>
                  </div>
                </div>
                {job.estimated_completion && (
                  <div className="mt-2 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100/50">
                    <p className="text-xs bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent font-medium">
                      <strong>Est. Completion:</strong> {new Date(job.estimated_completion).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      {jobModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setJobModalOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-indigo-700 text-center">Job Details</h2>
            <div className="space-y-2">
              <div className="font-bold text-lg">{selectedJob.title}</div>
              <div className="text-gray-600">Service: {selectedJob.services.name} ({selectedJob.services.service_type})</div>
              <div className="text-gray-600">Qty: {selectedJob.quantity}</div>
              <div className="text-gray-600">Status: <span className={`px-2 py-1 rounded ${getStatusColor(selectedJob.status)} text-white`}>{selectedJob.status}</span></div>
              <div className="text-gray-600">Created: {new Date(selectedJob.created_at).toLocaleDateString()}</div>
              <div className="text-gray-600">Tracking Code: <span className="font-mono">{selectedJob.tracking_code}</span></div>
              {selectedJob.estimated_completion && (
                <div className="text-blue-700">Est. Completion: {new Date(selectedJob.estimated_completion).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </div>
      )}

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