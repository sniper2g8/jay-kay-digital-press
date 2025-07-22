import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, Send } from "lucide-react";

interface Service {
  id: number;
  name: string;
  requires_dimensions: boolean;
}

interface QuoteRequestProps {
  onSuccess?: () => void;
}

export const QuoteRequest = ({ onSuccess }: QuoteRequestProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    service_id: "",
    quantity: 1,
    width: "",
    length: "",
    delivery_method: "",
    delivery_address: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('id, name, requires_dimensions')
      .eq('is_active', true);
    
    if (data) {
      setServices(data);
    }
  };

  const getCurrentCustomer = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (!customer) throw new Error('Customer not found');
    return customer.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const customerId = await getCurrentCustomer();
      
      const quoteData = {
        customer_id: customerId,
        service_id: parseInt(formData.service_id),
        title: formData.title,
        description: formData.description,
        quantity: formData.quantity,
        width: formData.width ? parseFloat(formData.width) : null,
        length: formData.length ? parseFloat(formData.length) : null,
        delivery_method: formData.delivery_method,
        delivery_address: formData.delivery_address || null,
        notes: formData.notes || null,
        validity_days: 30,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      const { error } = await supabase
        .from('quotes')
        .insert([quoteData]);

      if (error) throw error;

      toast({
        title: "Quote Request Submitted",
        description: "We'll review your request and get back to you soon.",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        service_id: "",
        quantity: 1,
        width: "",
        length: "",
        delivery_method: "",
        delivery_address: "",
        notes: ""
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast({
        title: "Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === parseInt(formData.service_id));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Request Quote
        </CardTitle>
        <CardDescription>
          Get a custom quote for your printing project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Project Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Business Cards for Tech Startup"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="service">Service Type</Label>
              <Select value={formData.service_id} onValueChange={(value) => setFormData({ ...formData, service_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="delivery">Delivery Method</Label>
              <Select value={formData.delivery_method} onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedService?.requires_dimensions && (
              <>
                <div>
                  <Label htmlFor="width">Width (inches)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    placeholder="e.g., 24"
                  />
                </div>
                <div>
                  <Label htmlFor="length">Length (inches)</Label>
                  <Input
                    id="length"
                    type="number"
                    step="0.1"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    placeholder="e.g., 36"
                  />
                </div>
              </>
            )}

            {formData.delivery_method === 'delivery' && (
              <div className="md:col-span-2">
                <Label htmlFor="delivery_address">Delivery Address</Label>
                <Textarea
                  id="delivery_address"
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  placeholder="Enter complete delivery address"
                  rows={2}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project requirements, specifications, etc."
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requirements or notes"
                rows={2}
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Quote Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};