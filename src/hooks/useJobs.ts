import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Job {
  id: number;
  customer_id: string;
  customer_uuid: string;
  customer_name?: string;
  service_id: number;
  service_name?: string;
  current_status: number;
  status_name?: string;
  tracking_code: string;
  title?: string;
  description?: string;
  quantity?: number;
  quoted_price?: number;
  final_price?: number;
  created_at: string;
  updated_at: string;
  due_date?: string;
  delivery_method: string;
  delivery_address?: string;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          customers!jobs_customer_uuid_fkey(name),
          services(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedJobs = data?.map(job => ({
        ...job,
        customer_name: job.customers?.name,
        service_name: job.services?.name,
        status_name: job.status || 'Unknown'
      })) || [];

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: number, statusId: number) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ current_status: statusId })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job status updated successfully"
      });

      fetchJobs(); // Refresh the list
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs,
    loading,
    fetchJobs,
    updateJobStatus
  };
};