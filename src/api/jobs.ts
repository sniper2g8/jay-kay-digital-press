// API layer for jobs
import { supabase } from "@/integrations/supabase/client";

export interface JobFile {
  id: number;
  job_id: number;
  file_path: string;
  description?: string;
  uploaded_at: string;
}

export interface Job {
  id: number;
  title?: string;
  description?: string;
  service_id: number;
  service_subtype?: string;
  customer_uuid: string;
  customer_id: string;
  paper_type?: string;
  paper_weight?: string;
  width?: number;
  length?: number;
  quantity?: number;
  delivery_method: string;
  delivery_address?: string;
  current_status: number;
  status?: string;
  estimated_completion?: string;
  actual_completion?: string;
  due_date?: string;
  quoted_price?: number;
  final_price?: number;
  tracking_code?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  created_by_user?: string;
  finishing_options?: any;
  files?: any;
}

export const jobsApi = {
  // Get all jobs with filters
  getAll: async (filters?: {
    status?: string;
    customer_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: Job[] | null; error: any }> => {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        customers!jobs_customer_uuid_fkey (name, customer_display_id, email),
        services (name, service_type)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_uuid', filters.customer_id);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    return await query;
  },

  // Get job by ID
  getById: async (id: number): Promise<{ data: Job | null; error: any }> => {
    return await supabase
      .from('jobs')
      .select(`
        *,
        customers!jobs_customer_uuid_fkey (name, customer_display_id, email, phone, address),
        services (name, service_type, description)
      `)
      .eq('id', id)
      .single();
  },

  // Get job by tracking code
  getByTrackingCode: async (trackingCode: string): Promise<{ data: Job | null; error: any }> => {
    return await supabase
      .from('jobs')
      .select(`
        *,
        customers!jobs_customer_uuid_fkey (name, customer_display_id),
        services (name, service_type)
      `)
      .eq('tracking_code', trackingCode)
      .single();
  },

  // Create new job
  create: async (job: Partial<Job>): Promise<{ data: Job | null; error: any }> => {
    return await supabase
      .from('jobs')
      .insert(job)
      .select()
      .single();
  },

  // Update job
  update: async (id: number, updates: Partial<Job>): Promise<{ data: Job | null; error: any }> => {
    return await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Update job status
  updateStatus: async (id: number, statusId: number, notes?: string): Promise<{ data: Job | null; error: any }> => {
    const { data: statusData, error: statusError } = await supabase
      .from('workflow_status')
      .select('name')
      .eq('id', statusId)
      .single();

    if (statusError) return { data: null, error: statusError };

    const updates: any = {
      current_status: statusId,
      status: statusData.name,
      updated_at: new Date().toISOString()
    };

    // Set completion time if status is "Completed"
    if (statusData.name === 'Completed') {
      updates.actual_completion = new Date().toISOString();
    }

    return await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Delete job
  delete: async (id: number): Promise<{ error: any }> => {
    return await supabase
      .from('jobs')
      .delete()
      .eq('id', id);
  },

  // Get job files
  getFiles: async (jobId: number): Promise<{ data: JobFile[] | null; error: any }> => {
    return await supabase
      .from('job_files')
      .select('*')
      .eq('job_id', jobId)
      .order('uploaded_at');
  }
};