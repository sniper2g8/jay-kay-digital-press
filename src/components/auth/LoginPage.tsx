import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { CompanyLogo } from "@/components/common/LogoHeader";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { settings } = useCompanySettings();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });
      navigate('/dashboard', { replace: true });
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message || "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header with company branding */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Homepage
          </Link>
          <div className="flex items-center justify-center mb-4">
            <CompanyLogo className="w-10 h-10 mr-3" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">
                {settings?.company_name || 'Loading...'}
              </h1>
              <p className="text-sm text-muted-foreground">Professional Printing Services</p>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl text-center font-semibold">Welcome Back</CardTitle>
            <CardDescription className="text-center text-base">
              Sign in to access your printing dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-sm text-primary hover:text-primary/80 hover:underline disabled:opacity-50"
              >
                {resetLoading ? 'Sending...' : 'Forgot your password?'}
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline">
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer with company contact */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Need help? Contact us at{' '}
            <a href={`mailto:${settings?.email || 'contact@company.com'}`} className="text-primary hover:underline">
              {settings?.email || 'contact@company.com'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};