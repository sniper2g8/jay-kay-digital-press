import { useCompanySettings } from "@/hooks/useCompanySettings";
import { CompanyLogo } from "./LogoHeader";
import { Separator } from "@/components/ui/separator";

export const Footer = () => {
  const { settings } = useCompanySettings();

  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <CompanyLogo className="h-10 w-auto" />
            <p className="text-sm text-muted-foreground max-w-xs">
              {settings?.company_name || 'Professional printing services'} - Your trusted partner for all printing needs.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              {settings?.phone && (
                <p>📞 {settings.phone}</p>
              )}
              {settings?.email && (
                <p>✉️ {settings.email}</p>
              )}
              {settings?.address && (
                <p>📍 {settings.address}</p>
              )}
              {settings?.business_hours && (
                <p>🕒 {settings.business_hours}</p>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><a href="/track" className="hover:text-foreground transition-colors">Track Your Order</a></p>
              <p><a href="/showcase" className="hover:text-foreground transition-colors">Our Work</a></p>
              {settings?.website && (
                <p><a href={settings.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Visit Website</a></p>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings?.company_name || 'Print Shop'}. All rights reserved.</p>
          <p>Powered by our print management system</p>
        </div>
      </div>
    </footer>
  );
};