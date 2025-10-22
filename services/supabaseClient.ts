
import { createClient } from '@supabase/supabase-js'

// Prefer Vite env vars; fall back to Node env for robustness
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || ''

// Use placeholders if missing so app doesn't crash; queries will just fail and fallbacks will be used
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Using placeholders; remote queries will fail and UI will use mocks.')
}

export const supabase = createClient(
  supabaseUrl || 'http://localhost.invalid',
  supabaseKey || 'missing'
)