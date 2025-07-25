import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip'
          ],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-query': ['@tanstack/react-query'],
          // PDF library gets its own chunk due to size
          'vendor-pdf': ['@react-pdf/renderer'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // App chunks - exclude PDF components from main chunks
          'admin': [
            '/src/components/admin/AdminDashboard',
            '/src/components/admin/JobManagement', 
            '/src/components/admin/InvoiceManagement',
            '/src/components/admin/CustomerManagement',
            '/src/components/admin/UserManagement'
          ],
          'customer': [
            '/src/components/customer/CustomerDashboard',
            '/src/components/customer/JobTracker',
            '/src/components/customer/OrderHistory'
          ],
          'auth': [
            '/src/components/auth/AuthPage',
            '/src/components/auth/LoginPage', 
            '/src/components/auth/RegisterPage'
          ],
          // PDF components in separate chunk
          'pdf-components': [
            '/src/components/pdf/InvoicePDF',
            '/src/components/pdf/QuotePDF',
            '/src/utils/pdfGenerator',
            '/src/utils/quotePdfGenerator'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1500, // Increased to accommodate PDF library
    target: 'esnext',
    minify: true
  }
}));
