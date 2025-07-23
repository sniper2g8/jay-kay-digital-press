import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CompanySettings {
  company_name: string;
  primary_color: string;
  secondary_color: string;
  theme_color: string;
  highlight_color: string;
  link_color: string;
  logo_url: string;
  currency_symbol: string;
  phone?: string;
  email?: string;
  address?: string;
  country?: string;
  business_hours?: string;
  website?: string;
}

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
        applyTheme(data);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (settings: CompanySettings) => {
    const root = document.documentElement;
    
    // Convert hex to HSL
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
          default: h = 0;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    if (settings.primary_color) {
      root.style.setProperty('--primary', hexToHsl(settings.primary_color));
    }
    if (settings.secondary_color) {
      root.style.setProperty('--secondary', hexToHsl(settings.secondary_color));
    }
    if (settings.highlight_color) {
      root.style.setProperty('--accent', hexToHsl(settings.highlight_color));
    }
  };

  return { settings, loading, refetch: fetchSettings };
};