import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Package, Clock, CheckCircle, TruckIcon, MapPin, Phone, Mail, Paperclip } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface Job {
  id: number;
  title: string;
  description: string;
  quantity: number;
  status: string;
  tracking_code: string;
  created_at: string;
  estimated_completion: string | null;
  delivery_method: string;
  service_id: number;
  services: {
    name: string;
    service_type: string;
  };
  job_files: Array<{
    id: number;
    file_path: string;
    description: string | null;
    uploaded_at: string;
  }>;
}

export const JobTrackingPage = () => {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useCompanySettings();

  useEffect(() => {
    if (trackingCode) {
      fetchJob();
    }
  }, [trackingCode]);

  const fetchJob = async () => {
    if (!trackingCode) return;

    try {
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
          estimated_completion,
          delivery_method,
          service_id,
          services (
            name,
            service_type
          ),
          job_files (
            id,
            file_path,
            description,
            uploaded_at
          )
        `)
        .eq("tracking_code", trackingCode)
        .single();

      if (error || !data) {
        toast({
          title: "Job Not Found",
          description: "No job found with this tracking code",
          variant: "destructive",
        });
        return;
      }

      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "received":
        return <Clock className="h-5 w-5" />;
      case "processing":
      case "printing":
      case "finishing":
        return <Package className="h-5 w-5" />;
      case "waiting for collection":
      case "out for delivery":
        return <TruckIcon className="h-5 w-5" />;
      case "completed":
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
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

  const generateTrackingUrl = () => {
    return `${window.location.origin}/track/${trackingCode}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Job Not Found</h2>
                <p className="text-muted-foreground mb-6">
                  We couldn't find a job with tracking code: {trackingCode}
                </p>
                <Button onClick={() => navigate("/")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = [
    "Pending",
    "Received", 
    "Processing",
    "Printing",
    "Finishing",
    "Waiting for Collection",
    job.delivery_method === "Collection" ? "Completed" : "Out for Delivery",
    job.delivery_method !== "Collection" ? "Completed" : null
  ].filter(Boolean) as string[];

  const currentStepIndex = statusSteps.findIndex(step => 
    step.toLowerCase() === job.status.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-xl font-bold">{settings?.company_name || 'Loading...'}</h1>
              <p className="text-sm text-muted-foreground">Job Tracking</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Job Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{job.title}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {job.services.name} • Quantity: {job.quantity}
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2 text-lg px-4 py-2">
                  {getStatusIcon(job.status)}
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Tracking Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tracking Code</Label>
                    <p className="font-mono text-lg font-semibold">{job.tracking_code}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
                    <p className="text-sm">{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                  
                  {job.estimated_completion && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estimated Completion</Label>
                      <p className="text-sm">{new Date(job.estimated_completion).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Delivery Method</Label>
                    <p className="text-sm capitalize">{job.delivery_method}</p>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <Label className="text-sm font-medium text-muted-foreground mb-4">Share This Link</Label>
                  <QRCodeSVG
                    value={generateTrackingUrl()}
                    size={150}
                    level="M"
                    includeMargin={true}
                    className="border rounded-lg p-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Scan to track this job
                  </p>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Need Help?</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{settings?.email || 'Contact us for assistance'}</span>
                    </div>
                    {settings?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{settings.phone}</span>
                      </div>
                    )}
                    {settings?.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{settings.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Job Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusSteps.map((status, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const isUpcoming = index > currentStepIndex;
                  
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCurrent ? getStatusColor(status) + " text-white" : 
                        isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isCurrent ? (
                          getStatusIcon(status)
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCurrent ? "text-foreground" : 
                          isCompleted ? "text-muted-foreground" : "text-gray-400"
                        }`}>
                          {status}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-muted-foreground">Current stage</p>
                        )}
                      </div>
                      
                      {isCurrent && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="default" className="bg-green-500">Complete</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Job Files */}
          {job.job_files && job.job_files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Submitted Files ({job.job_files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {job.job_files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {file.file_path.split('/').pop() || 'Unknown file'}
                        </p>
                        {file.description && (
                          <p className="text-xs text-muted-foreground">{file.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Description */}
          {job.description && (
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{job.description}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};