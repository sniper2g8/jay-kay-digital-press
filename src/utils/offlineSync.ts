import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from './offlineStorage';

export class OfflineSync {
  static async syncJobsToLocal() {
    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobs) {
        for (const job of jobs) {
          await offlineStorage.store('jobs', job);
        }
      }
    } catch (error) {
      console.error('Failed to sync jobs to local storage:', error);
    }
  }

  static async syncCustomersToLocal() {
    try {
      const { data: customers } = await supabase
        .from('customers')
        .select('*');

      if (customers) {
        for (const customer of customers) {
          await offlineStorage.store('customers', customer);
        }
      }
    } catch (error) {
      console.error('Failed to sync customers to local storage:', error);
    }
  }

  static async syncServicesToLocal() {
    try {
      const { data: services } = await supabase
        .from('services')
        .select('*');

      if (services) {
        for (const service of services) {
          await offlineStorage.store('services', service);
        }
      }
    } catch (error) {
      console.error('Failed to sync services to local storage:', error);
    }
  }

  static async syncUserProfileToLocal(userId: string) {
    try {
      // Store user profile in local storage
      const profileData = { id: userId, user_id: userId, synced_at: new Date().toISOString() };
      await offlineStorage.store('userProfile', profileData);
    } catch (error) {
      console.error('Failed to sync user profile to local storage:', error);
    }
  }

  static async getJobsFromLocal() {
    try {
      return await offlineStorage.getAll('jobs');
    } catch (error) {
      console.error('Failed to get jobs from local storage:', error);
      return [];
    }
  }

  static async getCustomersFromLocal() {
    try {
      return await offlineStorage.getAll('customers');
    } catch (error) {
      console.error('Failed to get customers from local storage:', error);
      return [];
    }
  }

  static async getServicesFromLocal() {
    try {
      return await offlineStorage.getAll('services');
    } catch (error) {
      console.error('Failed to get services from local storage:', error);
      return [];
    }
  }

  static async getUserProfileFromLocal() {
    try {
      const profiles = await offlineStorage.getAll('userProfile');
      return profiles[0] || null;
    } catch (error) {
      console.error('Failed to get user profile from local storage:', error);
      return null;
    }
  }

  static async syncAllToLocal() {
    await Promise.all([
      this.syncJobsToLocal(),
      this.syncCustomersToLocal(),
      this.syncServicesToLocal()
    ]);
  }

  static async queueOfflineAction(url: string, method: string, headers: any, body: any) {
    const action = {
      url,
      method,
      headers,
      body: JSON.stringify(body),
      timestamp: Date.now()
    };

    await offlineStorage.addPendingAction(action);
  }
}