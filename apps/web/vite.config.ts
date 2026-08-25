import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import path from "path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    process.env.ANALYZE
      ? visualizer({
          filename: ".build/bundle-stats.html",
          template: "treemap",
          sourcemap: true,
          gzipSize: true,
          brotliSize: true,
        })
      : undefined,
  ],
  build: {
    // helps visualizer to have more accurate sizes
    sourcemap: Boolean(process.env.ANALYZE),
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "tanstack-query",
              test: /node_modules[\\/]@tanstack[\\/]react-query/,
            },
          ],
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
