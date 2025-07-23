import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const NotFound = () => {
  const { settings } = useCompanySettings();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
            <span className="text-3xl font-bold text-muted-foreground">404</span>
          </div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link to="/">
              <Button className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="pt-4 text-sm text-muted-foreground">
            <p>Need help? Contact us:</p>
            <p>📞 {settings?.phone || 'Contact us'}</p>
            <p>✉️ {settings?.email || 'Contact us'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
