import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useNotifications } from "@/hooks/useNotifications";
import { Upload, X, Loader2, Plus, FileText, AlertTriangle, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { 
  FINISHING_OPTIONS,
  type FinishingOption
} from '@/constants/services';
import { validateFileUpload, sanitizeInput, validateNumericInput } from "@/utils/inputValidation";
import { handleError } from "@/utils/errorHandling";

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

interface JobFile {
  file: File;
  title: string;
  description: string;
  quantity: number;
  service_subtype?: string;
  paper_type?: string;
  paper_weight?: string;
  finishing_options: string[];
  width_mm?: number;
  height_mm?: number;
}

interface JobFormData {
  delivery_method: string;
  delivery_address?: string;
}

interface JobSubmissionFormProps {
  onSuccess?: () => void;
}

export const JobSubmissionForm = ({ onSuccess }: JobSubmissionFormProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [jobFiles, setJobFiles] = useState<JobFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isUploading, setIsUploading] = useState(false);
  const { sendJobSubmittedNotification, sendAdminJobNotification } = useNotifications();
  const { trackJobCreated } = useAnalytics();
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<JobFormData>({
    defaultValues: {
      delivery_method: "pickup"
    }
  });

  const deliveryMethod = watch("delivery_method");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      toast.error("Failed to load services");
      return;
    }

    setServices(data as Service[] || []);
    if (data && data.length > 0) {
      setSelectedService(data[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && selectedService) {
      const newFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      // Validate each file
      newFiles.forEach(file => {
        const validation = validateFileUpload(file);
        if (validation.isValid) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name}: ${validation.error}`);
        }
      });
      
      // Show errors for invalid files
      if (invalidFiles.length > 0) {
        toast.error(`File validation failed:\n${invalidFiles.join('\n')}`);
      }
      
      // Add valid files only
      if (validFiles.length > 0) {
        const newJobFiles = validFiles.map(file => ({
          file,
          title: sanitizeInput(file.name.replace(/\.[^/.]+$/, "")), // Remove extension and sanitize title
          description: "",
          quantity: 1,
          service_subtype: "",
          paper_type: "",
          paper_weight: "",
          finishing_options: [],
          width_mm: undefined,
          height_mm: undefined
        }));
        setJobFiles(prev => [...prev, ...newJobFiles]);
        
        if (validFiles.length > 0) {
          toast.success(`${validFiles.length} file(s) added successfully`);
        }
      }
    }
  };

  const removeJobFile = (index: number) => {
    setJobFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateJobFile = (index: number, field: keyof JobFile, value: any) => {
    let sanitizedValue = value;
    
    // Sanitize and validate based on field type
    if (typeof value === 'string') {
      sanitizedValue = sanitizeInput(value);
      
      // Additional validation for specific fields
      if (field === 'title' && sanitizedValue.length > 100) {
        toast.error("Title must be less than 100 characters");
        return;
      }
      if (field === 'description' && sanitizedValue.length > 500) {
        toast.error("Description must be less than 500 characters");
        return;
      }
    } else if (typeof value === 'number') {
      // Validate numeric inputs
      if (field === 'quantity') {
        const validation = validateNumericInput(value, 'Quantity', 1, 10000);
        if (validation) {
          toast.error(validation);
          return;
        }
      } else if (field === 'width_mm' || field === 'height_mm') {
        const validation = validateNumericInput(value, field === 'width_mm' ? 'Width' : 'Height', 1, 10000);
        if (validation) {
          toast.error(validation);
          return;
        }
      }
    }
    
    setJobFiles(prev => prev.map((jobFile, i) => 
      i === index ? { ...jobFile, [field]: sanitizedValue } : jobFile
    ));
  };

  const uploadFiles = async (): Promise<{jobId: string, fileUrls: string[]}[]> => {
    const results: {jobId: string, fileUrls: string[]}[] = [];
    setIsUploading(true);
    
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

      for (let i = 0; i < jobFiles.length; i++) {
        const jobFile = jobFiles[i];
        const fileKey = `${jobFile.file.name}-${i}`;
        
        // Reset progress for this file
        setUploadProgress(prev => ({ ...prev, [fileKey]: 10 }));

        // Create individual job for each file
        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .insert({
            customer_id: null,
            customer_uuid: customer.id,
            service_id: selectedService!.id,
            current_status: 1, // Pending status
            delivery_method: watch("delivery_method"),
            delivery_address: watch("delivery_address"),
            width: jobFile.width_mm,
            length: jobFile.height_mm,
            title: jobFile.title,
            description: jobFile.description,
            quantity: jobFile.quantity,
            service_subtype: jobFile.service_subtype,
            paper_type: jobFile.paper_type,
            paper_weight: jobFile.paper_weight,
            finishing_options: JSON.stringify(jobFile.finishing_options || []),
          })
          .select()
          .single();

        if (jobError) throw jobError;

        setUploadProgress(prev => ({ ...prev, [fileKey]: 30 }));

        // Upload file
        const fileExt = jobFile.file.name.split('.').pop();
        const fileName = `${job.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileKey] || 30;
            if (currentProgress < 90) {
              return { ...prev, [fileKey]: currentProgress + 10 };
            }
            return prev;
          });
        }, 100);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-uploads')
          .upload(fileName, jobFile.file);

        clearInterval(progressInterval);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload ${jobFile.file.name}: ${uploadError.message}`);
        }

        // Create file record
        const { error: fileRecordError } = await supabase
          .from('job_files')
          .insert({
            job_id: job.id,
            file_path: uploadData.path,
            description: jobFile.file.name
          });
          
        if (fileRecordError) {
          console.error('Error creating file record:', fileRecordError);
        }

        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));

        results.push({ jobId: job.id.toString(), fileUrls: [uploadData.path] });

        // Send notifications for each job
        try {
          const { data: customerProfile } = await supabase
            .from("customers")
            .select("name")
            .eq("id", customer.id)
            .single();

          await sendJobSubmittedNotification(customer.id, job.id, jobFile.title);
          await sendAdminJobNotification(customer.id, job.id, jobFile.title, customerProfile?.name || 'Unknown');
          await trackJobCreated(job.id, customer.id);
        } catch (notificationError) {
          console.warn('Notification or analytics failed but job was created:', notificationError);
        }
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress({}), 2000);
    }

    return results;
  };

  const onSubmit = async (formData: JobFormData) => {
    try {
      // Comprehensive form validation
      if (jobFiles.length === 0) {
        toast.error("Please upload at least one file");
        return;
      }

      if (jobFiles.length > 20) {
        toast.error("Maximum 20 files allowed per submission");
        return;
      }

      // Validate each job file
      for (let i = 0; i < jobFiles.length; i++) {
        const jobFile = jobFiles[i];
        
        if (!jobFile.title || jobFile.title.trim().length < 2) {
          toast.error(`Job ${i + 1}: Title must be at least 2 characters`);
          return;
        }
        
        if (jobFile.quantity < 1 || jobFile.quantity > 10000) {
          toast.error(`Job ${i + 1}: Quantity must be between 1 and 10,000`);
          return;
        }
        
        if (selectedService?.requires_dimensions) {
          if (!jobFile.width_mm || !jobFile.height_mm) {
            toast.error(`Job ${i + 1}: Dimensions are required for this service`);
            return;
          }
          if (jobFile.width_mm <= 0 || jobFile.height_mm <= 0) {
            toast.error(`Job ${i + 1}: Dimensions must be greater than 0`);
            return;
          }
        }
      }

      // Validate delivery information
      const sanitizedDeliveryMethod = sanitizeInput(formData.delivery_method);
      if (!sanitizedDeliveryMethod) {
        toast.error("Please select a delivery method");
        return;
      }

      if (sanitizedDeliveryMethod === 'delivery' && !formData.delivery_address?.trim()) {
        toast.error("Delivery address is required for delivery option");
        return;
      }

      setIsSubmitting(true);

      const results = await uploadFiles();
      
      if (results.length === 0) {
        throw new Error("No jobs were created successfully");
      }
      
      toast.success(`${results.length} job(s) submitted successfully!`);

      reset();
      setJobFiles([]);
      setSelectedService(services[0] || null);
      onSuccess?.();

    } catch (error: any) {
      console.error("Job submission error:", error);
      const userMessage = handleError(error, 'job-submission');
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Print Jobs</CardTitle>
        <p className="text-muted-foreground">Upload multiple files and specify individual requirements for each job</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Service Selection */}
          <div>
            <Label htmlFor="service">Service Type *</Label>
            <Select onValueChange={(value) => {
              const service = services.find(s => s.id.toString() === value);
              setSelectedService(service || null);
            }} value={selectedService?.id.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name} - Le {service.base_price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                     PDF, Images, Word documents, Text files up to 50MB each
                   </p>
                   <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                     <Shield className="h-3 w-3" />
                     Files are automatically scanned for security
                   </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.gif,.docx,.doc"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Job Files List */}
          {jobFiles.length > 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Job Details ({jobFiles.length} files)</Label>
              {jobFiles.map((jobFile, index) => {
                const fileKey = `${jobFile.file.name}-${index}`;
                const progress = uploadProgress[fileKey];
                const isFileUploading = isUploading && progress !== undefined;
                
                return (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-medium">{jobFile.file.name}</span>
                        {isFileUploading && (
                          <Badge variant="secondary">Uploading {progress}%</Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeJobFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {Object.keys(uploadProgress).length > 0 && (
                      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Upload Progress</div>
                        {Object.entries(uploadProgress).map(([fileKey, progress]) => {
                          const fileName = fileKey.split('-')[0];
                          return (
                            <div key={fileKey} className="flex items-center gap-2 mb-2">
                              <span className="text-sm truncate flex-1">{fileName}</span>
                              <span className="text-sm">{progress}%</span>
                              <Progress value={progress} className="w-24 h-2" />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label>Job Title *</Label>
                        <Input
                          value={jobFile.title}
                          onChange={(e) => updateJobFile(index, "title", e.target.value)}
                          placeholder="e.g., Business Cards for John Doe"
                          required
                        />
                      </div>
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={jobFile.quantity}
                          onChange={(e) => updateJobFile(index, "quantity", parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label>Description</Label>
                      <Textarea
                        value={jobFile.description}
                        onChange={(e) => updateJobFile(index, "description", e.target.value)}
                        placeholder="Additional details about this job..."
                        rows={2}
                      />
                    </div>

                    {/* Service-specific options */}
                    {selectedService && (
                      <div className="space-y-4 p-3 border rounded-lg bg-muted/30">
                        <h4 className="font-medium text-sm">Service Options</h4>
                        
                        {/* Subtypes */}
                        {selectedService.available_subtypes && selectedService.available_subtypes.length > 0 && (
                          <div>
                            <Label className="text-sm">{selectedService.service_type} Type</Label>
                            <Select onValueChange={(value) => updateJobFile(index, "service_subtype", value)}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select type" />
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

                        {/* Dimensions */}
                        {selectedService.requires_dimensions && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm">Width (mm)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={jobFile.width_mm || ""}
                                onChange={(e) => updateJobFile(index, "width_mm", parseFloat(e.target.value) || undefined)}
                                placeholder="1000"
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Height (mm)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={jobFile.height_mm || ""}
                                onChange={(e) => updateJobFile(index, "height_mm", parseFloat(e.target.value) || undefined)}
                                placeholder="500"
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}

                        {/* Paper Type & Weight */}
                        <div className="grid grid-cols-2 gap-2">
                          {selectedService.available_paper_types && selectedService.available_paper_types.length > 0 && (
                            <div>
                              <Label className="text-sm">Paper Type</Label>
                              <Select onValueChange={(value) => updateJobFile(index, "paper_type", value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select paper" />
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

                          {selectedService.available_paper_weights && selectedService.available_paper_weights.length > 0 && (
                            <div>
                              <Label className="text-sm">Paper Weight</Label>
                              <Select onValueChange={(value) => updateJobFile(index, "paper_weight", value)}>
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select weight" />
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
                        </div>

                        {/* Finishing Options */}
                        {selectedService.available_finishes && selectedService.available_finishes.length > 0 && (
                          <div>
                            <Label className="text-sm">Finishing Options</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {selectedService.available_finishes.map((finishId: string) => {
                                const finishOption = FINISHING_OPTIONS.find(f => f.id === finishId);
                                if (!finishOption) return null;
                                
                                return (
                                  <label key={finishId} className="flex items-center space-x-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={jobFile.finishing_options.includes(finishId)}
                                      onChange={(e) => {
                                        const current = jobFile.finishing_options;
                                        if (e.target.checked) {
                                          updateJobFile(index, "finishing_options", [...current, finishId]);
                                        } else {
                                          updateJobFile(index, "finishing_options", current.filter(f => f !== finishId));
                                        }
                                      }}
                                      className="rounded"
                                    />
                                    <span>{finishOption.name}</span>
                                    <Badge variant="outline" className="text-xs">+Le {finishOption.price.toFixed(2)}</Badge>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Delivery Options */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold">Delivery Options</h3>
            
            <div>
              <Label htmlFor="delivery_method">Delivery Method *</Label>
              <Select onValueChange={(value) => setValue("delivery_method", value)} defaultValue="pickup">
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup from Store</SelectItem>
                  <SelectItem value="delivery">Home Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {deliveryMethod === "delivery" && (
              <div>
                <Label htmlFor="delivery_address">Delivery Address *</Label>
                <Textarea
                  id="delivery_address"
                  {...register("delivery_address", { 
                    required: deliveryMethod === "delivery" ? "Delivery address is required" : false 
                  })}
                  placeholder="Enter your complete delivery address..."
                  rows={3}
                />
                {errors.delivery_address && (
                  <p className="text-sm text-destructive mt-1">{errors.delivery_address.message}</p>
                )}
              </div>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting || isUploading || jobFiles.length === 0} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isUploading ? "Uploading files..." : "Creating jobs..."}
              </>
            ) : (
              `Submit ${jobFiles.length} Job${jobFiles.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};