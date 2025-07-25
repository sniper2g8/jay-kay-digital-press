import { useMemo, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const SimpleHomepage = lazy(() => import("./pages/SimpleHomepage").then(module => ({ default: module.SimpleHomepage })));
const AuthPage = lazy(() => import("./components/auth/AuthPage").then(module => ({ default: module.AuthPage })));
const LoginPage = lazy(() => import("./components/auth/LoginPage").then(module => ({ default: module.LoginPage })));
const JobTrackingPage = lazy(() => import("./pages/JobTrackingPage").then(module => ({ default: module.JobTrackingPage })));

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
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<LoginPage />} />
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
    </QueryClientProvider>
  );
};

export default App;
