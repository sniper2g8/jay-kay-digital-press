import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Plus,
  Edit,
  Eye,
  Calendar
} from "lucide-react";

interface DeliverySchedule {
  id: string;
  job_id: number;
  scheduled_date: string;
  scheduled_time_start: string | null;
  scheduled_time_end: string | null;
  delivery_method: string;
  delivery_address: string | null;
  delivery_contact_name: string | null;
  delivery_contact_phone: string | null;
  delivery_status: string;
  tracking_number: string | null;
  delivery_fee: number;
  assigned_driver_id: string | null;
  delivery_notes: string | null;
  created_at: string;
  jobs?: {
    title: string;
    customers: {
      name: string;
    } | null;
  } | null;
  assigned_driver?: {
    name: string;
  } | null;
}

interface Driver {
  id: string;
  name: string;
  phone: string | null;
  is_active: boolean;
}

interface Job {
  id: number;
  title: string;
  customers: {
    name: string;
  } | null;
}

export const DeliveryManagement = () => {
  const [deliveries, setDeliveries] = useState<DeliverySchedule[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliverySchedule | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDeliveries(),
        loadDrivers(),
        loadAvailableJobs()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveries = async () => {
    const { data, error } = await supabase
      .from('delivery_schedules')
      .select(`
        *,
        jobs!inner(
          title,
          customers(name)
        ),
        assigned_driver:non_system_staff(name)
      `)
      .order('scheduled_date', { ascending: false });
    
    if (error) {
      console.error('Error loading deliveries:', error);
      return;
    }
    
    setDeliveries(data || []);
  };

  const loadDrivers = async () => {
    const { data, error } = await supabase
      .from('non_system_staff')
      .select('id, name, phone, is_active')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error loading drivers:', error);
      return;
    }
    
    setDrivers(data || []);
  };

  const loadAvailableJobs = async () => {
    let query = supabase
      .from('jobs')
      .select(`
        id,
        title,
        customers(name)
      `)
      .eq('delivery_method', 'delivery')
      .order('created_at', { ascending: false });
    
    // Only filter out jobs that already have deliveries if there are any
    const scheduledJobIds = deliveries.map(d => d.job_id).filter(Boolean);
    if (scheduledJobIds.length > 0) {
      query = query.not('id', 'in', `(${scheduledJobIds.join(',')})`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error loading jobs:', error);
      return;
    }
    
    setAvailableJobs(data || []);
  };

  const createDelivery = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('delivery_schedules')
        .insert([{
          job_id: parseInt(formData.job_id),
          scheduled_date: formData.scheduled_date,
          scheduled_time_start: formData.scheduled_time_start || null,
          scheduled_time_end: formData.scheduled_time_end || null,
          delivery_method: 'delivery',
          delivery_address: formData.delivery_address,
          delivery_contact_name: formData.delivery_contact_name,
          delivery_contact_phone: formData.delivery_contact_phone,
          delivery_fee: parseFloat(formData.delivery_fee) || 0,
          assigned_driver_id: formData.assigned_driver_id || null,
          delivery_notes: formData.delivery_notes,
          delivery_status: 'scheduled',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery scheduled successfully",
      });

      setIsCreateOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create delivery",
        variant: "destructive",
      });
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('delivery_schedules')
        .update({ 
          delivery_status: newStatus,
          ...(newStatus === 'delivered' ? { actual_delivery_time: new Date().toISOString() } : {})
        })
        .eq('id', deliveryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery status updated",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_transit': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const DeliveryForm = ({ delivery, onSubmit, onClose }: { 
    delivery?: DeliverySchedule | null; 
    onSubmit: (data: any) => void; 
    onClose: () => void;
  }) => {
    const [formData, setFormData] = useState({
      job_id: delivery?.job_id?.toString() || '',
      scheduled_date: delivery?.scheduled_date || new Date().toISOString().split('T')[0],
      scheduled_time_start: delivery?.scheduled_time_start || '',
      scheduled_time_end: delivery?.scheduled_time_end || '',
      delivery_address: delivery?.delivery_address || '',
      delivery_contact_name: delivery?.delivery_contact_name || '',
      delivery_contact_phone: delivery?.delivery_contact_phone || '',
      delivery_fee: delivery?.delivery_fee?.toString() || '0',
      assigned_driver_id: delivery?.assigned_driver_id || '',
      delivery_notes: delivery?.delivery_notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="job_id">Job</Label>
            <Select 
              value={formData.job_id} 
              onValueChange={(value) => setFormData({...formData, job_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {availableJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.title} - {job.customers?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scheduled_date">Delivery Date</Label>
            <Input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="scheduled_time_start">Start Time</Label>
            <Input
              type="time"
              value={formData.scheduled_time_start}
              onChange={(e) => setFormData({...formData, scheduled_time_start: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="scheduled_time_end">End Time</Label>
            <Input
              type="time"
              value={formData.scheduled_time_end}
              onChange={(e) => setFormData({...formData, scheduled_time_end: e.target.value})}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="delivery_address">Delivery Address</Label>
          <Textarea
            value={formData.delivery_address}
            onChange={(e) => setFormData({...formData, delivery_address: e.target.value})}
            placeholder="Enter delivery address"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="delivery_contact_name">Contact Name</Label>
            <Input
              value={formData.delivery_contact_name}
              onChange={(e) => setFormData({...formData, delivery_contact_name: e.target.value})}
              placeholder="Contact person name"
            />
          </div>

          <div>
            <Label htmlFor="delivery_contact_phone">Contact Phone</Label>
            <Input
              value={formData.delivery_contact_phone}
              onChange={(e) => setFormData({...formData, delivery_contact_phone: e.target.value})}
              placeholder="Contact phone number"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="delivery_fee">Delivery Fee (Le)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.delivery_fee}
              onChange={(e) => setFormData({...formData, delivery_fee: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="assigned_driver_id">Assign Driver</Label>
            <Select 
              value={formData.assigned_driver_id} 
              onValueChange={(value) => setFormData({...formData, assigned_driver_id: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} {driver.phone && `(${driver.phone})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="delivery_notes">Notes</Label>
          <Textarea
            value={formData.delivery_notes}
            onChange={(e) => setFormData({...formData, delivery_notes: e.target.value})}
            placeholder="Delivery instructions or notes"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {delivery ? 'Update' : 'Create'} Delivery
          </Button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p>Loading deliveries...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Delivery Management</h2>
          <p className="text-muted-foreground">Schedule and track deliveries</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Delivery
        </Button>
      </div>

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="grid gap-4">
            {deliveries
              .filter(d => d.delivery_status === 'scheduled')
              .map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{delivery.jobs?.title}</span>
                          <Badge variant="outline">{delivery.delivery_status}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{delivery.jobs?.customers?.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(delivery.scheduled_date), 'MMM dd, yyyy')}</span>
                          </div>
                          {delivery.assigned_driver && (
                            <div className="flex items-center space-x-1">
                              <Truck className="h-3 w-3" />
                              <span>{delivery.assigned_driver.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={delivery.delivery_status}
                          onValueChange={(value) => updateDeliveryStatus(delivery.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDelivery(delivery);
                            setIsEditOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="in_transit" className="space-y-4">
          <div className="grid gap-4">
            {deliveries
              .filter(d => d.delivery_status === 'in_transit')
              .map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">{delivery.jobs?.title}</span>
                          <Badge className="bg-orange-500">{delivery.delivery_status}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{delivery.jobs?.customers?.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{delivery.delivery_address?.slice(0, 50)}...</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={delivery.delivery_status}
                          onValueChange={(value) => updateDeliveryStatus(delivery.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_transit">In Transit</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="delivered" className="space-y-4">
          <div className="grid gap-4">
            {deliveries
              .filter(d => d.delivery_status === 'delivered')
              .map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{delivery.jobs?.title}</span>
                          <Badge className="bg-green-500">{delivery.delivery_status}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{delivery.jobs?.customers?.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Delivered {format(new Date(delivery.scheduled_date), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b">
                    <tr>
                      <th className="p-4 text-left font-medium">Job</th>
                      <th className="p-4 text-left font-medium">Customer</th>
                      <th className="p-4 text-left font-medium">Date</th>
                      <th className="p-4 text-left font-medium">Driver</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id} className="border-b hover:bg-muted/20">
                        <td className="p-4 font-medium">{delivery.jobs?.title}</td>
                        <td className="p-4">{delivery.jobs?.customers?.name}</td>
                        <td className="p-4">{format(new Date(delivery.scheduled_date), 'MMM dd, yyyy')}</td>
                        <td className="p-4">{delivery.assigned_driver?.name || 'Unassigned'}</td>
                        <td className="p-4">
                          <Badge className={getStatusColor(delivery.delivery_status)}>
                            {delivery.delivery_status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDelivery(delivery);
                              setIsEditOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Delivery Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Delivery</DialogTitle>
            <DialogDescription>
              Create a new delivery schedule for a completed job
            </DialogDescription>
          </DialogHeader>
          <DeliveryForm
            onSubmit={createDelivery}
            onClose={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Delivery Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Delivery</DialogTitle>
            <DialogDescription>
              Update delivery details
            </DialogDescription>
          </DialogHeader>
          <DeliveryForm
            delivery={selectedDelivery}
            onSubmit={(data) => {
              // Update logic here
              setIsEditOpen(false);
            }}
            onClose={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};