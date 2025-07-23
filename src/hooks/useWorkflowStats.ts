import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WorkflowStats {
  total_jobs: number;
  pending_jobs: number;
  active_jobs: number;
  completed_jobs: number;
  cancelled_jobs: number;
}

export const useWorkflowStats = () => {
  const [stats, setStats] = useState<WorkflowStats>({
    total_jobs: 0,
    pending_jobs: 0,
    active_jobs: 0,
    completed_jobs: 0,
    cancelled_jobs: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get all jobs with their status
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, status');

      if (error) throw error;

      const total_jobs = jobs?.length || 0;
      let pending_jobs = 0;
      let active_jobs = 0;
      let completed_jobs = 0;
      let cancelled_jobs = 0;

      jobs?.forEach(job => {
        const statusName = job.status;

        if (statusName === 'Cancelled') {
          cancelled_jobs++;
        } else if (statusName === 'Pending' || statusName === 'Received') {
          pending_jobs++;
        } else if (statusName === 'Completed' || statusName === 'Waiting for Collection') {
          completed_jobs++;
        } else {
          active_jobs++;
        }
      });

      setStats({
        total_jobs,
        pending_jobs,
        active_jobs,
        completed_jobs,
        cancelled_jobs
      });
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    fetchStats
  };
};