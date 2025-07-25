import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarDays, Truck, User, Package, Phone, Mail, Trash2 } from 'lucide-react';

interface DeliverySchedule {
  id: string;
  job_id: number;
  scheduled_date: string;
  delivery_method: string;
  delivery_address?: string;
  delivery_status: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_instructions?: string;
  delivery_fee?: number;
  delivery_notes?: string;
  created_at: string;
  jobs: {
    title: string;
    tracking_code: string;
    status: string;
    customers: {
      name: string;
      customer_display_id: string;
      email: string;
      phone: string;
    };
  };
  non_system_staff: {
    name: string;
    email: string;
    phone: string;
  } | null;
}

const statusOptions = [
  'scheduled',
  'in_transit',
  'delivered',
  'failed',
  'cancelled'
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'scheduled': return 'bg-blue-100 text-blue-800';
    case 'in_transit': return 'bg-yellow-100 text-yellow-800';
    case 'delivered': return 'bg-green-100 text-green-800';
    case 'failed': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const DeliveryScheduleList = () => {
  const [deliverySchedules, setDeliverySchedules] = useState<DeliverySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliverySchedules();
  }, []);

  const fetchDeliverySchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_schedules')
        .select(`
          *,
          jobs (
            title,
            tracking_code,
            status,
            customers (
              name,
              customer_display_id,
              email,
              phone
            )
          ),
          non_system_staff (
            name,
            email,
            phone
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      setDeliverySchedules(data || []);
    } catch (error) {
      console.error('Error fetching delivery schedules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch delivery schedules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (scheduleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('delivery_schedules')
        .update({ 
          delivery_status: newStatus,
          actual_delivery_time: newStatus === 'delivered' ? new Date().toISOString() : null
        })
        .eq('id', scheduleId);

      if (error) throw error;

      // Send notification to customer about status update
      const schedule = deliverySchedules.find(s => s.id === scheduleId);
      if (schedule && schedule.jobs?.customers) {
        let message = '';
        switch (newStatus) {
          case 'in_transit':
            message = `Your delivery for "${schedule.jobs.title}" (${schedule.jobs.tracking_code}) is now in transit.`;
            break;
          case 'delivered':
            message = `Your order "${schedule.jobs.title}" (${schedule.jobs.tracking_code}) has been successfully delivered.`;
            break;
          case 'failed':
            message = `Delivery attempt for "${schedule.jobs.title}" (${schedule.jobs.tracking_code}) failed. We will contact you to reschedule.`;
            break;
          case 'cancelled':
            message = `Delivery for "${schedule.jobs.title}" (${schedule.jobs.tracking_code}) has been cancelled. Please contact us for more information.`;
            break;
        }

        if (message) {
          // Find the customer ID from the jobs relationship
          const { data: customerData } = await supabase
            .from('jobs')
            .select('customer_uuid')
            .eq('id', schedule.job_id)
            .single();

          if (customerData) {
            await supabase.functions.invoke('send-notification', {
              body: {
                type: 'delivery_update',
                customer_id: customerData.customer_uuid,
                event: 'delivery_status_update',
                subject: 'Delivery Status Update',
                message: message
              }
            });
          }
        }
      }

      toast({
        title: "Success",
        description: "Delivery status updated successfully"
      });

      fetchDeliverySchedules();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive"
      });
    }
  };

  const deleteDeliverySchedule = async (scheduleId: string) => {
    try {
      // Delete the delivery schedule (CASCADE will handle related records)
      const { error } = await supabase
        .from('delivery_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery schedule deleted successfully"
      });

      fetchDeliverySchedules();
    } catch (error) {
      console.error('Error deleting delivery schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete delivery schedule",
        variant: "destructive"
      });
    }
  };

  const filteredSchedules = statusFilter === 'all' 
    ? deliverySchedules 
    : deliverySchedules.filter(schedule => schedule.delivery_status === statusFilter);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 animate-spin" />
            Loading delivery schedules...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Schedules ({filteredSchedules.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No delivery schedules found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Delivery Method</TableHead>
                  <TableHead>Assigned Staff</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSchedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{schedule.jobs.customers.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.jobs.customers.customer_display_id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {schedule.jobs.customers.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {schedule.jobs.customers.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{schedule.jobs.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.jobs.tracking_code}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(schedule.scheduled_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {schedule.delivery_method.charAt(0).toUpperCase() + schedule.delivery_method.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {schedule.non_system_staff ? (
                        <div className="space-y-1">
                          <p className="font-medium">{schedule.non_system_staff.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {schedule.non_system_staff.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(schedule.delivery_status)}>
                        {schedule.delivery_status.charAt(0).toUpperCase() + schedule.delivery_status.slice(1).replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {schedule.delivery_fee ? `Le ${schedule.delivery_fee.toFixed(2)}` : 'Free'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select 
                          value={schedule.delivery_status} 
                          onValueChange={(value) => updateDeliveryStatus(schedule.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Delivery Schedule</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this delivery schedule for "{schedule.jobs.title}"? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteDeliverySchedule(schedule.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};