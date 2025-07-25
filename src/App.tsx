import { useEffect, Suspense, lazy, useMemo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LogoHeader } from "@/components/common/LogoHeader";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load components for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Homepage = lazy(() => import("./pages/Homepage").then(module => ({ default: module.Homepage })));
const WaitingArea = lazy(() => import("./pages/WaitingArea").then(module => ({ default: module.WaitingArea })));
const ShowcaseScreen = lazy(() => import("./pages/ShowcaseScreen").then(module => ({ default: module.ShowcaseScreen })));
const LoginPage = lazy(() => import("./components/auth/LoginPage").then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./components/auth/RegisterPage").then(module => ({ default: module.RegisterPage })));
const Unauthorized = lazy(() => import("./pages/Unauthorized").then(module => ({ default: module.Unauthorized })));
const InvoiceViewPage = lazy(() => import("./components/admin/InvoiceViewPage").then(module => ({ default: module.InvoiceViewPage })));
const JobTrackingPage = lazy(() => import("./pages/JobTrackingPage").then(module => ({ default: module.JobTrackingPage })));
const ResetPassword = lazy(() => import("./pages/ResetPassword").then(module => ({ default: module.ResetPassword })));
const DisplayJobsScreen = lazy(() => import("./pages/DisplayJobsScreen").then(module => ({ default: module.DisplayJobsScreen })));
const DisplayShowcaseScreen = lazy(() => import("./pages/DisplayShowcaseScreen").then(module => ({ default: module.DisplayShowcaseScreen })));


const App = () => {
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  }), []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Step by step rebuild - No TooltipProvider for now */}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner />
          </div>
        }>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth" element={<LoginPage />} />
            <Route path="/waiting-area" element={<WaitingArea />} />
            <Route path="/showcase" element={<ShowcaseScreen />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/invoice/:invoiceId" 
              element={
                <ProtectedRoute>
                  <InvoiceViewPage />
                </ProtectedRoute>
              } 
            />

            {/* Job Tracking Routes */}
            <Route path="/track" element={<JobTrackingPage />} />
            <Route path="/track/:trackingCode" element={<JobTrackingPage />} />
            
            {/* Display Routes */}
            <Route path="/display/jobs" element={<DisplayJobsScreen />} />
            <Route path="/display/showcase" element={<DisplayShowcaseScreen />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
