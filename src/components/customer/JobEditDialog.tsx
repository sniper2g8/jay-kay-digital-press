import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface Job {
  id: number;
  title: string;
  description: string;
  quantity: number;
  service_id: number;
  delivery_method: string;
  delivery_address?: string;
  status: string;
}

interface Service {
  id: number;
  name: string;
}

interface JobEditDialogProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JobEditDialog = ({ job, isOpen, onClose, onSuccess }: JobEditDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    quantity: 1,
    service_id: 0,
    delivery_method: "",
    delivery_address: "",
  });
  const { toast } = useToast();

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name")
        .eq("is_active", true);
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  // Populate form when job changes
  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        quantity: job.quantity || 1,
        service_id: job.service_id || 0,
        delivery_method: job.delivery_method || "",
        delivery_address: job.delivery_address || "",
      });
    }
  }, [job]);

  const canEditJob = (status: string) => {
    // Allow editing only for jobs that haven't started processing
    return ["Pending", "Received"].includes(status);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    // Check if job can be edited
    if (!canEditJob(job.status)) {
      toast({
        title: "Cannot Edit Job",
        description: "This job has already started processing and cannot be edited.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          title: formData.title,
          description: formData.description,
          quantity: formData.quantity,
          service_id: formData.service_id,
          delivery_method: formData.delivery_method,
          delivery_address: formData.delivery_address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating job:", error);
      toast({
        title: "Error",
        description: "Failed to update job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  const canEdit = canEditJob(job.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {canEdit ? "Edit Job" : "View Job Details"}
          </DialogTitle>
        </DialogHeader>

        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-800 text-sm">
              This job has started processing and cannot be edited. You can only view the details.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter job title"
                required
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
                }
                required
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Select
              value={formData.service_id.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, service_id: parseInt(value) })
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe your print job requirements"
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_method">Delivery Method *</Label>
            <Select
              value={formData.delivery_method}
              onValueChange={(value) =>
                setFormData({ ...formData, delivery_method: value })
              }
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.delivery_method === "delivery" && (
            <div className="space-y-2">
              <Label htmlFor="delivery_address">Delivery Address *</Label>
              <Textarea
                id="delivery_address"
                value={formData.delivery_address}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_address: e.target.value })
                }
                placeholder="Enter delivery address"
                required
                disabled={!canEdit}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {canEdit ? "Cancel" : "Close"}
            </Button>
            {canEdit && (
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Job
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};