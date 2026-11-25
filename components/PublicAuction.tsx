'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Artwork, AuctionConfig, Bid } from '@/lib/types'
import ArtworkCard from './ArtworkCard'
import Timer from './Timer'

interface Props {
  initialArtworks: Artwork[]
  initialConfig: AuctionConfig
}

export default function PublicAuction({ initialArtworks, initialConfig }: Props) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks)
  const [config, setConfig]     = useState<AuctionConfig>(initialConfig)
  const [bids, setBids]         = useState<Record<string, Bid[]>>({})

  const loadBids = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    const { data } = await supabase
      .from('bids')
      .select('*')
      .in('artwork_id', ids)
      .order('created_at', { ascending: false })

    if (data) {
      const grouped: Record<string, Bid[]> = {}
      for (const bid of data) {
        grouped[bid.artwork_id] = grouped[bid.artwork_id] ?? []
        grouped[bid.artwork_id].push(bid as Bid)
      }
      setBids(grouped)
    }
  }, [])

  // Initial bids load
  useEffect(() => {
    if (artworks.length) loadBids(artworks.map((a) => a.id))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscriptions
  useEffect(() => {
    const ch = supabase.channel('public-auction-v1')

    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'artworks' }, (p) => {
      if (p.eventType === 'INSERT') {
        setArtworks((prev) => [p.new as Artwork, ...prev])
        loadBids([p.new.id])
      } else if (p.eventType === 'UPDATE') {
        setArtworks((prev) => prev.map((a) => a.id === p.new.id ? p.new as Artwork : a))
      } else if (p.eventType === 'DELETE') {
        setArtworks((prev) => prev.filter((a) => a.id !== p.old.id))
        setBids((prev) => { const n = { ...prev }; delete n[p.old.id]; return n })
      }
    })

    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, (p) => {
      const bid = p.new as Bid
      setBids((prev) => ({
        ...prev,
        [bid.artwork_id]: [bid, ...(prev[bid.artwork_id] ?? [])],
      }))
    })

    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auction_config' }, (p) => {
      setConfig(p.new as AuctionConfig)
    })

    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadBids])

  const timerActive =
    config.is_running &&
    !!config.end_time &&
    new Date(config.end_time) > new Date()

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
            <p className="font-cinzel text-gold-500/50 text-2xl tracking-widest">🎨</p>
            <p className="font-cinzel text-gold-500/50 mt-4 tracking-widest text-sm">KARYA AKAN SEGERA HADIR</p>
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
                onBidSuccess={() => loadBids(artworks.map((a) => a.id))}
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
