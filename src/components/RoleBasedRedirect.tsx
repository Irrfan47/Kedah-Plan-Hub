import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth();
  
  console.log('RoleBasedRedirect - isLoading:', isLoading);
  console.log('RoleBasedRedirect - User:', user);
  console.log('RoleBasedRedirect - User role:', user?.role);
  console.log('RoleBasedRedirect - User ID:', user?.id);
  
  // If still loading, don't redirect yet
  if (isLoading) {
    console.log('RoleBasedRedirect - Still loading, waiting...');
    return null;
  }
  
  // If no user, redirect to login
  if (!user) {
    console.log('RoleBasedRedirect - No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If user is admin, finance_mmk, finance_officer, or super_admin, redirect to EXCO Users page
  if (user?.role === "admin" || user?.role === "finance_mmk" || user?.role === "finance_officer" || user?.role === "super_admin") {
    console.log('RoleBasedRedirect - Redirecting to /exco-users');
    return <Navigate to="/exco-users" replace />;
  }
  
  // For all other roles, redirect to Dashboard
  console.log('RoleBasedRedirect - Redirecting to /dashboard');
  return <Navigate to="/dashboard" replace />;
}; 