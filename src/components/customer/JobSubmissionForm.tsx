import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Upload, X } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  requires_dimensions: boolean;
  available_subtypes: any;
  available_paper_types: any;
  available_paper_weights: any;
  available_finishes: any;
  base_price: number;
}

interface JobFormData {
  title: string;
  description: string;
  service_id: string;
  quantity: number;
  service_subtype?: string;
  paper_type?: string;
  paper_weight?: string;
  finishing_options: string[];
  width_mm?: number;
  height_mm?: number;
}

interface JobSubmissionFormProps {
  onSuccess?: () => void;
}

export const JobSubmissionForm = ({ onSuccess }: JobSubmissionFormProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { sendJobSubmittedNotification } = useNotifications();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<JobFormData>();

  const serviceId = watch("service_id");

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (serviceId) {
      const service = services.find(s => s.id.toString() === serviceId);
      setSelectedService(service || null);
    }
  }, [serviceId, services]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
      return;
    }

    setServices(data || []);
  };

  const uploadFiles = async (jobId: string): Promise<string[]> => {
    const fileUrls: string[] = [];

    for (const file of uploadedFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('job-uploads')
        .upload(fileName, file);

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload ${file.name}`);
      }

      fileUrls.push(data.path);
    }

    return fileUrls;
  };

  const onSubmit = async (formData: JobFormData) => {
    setIsSubmitting(true);

    try {
      // Get current user's customer ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!customer) throw new Error("Customer profile not found");

      // Create job
      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          customer_id: customer.id,
          service_id: parseInt(formData.service_id),
          current_status: 1, // Pending status
          delivery_method: "Pickup",
          width: formData.width_mm,
          length: formData.height_mm,
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Upload files if any
      let fileUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        fileUrls = await uploadFiles(job.id.toString());
        
        // Update job with file URLs - note: this would need job_files table
        console.log("Files uploaded:", fileUrls);
      }

      // Send notification
      try {
        await sendJobSubmittedNotification(customer.id, job.id, formData.title);
      } catch (notificationError) {
        console.warn('Notification failed but job was created:', notificationError);
      }

      toast({
        title: "Success!",
        description: `Job has been submitted successfully. Job ID: ${job.id}`,
      });

      reset();
      setUploadedFiles([]);
      setSelectedService(null);
      onSuccess?.();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit job",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Submit New Print Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                {...register("title", { required: "Job title is required" })}
                placeholder="e.g., Business Cards for John Doe"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...register("quantity", { 
                  required: "Quantity is required",
                  min: { value: 1, message: "Quantity must be at least 1" }
                })}
                placeholder="e.g., 100"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Additional details about your print job..."
              rows={3}
            />
          </div>

          {/* Service Selection */}
          <div>
            <Label htmlFor="service">Service Type *</Label>
            <Select onValueChange={(value) => setValue("service_id", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - ${service.base_price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.service_id && (
              <p className="text-sm text-destructive mt-1">Service selection is required</p>
            )}
          </div>

          {/* Service-specific options */}
          {selectedService && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">Service Options</h3>
              
              {/* Subtypes for SAV and Banner */}
              {selectedService.available_subtypes && selectedService.available_subtypes.length > 0 && (
                <div>
                  <Label htmlFor="subtype">{selectedService.service_type} Type</Label>
                  <Select onValueChange={(value) => setValue("service_subtype", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${selectedService.service_type} type`} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedService.available_subtypes.map((subtype) => (
                        <SelectItem key={subtype} value={subtype}>
                          {subtype}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dimensions for SAV and Banner */}
              {selectedService.requires_dimensions && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (mm) *</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      {...register("width_mm", { 
                        required: "Width is required for this service" 
                      })}
                      placeholder="e.g., 1000"
                    />
                    {errors.width_mm && (
                      <p className="text-sm text-destructive mt-1">{errors.width_mm.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="height">Height (mm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      {...register("height_mm", { 
                        required: "Height is required for this service" 
                      })}
                      placeholder="e.g., 500"
                    />
                    {errors.height_mm && (
                      <p className="text-sm text-destructive mt-1">{errors.height_mm.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Paper Type */}
              {selectedService.available_paper_types && selectedService.available_paper_types.length > 0 && (
                <div>
                  <Label htmlFor="paper_type">Paper Type</Label>
                  <Select onValueChange={(value) => setValue("paper_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper type" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedService.available_paper_types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Paper Weight */}
              {selectedService.available_paper_weights && selectedService.available_paper_weights.length > 0 && (
                <div>
                  <Label htmlFor="paper_weight">Paper Weight</Label>
                  <Select onValueChange={(value) => setValue("paper_weight", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedService.available_paper_weights.map((weight) => (
                        <SelectItem key={weight} value={weight}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Finishing Options */}
              {selectedService.available_finishes && selectedService.available_finishes.length > 0 && (
                <div>
                  <Label>Finishing Options</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedService.available_finishes.map((finish) => (
                      <label key={finish} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          value={finish}
                          onChange={(e) => {
                            const current = watch("finishing_options") || [];
                            if (e.target.checked) {
                              setValue("finishing_options", [...current, finish]);
                            } else {
                              setValue("finishing_options", current.filter(f => f !== finish));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{finish}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          <div>
            <Label htmlFor="files">Upload Files</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload files or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, PNG, JPG up to 50MB each
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <Label>Uploaded Files:</Label>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Submit Job"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};