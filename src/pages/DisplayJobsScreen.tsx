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
        return "bg-[#8B1E2B]"; // dark red
      case "received":
        return "bg-[#8B1E2B]"; // dark red
      case "processing":
      case "printing":
        return "bg-[#1B2653]"; // navy
      case "finishing":
        return "bg-[#A3B4D8]"; // soft blue
      case "waiting for collection":
      case "out for delivery":
        return "bg-[#F8FAFC] border border-[#A3B4D8] text-[#1B2653]"; // light neutral
      case "completed":
        return "bg-[#F2F2F2] text-[#1B2653] border border-[#A3B4D8]"; // soft neutral
      default:
        return "bg-[#E5E7EB] text-[#1B2653]"; // very light gray
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
    <div className="min-h-screen bg-gradient-to-br from-[#1B2653] via-[#F8FAFC] to-[#A3B4D8] relative overflow-x-hidden">
      {/* Decorative SVG background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <svg width="100%" height="100%" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-15">
          <defs>
            <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1B2653" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#A3B4D8" stopOpacity="0.16" />
            </linearGradient>
          </defs>
          <path fill="url(#bgGrad)" d="M0,160L60,165.3C120,171,240,181,360,165.3C480,149,600,107,720,117.3C840,128,960,192,1080,218.7C1200,245,1320,235,1380,229.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
        </svg>
      </div>

      {/* Header */}
      <div className="mb-8 text-center relative z-10">
        <h1 className="text-5xl font-extrabold text-[#1B2653] mb-2 drop-shadow-lg tracking-tight">
          <span className="inline-flex items-center gap-4 justify-center mt-8">
            {settings?.logo_url && (
              <img src={settings.logo_url} alt="Company Logo" className="h-12 w-12 object-contain rounded-full border border-[#8B1E2B] bg-white" />
            )}
            <span className="text-5xl font-extrabold text-[#8B1E2B] drop-shadow-lg tracking-tight font-[Poppins]">
              {settings?.company_name || "Loading..."}
            </span>
          </span>
        </h1>
        <p className="text-xl text-[#1B2653] mb-4 font-medium">Live Job Progress Display</p>
        <div className="flex justify-center items-center gap-8 text-lg text-gray-700 mb-4">
          <span className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-1 shadow">
            <Calendar className="h-5 w-5 text-[#1B2653]" />
            {currentTime.toLocaleDateString()}
          </span>
          <span className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-1 shadow">
            <Clock className="h-5 w-5 text-[#1B2653]" />
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
        <div className="bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-xl px-8 py-3 inline-block shadow-lg mt-2">
          <div className="bg-white/80 rounded-xl px-8 py-3 inline-block shadow-lg mt-2 border border-[#A3B4D8]/40">
            <p className="text-2xl font-bold text-[#1B2653]">
              Total Active Jobs: <span className="text-[#8B1E2B]">{getTotalJobCount()}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Status Summary Bar */}
      <div className="flex flex-wrap justify-center gap-6 mb-8 relative z-10">
        {Object.entries(groupJobsByStatus()).map(([statusGroup, groupJobs]) => (
          <div key={statusGroup} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-lg shadow-lg border border-[#A3B4D8]/40">
            <span className="inline-flex items-center gap-2 text-[#1B2653] font-bold text-lg">
              {getStatusIcon(statusGroup)}
              {statusGroup}
            </span>
            <span className="bg-[#8B1E2B] text-white rounded-full px-4 py-1 text-base font-semibold shadow border border-[#1B2653]/10">
              {groupJobs.length}
            </span>
          </div>
        ))}
      </div>

      {/* Unified Jobs Grid - all jobs, no scrolling */}
      <div className="w-full px-2 md:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
          {jobs.length === 0 ? (
            <div className="col-span-full text-center py-12 text-[#1B2653]/60 bg-white/80 rounded-2xl shadow">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No jobs available</p>
            </div>
          ) : (
            jobs.map((job, idx) => (
              <Card
                key={job.id}
                className={`border-l-8 ${getStatusColor(job.status)} bg-white/30 backdrop-blur-lg rounded-3xl shadow-2xl transition-all duration-300 animate-fade-in hover:scale-[1.04] hover:shadow-[#8B1E2B]/40 hover:border-[#8B1E2B]`}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(12px)',
                  animationDelay: `${idx * 60}ms`
                }}
              >
                <CardContent className="p-7">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-2xl text-[#1B2653] mb-2 tracking-tight">
                        {job.title}
                      </h3>
                      <p className="text-[#1B2653]/80 text-lg mb-2">
                        <span className="font-semibold text-[#8B1E2B]">{job.services.name}</span> &bull; Qty: <span className="font-mono text-[#1B2653]">{job.quantity}</span>
                      </p>
                    </div>
                    {job.status.toLowerCase() !== "received" && (
                      <span className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#F7C948] to-[#1B2653] shadow-lg p-3 mr-2">
                        {getStatusIcon(job.status)}
                      </span>
                    )}
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(job.status)} text-white flex items-center gap-2 px-5 py-2 text-lg font-bold shadow-lg rounded-xl border-2 border-white/30`}
                      aria-label={job.status}
                    >
                      {job.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-8 text-lg mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#1B2653]" />
                      <span className="text-[#1B2653]/80">
                        {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#1B2653]" />
                      <span className="font-mono text-[#8B1E2B]">{job.tracking_code}</span>
                    </div>
                  </div>

                  {job.estimated_completion && (
                    <div className="mt-5 p-3 bg-[#8B1E2B]/10 rounded-xl border border-[#8B1E2B]/40 shadow">
                      <p className="text-lg text-[#1B2653] font-semibold">
                        <strong>Est. Completion:</strong> {new Date(job.estimated_completion).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 text-center text-[#1B2653] pb-10 relative z-10">
        <p className="text-lg">This display updates automatically every 30 seconds</p>
        <p className="text-base mt-2">
          For assistance, please visit our front desk or call <span className="font-bold text-[#8B1E2B]">{settings?.phone || "our office"}</span>
        </p>
      </div>

      {/* Fade-in animation style */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap');
        body {
          font-family: 'Poppins', sans-serif;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both;
        }
      `}</style>
    </div>
  );
};