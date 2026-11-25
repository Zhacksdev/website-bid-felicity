import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasAdminToken: !!process.env.ADMIN_SECRET_TOKEN,
    supabaseUrlStart: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30) + '...',
  })
}
