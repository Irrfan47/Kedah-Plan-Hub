import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute - isLoading:', isLoading);
  console.log('ProtectedRoute - user:', user);
  console.log('ProtectedRoute - user role:', user?.role);

  if (isLoading) {
    console.log('ProtectedRoute - Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - User authenticated, rendering children');
  return <DashboardLayout>{children}</DashboardLayout>;
}