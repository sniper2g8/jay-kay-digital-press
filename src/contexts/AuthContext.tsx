import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userProfile: any | null;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Check if user is an internal user (staff/admin)
      const { data: internalUser } = await supabase
        .from('internal_users')
        .select(`
          *,
          roles (name)
        `)
        .eq('auth_user_id', userId)
        .single();

      if (internalUser) {
        setUserRole(internalUser.roles.name);
        setUserProfile(internalUser);
        return;
      }

      // Check if user is a customer
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (customer) {
        setUserRole('Customer');
        setUserProfile(customer);
        return;
      }

      // If no profile found, user might be new - set as customer by default
      setUserRole('Customer');
      setUserProfile(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserRole(null);
      setUserProfile(null);
    }
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile data
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      userRole,
      userProfile,
      signOut,
      refetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}