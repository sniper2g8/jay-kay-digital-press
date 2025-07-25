import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OfflineSync } from '@/utils/offlineSync';
import { useOffline } from '@/hooks/useOffline';

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
  const { isOnline } = useOffline();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      if (isOnline) {
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
        
        // Sync to local storage
        await OfflineSync.syncJobsToLocal();
      } else {
        // Load from local storage when offline
        const localJobs = await OfflineSync.getJobsFromLocal();
        setJobs(localJobs);
        
        toast({
          title: "Offline Mode",
          description: "Showing cached data. Some information may be outdated.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      
      // Try to load from local storage as fallback
      try {
        const localJobs = await OfflineSync.getJobsFromLocal();
        setJobs(localJobs);
        
        toast({
          title: "Connection Issue",
          description: "Showing cached data. Check your connection.",
          variant: "destructive"
        });
      } catch (localError) {
        toast({
          title: "Error",
          description: "Failed to fetch jobs",
          variant: "destructive"
        });
      }
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