import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
    'process.env.VITE_GROQ_API_KEY': JSON.stringify(process.env.VITE_GROQ_API_KEY || ''),
    'process.env.VITE_GEMINI_API_KEY': JSON.stringify(process.env.VITE_GEMINI_API_KEY || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // FIX: Externalize problematic modules
      external: ['tesseract.js'],
    }
  },
  optimizeDeps: {
    // FIX: Exclude Tesseract.js from dependency optimization
    exclude: ['tesseract.js'],
  },
  resolve: {
    // FIX: Add alias for Tesseract.js browser build
    alias: {
      'tesseract.js': 'tesseract.js/dist/tesseract.esm.js'
    }
  }
});
