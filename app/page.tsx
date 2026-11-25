import { createServerSupabase } from '@/lib/supabase'
import PublicAuction from '@/components/PublicAuction'
import { Artwork, AuctionConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const db = createServerSupabase()

  const [{ data: artworks }, { data: config }] = await Promise.all([
    db.from('artworks').select('*').order('created_at', { ascending: false }),
    db.from('auction_config').select('*').eq('id', 1).single(),
  ])

  return (
    <PublicAuction
      initialArtworks={(artworks as Artwork[]) ?? []}
      initialConfig={(config as AuctionConfig) ?? { id: 1, end_time: null, is_running: false }}
    />
  )
}
