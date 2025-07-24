import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/common/LogoHeader";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Image, 
  Calendar, 
  Star,
  ArrowRight,
  Users,
  Clock,
  Award,
  Palette
} from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  image_url: string | null;
  base_price: number | null;
}

export const Homepage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .limit(6);
        
        if (error) throw error;
        setServices(data || []);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

  const popularServices = [
    {
      title: "Business Cards",
      description: "Make lasting first impressions with premium business cards featuring elegant designs and professional finishes",
      features: ["Premium cardstock options", "Elegant finishes available", "Same-day turnaround", "Professional designs"],
      icon: FileText,
      popular: true
    },
    {
      title: "Flyers & Brochures",
      description: "Captivate your audience with eye-catching marketing materials that showcase your brand and drive engagement",
      features: ["Full-color vibrant printing", "Multiple paper grades", "Custom sizes & folds", "Marketing optimization"],
      icon: Image,
      popular: true
    },
    {
      title: "Banners & Signage",
      description: "Command attention with durable outdoor banners and indoor signage solutions for maximum brand visibility",
      features: ["Weather-resistant materials", "Custom dimensions", "Indoor/outdoor options", "High-resolution graphics"],
      icon: Calendar,
      popular: true
    },
    {
      title: "Posters & Large Format",
      description: "Transform spaces with stunning large format prints perfect for events, presentations, and advertising displays",
      features: ["Large format capabilities", "Museum-quality prints", "Multiple substrate options", "Exhibition ready"],
      icon: Star,
      popular: true
    },
    {
      title: "Booklets & Catalogs",
      description: "Present comprehensive information beautifully with professionally bound booklets and detailed product catalogs",
      features: ["Perfect binding options", "Saddle-stitch binding", "Full-color pages", "Custom page counts"],
      icon: Palette,
      popular: true
    }
  ];

  const stats = [
    { icon: Users, value: "500+", label: "Happy Customers" },
    { icon: Clock, value: "24hr", label: "Fast Turnaround" },
    { icon: Award, value: "100%", label: "Quality Guarantee" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CompanyLogo className="h-10 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">JAY KAY DIGITAL PRESS</h1>
              <p className="text-sm text-muted-foreground">Professional Printing Services</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="#services" className="text-foreground hover:text-primary transition-colors">Services</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">Track Order</a>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 min-h-[70vh] flex items-center">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=1920&auto=format&fit=crop')",
            backgroundPosition: "center",
            backgroundSize: "cover"
          }}
        />
        <div className="relative container mx-auto px-4 text-center text-white">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Professional <span className="text-red-500">Printing</span>
            <br />
            Made Simple
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-4xl mx-auto leading-relaxed">
            Transform your ideas into stunning printed materials with our premium quality services and fast turnaround times.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg"
              onClick={() => navigate("/auth")}
            >
              Get Your Quote <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white bg-white/10 backdrop-blur hover:bg-white hover:text-gray-900 px-8 py-4 text-lg"
              onClick={() => navigate("/auth")}
            >
              Submit Project
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional printing services with premium finishing options to meet all your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {popularServices.slice(0, 6).map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-red-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
                      <service.icon className="h-6 w-6 text-red-600" />
                    </div>
                    {service.popular && (
                      <Badge className="bg-red-600 text-white">Popular</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-red-600 transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {service.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-all"
                    onClick={() => navigate("/login")}
                  >
                    Request Quote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Project?
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
            Get professional printing services with fast turnaround times and premium quality results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-red-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
              onClick={() => navigate("/auth")}
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white bg-white/10 backdrop-blur hover:bg-white hover:text-red-600 px-8 py-4 text-lg"
              onClick={() => navigate("/auth")}
            >
              View Portfolio
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <CompanyLogo className="h-8 w-auto" />
                <span className="font-bold text-lg">Jay Kay Digital Press</span>
              </div>
              <p className="text-gray-400">
                Professional printing services with premium quality and fast turnaround times.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Business Cards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Flyers & Brochures</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Banners</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Large Format</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Jay Kay Digital Press. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};