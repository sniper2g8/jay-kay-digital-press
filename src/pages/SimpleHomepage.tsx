import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const SimpleHomepage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">JAY KAY DIGITAL PRESS</h1>
              <p className="text-sm text-muted-foreground">Professional Printing Services</p>
            </div>
          </div>
          
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
              Get Your Quote
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

      {/* Simple Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional printing services with premium finishing options
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-xl font-bold mb-2">Business Cards</h3>
              <p className="text-muted-foreground">Professional business cards with premium finishes</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-xl font-bold mb-2">Flyers & Brochures</h3>
              <p className="text-muted-foreground">Eye-catching marketing materials</p>
            </div>
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-xl font-bold mb-2">Banners & Signage</h3>
              <p className="text-muted-foreground">Durable outdoor and indoor signage</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">JAY KAY DIGITAL PRESS</h3>
          <p className="text-gray-400 mb-4">Professional Printing Services</p>
          <p className="text-gray-400">St. Edward School Avenue, By Caritas, Freetown, Sierra Leone</p>
        </div>
      </footer>
    </div>
  );
};