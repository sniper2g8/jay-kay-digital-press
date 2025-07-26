import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { Upload, X, File, Image, Shield, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { FINISHING_OPTIONS } from "@/constants/services";
import { validateFileUpload, sanitizeInput, validateNumericInput } from "@/utils/inputValidation";
import { handleError } from "@/utils/errorHandling";

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
  available_subtypes: Array<{name: string; description: string}> | null;
  available_paper_types: string[] | null;
  available_paper_weights: string[] | null;
  available_finishes: string[] | null;
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
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
      // Service selection changed - update state
      setSelectedService(service || null);
    }
  }, [watchedServiceId, services]);

  const fetchCustomers = async () => {
    try {
      // Get all customers with their auth_user_id
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id, name, email, customer_display_id, auth_user_id")
        .order("name");

      if (customerError) {
        console.error("Error fetching customers:", customerError);
        return;
      }

      // Transform to include the auth_user_id as profile_id (since that's what the foreign key expects)
      const customersWithProfiles = customerData?.map(customer => ({
        ...customer,
        profile_id: customer.auth_user_id // Use auth_user_id as the profile_id reference
      })) || [];

      setCustomers(customersWithProfiles);
    } catch (err) {
      console.error("Unexpected error fetching customers:", err);
    }
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
    
    // Transform the data to match our Service interface
    const transformedServices: Service[] = (data || []).map(service => ({
      ...service,
      available_subtypes: Array.isArray(service.available_subtypes)
        ? service.available_subtypes.map((subtype) => {
            if (typeof subtype === 'string') {
              return { name: subtype, description: subtype };
            } else if (
              typeof subtype === 'object' &&
              subtype !== null &&
              'name' in subtype &&
              'description' in subtype &&
              typeof (subtype as { name: unknown }).name === 'string' &&
              typeof (subtype as { description: unknown }).description === 'string'
            ) {
              return {
                name: (subtype as { name: string }).name,
                description: (subtype as { description: string }).description
              };
            } else {
              // Invalid subtype format
              return { name: 'Unknown', description: 'Unknown subtype' };
            }
          })
        : null,
      available_paper_types: Array.isArray(service.available_paper_types)
        ? service.available_paper_types as string[]
        : null,
      available_paper_weights: Array.isArray(service.available_paper_weights)
        ? service.available_paper_weights as string[]
        : null,
      available_finishes: Array.isArray(service.available_finishes)
        ? service.available_finishes as string[]
        : null
    }));
    
    // Services transformed successfully
    
    setServices(transformedServices);
  };

  const uploadFiles = async (jobId: string): Promise<string[]> => {
    const fileUrls: string[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const fileKey = `${file.name}-${i}`;
      
      // Initialize progress
      setUploadProgress(prev => ({ ...prev, [fileKey]: 10 }));
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${jobId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileKey] || 10;
          if (currentProgress < 90) {
            return { ...prev, [fileKey]: currentProgress + 15 };
          }
          return prev;
        });
      }, 150);

      const { data, error } = await supabase.storage
        .from('job-uploads')
        .upload(fileName, file);

      clearInterval(progressInterval);

      if (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }));
        throw new Error(`Failed to upload ${file.name}`);
      }

      setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));
      fileUrls.push(data.path);
    }

    // Clear progress after a short delay
    setTimeout(() => setUploadProgress({}), 2000);
    return fileUrls;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
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
        toast({
          title: "File Upload Errors",
          description: invalidFiles.join('\n'),
          variant: "destructive",
        });
      }
      
      // Add only valid files
      if (validFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...validFiles]);
        toast({
          title: "Files Added",
          description: `${validFiles.length} file(s) added successfully`,
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      // Comprehensive input validation
      const sanitizedTitle = sanitizeInput(data.title);
      const sanitizedDescription = sanitizeInput(data.description || '');

      // Required field checks
      if (!sanitizedTitle || sanitizedTitle.length < 2) {
        toast({
          title: "Validation Error",
          description: "Job title must be at least 2 characters long",
          variant: "destructive",
        });
        return;
      }
      if (!data.customer_id) {
        toast({
          title: "Validation Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }
      if (!data.service_id) {
        toast({
          title: "Validation Error",
          description: "Please select a service",
          variant: "destructive",
        });
        return;
      }
      if (selectedService?.available_subtypes && selectedService.available_subtypes.length > 0 && !data.service_subtype) {
        toast({
          title: "Validation Error",
          description: "Please select a service subtype.",
          variant: "destructive",
        });
        return;
      }
      if (selectedService?.available_paper_types && selectedService.available_paper_types.length > 0 && !data.paper_type) {
        toast({
          title: "Validation Error",
          description: "Please select a paper type.",
          variant: "destructive",
        });
        return;
      }
      if (selectedService?.available_paper_weights && selectedService.available_paper_weights.length > 0 && !data.paper_weight) {
        toast({
          title: "Validation Error",
          description: "Please select a paper weight.",
          variant: "destructive",
        });
        return;
      }
      if (selectedService?.requires_dimensions) {
        if (!data.width || data.width <= 0) {
          toast({
            title: "Validation Error",
            description: "Width must be greater than 0.",
            variant: "destructive",
          });
          return;
        }
        if (!data.length || data.length <= 0) {
          toast({
            title: "Validation Error",
            description: "Length must be greater than 0.",
            variant: "destructive",
          });
          return;
        }
      }
      if (sanitizedTitle.length > 100) {
        toast({
          title: "Validation Error",
          description: "Job title must be less than 100 characters",
          variant: "destructive",
        });
        return;
      }
      if (sanitizedDescription.length > 1000) {
        toast({
          title: "Validation Error",
          description: "Description must be less than 1000 characters",
          variant: "destructive",
        });
        return;
      }
      // Validate numeric inputs
      const quantityValidation = validateNumericInput(data.quantity, 'Quantity', 1, 10000);
      if (quantityValidation) {
        toast({
          title: "Validation Error",
          description: quantityValidation,
          variant: "destructive",
        });
        return;
      }
      setIsSubmitting(true);
      
      // Find the selected customer to get both IDs
      const selectedCustomer = customers.find(c => c.id === data.customer_id);
      if (!selectedCustomer) {
        throw new Error("Selected customer not found");
      }

      // Get the first available workflow status
      const { data: statusData, error: statusError } = await supabase
        .from("workflow_status")
        .select("id")
        .order("order_index")
        .limit(1);

      if (statusError) throw statusError;

      const currentStatusId = statusData?.[0]?.id || 1;

      // Get the current user's internal_users record
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error("User not authenticated");
      }

      const { data: internalUser, error: userError } = await supabase
        .from("internal_users")
        .select("id")
        .eq("auth_user_id", currentUser.data.user.id)
        .maybeSingle();

      if (userError || !internalUser) {
        throw new Error("User is not an internal user. Only staff can create jobs.");
      }

      const jobData = {
        title: sanitizedTitle,
        description: sanitizedDescription,
        customer_id: selectedCustomer.profile_id, // This references profiles.id (auth_user_id)
        customer_uuid: selectedCustomer.id, // This references customers.id
        service_id: parseInt(data.service_id),
        quantity: data.quantity,
        service_subtype: data.service_subtype ? sanitizeInput(data.service_subtype) : null,
        paper_type: data.paper_type ? sanitizeInput(data.paper_type) : null,
        paper_weight: data.paper_weight ? sanitizeInput(data.paper_weight) : null,
        width: data.width || null,
        length: data.length || null,
        delivery_method: sanitizeInput(data.delivery_method),
        delivery_address: data.delivery_address ? sanitizeInput(data.delivery_address) : null,
        quoted_price: data.quoted_price || null,
        final_price: data.final_price || null,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        current_status: currentStatusId,
        status: "Pending",
        created_by_user: internalUser.id // This should reference internal_users.id
      };

      const { data: newJob, error: jobError } = await supabase
        .from("jobs")
        .insert([jobData])
        .select()
        .single();

      if (jobError) throw jobError;

      // Upload files if any
      if (uploadedFiles.length > 0) {
        const fileUrls = await uploadFiles(newJob.id.toString());
        
        // Create records in job_files table for each uploaded file
        for (let i = 0; i < fileUrls.length; i++) {
          const filePath = fileUrls[i];
          const originalFile = uploadedFiles[i];
          
          const { error: fileRecordError } = await supabase
            .from('job_files')
            .insert({
              job_id: newJob.id,
              file_path: filePath,
              description: sanitizeInput(originalFile.name)
            });
            
          if (fileRecordError) {
            console.error('Error creating file record:', fileRecordError);
            // Don't throw here as the main job was created successfully
          }
        }
      }

      // Send notification to customer
      try {
        await sendJobSubmittedNotification(selectedCustomer.id, newJob.id, sanitizedTitle);
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Don't throw here as the job was created successfully
      }

      toast({
        title: "Success",
        description: "Job created successfully",
      });

      reset();
      setUploadedFiles([]);
      onJobCreated();
      onClose();
    } catch (error) {
      let userMessage: string;
      if (error instanceof Error) {
        userMessage = handleError(error, 'job-creation');
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
      ) {
        userMessage = handleError(new Error(String((error as { message: unknown }).message)), 'job-creation');
      } else {
        userMessage = 'An unknown error occurred during job creation.';
      }
      toast({
        title: "Error",
        description: userMessage,
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
                {...register("title", { 
                  required: "Job title is required",
                  minLength: { value: 2, message: "Title must be at least 2 characters" },
                  maxLength: { value: 100, message: "Title must be less than 100 characters" }
                })}
                placeholder="Enter job title"
                maxLength={100}
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
              {...register("description", {
                maxLength: { value: 1000, message: "Description must be less than 1000 characters" }
              })}
              placeholder="Enter job description"
              rows={3}
              maxLength={1000}
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
                        <div className="flex flex-col">
                          <span className="font-medium">{service.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {service.service_type} - Base: Le{service.base_price}
                          </span>
                        </div>
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
                max="10000"
                {...register("quantity", { 
                  required: "Quantity is required", 
                  min: { value: 1, message: "Quantity must be at least 1" },
                  max: { value: 10000, message: "Quantity must be less than 10,000" }
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          {selectedService?.available_subtypes && selectedService.available_subtypes.length > 0 && (
            <div>
              <Label htmlFor="service_subtype">Service Subtype</Label>
              <Select onValueChange={(value) => setValue("service_subtype", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subtype" />
                </SelectTrigger>
                <SelectContent>
                  {selectedService.available_subtypes.map((subtype, index) => (
                    <SelectItem key={index} value={subtype.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{subtype.name}</span>
                        <span className="text-sm text-muted-foreground">{subtype.description}</span>
                      </div>
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

          {/* Finishing Options */}
          {selectedService?.available_finishes && selectedService.available_finishes.length > 0 && (
            <div>
              <Label>Finishing Options</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {selectedService.available_finishes.map((finishId: string) => {
                  const finishOption = FINISHING_OPTIONS.find(f => f.id === finishId);
                  if (!finishOption) return null;
                  
                  return (
                    <label key={finishId} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
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

          {/* File Upload Section */}
          <div className="space-y-4">
            <Label>Job Files</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag files here or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp,.svg"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Choose Files
                </Button>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</p>
                {uploadedFiles.map((file, index) => {
                  const fileKey = `${file.name}-${index}`;
                  const progress = uploadProgress[fileKey];
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getFileIcon(file.name)}
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={progress !== undefined}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {progress !== undefined && (
                        <div className="px-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Uploading...</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2 mt-1" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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