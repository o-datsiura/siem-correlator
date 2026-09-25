import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const packageJson = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, "./package.json"), "utf-8"),
) as { version: string };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@core": path.resolve(import.meta.dirname, "./src/core"),
      "@features": path.resolve(import.meta.dirname, "./src/features"),
      "@shared": path.resolve(import.meta.dirname, "./src/shared"),
      "@workers": path.resolve(import.meta.dirname, "./src/workers"),
    },
  },
  worker: {
    format: "es",
  },
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx", "tests/**/*.bench.ts"],
  },
});
