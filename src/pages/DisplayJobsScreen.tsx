import { useState } from "react";
  // Payroll modal state
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ name: "", amount: "", date: "" });

  const handlePayrollChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPayrollForm({ ...payrollForm, [e.target.name]: e.target.value });
  };

  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Payroll Created:", payrollForm);
    setPayrollOpen(false);
    setPayrollForm({ name: "", amount: "", date: "" });
    alert("Payroll created (demo only)");
  };
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8 text-center relative">
        {/* Create Payroll Button */}
        <div className="absolute right-8 top-0 z-20">
          <button
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg border border-indigo-300 hover:bg-indigo-700 transition"
            onClick={() => setPayrollOpen(true)}
          >
            Create Payroll
          </button>
        </div>
      {/* Payroll Modal */}
      {payrollOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setPayrollOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-indigo-700 text-center">Create Payroll</h2>
            <form onSubmit={handlePayrollSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                <input
                  type="text"
                  name="name"
                  value={payrollForm.name}
                  onChange={handlePayrollChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={payrollForm.amount}
                  onChange={handlePayrollChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={payrollForm.date}
                  onChange={handlePayrollChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold shadow hover:bg-indigo-700 transition"
              >
                Submit Payroll
              </button>
            </form>
          </div>
        </div>
      )}
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {settings?.company_name || "Loading..."}
        </h1>
        <p className="text-xl text-gray-600 mb-4">Live Job Progress Display</p>
        <div className="flex justify-center items-center gap-6 text-lg text-gray-700 mb-4">
          <Calendar className="h-5 w-5" />
          <span>{currentTime.toLocaleDateString()}</span>
          <Clock className="h-5 w-5" />
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
        <div className="bg-white/80 rounded-lg p-4 inline-block">
          <p className="text-2xl font-bold text-primary">
            Total Active Jobs: {getTotalJobCount()}
          </p>
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