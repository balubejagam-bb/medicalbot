import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { Plugin } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: (Plugin | Plugin[])[] = [react()];
  
  if (mode === 'development') {
    const tagger = componentTagger();
    if (Array.isArray(tagger)) {
      plugins.push(...tagger);
    } else {
      plugins.push(tagger);
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      // https: false, // Set to true for HTTPS in production
      // For camera access in development, you can use:
      // https: {
      //   key: fs.readFileSync('path/to/private.key'),
      //   cert: fs.readFileSync('path/to/certificate.crt')
      // }
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
