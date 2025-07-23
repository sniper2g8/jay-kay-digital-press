import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";

interface Customer {
  id: string;
  name: string;
  email: string;
  customer_display_id: string;
  profile_id?: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  requires_dimensions: boolean;
  available_subtypes: any;
  available_paper_types: any;
  available_paper_weights: any;
  base_price: number;
}

interface JobFormData {
  title: string;
  description: string;
  customer_id: string;
  service_id: string;
  quantity: number;
  service_subtype?: string;
  paper_type?: string;
  paper_weight?: string;
  width?: number;
  length?: number;
  delivery_method: string;
  delivery_address?: string;
  quoted_price?: number;
  final_price?: number;
  due_date?: string;
}

interface JobCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: () => void;
}

export const JobCreationDialog = ({ isOpen, onClose, onJobCreated }: JobCreationDialogProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { sendJobSubmittedNotification } = useNotifications();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<JobFormData>({
    defaultValues: {
      quantity: 1,
      delivery_method: "pickup"
    }
  });

  const watchedServiceId = watch("service_id");
  const watchedDeliveryMethod = watch("delivery_method");

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      fetchServices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (watchedServiceId) {
      const service = services.find(s => s.id.toString() === watchedServiceId);
      setSelectedService(service || null);
    }
  }, [watchedServiceId, services]);

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select(`
        id, 
        name, 
        email, 
        customer_display_id,
        profiles!inner(id)
      `)
      .order("name");
    
    if (error) {
      console.error("Error fetching customers:", error);
      return;
    }
    
    // Transform the data to include profile_id
    const transformedData = data?.map(customer => ({
      ...customer,
      profile_id: customer.profiles?.[0]?.id
    })) || [];
    
    setCustomers(transformedData);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name");
    
    if (error) {
      console.error("Error fetching services:", error);
      return;
    }
    
    setServices(data || []);
  };

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    
    try {
      // Find the selected customer to get both IDs
      const selectedCustomer = customers.find(c => c.id === data.customer_id);
      if (!selectedCustomer || !selectedCustomer.profile_id) {
        throw new Error("Selected customer not found or missing profile");
      }

      // Get the first available workflow status
      const { data: statusData, error: statusError } = await supabase
        .from("workflow_status")
        .select("id")
        .order("order_index")
        .limit(1);

      if (statusError) throw statusError;

      const currentStatusId = statusData?.[0]?.id || 1;

      const jobData = {
        title: data.title,
        description: data.description,
        customer_id: selectedCustomer.profile_id, // This should reference profiles.id
        customer_uuid: selectedCustomer.id, // This should reference customers.id
        service_id: parseInt(data.service_id),
        quantity: data.quantity,
        service_subtype: data.service_subtype || null,
        paper_type: data.paper_type || null,
        paper_weight: data.paper_weight || null,
        width: data.width || null,
        length: data.length || null,
        delivery_method: data.delivery_method,
        delivery_address: data.delivery_address || null,
        quoted_price: data.quoted_price || null,
        final_price: data.final_price || null,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        current_status: currentStatusId,
        status: "Pending",
        created_by_user: (await supabase.auth.getUser()).data.user?.id
      };

      const { data: newJob, error: jobError } = await supabase
        .from("jobs")
        .insert([jobData])
        .select()
        .single();

      if (jobError) throw jobError;

      // Send notification to customer
      try {
        await sendJobSubmittedNotification(selectedCustomer.id, newJob.id, data.title);
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
      }

      toast({
        title: "Success",
        description: "Job created successfully",
      });

      reset();
      onJobCreated();
      onClose();
    } catch (error: any) {
      console.error("Error creating job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Job title is required" })}
                placeholder="Enter job title"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customer_id">Customer</Label>
              <Select onValueChange={(value) => setValue("customer_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.customer_display_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && (
                <p className="text-sm text-red-500 mt-1">Customer is required</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter job description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_id">Service</Label>
              <Select onValueChange={(value) => setValue("service_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.service_id && (
                <p className="text-sm text-red-500 mt-1">Service is required</p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...register("quantity", { required: "Quantity is required", min: 1 })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          {selectedService?.available_subtypes && (
            <div>
              <Label htmlFor="service_subtype">Service Subtype</Label>
              <Select onValueChange={(value) => setValue("service_subtype", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  {selectedService.available_subtypes.map((subtype: string) => (
                    <SelectItem key={subtype} value={subtype}>
                      {subtype}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedService?.available_paper_types && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paper_type">Paper Type</Label>
                <Select onValueChange={(value) => setValue("paper_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select paper type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedService.available_paper_types.map((type: string) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedService?.available_paper_weights && (
                <div>
                  <Label htmlFor="paper_weight">Paper Weight</Label>
                  <Select onValueChange={(value) => setValue("paper_weight", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedService.available_paper_weights.map((weight: string) => (
                        <SelectItem key={weight} value={weight}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {selectedService?.requires_dimensions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (mm)</Label>
                <Input
                  id="width"
                  type="number"
                  min="1"
                  {...register("width")}
                  placeholder="Enter width in mm"
                />
              </div>
              <div>
                <Label htmlFor="length">Length (mm)</Label>
                <Input
                  id="length"
                  type="number"
                  min="1"
                  {...register("length")}
                  placeholder="Enter length in mm"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_method">Delivery Method</Label>
              <Select onValueChange={(value) => setValue("delivery_method", value)} defaultValue="pickup">
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
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                {...register("due_date")}
              />
            </div>
          </div>

          {watchedDeliveryMethod === "delivery" && (
            <div>
              <Label htmlFor="delivery_address">Delivery Address</Label>
              <Textarea
                id="delivery_address"
                {...register("delivery_address")}
                placeholder="Enter delivery address"
                rows={2}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quoted_price">Quoted Price (Le)</Label>
              <Input
                id="quoted_price"
                type="number"
                step="0.01"
                min="0"
                {...register("quoted_price")}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="final_price">Final Price (Le)</Label>
              <Input
                id="final_price"
                type="number"
                step="0.01"
                min="0"
                {...register("final_price")}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};