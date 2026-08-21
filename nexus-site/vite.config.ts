import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
        about: './about.html',
        'nexus-now': './nexus-now.html',
        robots: './robots.html',
        team: './team.html',
        sponsors: './sponsors.html',
        contact: './contact.html',
        mechanical: './mechanical.html',
        electronics: './electronics.html',
        programming: './programming.html',
        'image-processing': './image-processing.html',
        management: './management.html',
      },
    },
  },
  server: {
    host: '127.0.0.1',   // bind IPv4 explicitly — avoids Windows iphlpsvc
                         // stealing 0.0.0.0:3000, which wedges the browser
                         // in a reconnect loop (glitchy navbar/HMR).
    port: 5173,          // free port, no conflict with system services
    strictPort: true,    // fail loudly instead of silently grabbing another
    open: true,
  },
});
