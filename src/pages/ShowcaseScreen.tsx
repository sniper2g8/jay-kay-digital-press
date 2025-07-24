import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Award, Clock, Palette } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";

interface Slide {
  id: number;
  title: string;
  file_path: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  base_price: number;
}

export const ShowcaseScreen = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { settings } = useCompanySettings();

  useEffect(() => {
    const fetchContent = async () => {
      // Fetch showcase slides
      const { data: slidesData } = await supabase
        .from('showcase_slides')
        .select('*')
        .order('uploaded_at', { ascending: false });

      // Fetch featured services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (slidesData) setSlides(slidesData);
      if (servicesData) setServices(servicesData);
    };

    fetchContent();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const promotionalMessages = [
    "🎯 New Customer? Get 10% off your first order!",
    "⚡ Same-day printing available for urgent orders",
    "🏆 Award-winning quality since 2020",
    `📞 Call us now: ${settings?.phone || 'Contact us'}`,
    "🎨 Custom designs available - speak to our team!"
  ];

  const [currentPromo, setCurrentPromo] = useState(0);

  useEffect(() => {
    const promoTimer = setInterval(() => {
      setCurrentPromo(prev => (prev + 1) % promotionalMessages.length);
    }, 5000);
    return () => clearInterval(promoTimer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{settings?.company_name || 'Loading...'}</h1>
              <p className="text-primary-foreground/90">Premium Printing & Design Solutions</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Live Time</span>
              </div>
              <p className="text-xl font-bold">{currentTime.toLocaleTimeString()}</p>
              <p className="text-sm text-primary-foreground/80">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Promotional Banner */}
      <div className="bg-gradient-to-r from-accent to-secondary text-accent-foreground py-3">
        <div className="container mx-auto px-6">
          <p className="text-center font-semibold animate-fade-in">
            {promotionalMessages[currentPromo]}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Showcase Carousel */}
        {slides.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Our Latest Work</h2>
            <Carousel className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {slides.map((slide) => (
                  <CarouselItem key={slide.id}>
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-0">
                        <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                          <img
                            src={slide.file_path}
                            alt={slide.title || "Showcase"}
                            className="w-full h-full object-cover"
                          />
                          {slide.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                              <h3 className="text-white text-xl font-bold">{slide.title}</h3>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        )}

        {/* Services Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.slice(0, 6).map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Palette className="h-6 w-6 text-primary" />
                    <Badge variant="secondary">{service.service_type}</Badge>
                  </div>
                  <h3 className="font-bold mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">From</span>
                    <span className="font-bold text-primary">Le {service.base_price}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-6">
            <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Premium Quality</h3>
            <p className="text-muted-foreground">State-of-the-art equipment ensuring exceptional results</p>
          </Card>
          
          <Card className="text-center p-6">
            <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Fast Turnaround</h3>
            <p className="text-muted-foreground">Most orders completed within 24-48 hours</p>
          </Card>
          
          <Card className="text-center p-6">
            <Award className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Expert Team</h3>
            <p className="text-muted-foreground">Professional designers and printing specialists</p>
          </Card>
        </div>

        {/* Contact CTA */}
        <Card className="bg-primary text-primary-foreground text-center p-8">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg mb-6">Contact us today for a free quote on your printing project</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">📞 {settings?.phone || 'Contact us'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">✉️ {settings?.email || 'Contact us'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-muted py-6 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            © 2024 {settings?.company_name || 'Print Shop'} • Your Trusted Printing Partner
          </p>
        </div>
      </footer>
    </div>
  );
};