'use client'

import { Bid } from '@/lib/types'
import { formatRp } from '@/lib/format'

interface Props {
  bids: Bid[]
  artworkTitle: string
  onClose: () => void
}

export default function Leaderboard({ bids, artworkTitle, onClose }: Props) {
  const top = [...bids].sort((a, b) => b.amount - a.amount).slice(0, 10)

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-cinzel font-black text-xl gold-text tracking-widest">LEADERBOARD</h2>
            <p className="text-cream/50 text-sm font-cormorant italic mt-0.5">{artworkTitle}</p>
          </div>
          <button onClick={onClose} className="text-cream/40 hover:text-cream text-xl transition-colors leading-none">✕</button>
        </div>

        <div className="divider mb-5">
          <span className="text-gold-500/50 text-[10px] font-cinzel tracking-[0.3em]">TOP BIDDERS</span>
        </div>

        {top.length === 0 ? (
          <p className="text-center text-cream/35 py-10 font-cormorant text-lg italic">
            Belum ada bid untuk karya ini
          </p>
        ) : (
          <div className="space-y-2">
            {top.map((bid, i) => (
              <div
                key={bid.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                  i === 0
                    ? 'bg-gold-500/15 border-gold-500/50'
                    : 'bg-crimson-800/40 border-gold-500/10'
                }`}
              >
                {/* Rank badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-cinzel font-bold text-sm flex-shrink-0 ${
                  i === 0 ? 'bg-gold-500 text-crimson-950' :
                  i === 1 ? 'bg-gold-700/50 text-gold-200' :
                  i === 2 ? 'bg-crimson-700 text-gold-400' :
                             'bg-crimson-800 text-cream/40'
                }`}>
                  {i === 0 ? '♛' : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${i === 0 ? 'text-gold-300' : 'text-cream'}`}>
                    {bid.bidder_name}
                  </p>
                  <p className="text-cream/35 text-xs">
                    {new Date(bid.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>

                <span className={`font-cinzel font-bold text-sm flex-shrink-0 ${i === 0 ? 'text-gold-400' : 'text-gold-500/70'}`}>
                  {formatRp(bid.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
