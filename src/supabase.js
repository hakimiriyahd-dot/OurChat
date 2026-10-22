import { createClient } from '@supabase/supabase-js'

// 1. Try Render/Vite env vars first
// 2. Fall back to your exact provided keys so it NEVER crashes
const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || 'https://opyrxgrwvuzcvbuynwmo.supabase.co';

const supabaseKey = import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ZDsJRIPZPOP7Gv7MeyJqyg_b_-VxgK1';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})
