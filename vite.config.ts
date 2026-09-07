import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      // Redireciona o entry do servidor SSR para src/server.ts
      server: { entry: "server" },
    }),
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
