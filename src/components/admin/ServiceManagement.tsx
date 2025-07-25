import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Settings, Eye, EyeOff } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  SERVICE_TYPES, 
  SAV_TYPES, 
  BANNER_TYPES, 
  PAPER_TYPES, 
  PAPER_WEIGHTS,
  FINISHING_OPTIONS,
  DEFAULT_SERVICES,
  type ServiceType 
} from '@/constants/services';

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  base_price: number;
  requires_dimensions: boolean;
  available_subtypes: any;
  available_paper_types: any;
  available_paper_weights: any;
  available_finishes: any;
  is_active: boolean;
}

interface ServiceFormData {
  name: string;
  description: string;
  service_type: string;
  base_price: number;
  requires_dimensions: boolean;
  available_subtypes: string[];
  available_paper_types: string[];
  available_paper_weights: string[];
  available_finishes: string[];
}

// Use constants from the centralized services file

export const ServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ServiceFormData>();

  const serviceType = watch("service_type");

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    // Auto-populate subtypes based on service type
    if (serviceType === "SAV") {
      setValue("available_subtypes", [...SAV_TYPES]);
      setValue("requires_dimensions", true);
    } else if (serviceType === "Banner") {
      setValue("available_subtypes", [...BANNER_TYPES]);
      setValue("requires_dimensions", true);
    } else {
      setValue("available_subtypes", []);
      setValue("requires_dimensions", false);
    }
  }, [serviceType, setValue]);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load services");
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  const onSubmit = async (formData: ServiceFormData) => {
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        service_type: formData.service_type,
        base_price: formData.base_price,
        requires_dimensions: formData.requires_dimensions,
        available_subtypes: formData.available_subtypes.length > 0 ? formData.available_subtypes : null,
        available_paper_types: formData.available_paper_types,
        available_paper_weights: formData.available_paper_weights,
        available_finishes: formData.available_finishes,
        is_active: true,
      };

      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update(serviceData)
          .eq("id", editingService.id);

        if (error) throw error;

        toast.success("Service updated successfully");
      } else {
        const { error } = await supabase
          .from("services")
          .insert(serviceData);

        if (error) throw error;

        toast.success("Service created successfully");
      }

      reset();
      setEditingService(null);
      setIsDialogOpen(false);
      fetchServices();
    } catch (error: any) {
      toast.error(error.message || "Failed to save service");
    }
  };

  const toggleServiceStatus = async (serviceId: number, isActive: boolean) => {
    const { error } = await supabase
      .from("services")
      .update({ is_active: !isActive })
      .eq("id", serviceId);

    if (error) {
      toast.error("Failed to update service status");
    } else {
      toast.success(`Service ${!isActive ? "activated" : "deactivated"} successfully`);
      fetchServices();
    }
  };

  const [deleteServiceDialog, setDeleteServiceDialog] = useState<{ open: boolean; serviceId?: number }>({ open: false });

  const handleDeleteService = (serviceId: number) => {
    setDeleteServiceDialog({ open: true, serviceId });
  };

  const confirmDeleteService = async () => {
    const { serviceId } = deleteServiceDialog;
    if (!serviceId) return;
    
    setDeleteServiceDialog({ open: false });

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      toast.error("Failed to delete service");
    } else {
      toast.success("Service deleted successfully");
      fetchServices();
    }
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setValue("name", service.name);
    setValue("description", service.description);
    setValue("service_type", service.service_type);
    setValue("base_price", service.base_price);
    setValue("requires_dimensions", service.requires_dimensions);
    setValue("available_subtypes", service.available_subtypes || []);
    setValue("available_paper_types", service.available_paper_types);
    setValue("available_paper_weights", service.available_paper_weights);
    setValue("available_finishes", service.available_finishes);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Edit Service" : "Create New Service"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "Service name is required" })}
                    placeholder="e.g., Premium Business Cards"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="base_price">Base Price *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("base_price", { 
                      required: "Base price is required",
                      min: { value: 0, message: "Price must be positive" }
                    })}
                    placeholder="0.00"
                  />
                  {errors.base_price && (
                    <p className="text-sm text-destructive mt-1">{errors.base_price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe this service..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="service_type">Service Type *</Label>
                <Select onValueChange={(value) => setValue("service_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SERVICE_TYPES).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.service_type && (
                  <p className="text-sm text-destructive mt-1">Service type is required</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requires_dimensions"
                  {...register("requires_dimensions")}
                  className="rounded"
                />
                <Label htmlFor="requires_dimensions">Requires Dimensions</Label>
              </div>

              {/* Service-specific subtypes */}
              {(serviceType === "SAV" || serviceType === "Banner") && (
                <div>
                  <Label>Available Subtypes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(serviceType === "SAV" ? SAV_TYPES : BANNER_TYPES).map((subtype) => (
                      <label key={subtype} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={subtype}
                          defaultChecked={true}
                          onChange={(e) => {
                            const current = watch("available_subtypes") || [];
                            if (e.target.checked) {
                              setValue("available_subtypes", [...current, subtype]);
                            } else {
                              setValue("available_subtypes", current.filter(s => s !== subtype));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{subtype}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Paper Types */}
              <div>
                <Label>Available Paper Types</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto">
                  {PAPER_TYPES.map((type) => (
                    <label key={type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={type}
                        onChange={(e) => {
                          const current = watch("available_paper_types") || [];
                          if (e.target.checked) {
                            setValue("available_paper_types", [...current, type]);
                          } else {
                            setValue("available_paper_types", current.filter(t => t !== type));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-xs">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Paper Weights */}
              <div>
                <Label>Available Paper Weights</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {PAPER_WEIGHTS.map((weight) => (
                    <label key={weight} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={weight}
                        onChange={(e) => {
                          const current = watch("available_paper_weights") || [];
                          if (e.target.checked) {
                            setValue("available_paper_weights", [...current, weight]);
                          } else {
                            setValue("available_paper_weights", current.filter(w => w !== weight));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-xs">{weight}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Finishes */}
              <div>
                <Label>Available Finishes</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {FINISHING_OPTIONS.map((finish) => (
                    <label key={finish.id} className="flex items-center space-x-2">
                       <input
                         type="checkbox"
                         value={finish.id}
                         onChange={(e) => {
                           const current = watch("available_finishes") || [];
                           if (e.target.checked) {
                             setValue("available_finishes", [...current, finish.id]);
                           } else {
                             setValue("available_finishes", current.filter(f => f !== finish.id));
                           }
                         }}
                         className="rounded"
                       />
                       <span className="text-sm">{finish.name} (+Le {finish.price.toFixed(2)})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingService ? "Update Service" : "Create Service"}
                </Button>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Services ({services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
              <p>Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services</h3>
              <p className="text-muted-foreground">Create your first service to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground">
                            {service.description.length > 50 
                              ? `${service.description.substring(0, 50)}...`
                              : service.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.service_type}</Badge>
                    </TableCell>
                    <TableCell>Le {service.base_price.toFixed(2)}</TableCell>
                    <TableCell>
                      {service.requires_dimensions ? (
                        <Badge variant="secondary">Required</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                      >
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openEditDialog(service)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteServiceDialog.open}
        onOpenChange={(open) => setDeleteServiceDialog({ open })}
        title="Delete Service"
        description="Are you sure you want to delete this service? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDeleteService}
      />
    </div>
  );
};