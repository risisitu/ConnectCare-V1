import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  server: {
    host: true,
    proxy: {
      // Proxy API requests to HTTP Backend
      '/api': {
        target: 'http://192.168.1.140:3000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy Socket.IO
      '/socket.io': {
        target: 'http://192.168.1.140:3000',
        changeOrigin: true,
        ws: true, // Enable WebSocket proxying
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    basicSsl(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
});
