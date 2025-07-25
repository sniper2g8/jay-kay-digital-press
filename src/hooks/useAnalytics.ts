import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsEvent {
  event_type: string;
  event_data?: any;
  user_id?: string;
}

interface AnalyticsMetrics {
  daily_revenue: number;
  monthly_jobs: number;
  active_customers: number;
  pending_jobs: number;
  completed_jobs: number;
  total_revenue: number;
}

export const useAnalytics = () => {
  const { toast } = useToast();

  const trackEvent = async (event: AnalyticsEvent) => {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: event.event_type,
          event_data: event.event_data,
          user_id: event.user_id,
        });

      if (error) throw error;
    } catch (error) {
      // ...existing code...
    }
  };

  const getMetrics = async (period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<AnalyticsMetrics | null> => {
    try {
      let startDate = new Date();
      let endDate = new Date();

      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Get revenue data
      const { data: revenueData } = await supabase
        .from('jobs')
        .select('final_price, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('final_price', 'is', null);

      // Get job counts
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('status, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get customer count
      const { data: customersData } = await supabase
        .from('customers')
        .select('id')
        .gte('created_at', startDate.toISOString());

      // Calculate metrics
      const totalRevenue = revenueData?.reduce((sum, job) => sum + (Number(job.final_price) || 0), 0) || 0;
      const dailyRevenue = period === 'today' ? totalRevenue : totalRevenue / getDaysDifference(startDate, endDate);
      const monthlyJobs = jobsData?.length || 0;
      const activeCustomers = customersData?.length || 0;
      const pendingJobs = jobsData?.filter(job => job.status === 'Pending').length || 0;
      const completedJobs = jobsData?.filter(job => job.status === 'Completed').length || 0;

      return {
        daily_revenue: dailyRevenue,
        monthly_jobs: monthlyJobs,
        active_customers: activeCustomers,
        pending_jobs: pendingJobs,
        completed_jobs: completedJobs,
        total_revenue: totalRevenue,
      };
    } catch (error) {
      toast({
        title: "Analytics Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
      return null;
    }
  };

  const getRevenueChart = async (period: 'week' | 'month' | 'year' = 'month') => {
    try {
      let startDate = new Date();
      let groupBy = '';
      
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          groupBy = 'day';
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          groupBy = 'day';
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          groupBy = 'month';
          break;
      }

      const { data } = await supabase
        .from('jobs')
        .select('final_price, created_at')
        .gte('created_at', startDate.toISOString())
        .not('final_price', 'is', null);

      // Group data by period
      const chartData = data?.reduce((acc: any[], job) => {
        const date = new Date(job.created_at);
        const key = groupBy === 'day' 
          ? date.toISOString().split('T')[0]
          : `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        const existing = acc.find(item => item.period === key);
        const jobRevenue = Number(job.final_price) || 0;
        
        if (existing) {
          existing.revenue += jobRevenue;
        } else {
          acc.push({
            period: key,
            revenue: jobRevenue,
          });
        }
        return acc;
      }, []) || [];

      return chartData.sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      return [];
    }
  };

  const getDaysDifference = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Analytics tracking functions
  const trackJobCreated = (jobId: number, customerId: string) =>
    trackEvent({
      event_type: 'job_created',
      event_data: { job_id: jobId },
      user_id: customerId,
    });

  const trackJobCompleted = (jobId: number, revenue: number) =>
    trackEvent({
      event_type: 'job_completed',
      event_data: { job_id: jobId, revenue: revenue.toString() },
    });

  const trackCustomerRegistered = (customerId: string) =>
    trackEvent({
      event_type: 'customer_registered',
      user_id: customerId,
    });

  return {
    trackEvent,
    getMetrics,
    getRevenueChart,
    trackJobCreated,
    trackJobCompleted,
    trackCustomerRegistered,
  };
};