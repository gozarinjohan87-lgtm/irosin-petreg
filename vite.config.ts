import { defineConfig } from "vite";
import { miaodaDevPlugin } from "miaoda-sc-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    miaodaDevPlugin(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor';
          }

          if (id.includes('@supabase')) {
            return 'supabase';
          }

          if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('class-variance-authority') || id.includes('@hookform')) {
            return 'ui-vendor';
          }

          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) {
            return 'charts';
          }

          if (id.includes('motion') || id.includes('framer-motion')) {
            return 'motion';
          }

          if (id.includes('qrcode') || id.includes('jsqr') || id.includes('video-react')) {
            return 'media';
          }

          if (id.includes('date-fns') || id.includes('ky') || id.includes('axios') || id.includes('eventsource-parser')) {
            return 'utilities';
          }

          return 'vendor';
        },
      },
    },
  },
});
