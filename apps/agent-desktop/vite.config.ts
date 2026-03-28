import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

// Tauri expects a fixed port during dev
const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    react(),
  ],

  // Tauri: use relative paths for file:// protocol
  base: "./",

  build: {
    outDir: "dist",
    // Tauri uses Chromium on Windows/Linux and WebKit on macOS
    target: process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari14",
    // Don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },

  server: {
    port: 3003,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 3004 } : undefined,
    watch: {
      // Tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
    // Proxy auth requests to Convex site URL to avoid CORS in dev.
    // The desktop app has no auth server — Convex HTTP Actions handle auth.
    proxy: {
      "/api/auth": {
        target: process.env.VITE_CONVEX_SITE_URL || "https://acrobatic-mole-132.eu-west-1.convex.site",
        changeOrigin: true,
        secure: true,
      },
    },
  },

  // Env prefix for Tauri + Vite
  envPrefix: ["VITE_", "TAURI_ENV_*"],
});
