import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { Star, Award, Clock, CheckCircle, Users, Palette, Settings2 } from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  service_type: string;
  base_price: number;
  image_url: string | null;
}

interface Slide {
  id: number;
  title: string | null;
  file_path: string;
}

export const DisplayShowcaseScreen = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { settings } = useCompanySettings();

  useEffect(() => {
    fetchData();
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (slides.length > 0) {
      const slideInterval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(slideInterval);
    }
  }, [slides.length]);

  const fetchData = async () => {
    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .limit(6);

      if (!servicesError) {
        setServices(servicesData || []);
      }

      // Fetch showcase slides
      const { data: slidesData, error: slidesError } = await supabase
        .from("showcase_slides")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (!slidesError) {
        setSlides(slidesData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case "design":
        return <Palette className="h-8 w-8" />;
      case "printing":
        return <Settings2 className="h-8 w-8" />;
      default:
        return <Star className="h-8 w-8" />;
    }
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      text: "Excellent quality printing and fast service. Highly recommended!",
      rating: 5,
    },
    {
      name: "Michael Chen",
      text: "Professional design work and reliable delivery. Great experience!",
      rating: 5,
    },
    {
      name: "Aisha Kamara",
      text: "Best printing service in town. Always satisfied with the results.",
      rating: 5,
    },
  ];

  const stats = [
    { icon: <Users className="h-6 w-6" />, label: "Happy Customers", value: "500+" },
    { icon: <CheckCircle className="h-6 w-6" />, label: "Jobs Completed", value: "2000+" },
    { icon: <Award className="h-6 w-6" />, label: "Years of Experience", value: "5+" },
    { icon: <Clock className="h-6 w-6" />, label: "Same Day Service", value: "Available" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white overflow-hidden">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="relative z-10 text-center py-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
            {settings?.company_name || "Loading..."}
          </h1>
          <p className="text-2xl text-blue-200 mb-6">
            Professional Printing & Design Services in Sierra Leone
          </p>
          <div className="text-lg text-blue-300">
            {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* Hero Slides Section */}
        {slides.length > 0 && (
          <div className="mb-12">
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={slides[currentSlide]?.file_path}
                alt={slides[currentSlide]?.title || "Showcase"}
                className="w-full h-full object-cover transition-opacity duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {slides[currentSlide]?.title && (
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-3xl font-bold text-white">
                    {slides[currentSlide].title}
                  </h3>
                </div>
              )}
              
              {/* Slide indicators */}
              <div className="absolute bottom-4 right-8 flex gap-2">
                {slides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Services Section */}
          <div>
            <h2 className="text-4xl font-bold mb-8 text-center">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {services.slice(0, 6).map((service) => (
                <Card key={service.id} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-blue-300">
                        {getServiceIcon(service.service_type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                        <Badge variant="secondary" className="bg-blue-600 text-white">
                          {service.service_type}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-blue-100 mb-4 line-clamp-3">
                      {service.description || "Professional service with quality guaranteed."}
                    </p>
                    {service.base_price && (
                      <p className="text-blue-200 font-semibold">
                        Starting from Le {service.base_price.toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Testimonials & Stats Section */}
          <div className="space-y-8">
            {/* Stats */}
            <div>
              <h2 className="text-4xl font-bold mb-8 text-center">Why Choose Us</h2>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardContent className="p-6 text-center">
                      <div className="text-blue-300 flex justify-center mb-3">
                        {stat.icon}
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                      <p className="text-blue-200 text-sm">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div>
              <h2 className="text-3xl font-bold mb-6 text-center">What Our Customers Say</h2>
              <div className="space-y-4">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-blue-100 mb-3">"{testimonial.text}"</p>
                      <p className="text-blue-300 font-semibold">- {testimonial.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-12 text-center">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 mx-auto max-w-2xl">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">Contact Us Today</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-200">
                {settings?.phone && (
                  <p><strong>Phone:</strong> {settings.phone}</p>
                )}
                {settings?.email && (
                  <p><strong>Email:</strong> {settings.email}</p>
                )}
                {settings?.address && (
                  <p><strong>Address:</strong> {settings.address}</p>
                )}
                {settings?.business_hours && (
                  <p><strong>Hours:</strong> {settings.business_hours}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};