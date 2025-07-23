// API layer for customers
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  auth_user_id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  customer_display_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const customersApi = {
  // Get all customers
  getAll: async (limit?: number, offset?: number): Promise<{ data: Customer[] | null; error: any }> => {
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    return await query;
  },

  // Get customer by ID
  getById: async (id: string): Promise<{ data: Customer | null; error: any }> => {
    return await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
  },

  // Get customer by display ID
  getByDisplayId: async (displayId: string): Promise<{ data: Customer | null; error: any }> => {
    return await supabase
      .from('customers')
      .select('*')
      .eq('customer_display_id', displayId)
      .single();
  },

  // Get customer by auth user ID
  getByAuthUserId: async (authUserId: string): Promise<{ data: Customer | null; error: any }> => {
    return await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
  },

  // Search customers
  search: async (query: string): Promise<{ data: Customer[] | null; error: any }> => {
    return await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,customer_display_id.ilike.%${query}%`)
      .order('name');
  },

  // Create new customer
  create: async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'customer_display_id'>): Promise<{ data: Customer | null; error: any }> => {
    return await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();
  },

  // Update customer
  update: async (id: string, updates: Partial<Customer>): Promise<{ data: Customer | null; error: any }> => {
    return await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
  },

  // Delete customer
  delete: async (id: string): Promise<{ error: any }> => {
    return await supabase
      .from('customers')
      .delete()
      .eq('id', id);
  },

  // Get customer stats
  getStats: async (customerId: string): Promise<{ data: any; error: any }> => {
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, status, created_at, final_price')
      .eq('customer_uuid', customerId);

    if (jobsError) return { data: null, error: jobsError };

    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, status, total_amount')
      .eq('customer_id', customerId);

    if (invoicesError) return { data: null, error: invoicesError };

    const stats = {
      totalJobs: jobs?.length || 0,
      completedJobs: jobs?.filter(j => j.status === 'Completed').length || 0,
      totalSpent: invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
      pendingInvoices: invoices?.filter(inv => inv.status === 'sent').length || 0
    };

    return { data: stats, error: null };
  }
};