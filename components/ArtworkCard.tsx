'use client'

import { useState } from 'react'
import { Artwork, Bid } from '@/lib/types'
import { formatRp } from '@/lib/format'
import BidModal from './BidModal'
import Leaderboard from './Leaderboard'

interface Props {
  artwork: Artwork
  bids: Bid[]
  timerActive: boolean
  onBidSuccess: () => void
}

export default function ArtworkCard({ artwork, bids, timerActive, onBidSuccess }: Props) {
  const [showBid, setShowBid]         = useState(false)
  const [showBoard, setShowBoard]     = useState(false)

  const sorted    = [...bids].sort((a, b) => b.amount - a.amount)
  const topBidder = sorted[0]
  const bidCount  = bids.length

  return (
    <>
      <div className="card overflow-hidden flex flex-col group hover:border-gold-500/50 hover:shadow-xl hover:shadow-gold-500/8 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-crimson-800 overflow-hidden">
          {artwork.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-14 h-14 text-gold-500/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-5-6-3 3.72L9 13l-3 4h12z"/>
              </svg>
            </div>
          )}

          {/* gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-crimson-900/90 via-transparent to-transparent" />

          {/* bid count badge */}
          {bidCount > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-gold-500/90 text-crimson-950 px-2 py-0.5 rounded font-cinzel font-bold text-xs">
              {bidCount} bid{bidCount !== 1 ? 's' : ''}
            </div>
          )}

          {/* inactive overlay */}
          {!artwork.is_active && (
            <div className="absolute inset-0 bg-crimson-950/70 flex items-center justify-center">
              <span className="font-cinzel text-cream/60 text-sm tracking-widest border border-cream/20 px-3 py-1 rounded">
                DITUTUP
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="font-cinzel font-semibold text-base text-cream leading-tight">{artwork.title}</h3>
            {artwork.description && (
              <p className="text-cream/45 text-sm font-cormorant italic mt-1 line-clamp-2">{artwork.description}</p>
            )}
          </div>

          <div className="mt-auto space-y-2.5">
            {/* Price row */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-cream/40 text-[10px] font-cinzel tracking-widest">BID TERTINGGI</p>
                <p className="font-cinzel font-bold text-xl gold-text leading-tight">{formatRp(artwork.current_price)}</p>
              </div>
              <div className="text-right">
                <p className="text-cream/40 text-[10px] font-cinzel tracking-widest">MULAI DARI</p>
                <p className="text-cream/55 text-sm font-cinzel">{formatRp(artwork.starting_price)}</p>
              </div>
            </div>

            {/* Top bidder */}
            {topBidder ? (
              <div className="bg-crimson-800/50 border border-gold-500/15 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-gold-500 text-xs">♛</span>
                <span className="text-cream/65 text-sm font-cormorant truncate">{topBidder.bidder_name}</span>
                <span className="text-gold-500/60 text-xs font-cinzel ml-auto flex-shrink-0">{formatRp(topBidder.amount)}</span>
              </div>
            ) : (
              <div className="bg-crimson-800/30 border border-gold-500/10 rounded-lg px-3 py-1.5">
                <p className="text-cream/30 text-sm font-cormorant italic text-center">Jadilah yang pertama bid!</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={() => setShowBoard(true)} className="btn-outline flex-1 text-xs py-2">
                📊 RANKING
              </button>
              <button
                onClick={() => setShowBid(true)}
                disabled={!timerActive || !artwork.is_active}
                className="btn-gold flex-1 text-xs py-2"
              >
                ⚡ BID NOW
              </button>
            </div>
          </div>
        </div>
      </div>

      {showBid && (
        <BidModal artwork={artwork} onClose={() => setShowBid(false)} onSuccess={onBidSuccess} />
      )}
      {showBoard && (
        <Leaderboard bids={bids} artworkTitle={artwork.title} onClose={() => setShowBoard(false)} />
      )}
    </>
  )
}
