import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()
  const { artwork_id, bidder_name, amount } = body

  if (!artwork_id || !bidder_name?.trim() || !amount) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  const numAmount = Math.floor(Number(amount))
  if (numAmount <= 0 || isNaN(numAmount)) {
    return NextResponse.json({ error: 'Jumlah bid tidak valid' }, { status: 400 })
  }

  if (bidder_name.trim().length > 60) {
    return NextResponse.json({ error: 'Nama terlalu panjang' }, { status: 400 })
  }

  const db = createServerSupabase()
  const { data, error } = await db.rpc('place_bid', {
    p_artwork_id:  artwork_id,
    p_bidder_name: bidder_name.trim(),
    p_amount:      numAmount,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data?.error) {
    return NextResponse.json({ error: data.error }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
