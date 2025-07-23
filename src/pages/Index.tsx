import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { CustomerDashboard } from "@/components/customer/CustomerDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Index = () => {
  const { user, session, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !session) {
    // This should not happen since this page is protected, but just in case
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  // Route based on user role
  if (userRole === 'Admin' || userRole === 'Staff' || userRole === 'System User') {
    return <AdminDashboard user={user} userRole={userRole} />;
  }

  // Default to customer dashboard
  return <CustomerDashboard user={user} />;
};

export default Index;
