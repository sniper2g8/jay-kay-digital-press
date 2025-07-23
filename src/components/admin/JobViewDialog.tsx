import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  DollarSign,
  Clock,
  ExternalLink
} from "lucide-react";

interface JobDetails {
  id: number;
  title: string;
  description: string;
  quantity: number;
  status: string;
  tracking_code: string;
  created_at: string;
  updated_at: string;
  estimated_completion: string | null;
  actual_completion: string | null;
  quoted_price: number | null;
  final_price: number | null;
  delivery_method: string;
  delivery_address: string | null;
  paper_type: string | null;
  paper_weight: string | null;
  service_subtype: string | null;
  finishing_options: any;
  customers: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    customer_display_id: string;
  } | null;
  services: {
    name: string;
    service_type: string;
    description: string | null;
  } | null;
}

interface JobViewDialogProps {
  jobId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobViewDialog = ({ jobId, isOpen, onClose }: JobViewDialogProps) => {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (jobId && isOpen) {
      fetchJobDetails();
    }
  }, [jobId, isOpen]);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          customers!jobs_customer_uuid_fkey (
            id,
            name,
            email,
            phone,
            customer_display_id
          ),
          services (
            name,
            service_type,
            description
          )
        `)
        .eq("id", jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    return `${window.location.origin}/track/${job?.tracking_code}`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Job Details {job && `- ${job.title || `Job #${job.id}`}`}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p>Loading job details...</p>
            </div>
          </div>
        ) : job ? (
          <div className="space-y-6">
            {/* Job Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Job Overview</span>
                  <Badge variant="secondary" className={`${getStatusColor(job.status)} text-white`}>
                    {job.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Job Information
                    </h4>
                    <div className="ml-6 space-y-1 text-sm">
                      <p><strong>Title:</strong> {job.title || `Job #${job.id}`}</p>
                      <p><strong>Tracking Code:</strong> 
                        <code className="ml-2 bg-muted px-1 rounded">{job.tracking_code}</code>
                      </p>
                      <p><strong>Quantity:</strong> {job.quantity}</p>
                      <p><strong>Service:</strong> {job.services?.name}</p>
                      {job.service_subtype && (
                        <p><strong>Type:</strong> {job.service_subtype}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dates
                    </h4>
                    <div className="ml-6 space-y-1 text-sm">
                      <p><strong>Created:</strong> {new Date(job.created_at).toLocaleString()}</p>
                      <p><strong>Updated:</strong> {new Date(job.updated_at).toLocaleString()}</p>
                      {job.estimated_completion && (
                        <p><strong>Est. Completion:</strong> {new Date(job.estimated_completion).toLocaleString()}</p>
                      )}
                      {job.actual_completion && (
                        <p><strong>Completed:</strong> {new Date(job.actual_completion).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </h4>
                    <div className="ml-6 space-y-1 text-sm">
                      {job.quoted_price && (
                        <p><strong>Quoted Price:</strong> Le {job.quoted_price.toLocaleString()}</p>
                      )}
                      {job.final_price && (
                        <p><strong>Final Price:</strong> Le {job.final_price.toLocaleString()}</p>
                      )}
                      {!job.quoted_price && !job.final_price && (
                        <p className="text-muted-foreground">No pricing set</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Delivery
                    </h4>
                    <div className="ml-6 space-y-1 text-sm">
                      <p><strong>Method:</strong> {job.delivery_method}</p>
                      {job.delivery_address && (
                        <p><strong>Address:</strong> {job.delivery_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            {job.customers && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {job.customers.name}</p>
                      <p><strong>Customer ID:</strong> {job.customers.customer_display_id}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {job.customers.email}
                      </p>
                      {job.customers.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {job.customers.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Job Description & Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {job.description && (
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{job.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {job.paper_type && (
                      <div>
                        <strong>Paper Type:</strong>
                        <p>{job.paper_type}</p>
                      </div>
                    )}
                    {job.paper_weight && (
                      <div>
                        <strong>Paper Weight:</strong>
                        <p>{job.paper_weight}</p>
                      </div>
                    )}
                    {job.finishing_options && (
                      <div>
                        <strong>Finishing:</strong>
                        <p>{JSON.stringify(job.finishing_options)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* QR Code & Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Tracking & Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <QRCodeSVG
                      value={generateTrackingUrl()}
                      size={120}
                      level="M"
                      includeMargin={true}
                      className="border rounded"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Customer Tracking QR</p>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(generateTrackingUrl(), '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Public Tracking Page
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generateTrackingUrl());
                        toast({ title: "Copied!", description: "Tracking URL copied to clipboard" });
                      }}
                      className="w-full"
                    >
                      Copy Tracking Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Job Not Found</h3>
            <p className="text-muted-foreground">Could not load job details.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};