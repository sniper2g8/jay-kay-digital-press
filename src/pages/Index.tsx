import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { AuthPage } from "@/components/auth/AuthPage";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { CustomerDashboard } from "@/components/customer/CustomerDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Homepage } from "./Homepage";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    console.log('Index: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', { event, hasSession: !!session, userId: session?.user?.id });
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Fetching user role for:', session.user.id);
          // Fetch user role
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role_id, roles(name)')
            .eq('id', session.user.id)
            .single();
          
          console.log('Profile query result:', { profile, error });
          
          if (error) {
            console.error('Error fetching profile:', error);
            // If error, set as customer by default
            setUserRole('Customer');
          } else if (profile?.roles) {
            console.log('Setting user role to:', profile.roles.name);
            setUserRole(profile.roles.name);
          } else {
            console.log('No profile roles found, setting as Customer');
            // If no profile exists, set as customer by default
            setUserRole('Customer');
          }
        } else {
          console.log('No session, clearing user role');
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session and wait for role fetch
    const checkSession = async () => {
      console.log('Checking existing session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Existing session:', { hasSession: !!session, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('Fetching role for existing session:', session.user.id);
        // Fetch user role for existing session
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role_id, roles(name)')
          .eq('id', session.user.id)
          .single();
        
        console.log('Existing session profile query:', { profile, error });
        
        if (error) {
          console.error('Error fetching profile for existing session:', error);
          setUserRole('Customer');
        } else if (profile?.roles) {
          console.log('Setting existing session user role to:', profile.roles.name);
          setUserRole(profile.roles.name);
        } else {
          console.log('No existing session profile roles found, setting as Customer');
          setUserRole('Customer');
        }
      }
      setLoading(false);
    };
    
    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !session) {
    return <Homepage />;
  }

  console.log('Index render:', { loading, hasUser: !!user, hasSession: !!session, userRole });

  // Route based on user role
  if (userRole === 'Admin' || userRole === 'Staff' || userRole === 'System User') {
    console.log('Rendering AdminDashboard for role:', userRole);
    return <AdminDashboard user={user} userRole={userRole} />;
  }

  if (user && session && userRole) {
    console.log('Rendering CustomerDashboard for role:', userRole);
    return <CustomerDashboard user={user} />;
  }

  // If we have a user/session but no role yet, show loading
  if (user && session && !userRole) {
    console.log('User/session exists but role not loaded yet, showing loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // Default fallback - should not reach here but just in case
  console.log('Fallback: Rendering Homepage');
  return <Homepage />;
};

export default Index;
