import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const adminToken = request.headers.get('x-admin-token')
  if (!adminToken || adminToken !== process.env.ADMIN_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Tipe file tidak didukung (JPG/PNG/WEBP/GIF)' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Ukuran file maks 10MB' }, { status: 400 })
  }

  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `artworks/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const db = createServerSupabase()
  const { error } = await db.storage.from('artworks').upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = db.storage.from('artworks').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
