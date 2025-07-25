import { useMemo, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Start with just the Homepage - we know this was part of the issue
const Homepage = lazy(() => import("./pages/Homepage").then(module => ({ default: module.Homepage })));

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
            <Route path="/" element={<Homepage />} />
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
