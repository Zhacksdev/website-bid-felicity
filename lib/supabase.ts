import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — shared singleton
export const supabase = createClient(url, anon)

// Server client — bypasses RLS via service role key
export function createServerSupabase() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
