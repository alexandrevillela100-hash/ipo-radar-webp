import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// Path A static-deploy Vite config:
// - Manus runtime plugin REMOVED (this build deploys to Vercel, not Manus)
// - Manus debug-collector plugin REMOVED (Vercel doesn't need it)
// - Server proxy REMOVED (no Express backend in this build)
// - Build target = static client/dist/ for Vercel to serve

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
  },
});
