import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel injects environment variables at build time
// We need to expose them to the client-side code
export default defineConfig({
  plugins: [react()],
  define: {
    // This exposes env vars to the client-side code
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY || process.env.API_KEY || ''),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
