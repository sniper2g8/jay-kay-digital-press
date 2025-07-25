import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, User, Mail, Lock, Phone, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { validatePassword, validateEmail, sanitizeInput } from '@/utils/inputValidation';

export const UnifiedAuthPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isInviteSignUp, setIsInviteSignUp] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Unified form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });
  
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, errors: [] as string[] });

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    };
    checkUser();
  }, [navigate, location]);

  useEffect(() => {
    // Check for invitation token in URL
    const inviteParam = searchParams.get('invite');
    if (inviteParam) {
      setInviteToken(inviteParam);
      setIsInviteSignUp(true);
      setIsSignUp(true);
      fetchInviteData(inviteParam);
    }
  }, [searchParams]);

  const fetchInviteData = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          *,
          roles (
            name
          )
        `)
        .eq('invite_token', token)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error || !data) {
        toast.error('Invalid or expired invitation link');
        setIsInviteSignUp(false);
        setInviteToken(null);
        return;
      }

      setInviteData(data);
      setFormData(prev => ({
        ...prev,
        email: data.invited_email,
        name: data.invited_name,
        phone: data.invited_phone || ''
      }));
    } catch (error) {
      console.error('Error fetching invite data:', error);
      toast.error('Failed to load invitation details');
      setIsInviteSignUp(false);
      setInviteToken(null);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Sanitize input
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Validate password in real-time for signup
    if (field === 'password' && isSignUp) {
      const validation = validatePassword(sanitizedValue);
      setPasswordValidation(validation);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        
        // Validate email format
        if (!validateEmail(formData.email)) {
          toast.error('Please enter a valid email address');
          setIsLoading(false);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }

        // Use comprehensive password validation
        if (!passwordValidation.isValid) {
          toast.error('Password does not meet security requirements');
          setIsLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/dashboard`;
        
        if (isInviteSignUp && inviteToken) {
          // Handle invitation signup
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                name: formData.name,
                phone: formData.phone
              }
            }
          });

          if (authError) {
            toast.error(authError.message);
            return;
          }

          // Process the invitation using the database function
          const { data: processResult, error: processError } = await supabase
            .rpc('process_invitation_signup', {
              invite_token_param: inviteToken,
              user_auth_id: authData.user?.id,
              user_password: formData.password
            });

          const result = processResult as { success?: boolean; error?: string; role?: string } | null;

          if (processError || !result?.success) {
            toast.error(result?.error || 'Failed to complete invitation signup');
            return;
          }

          toast.success(`Account created successfully! Welcome to the team as ${result.role}.`);
          navigate('/dashboard', { replace: true });
        } else {
          // Regular signup
          const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                name: formData.name,
                phone: formData.phone
              }
            }
          });

          if (error) {
            toast.error(error.message);
          } else {
            toast.success('Account created! Please check your email for verification.');
            // Switch to login mode after successful signup
            setIsSignUp(false);
            setFormData(prev => ({ ...prev, password: '', confirmPassword: '', name: '', phone: '' }));
          }
        }
      } else {
        // Sign in flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          const from = location.state?.from?.pathname || '/dashboard';
          navigate(from, { replace: true });
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      phone: ''
    });
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <img 
                src="/lovable-uploads/206bc571-58ab-4338-87a3-922114137a36.png" 
                alt="Jay Kay Digital Press Logo" 
                className="h-16 w-16 object-contain"
              />
            </div>
            <CardTitle className="text-2xl font-bold">
              {isInviteSignUp ? (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6" />
                  Accept Invitation
                </span>
              ) : (isSignUp ? 'Create Account' : 'Welcome Back')}
            </CardTitle>
            <CardDescription className="text-base">
              {isInviteSignUp
                ? `You've been invited to join as ${inviteData?.roles?.name || 'a team member'}. Complete your account setup below.`
                : (isSignUp 
                  ? 'Join JAY KAY DIGITAL PRESS to access our printing services'
                  : 'Sign in to access your printing dashboard'
                )
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Invitation Info */}
            {isInviteSignUp && inviteData && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <UserPlus className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-medium">Invitation Details:</p>
                    <p className="text-sm mt-1">
                      Role: <span className="font-medium">{inviteData.roles?.name}</span><br />
                      Email: <span className="font-medium">{inviteData.invited_email}</span>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field - only for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      disabled={isInviteSignUp}
                      required
                    />
                </div>
              </div>

              {/* Phone field - only for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignUp ? "Create a strong password (min. 8 characters)" : "Enter your password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password strength indicator for signup */}
                {isSignUp && formData.password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {passwordValidation.isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className={`text-sm ${passwordValidation.isValid ? 'text-green-600' : 'text-destructive'}`}>
                        {passwordValidation.isValid ? 'Password meets requirements' : 'Password requirements not met'}
                      </span>
                    </div>
                    
                    {passwordValidation.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc list-inside space-y-1">
                            {passwordValidation.errors.map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password field - only for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="pl-10"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : (isInviteSignUp ? 'Accept Invitation & Create Account' : (isSignUp ? 'Create Account' : 'Sign In'))}
              </Button>

              {/* Toggle between sign in and sign up - hide for invitations */}
              {!isInviteSignUp && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="ml-2 text-red-600 hover:text-red-700 font-semibold hover:underline"
                    >
                      {isSignUp ? 'Sign In' : 'Create Account'}
                    </button>
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>By signing {isSignUp ? 'up' : 'in'}, you agree to our terms of service and privacy policy.</p>
        </div>
      </div>
    </div>
  );
};