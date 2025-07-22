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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role_id, roles(name)')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.roles) {
            setUserRole(profile.roles.name);
          }
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

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

  // Route based on user role
  if (userRole === 'Admin' || userRole === 'Staff' || userRole === 'System User') {
    return <AdminDashboard user={user} userRole={userRole} />;
  }

  return <CustomerDashboard user={user} />;
};

export default Index;
