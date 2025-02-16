import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [checker({ typescript: true })],
  worker: {},
  build: {
    sourcemap: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  server: {
    open: true,
    port: 1234,
    host: "localhost",
  },
});
