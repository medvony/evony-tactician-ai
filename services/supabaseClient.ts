import { createClient } from '@supabase/supabase-js';

// Use process.env as defined in vite.config.ts
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Auth will not function until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
