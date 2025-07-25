import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, Shield, AlertTriangle } from "lucide-react";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { CompanyLogo } from "@/components/common/LogoHeader";
import { validateEmail, validatePhone, validatePassword, sanitizeInput, rateLimit } from "@/utils/inputValidation";
import { handleError, validateSecureContext } from "@/utils/errorHandling";

export const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] as string[] });
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

    // Validate secure context
    if (!validateSecureContext()) {
      toast({
        title: "Security Warning",
        description: "This site should be accessed over HTTPS for security.",
        variant: "destructive",
      });
    }
  }, [navigate, toast]);

  // Real-time password validation
  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [password]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting check
    const clientId = `signup-${email || 'unknown'}-${Date.now()}`;
    if (!rateLimit(clientId, 3, 60 * 60 * 1000)) {
      toast({
        title: "Too Many Attempts",
        description: "Please wait an hour before creating another account.",
        variant: "destructive",
      });
      return;
    }

    // Comprehensive input validation
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = sanitizeInput(phone);

    if (!sanitizedName || sanitizedName.length < 2) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid name (at least 2 characters).",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "Weak Password",
        description: passwordValidation.errors.join(' '),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: sanitizedName,
            phone: sanitizedPhone,
          }
        }
      });

      if (error) {
        const userMessage = handleError(error, 'registration');
        toast({
          title: "Registration Failed", 
          description: userMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account Created Successfully!",
          description: "Please check your email to confirm your account before signing in.",
        });
        // Redirect to login page after successful registration
        navigate('/login');
      }
    } catch (error) {
      const userMessage = handleError(error, 'registration');
      toast({
        title: "Registration Error",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
            <CardTitle className="text-2xl text-center font-semibold">Create Account</CardTitle>
            <CardDescription className="text-center text-base">
              Join us for premium printing services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(sanitizeInput(e.target.value))}
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                    autoComplete="name"
                    maxLength={100}
                  />
                </div>
              </div>

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
                    onChange={(e) => setEmail(sanitizeInput(e.target.value))}
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                    autoComplete="email"
                    maxLength={254}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number <span className="text-muted-foreground">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+232 XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(sanitizeInput(e.target.value))}
                    className="pl-10 h-11"
                    disabled={loading}
                    autoComplete="tel"
                    maxLength={20}
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
                    placeholder="Create a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
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
                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {passwordValidation.isValid ? (
                        <Shield className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className={`text-xs font-medium ${passwordValidation.isValid ? 'text-green-500' : 'text-yellow-500'}`}>
                        {passwordValidation.isValid ? 'Strong password' : 'Password requirements:'}
                      </span>
                    </div>
                    {!passwordValidation.isValid && passwordValidation.errors.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
            
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
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline">
                  Sign In
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