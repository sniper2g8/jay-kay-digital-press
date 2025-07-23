import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Printer, 
  Package, 
  Palette,
  CreditCard,
  FileImage,
  Eye,
  Image,
  Wrench,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Truck,
  Upload,
  MessageSquareQuote,
  ShoppingCart,
  Star,
  ArrowRight,
  Play,
  Search,
  Package2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useEmblaCarousel from 'embla-carousel-react';
import heroImage from "@/assets/hero-bg.jpg";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { 
  SERVICE_TYPES, 
  DEFAULT_SERVICES,
  type ServiceType 
} from '@/constants/services';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [emblaRef] = useEmblaCarousel({ loop: true });
  const { settings: companySettings } = useCompanySettings();
  
  // Tracking functionality
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingJob, setTrackingJob] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

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

  const navigate = useNavigate();

  const handleTrackJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setTrackingError("Please enter a tracking code");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          description,
          quantity,
          status,
          tracking_code,
          created_at,
          estimated_completion,
          delivery_method,
          delivery_address,
          services (
            name,
            service_type
          ),
          customers (
            name,
            email,
            phone
          )
        `)
        .eq("tracking_code", trackingCode.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setTrackingError("No job found with this tracking code");
        return;
      }

      // Navigate to tracking page
      navigate(`/track/${trackingCode.trim()}`);
    } catch (error) {
      console.error("Error tracking job:", error);
      setTrackingError("Failed to track job. Please try again.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // Generate service icons based on service type
  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'Business Card': return CreditCard;
      case 'Banner': return Image;
      case 'SAV': return Eye;
      case 'Flyer': return FileImage;
      case 'Poster': return FileImage;
      case 'Brochure': return FileImage;
      case 'Sticker': return Package;
      default: return Palette;
    }
  };

  // Dynamic services from constants
  const keyServices = DEFAULT_SERVICES.slice(0, 6).map(service => ({
    icon: getServiceIcon(service.service_type),
    title: service.name,
    description: service.description,
    service_type: service.service_type,
    base_price: service.base_price
  }));

  const whyChooseUs = [
    { icon: Star, title: "High-Quality Prints", description: "Premium materials and latest printing technology" },
    { icon: Clock, title: "Fast Turnaround", description: "Quick delivery without compromising quality" },
    { icon: DollarSign, title: "Competitive Pricing", description: "Best value for professional printing services" },
    { icon: Users, title: "Expert Staff", description: "Experienced team dedicated to your success" },
    { icon: Truck, title: "Nationwide Delivery", description: "Reliable delivery across Sierra Leone" }
  ];

  const howItWorks = [
    { step: 1, icon: ShoppingCart, title: "Choose Service", description: "Select from our wide range of printing services" },
    { step: 2, icon: Upload, title: "Upload Files & Details", description: "Submit your designs and specifications" },
    { step: 3, icon: MessageSquareQuote, title: "Get a Quote", description: "Receive instant pricing for your project" },
    { step: 4, icon: Truck, title: "Receive & Track", description: "Track your order and receive premium prints" }
  ];

  const showcaseImages = [
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400",
    "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400", 
    "https://images.unsplash.com/photo-1607703703520-bb638e84caf2?w=400",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{companySettings?.company_name || 'Loading...'}</h1>
            <p className="text-primary-foreground/80">Bringing Your Prints to Life</p>
          </div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="secondary">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center text-center text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="container mx-auto px-4 z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            Bringing Your Prints to Life
          </h2>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Professional digital printing services with cutting-edge technology and personalized customer care
          </p>
          <Link to="/register">
            <Button size="lg" className="px-12 py-6 text-lg font-semibold bg-primary hover:bg-primary/90 animate-scale-in">
              Start Your Print Job
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Job Tracking Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">Track Your Order</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enter your tracking code to see the current status of your print job
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="p-6">
              <form onSubmit={handleTrackJob} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trackingCode" className="text-base font-medium">
                    Tracking Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="trackingCode"
                      type="text"
                      placeholder="Enter your tracking code (e.g., JKDP-0001)"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className="pl-10"
                    />
                    <Package2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  {trackingError && (
                    <p className="text-sm text-destructive">{trackingError}</p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={trackingLoading}
                >
                  {trackingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Tracking...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Track Order
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Services */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Our Services</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Professional printing solutions for all your business and personal needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {keyServices.map((service, index) => (
              <Card key={index} className="hover:shadow-xl transition-all duration-300 hover-scale group">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <Badge variant="outline" className="w-fit mx-auto">
                    {service.service_type}
                  </Badge>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base mb-3">{service.description}</CardDescription>
                  <p className="text-lg font-semibold text-primary">
                    Starting at Le {service.base_price.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Dynamic Services from Database */}
          {services.length > 0 && (
            <>
              <div className="text-center mt-16 mb-8">
                <h4 className="text-2xl font-bold mb-4">More Services</h4>
                <p className="text-muted-foreground">Additional services available in our system</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.filter(service => 
                  !DEFAULT_SERVICES.some(ds => ds.name === service.name)
                ).map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <Badge variant="secondary">{service.service_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-primary">Le {service.base_price.toFixed(2)}</span>
                        <Link to="/register">
                          <Button size="sm" variant="outline">
                            Order Now
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Why Choose Us?</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We deliver exceptional value through quality, speed, and service excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-10 w-10 text-primary-foreground" />
                </div>
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Gallery */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Showcase Gallery</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See our recent work and quality in action
            </p>
          </div>

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {showcaseImages.map((image, index) => (
                <div key={index} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-4">
                  <div className="relative group cursor-pointer">
                    <img 
                      src={image} 
                      alt={`Showcase ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/showcase">
              <Button variant="outline" size="lg">
                View Full Portfolio
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">How It Works</h3>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Simple steps to get your professional prints delivered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <step.icon className="h-10 w-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-sm font-bold text-secondary-foreground">
                    {step.step}
                  </div>
                </div>
                <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/register">
              <Button size="lg" className="px-8">
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold mb-4">Get In Touch</h3>
            <p className="text-xl text-muted-foreground">Ready to start your project? Contact us today!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl">Call Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-semibold text-lg">{companySettings?.phone || 'Contact us'}</p>
                <p className="text-muted-foreground">Mon - Fri, 8AM - 6PM</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl">Email Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-semibold text-lg">{companySettings?.email || 'Contact us'}</p>
                <p className="text-muted-foreground">Quick response guaranteed</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl">Visit Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="font-semibold text-lg">{companySettings?.address || '123 Business Street'}</p>
                <p className="text-muted-foreground">{companySettings?.country || 'Freetown, Sierra Leone'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h4 className="text-2xl font-bold mb-4">{companySettings?.company_name || 'Loading...'}</h4>
            <p className="text-primary-foreground/80 mb-6 text-lg">Your trusted printing partner since 2020</p>
            <div className="flex justify-center gap-6 mb-6">
              <Link to="/login" className="text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                Services
              </Link>
              <Link to="/showcase" className="text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                Portfolio
              </Link>
              <Link to="/login" className="text-primary-foreground hover:text-primary-foreground/80 transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-primary-foreground/60">
              © 2024 {companySettings?.company_name || 'Print Shop'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};