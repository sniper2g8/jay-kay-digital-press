import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { CustomerDashboard } from "@/components/customer/CustomerDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const { user, session, loading, userRole, userProfile } = useAuth();

  // Debug logging
  console.log('Index page - Auth state:', {
    user: !!user,
    session: !!session,
    loading,
    userRole,
    userProfile: !!userProfile
  });

  if (loading) {
    console.log('Index page - Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !session) {
    console.log('Index page - No user or session, redirecting...');
    // This should not happen since this page is protected, but just in case
    window.location.href = '/login';
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  console.log('Index page - User role check:', userRole);

  // Route based on user role
  if (userRole === 'Admin' || userRole === 'Staff' || userRole === 'System User') {
    console.log('Index page - Showing admin dashboard');
    return <AdminDashboard user={user} userRole={userRole} />;
  }

  // Default to customer dashboard
  console.log('Index page - Showing customer dashboard');
  return <CustomerDashboard user={user} />;
};

export default Index;
