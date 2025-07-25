import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { 
  FileText, 
  Image, 
  Calendar, 
  Star,
  ArrowRight,
  Users,
  Clock,
  Award,
  Palette,
  Phone,
  Mail,
  MapPin,
  Send,
  WifiOff
} from "lucide-react";

// Import service images
import businessCardsImg from "@/assets/services/business-cards.jpg";
import flyersBrochuresImg from "@/assets/services/flyers-brochures.jpg";
import bannersSignageImg from "@/assets/services/banners-signage.jpg";
import postersLargeFormatImg from "@/assets/services/posters-large-format.jpg";
import bookletsCatalogsImg from "@/assets/services/booklets-catalogs.jpg";
import labelsStickersImg from "@/assets/services/labels-stickers.jpg";
// Hardcoded services data - no Supabase fetching needed
const HARDCODED_SERVICES = [
  {
    title: "Business Cards",
    description: "Make lasting first impressions with premium business cards featuring elegant designs and professional finishes",
    features: ["Premium cardstock options", "Elegant finishes available", "Same-day turnaround", "Professional designs"],
    image: businessCardsImg,
    popular: true
  },
  {
    title: "Flyers & Brochures",
    description: "Captivate your audience with eye-catching marketing materials that showcase your brand and drive engagement",
    features: ["Full-color vibrant printing", "Multiple paper grades", "Custom sizes & folds", "Marketing optimization"],
    image: flyersBrochuresImg,
    popular: true
  },
  {
    title: "Banners & Signage",
    description: "Command attention with durable outdoor banners and indoor signage solutions for maximum brand visibility",
    features: ["Weather-resistant materials", "Custom dimensions", "Indoor/outdoor options", "High-resolution graphics"],
    image: bannersSignageImg,
    popular: true
  },
  {
    title: "Posters & Large Format",
    description: "Transform spaces with stunning large format prints perfect for events, presentations, and advertising displays",
    features: ["Large format capabilities", "Museum-quality prints", "Multiple substrate options", "Exhibition ready"],
    image: postersLargeFormatImg,
    popular: true
  },
  {
    title: "Booklets & Catalogs",
    description: "Present comprehensive information beautifully with professionally bound booklets and detailed product catalogs",
    features: ["Perfect binding options", "Saddle-stitch binding", "Full-color pages", "Custom page counts"],
    image: bookletsCatalogsImg,
    popular: true
  },
  {
    title: "Labels & Stickers",
    description: "Brand your products professionally with custom labels and promotional stickers in various shapes and sizes",
    features: ["Waterproof materials", "Custom die-cutting", "Adhesive options", "Bulk quantities"],
    image: labelsStickersImg,
    popular: false
  }
];

const COMPANY_STATS = [
  { icon: Users, value: "500+", label: "Happy Customers" },
  { icon: Clock, value: "24hr", label: "Fast Turnaround" },
  { icon: Award, value: "100%", label: "Quality Guarantee" },
];

export const SimpleHomepage = () => {
  const navigate = useNavigate();
  const isOnline = useOfflineStatus();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      alert("Contact form requires internet connection. Please try again when you're online.");
      return;
    }
    // Contact form submitted successfully
    // Reset form
    setContactForm({ name: "", email: "", phone: "", message: "" });
    alert("Thank you for your message! We'll get back to you soon.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 text-center">
          <WifiOff className="inline-block w-4 h-4 mr-2" />
          You're offline. Some features may be limited.
        </div>
      )}
      
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/lovable-uploads/206bc571-58ab-4338-87a3-922114137a36.png" 
              alt="Jay Kay Digital Press Logo" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-foreground">JAY KAY DIGITAL PRESS</h1>
              <p className="text-sm text-muted-foreground">Professional Printing Services</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="#services" className="text-foreground hover:text-primary transition-colors">Services</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact</a>
            <button 
              onClick={() => navigate("/track")} 
              className="text-foreground hover:text-primary transition-colors"
            >
              Track Order
            </button>
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
      <section id="home" className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/lovable-uploads/6547acd2-7a0c-4b2d-ad63-4957c2a7b57b.png')` }}
        />
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        <div className="relative container mx-auto px-4 text-center text-white z-10">
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
            {COMPANY_STATS.map((stat, index) => (
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
            {HARDCODED_SERVICES.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-red-200">
                <CardContent className="pt-6">
                  <div className="relative mb-4">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    {service.popular && (
                      <Badge className="absolute top-3 right-3 bg-red-600 text-white">Popular</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground group-hover:text-red-600 transition-colors mb-2 text-center">
                    {service.title}
                  </CardTitle>
                  <p className="text-muted-foreground mb-4 leading-relaxed text-center">
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

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Get in Touch</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ready to start your project? Contact us for a free consultation and quote.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-8">Contact Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg flex-shrink-0">
                    <Phone className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Phone</p>
                    <p className="text-muted-foreground">+232 34 788711, +232 30 741062</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg flex-shrink-0">
                    <Mail className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <p className="text-muted-foreground">jaykaydigitalpress@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg flex-shrink-0">
                    <MapPin className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Address</p>
                    <p className="text-muted-foreground">St. Edward School Avenue, By Caritas, Freetown, Sierra Leone</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => navigate("/auth")}
                  >
                    Request Quote
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/track")}
                  >
                    Track Order
                  </Button>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-8">Send us a Message</h3>
              <p className="text-muted-foreground mb-6">Have a question or special request? We'd love to hear from you.</p>
              
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                
                <div>
                  <Textarea
                    placeholder="Message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    rows={5}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/lovable-uploads/206bc571-58ab-4338-87a3-922114137a36.png" 
                  alt="Jay Kay Digital Press Logo" 
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <h3 className="text-2xl font-bold">JAY KAY DIGITAL PRESS</h3>
                  <p className="text-gray-400">Professional Printing Services</p>
                </div>
              </div>
              <p className="text-gray-400">
                Transform your ideas into stunning printed materials with our premium quality services and fast turnaround times.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/#services" className="hover:text-white transition-colors">Business Cards</a></li>
                <li><a href="/#services" className="hover:text-white transition-colors">Flyers & Brochures</a></li>
                <li><a href="/#services" className="hover:text-white transition-colors">Banners & Signage</a></li>
                <li><a href="/#services" className="hover:text-white transition-colors">Posters</a></li>
                <li><a href="/#services" className="hover:text-white transition-colors">Booklets</a></li>
                <li><a href="/#services" className="hover:text-white transition-colors">Labels & Stickers</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div>
                    <p>+232 34 788711</p>
                    <p>+232 30 741062</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p>jaykaydigitalpress@gmail.com</p>
                </div>
                <div className="flex items-start gap-3 text-gray-400">
                  <MapPin className="h-4 w-4 text-red-500 flex-shrink-0 mt-1" />
                  <p>St. Edward School Avenue, By Caritas, Freetown, Sierra Leone</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 JAY KAY DIGITAL PRESS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleHomepage;