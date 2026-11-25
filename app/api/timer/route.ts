import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

function isAdmin(request: Request) {
  return request.headers.get('x-admin-token') === process.env.ADMIN_SECRET_TOKEN
}

export async function GET() {
  const db = createServerSupabase()
  const { data, error } = await db
    .from('auction_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const db = createServerSupabase()
  const { data, error } = await db
    .from('auction_config')
    .update(body)
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
