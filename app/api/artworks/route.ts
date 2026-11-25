import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function isAdmin(request: Request) {
  return request.headers.get('x-admin-token') === process.env.ADMIN_SECRET_TOKEN
}

export async function GET() {
  noStore()
  const db = createServerSupabase()
  const { data, error } = await db
    .from('artworks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, description, image_url, starting_price } = await request.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
  }

  const price = Math.floor(Number(starting_price))
  if (!price || price < 0) {
    return NextResponse.json({ error: 'Harga awal tidak valid' }, { status: 400 })
  }

  const db = createServerSupabase()
  const { data, error } = await db
    .from('artworks')
    .insert({
      title:          title.trim(),
      description:    description?.trim() ?? '',
      image_url:      image_url?.trim() ?? '',
      starting_price: price,
      current_price:  price,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
