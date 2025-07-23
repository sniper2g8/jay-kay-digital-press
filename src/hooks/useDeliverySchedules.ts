import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DeliverySchedule {
  id: string;
  job_id: number;
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  delivery_method: string;
  delivery_address?: string;
  delivery_status: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  delivery_instructions?: string;
  tracking_number?: string;
  delivery_fee?: number;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  assigned_driver_id?: string;
  non_system_staff_id?: string;
  delivery_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useDeliverySchedules = () => {
  const [deliverySchedules, setDeliverySchedules] = useState<DeliverySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDeliverySchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_schedules')
        .select('*')
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

  const createDeliverySchedule = async (scheduleData: any) => {
    try {
      const { error } = await supabase
        .from('delivery_schedules')
        .insert(scheduleData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Delivery schedule created successfully"
      });

      fetchDeliverySchedules();
    } catch (error) {
      console.error('Error creating delivery schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create delivery schedule",
        variant: "destructive"
      });
    }
  };

  const updateDeliveryStatus = async (scheduleId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('delivery_schedules')
        .update({ delivery_status: status })
        .eq('id', scheduleId);

      if (error) throw error;

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

  useEffect(() => {
    fetchDeliverySchedules();
  }, []);

  return {
    deliverySchedules,
    loading,
    createDeliverySchedule,
    updateDeliveryStatus,
    deleteDeliverySchedule,
    fetchDeliverySchedules
  };
};