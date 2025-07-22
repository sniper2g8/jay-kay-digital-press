import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CompanySettings {
  id: number;
  company_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  business_hours: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  theme_color: string;
  highlight_color: string;
  link_color: string;
  currency_symbol: string;
  currency_code: string;
  country: string | null;
  notification_sender_name: string | null;
  notification_sender_email: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  twitter_handle: string | null;
}

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching company settings:', error);
        setError('Failed to load company settings');
        return;
      }

      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('Error in fetchSettings:', err);
      setError('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
  };
};