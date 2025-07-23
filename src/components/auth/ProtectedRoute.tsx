import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { hasPermission } from '@/constants/roles';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  allowedRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  allowedRoles,
  fallbackPath = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check permission-based access
  if (requiredPermission && userRole && !hasPermission(userRole, requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}