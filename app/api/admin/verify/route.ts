import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { password } = await request.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Password salah' }, { status: 401 })
  }

  return NextResponse.json({ token: process.env.ADMIN_SECRET_TOKEN })
}
