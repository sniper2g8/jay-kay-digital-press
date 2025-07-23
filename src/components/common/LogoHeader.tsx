import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useEffect } from "react";

export const LogoHeader = () => {
  const { settings } = useCompanySettings();

  useEffect(() => {
    // Update favicon and page title when company settings change
    if (settings) {
      // Update page title
      document.title = settings.company_name || 'Print Shop';

      // Update favicon if logo_url exists
      if (settings.logo_url) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = settings.logo_url;
      }

      // Update meta tags
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `${settings.company_name} - Professional printing services`);
      }
    }
  }, [settings]);

  return null;
};

export const CompanyLogo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  const { settings } = useCompanySettings();

  if (settings?.logo_url) {
    return (
      <img 
        src={settings.logo_url} 
        alt={settings.company_name}
        className={className}
        onError={(e) => {
          // Fallback to text if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('span');
          fallback.textContent = settings.company_name;
          fallback.className = 'font-bold text-lg';
          target.parentNode?.insertBefore(fallback, target.nextSibling);
        }}
      />
    );
  }

  return (
    <span className="font-bold text-lg">
      {settings?.company_name || 'Print Shop'}
    </span>
  );
};