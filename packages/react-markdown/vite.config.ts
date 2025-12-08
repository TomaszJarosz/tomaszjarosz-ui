import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { copyFileSync, mkdirSync } from "fs";

// Plugin to copy CSS file to dist
const copyCssPlugin = () => ({
  name: "copy-css",
  closeBundle() {
    try {
      mkdirSync(resolve(__dirname, "dist"), { recursive: true });
      copyFileSync(
        resolve(__dirname, "src/styles.css"),
        resolve(__dirname, "dist/styles.css")
      );
      console.log("✓ Copied styles.css to dist/");
    } catch (error) {
      console.error("Failed to copy styles.css:", error);
    }
  },
});

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["src"],
      rollupTypes: true,
    }),
    copyCssPlugin(),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ReactMarkdown",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
});
