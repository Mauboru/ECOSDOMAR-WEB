import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    TanStackRouterVite(),
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api → Express API em desenvolvimento
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
