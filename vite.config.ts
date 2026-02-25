import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
// import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    // accorinng to docs, keep this last if sourcemaps are used
    // uncomoment to generate bundle stats after build
    // visualizer({
    //   filename: ".build/bundle-stats.html",
    //   template: "flamegraph",
    //   sourcemap: true,
    //   gzipSize: true,
    //   brotliSize: true,
    // }),
  ],
  build: {
    // helps visualizer to have more accurate sizes
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "shaka-player": ["shaka-player"],
          "tanstack-query": ["@tanstack/react-query"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
