import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { AuthProvider } from "@/contexts/AuthContext";
import { LogoHeader } from "@/components/common/LogoHeader";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Homepage } from "./pages/Homepage";
import { WaitingArea } from "./pages/WaitingArea";
import { ShowcaseScreen } from "./pages/ShowcaseScreen";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { Unauthorized } from "./pages/Unauthorized";
import { InvoiceViewPage } from "./components/admin/InvoiceViewPage";
import { JobTrackingPage } from "./pages/JobTrackingPage";
import { ResetPassword } from "./pages/ResetPassword";
import { DisplayJobsScreen } from "./pages/DisplayJobsScreen";
import { DisplayShowcaseScreen } from "./pages/DisplayShowcaseScreen";

const queryClient = new QueryClient();

const AppContent = () => {
  const { settings, loading } = useCompanySettings();

  return (
    <AuthProvider>
      <LogoHeader />
      <div className="fixed top-4 right-4 z-50">
        <OfflineIndicator />
      </div>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/waiting-area" element={<WaitingArea />} />
          <Route path="/showcase" element={<ShowcaseScreen />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
