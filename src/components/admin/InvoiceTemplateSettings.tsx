import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, FileText } from "lucide-react";

interface InvoiceTemplateSettings {
  id?: number;
  header_text: string;
  footer_text: string;
  company_name: string;
  company_address: string;
  company_email: string;
  company_phone: string;
  logo_url: string;
  payment_terms: string;
  bank_details: string;
  notes_placeholder: string;
}

export const InvoiceTemplateSettings = () => {
  const [template, setTemplate] = useState<InvoiceTemplateSettings>({
    header_text: "INVOICE",
    footer_text: "Thank you for your business!",
    company_name: "JAY KAY DIGITAL PRESS",
    company_address: "123 Business Street\nFreetown, Sierra Leone",
    company_email: "info@jaykaypress.com",
    company_phone: "+232 76 123 456",
    logo_url: "",
    payment_terms: "Payment is due within 30 days of invoice date.",
    bank_details: "Bank: Your Bank Name\nAccount: 123456789\nSort Code: 12-34-56",
    notes_placeholder: "Additional notes and terms can be added here."
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      // Check if we have invoice template settings
      const { data: settings, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (settings) {
        setTemplate({
          header_text: "INVOICE",
          footer_text: "Thank you for your business!",
          company_name: settings.company_name || "JAY KAY DIGITAL PRESS",
          company_address: settings.address || "123 Business Street\nFreetown, Sierra Leone",
          company_email: settings.email || "info@jaykaypress.com",
          company_phone: settings.phone || "+232 76 123 456",
          logo_url: settings.logo_url || "",
          payment_terms: "Payment is due within 30 days of invoice date.",
          bank_details: "Bank: Your Bank Name\nAccount: 123456789\nSort Code: 12-34-56",
          notes_placeholder: "Additional notes and terms can be added here."
        });
      }
    } catch (error: any) {
      console.error('Error fetching template:', error);
    }
    setLoading(false);
  };

  const saveTemplate = async () => {
    setSaving(true);
    try {
      // Save to company settings
      const { error } = await supabase
        .from("company_settings")
        .upsert({
          company_name: template.company_name,
          address: template.company_address,
          email: template.company_email,
          phone: template.company_phone,
          logo_url: template.logo_url
        }, { onConflict: "id" });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invoice template settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to save template settings",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleInputChange = (field: keyof InvoiceTemplateSettings, value: string) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p>Loading template settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Invoice Template Settings</h2>
        <Button onClick={saveTemplate} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Template"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={template.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                placeholder="JAY KAY DIGITAL PRESS"
              />
            </div>
            <div>
              <Label htmlFor="company_address">Company Address</Label>
              <Textarea
                id="company_address"
                value={template.company_address}
                onChange={(e) => handleInputChange("company_address", e.target.value)}
                placeholder="123 Business Street&#10;Freetown, Sierra Leone"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="company_email">Company Email</Label>
              <Input
                id="company_email"
                type="email"
                value={template.company_email}
                onChange={(e) => handleInputChange("company_email", e.target.value)}
                placeholder="info@jaykaypress.com"
              />
            </div>
            <div>
              <Label htmlFor="company_phone">Company Phone</Label>
              <Input
                id="company_phone"
                value={template.company_phone}
                onChange={(e) => handleInputChange("company_phone", e.target.value)}
                placeholder="+232 76 123 456"
              />
            </div>
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                value={template.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Content */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="header_text">Header Text</Label>
              <Input
                id="header_text"
                value={template.header_text}
                onChange={(e) => handleInputChange("header_text", e.target.value)}
                placeholder="INVOICE"
              />
            </div>
            <div>
              <Label htmlFor="footer_text">Footer Text</Label>
              <Input
                id="footer_text"
                value={template.footer_text}
                onChange={(e) => handleInputChange("footer_text", e.target.value)}
                placeholder="Thank you for your business!"
              />
            </div>
            <div>
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Textarea
                id="payment_terms"
                value={template.payment_terms}
                onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                placeholder="Payment is due within 30 days of invoice date."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="bank_details">Bank Details</Label>
              <Textarea
                id="bank_details"
                value={template.bank_details}
                onChange={(e) => handleInputChange("bank_details", e.target.value)}
                placeholder="Bank: Your Bank Name&#10;Account: 123456789&#10;Sort Code: 12-34-56"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="notes_placeholder">Notes Placeholder</Label>
              <Textarea
                id="notes_placeholder"
                value={template.notes_placeholder}
                onChange={(e) => handleInputChange("notes_placeholder", e.target.value)}
                placeholder="Additional notes and terms can be added here."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-6 bg-white text-black">
            <div className="text-center border-b pb-4 mb-6">
              <h1 className="text-3xl font-bold">{template.header_text}</h1>
              <p className="text-muted-foreground mt-2">#SAMPLE-001</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-3">From:</h3>
                <div className="text-sm">
                  <p className="font-medium">{template.company_name}</p>
                  {template.company_address.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                  <p>{template.company_email}</p>
                  <p>{template.company_phone}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3">To:</h3>
                <div className="text-sm">
                  <p className="font-medium">Sample Customer</p>
                  <p>customer@example.com</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{template.footer_text}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};