import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface JobEditDialogProps {
  jobId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onJobUpdated: () => void;
}

interface JobDetails {
  title: string;
  description: string;
  quantity: number;
  status: string;
  quoted_price: number | null;
  final_price: number | null;
  delivery_method: string;
  delivery_address: string;
  service_id: number;
  paper_type: string;
  paper_weight: string;
  width: number | null;
  length: number | null;
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

const DELIVERY_METHODS = ["pickup", "delivery"];

export const JobEditDialog = ({ jobId, isOpen, onClose, onJobUpdated }: JobEditDialogProps) => {
  const [job, setJob] = useState<JobDetails>({
    title: "",
    description: "",
    quantity: 1,
    status: "Pending",
    quoted_price: null,
    final_price: null,
    delivery_method: "pickup",
    delivery_address: "",
    service_id: 1,
    paper_type: "",
    paper_weight: "",
    width: null,
    length: null,
  });
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && jobId) {
      fetchJobDetails();
      fetchServices();
    }
  }, [isOpen, jobId]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("id, name, service_type")
      .eq("is_active", true)
      .order("name");
    
    if (data) setServices(data);
  };

  const fetchJobDetails = async () => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) throw error;
      
      setJob({
        title: data.title || "",
        description: data.description || "",
        quantity: data.quantity || 1,
        status: data.status || "Pending",
        quoted_price: data.quoted_price,
        final_price: data.final_price,
        delivery_method: data.delivery_method || "pickup",
        delivery_address: data.delivery_address || "",
        service_id: data.service_id,
        paper_type: data.paper_type || "",
        paper_weight: data.paper_weight || "",
        width: data.width,
        length: data.length,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load job details",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const saveJob = async () => {
    if (!jobId) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          title: job.title,
          description: job.description,
          quantity: job.quantity,
          status: job.status,
          quoted_price: job.quoted_price,
          final_price: job.final_price,
          delivery_method: job.delivery_method,
          delivery_address: job.delivery_address,
          service_id: job.service_id,
          paper_type: job.paper_type,
          paper_weight: job.paper_weight,
          width: job.width,
          length: job.length,
        })
        .eq("id", jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job updated successfully",
      });
      
      onJobUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleInputChange = (field: keyof JobDetails, value: any) => {
    setJob(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job #{jobId}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center">Loading job details...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={job.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter job title"
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={job.quantity}
                  onChange={(e) => handleInputChange("quantity", parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={job.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="service">Service</Label>
                <Select 
                  value={job.service_id.toString()} 
                  onValueChange={(value) => handleInputChange("service_id", parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.name} ({service.service_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="quoted_price">Quoted Price (Le)</Label>
                <Input
                  id="quoted_price"
                  type="number"
                  step="0.01"
                  value={job.quoted_price || ""}
                  onChange={(e) => handleInputChange("quoted_price", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="final_price">Final Price (Le)</Label>
                <Input
                  id="final_price"
                  type="number"
                  step="0.01"
                  value={job.final_price || ""}
                  onChange={(e) => handleInputChange("final_price", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="delivery_method">Delivery Method</Label>
                <Select value={job.delivery_method} onValueChange={(value) => handleInputChange("delivery_method", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="paper_type">Paper Type</Label>
                <Input
                  id="paper_type"
                  value={job.paper_type}
                  onChange={(e) => handleInputChange("paper_type", e.target.value)}
                  placeholder="e.g., Glossy, Matte"
                />
              </div>
              
              <div>
                <Label htmlFor="paper_weight">Paper Weight</Label>
                <Input
                  id="paper_weight"
                  value={job.paper_weight}
                  onChange={(e) => handleInputChange("paper_weight", e.target.value)}
                  placeholder="e.g., 200gsm"
                />
              </div>
              
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={job.width || ""}
                  onChange={(e) => handleInputChange("width", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Width in cm"
                />
              </div>
              
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={job.length || ""}
                  onChange={(e) => handleInputChange("length", e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Length in cm"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={job.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Job description and special requirements"
                rows={3}
              />
            </div>
            
            {job.delivery_method === "delivery" && (
              <div>
                <Label htmlFor="delivery_address">Delivery Address</Label>
                <Textarea
                  id="delivery_address"
                  value={job.delivery_address}
                  onChange={(e) => handleInputChange("delivery_address", e.target.value)}
                  placeholder="Complete delivery address"
                  rows={2}
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={saveJob} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};