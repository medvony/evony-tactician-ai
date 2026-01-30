import { createClient } from '@supabase/supabase-js';

// Use import.meta.env for Vite projects (NOT process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn("⚠️ Supabase credentials missing. Auth will not function until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.");
}

// Create client with fallback values to prevent build errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
