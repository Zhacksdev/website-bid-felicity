'use client'

import { useState } from 'react'
import { Artwork } from '@/lib/types'
import { formatRp, parseRp, displayRp } from '@/lib/format'

interface Props {
  artwork: Artwork
  onClose: () => void
  onSuccess: () => void
}

export default function BidModal({ artwork, onClose, onSuccess }: Props) {
  const [name, setName]       = useState('')
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const minBid = artwork.current_price + 10_000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const num = parseRp(amount)
    if (!name.trim())          return setError('Nama wajib diisi')
    if (num < minBid)          return setError(`Bid minimum: ${formatRp(minBid)}`)

    setLoading(true)
    try {
      const res = await fetch('/api/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artwork_id: artwork.id, bidder_name: name.trim(), amount: num }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error ?? 'Gagal melakukan bid')
      onSuccess()
      onClose()
    } catch {
      setError('Koneksi bermasalah, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-sm p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-cinzel font-black text-xl gold-text tracking-widest">PLACE YOUR BID</h2>
            <p className="text-cream/50 text-sm font-cormorant italic mt-0.5 max-w-[220px] truncate">{artwork.title}</p>
          </div>
          <button onClick={onClose} className="text-cream/40 hover:text-cream text-xl transition-colors leading-none">✕</button>
        </div>

        {/* Current highest */}
        <div className="bg-crimson-800/60 border border-gold-500/20 rounded-lg p-3 mb-5 flex items-center justify-between">
          <span className="text-cream/50 text-xs font-cinzel tracking-widest">BID TERTINGGI</span>
          <span className="font-cinzel font-bold text-gold-400">{formatRp(artwork.current_price)}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-cream/60 text-xs font-cinzel tracking-widest mb-1.5">NAMA ANDA</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama bidder..."
              className="field"
              maxLength={60}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-cream/60 text-xs font-cinzel tracking-widest mb-1.5">JUMLAH BID</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500/60 text-sm font-cinzel pointer-events-none">Rp</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(displayRp(e.target.value))}
                placeholder={displayRp(String(minBid))}
                className="field pl-10"
                inputMode="numeric"
              />
            </div>
            <p className="text-cream/35 text-xs mt-1.5">Minimum: {formatRp(minBid)}</p>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-500/25 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full text-sm tracking-widest">
            {loading ? 'MENGIRIM...' : '⚡ PASANG BID'}
          </button>
        </form>
      </div>
    </div>
  )
}
