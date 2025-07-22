import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Printer, Package, Palette } from "lucide-react";
import { Link } from "react-router-dom";

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  image_url: string | null;
  base_price: number;
}

export const Homepage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .limit(6);
      
      if (data) {
        setServices(data);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  const getServiceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'printing': return <Printer className="h-6 w-6" />;
      case 'packaging': return <Package className="h-6 w-6" />;
      default: return <Palette className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">JAY KAY DIGITAL PRESS</h1>
            <p className="text-primary-foreground/80">Professional Printing Services</p>
          </div>
          <div className="flex gap-4">
            <Link to="/auth">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Premium Digital Printing Solutions
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From business cards to large format banners, we deliver exceptional quality printing services with cutting-edge technology and personalized customer care.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="px-8">Submit a Job</Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">View Portfolio</Button>
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Our Services</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive printing solutions for all your business and personal needs
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      {getServiceIcon(service.service_type)}
                      <Badge variant="secondary">{service.service_type}</Badge>
                    </div>
                    <CardTitle>{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Starting from</span>
                      <span className="font-bold text-primary">Le {service.base_price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Get In Touch</h3>
            <p className="text-muted-foreground">Ready to start your project? Contact us today!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Call Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-semibold">+232 76 123 456</p>
                <p className="text-sm text-muted-foreground">Mon - Fri, 8AM - 6PM</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Email Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-semibold">info@jaykaypress.com</p>
                <p className="text-sm text-muted-foreground">Quick response guaranteed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Visit Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-semibold">123 Business Street</p>
                <p className="text-sm text-muted-foreground">Freetown, Sierra Leone</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-4 text-center">
          <h4 className="text-xl font-bold mb-2">JAY KAY DIGITAL PRESS</h4>
          <p className="text-primary-foreground/80 mb-4">Your trusted printing partner since 2020</p>
          <p className="text-sm text-primary-foreground/60">
            © 2024 Jay Kay Digital Press. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};