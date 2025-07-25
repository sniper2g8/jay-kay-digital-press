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
  optimizeDeps: {
    exclude: [
      "chunk-POTTOUC3",
      "chunk-YJWVS2NX",
      "chunk-A6SPIYQT",
      "chunk-3RXG37ZK",
      "chunk-5VORCL3H",
      "chunk-X5NZ3XE2",
      "chunk-U7P2NEEE"
    ]
  }
}));
