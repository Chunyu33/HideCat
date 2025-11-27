import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  base: "./",
  plugins: [
    react({
      // 禁用严格模式以避免 findDOMNode 警告
      jsxImportSource: undefined,
      // 保留其他默认配置
      fastRefresh: true,
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, "../../h5"),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.html"),
    },
  },
});
