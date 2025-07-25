import { useMemo, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const SimpleHomepage = lazy(() => import("./pages/SimpleHomepage").then(module => ({ default: module.SimpleHomepage })));
const UnifiedAuthPage = lazy(() => import("./components/auth/UnifiedAuthPage").then(module => ({ default: module.UnifiedAuthPage })));
const LoginPage = lazy(() => import("./components/auth/LoginPage").then(module => ({ default: module.LoginPage })));
const JobTrackingPage = lazy(() => import("./pages/JobTrackingPage").then(module => ({ default: module.JobTrackingPage })));
const DashboardPage = lazy(() => import("./pages/Index"));

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
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
                <p className="text-gray-600">Please wait while we load your content</p>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<SimpleHomepage />} />
              <Route path="/auth" element={<UnifiedAuthPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/track" element={<JobTrackingPage />} />
              <Route path="/track/:trackingCode" element={<JobTrackingPage />} />
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <h1 className="text-2xl">Page Not Found</h1>
                </div>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
