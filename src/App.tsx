import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import { lazy, Suspense } from "react";

// Lazy load pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ExcoUsers = lazy(() => import("./pages/ExcoUsers"));
const ExcoUserDashboard = lazy(() => import("./pages/ExcoUserDashboard"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const StatusTracking = lazy(() => import("./pages/StatusTracking"));
const ProgramManagement = lazy(() => import("./pages/ProgramManagement"));
const Query = lazy(() => import("./pages/Query"));
const Report = lazy(() => import("./pages/Report"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LanguageProvider>
            <PerformanceMonitor enabled={false} />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <RoleBasedRedirect />
                    </ProtectedRoute>
                  } />
                  <Route path="/login" element={<Login />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/exco-users" element={
                    <ProtectedRoute>
                      <ExcoUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="/exco-user-dashboard/:userId" element={
                    <ProtectedRoute>
                      <ExcoUserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/users" element={
                    <ProtectedRoute>
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/status" element={
                    <ProtectedRoute>
                      <StatusTracking />
                    </ProtectedRoute>
                  } />
                  <Route path="/programs" element={
                    <ProtectedRoute>
                      <ProgramManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/query" element={
                    <ProtectedRoute>
                      <Query />
                    </ProtectedRoute>
                  } />
                  <Route path="/report" element={
                    <ProtectedRoute>
                      <Report />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </LanguageProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
