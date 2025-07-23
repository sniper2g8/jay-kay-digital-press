// API layer for services
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SERVICES } from "@/constants/services";

export interface Service {
  id: number;
  name: string;
  description?: string;
  service_type?: string;
  base_price?: number;
  requires_dimensions?: boolean;
  available_subtypes?: any;
  available_paper_types?: any;
  available_paper_weights?: any;
  available_finishes?: any;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const servicesApi = {
  // Get all active services
  getAll: async (): Promise<{ data: Service[] | null; error: any }> => {
    return await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');
  },

  // Get service by ID
  getById: async (id: number): Promise<{ data: Service | null; error: any }> => {
    return await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
  },

  // Create new service
  create: async (service: Partial<Service>): Promise<{ data: Service | null; error: any }> => {
    return await supabase
      .from('services')
      .insert(service)
      .select()
      .single();
  },

  // Update service
  update: async (id: number, updates: Partial<Service>): Promise<{ data: Service | null; error: any }> => {
    return await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Delete (deactivate) service
  delete: async (id: number): Promise<{ error: any }> => {
    return await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', id);
  },

  // Initialize default services
  initializeDefaults: async (): Promise<{ data: Service[] | null; error: any }> => {
    const { data: existing, error: checkError } = await supabase
      .from('services')
      .select('id')
      .limit(1);

    if (checkError) return { data: null, error: checkError };

    // Only initialize if no services exist
    if (existing && existing.length > 0) {
      return { data: existing as Service[], error: null };
    }

    return await supabase
      .from('services')
      .insert(DEFAULT_SERVICES.map(service => ({
        ...service,
        is_active: true
      })))
      .select();
  }
};