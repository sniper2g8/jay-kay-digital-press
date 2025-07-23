import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Settings, Upload, Image, Globe } from "lucide-react";

interface CompanySettingsData {
  company_name: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  business_hours: string;
  country: string;
  currency_symbol: string;
  currency_code: string;
  primary_color: string;
  secondary_color: string;
  theme_color: string;
  highlight_color: string;
  link_color: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_handle: string;
  notification_sender_name: string;
  notification_sender_email: string;
  logo_url: string;
}

export const CompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettingsData>({
    company_name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    business_hours: "",
    country: "",
    currency_symbol: "Le",
    currency_code: "SLE",
    primary_color: "#000000",
    secondary_color: "#f8f9fa",
    theme_color: "#000000",
    highlight_color: "#ffd700",
    link_color: "#0066cc",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    og_title: "",
    og_description: "",
    og_image: "",
    twitter_handle: "",
    notification_sender_name: "",
    notification_sender_email: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<{ logo: boolean; favicon: boolean }>({ logo: false, favicon: false });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load company settings",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_settings")
        .upsert(settings, { onConflict: "id" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleInputChange = (field: keyof CompanySettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const uploadFile = async (file: File, type: 'logo' | 'favicon') => {
    setUploading(prev => ({ ...prev, [type]: true }));
    
    try {
      // Validate file type
      if (type === 'favicon' && !['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Favicon must be a PNG or JPG file. ICO files are not supported.",
          variant: "destructive",
        });
        return;
      }

      if (type === 'logo' && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type", 
          description: "Logo must be an image file.",
          variant: "destructive",
        });
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) throw new Error('Failed to get public URL');

      // Update settings
      if (type === 'logo') {
        setSettings(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      }

      // For favicon, we need to update the HTML head as well
      if (type === 'favicon') {
        updateFavicon(urlData.publicUrl);
      }

      toast({
        title: "Success",
        description: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`,
      });

    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || `Failed to upload ${type}`,
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const updateFavicon = (faviconUrl: string) => {
    // Remove existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"]');
    existingLinks.forEach(link => link.remove());

    // Add new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl;
    link.type = 'image/png';
    document.head.appendChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file, type);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p>Loading settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Company Settings</h2>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                placeholder="Jay Kay Digital Press"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="info@jaykaypress.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+232 76 123 456"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={settings.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://jaykaypress.com"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Your business address"
              />
            </div>
            <div>
              <Label htmlFor="business_hours">Business Hours</Label>
              <Input
                id="business_hours"
                value={settings.business_hours}
                onChange={(e) => handleInputChange("business_hours", e.target.value)}
                placeholder="Mon-Fri 8AM-6PM"
              />
            </div>
          </CardContent>
        </Card>

        {/* Currency & Locale */}
        <Card>
          <CardHeader>
            <CardTitle>Currency & Locale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={settings.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Sierra Leone"
              />
            </div>
            <div>
              <Label htmlFor="currency_symbol">Currency Symbol</Label>
              <Input
                id="currency_symbol"
                value={settings.currency_symbol}
                onChange={(e) => handleInputChange("currency_symbol", e.target.value)}
                placeholder="Le"
              />
            </div>
            <div>
              <Label htmlFor="currency_code">Currency Code</Label>
              <Input
                id="currency_code"
                value={settings.currency_code}
                onChange={(e) => handleInputChange("currency_code", e.target.value)}
                placeholder="SLE"
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Assets */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Assets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <div className="space-y-2">
                <Input
                  id="logo_url"
                  value={settings.logo_url}
                  onChange={(e) => handleInputChange("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="logo_upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm">
                      <Upload className="h-4 w-4" />
                      {uploading.logo ? "Uploading..." : "Upload Logo"}
                    </div>
                  </Label>
                  <Input
                    id="logo_upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="hidden"
                    disabled={uploading.logo}
                  />
                  {settings.logo_url && (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Logo set</span>
                    </div>
                  )}
                </div>
                {settings.logo_url && (
                  <div className="mt-2">
                    <img 
                      src={settings.logo_url} 
                      alt="Company Logo Preview" 
                      className="h-16 w-auto border rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="favicon_upload">Favicon</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="favicon_upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 text-sm">
                      <Globe className="h-4 w-4" />
                      {uploading.favicon ? "Uploading..." : "Upload Favicon"}
                    </div>
                  </Label>
                  <Input
                    id="favicon_upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => handleFileUpload(e, 'favicon')}
                    className="hidden"
                    disabled={uploading.favicon}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a PNG or JPG file for the favicon. ICO files are not supported.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange("primary_color", e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange("primary_color", e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                  placeholder="#f8f9fa"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="highlight_color">Highlight Color</Label>
              <div className="flex gap-2">
                <Input
                  id="highlight_color"
                  type="color"
                  value={settings.highlight_color}
                  onChange={(e) => handleInputChange("highlight_color", e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.highlight_color}
                  onChange={(e) => handleInputChange("highlight_color", e.target.value)}
                  placeholder="#ffd700"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Settings */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={settings.seo_title}
                onChange={(e) => handleInputChange("seo_title", e.target.value)}
                placeholder="Jay Kay Digital Press - Premium Printing Services"
              />
            </div>
            <div>
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={settings.seo_description}
                onChange={(e) => handleInputChange("seo_description", e.target.value)}
                placeholder="Professional printing services in Sierra Leone..."
              />
            </div>
            <div>
              <Label htmlFor="seo_keywords">SEO Keywords</Label>
              <Input
                id="seo_keywords"
                value={settings.seo_keywords}
                onChange={(e) => handleInputChange("seo_keywords", e.target.value)}
                placeholder="printing, design, banners, business cards"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};