'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Artwork, AuctionConfig, Bid } from '@/lib/types'
import ArtworkCard from './ArtworkCard'
import Timer from './Timer'

const POLL_MS = 4000

export default function PublicAuction() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [config, setConfig]     = useState<AuctionConfig>({ id: 1, end_time: null, is_running: false })
  const [bids, setBids]         = useState<Record<string, Bid[]>>({})
  const [loading, setLoading]   = useState(true)
  const prevArtworkIds          = useRef<string>('')

  const fetchAll = useCallback(async () => {
    try {
      const [artRes, cfgRes] = await Promise.all([
        fetch('/api/artworks', { cache: 'no-store' }),
        fetch('/api/timer',    { cache: 'no-store' }),
      ])

      const [arts, cfg]: [Artwork[], AuctionConfig] = await Promise.all([
        artRes.json(),
        cfgRes.json(),
      ])

      if (Array.isArray(arts)) setArtworks(arts)
      if (cfg && !cfg.error) setConfig(cfg as AuctionConfig)

      // Fetch bids only when artwork list changes
      const ids = Array.isArray(arts) ? arts.map((a) => a.id).sort().join(',') : ''
      if (ids && ids !== prevArtworkIds.current) {
        prevArtworkIds.current = ids
        fetchBids(Array.isArray(arts) ? arts.map((a) => a.id) : [])
      }
    } catch { /* network error — keep showing last state */ }
    finally { setLoading(false) }
  }, [])

  const fetchBids = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    try {
      const res  = await fetch(`/api/bids?ids=${ids.join(',')}`, { cache: 'no-store' })
      const data: Bid[] = await res.json()
      if (!Array.isArray(data)) return
      const grouped: Record<string, Bid[]> = {}
      for (const bid of data) {
        grouped[bid.artwork_id] = grouped[bid.artwork_id] ?? []
        grouped[bid.artwork_id].push(bid)
      }
      setBids(grouped)
    } catch { /* ignore */ }
  }, [])

  // Also update bids when artworks current_price changes (new bid landed)
  const fetchBidsForAll = useCallback(() => {
    setArtworks((prev) => {
      if (prev.length) fetchBids(prev.map((a) => a.id))
      return prev
    })
  }, [fetchBids])

  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, POLL_MS)
    return () => clearInterval(id)
  }, [fetchAll])

  const timerActive =
    config.is_running &&
    !!config.end_time &&
    new Date(config.end_time) > new Date()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto" />
          <p className="font-cinzel text-gold-500/50 text-xs tracking-widest">MEMUAT...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-gold-500/20 bg-crimson-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-px h-8 bg-gold-500/40" />
            <div>
              <p className="font-cinzel font-black text-lg gold-text leading-none tracking-widest">FELICITY</p>
              <p className="font-cinzel text-[9px] text-gold-500/50 tracking-[0.35em] leading-none mt-0.5">VOL. 4 · ART AUCTION</p>
            </div>
          </div>
          <Timer config={config} />
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <div className="divider mb-4">
          <span className="font-cinzel text-[10px] text-gold-500/50 tracking-[0.4em]">
            SATU ARENA · LIMA KEKUATAN · SATU KEJAYAAN
          </span>
        </div>
        <h1 className="font-cormorant text-4xl sm:text-5xl italic text-cream/85 leading-snug">
          Pelelangan Karya Seni
        </h1>
        <p className="font-cormorant text-cream/45 mt-2 text-lg italic">
          26 November 2026 · Aula Utama TUS · 14.00–18.00 WIB
        </p>
      </div>

      {/* ── Grid ── */}
      <main className="max-w-6xl mx-auto px-4 pb-20">
        {artworks.length === 0 ? (
          <div className="text-center py-28">
            <p className="text-5xl mb-4">🎨</p>
            <p className="font-cinzel text-gold-500/50 tracking-widest text-sm">KARYA AKAN SEGERA HADIR</p>
            <p className="font-cormorant text-cream/35 italic mt-2">Pantau terus halaman ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {artworks.map((art) => (
              <ArtworkCard
                key={art.id}
                artwork={art}
                bids={bids[art.id] ?? []}
                timerActive={timerActive}
                onBidSuccess={fetchBidsForAll}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-gold-500/15 py-6 text-center">
        <p className="font-cormorant text-cream/30 italic text-sm">
          Felicity Vol. 4 — Dies Natalis Telkom Art · @felicity.telkomart
        </p>
      </footer>
    </div>
  )
}
