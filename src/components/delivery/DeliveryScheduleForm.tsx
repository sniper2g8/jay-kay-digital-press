import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, User, Package } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  customer_display_id: string;
  email: string;
  phone: string;
}

interface Job {
  id: number;
  title: string;
  tracking_code: string;
  status: string;
  delivery_method: string;
  delivery_address?: string;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export const DeliveryScheduleForm = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerJobs, setCustomerJobs] = useState<Job[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    fetchStaff();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, customer_display_id, email, phone')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      });
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('non_system_staff')
        .select('id, name, email, phone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchCustomerJobs = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, tracking_code, status, delivery_method, delivery_address')
        .eq('customer_uuid', customerId)
        .in('status', ['Waiting for Collection', 'Out for Delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerJobs(data || []);
    } catch (error) {
      console.error('Error fetching customer jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customer jobs",
        variant: "destructive"
      });
    }
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedJob('');
    setCustomerJobs([]);
    if (customerId) {
      fetchCustomerJobs(customerId);
    }
  };

  const handleJobChange = (jobId: string) => {
    setSelectedJob(jobId);
    const job = customerJobs.find(j => j.id.toString() === jobId);
    if (job) {
      setDeliveryMethod(job.delivery_method);
      setDeliveryAddress(job.delivery_address || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedJob || !scheduledDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const scheduleData = {
        job_id: parseInt(selectedJob),
        scheduled_date: scheduledDate,
        delivery_method: deliveryMethod,
        delivery_address: deliveryAddress,
        delivery_instructions: deliveryInstructions,
        delivery_fee: deliveryFee ? parseFloat(deliveryFee) : 0,
        delivery_status: 'scheduled',
        non_system_staff_id: selectedStaff || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { data, error } = await supabase
        .from('delivery_schedules')
        .insert(scheduleData)
        .select('id')
        .single();

      if (error) throw error;

      // Send notification to customer
      if (selectedStaff) {
        const customer = customers.find(c => c.id === selectedCustomer);
        const staffMember = staff.find(s => s.id === selectedStaff);
        const job = customerJobs.find(j => j.id.toString() === selectedJob);

        if (customer && staffMember && job && data) {
          await supabase.functions.invoke('send-notification', {
            body: {
              type: 'email',
              customer_id: selectedCustomer,
              event: 'delivery_scheduled',
              subject: 'Delivery Scheduled',
              message: `Your job "${job.title}" (${job.tracking_code}) has been scheduled for delivery on ${new Date(scheduledDate).toLocaleDateString()}. Contact ${staffMember.name} at ${staffMember.phone} for any questions.`,
              delivery_schedule_id: data.id
            }
          });
        }
      }

      toast({
        title: "Success",
        description: "Delivery schedule created successfully"
      });

      // Reset form
      setSelectedCustomer('');
      setSelectedJob('');
      setSelectedStaff('');
      setScheduledDate('');
      setDeliveryMethod('');
      setDeliveryAddress('');
      setDeliveryInstructions('');
      setDeliveryFee('');
      setCustomerJobs([]);
    } catch (error) {
      console.error('Error creating delivery schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create delivery schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Schedule Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {customer.name} ({customer.customer_display_id})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Selection */}
          {selectedCustomer && (
            <div className="space-y-2">
              <Label htmlFor="job">Job *</Label>
              <Select value={selectedJob} onValueChange={handleJobChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {customerJobs.map((job) => (
                    <SelectItem key={job.id} value={job.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {job.title} - {job.tracking_code} ({job.status})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Staff Assignment */}
          <div className="space-y-2">
            <Label htmlFor="staff">Assign Staff Member</Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member (optional)" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduledDate">Scheduled Date *</Label>
            <Input
              type="date"
              id="scheduledDate"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
          </div>

          {/* Delivery Method */}
          <div className="space-y-2">
            <Label htmlFor="deliveryMethod">Delivery Method</Label>
            <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Home Delivery</SelectItem>
                <SelectItem value="courier">Courier Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Address */}
          {deliveryMethod === 'delivery' && (
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
              />
            </div>
          )}

          {/* Delivery Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Delivery Instructions</Label>
            <Textarea
              id="instructions"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="Any special instructions for delivery"
            />
          </div>

          {/* Delivery Fee */}
          <div className="space-y-2">
            <Label htmlFor="deliveryFee">Delivery Fee (Le)</Label>
            <Input
              type="number"
              id="deliveryFee"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Button type="submit" disabled={loading || !selectedCustomer || !selectedJob || !scheduledDate}>
            {loading ? 'Creating Schedule...' : 'Create Delivery Schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};