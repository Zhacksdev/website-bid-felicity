'use client'

import { useEffect, useState } from 'react'
import { AuctionConfig } from '@/lib/types'

export default function Timer({ config }: { config: AuctionConfig }) {
  const [secs, setSecs] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!config.is_running || !config.end_time) { setSecs(0); return }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(config.end_time!).getTime() - Date.now()) / 1000))
      setSecs(diff)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [config.end_time, config.is_running])

  if (!mounted) return null

  const pad = (n: number) => String(n).padStart(2, '0')
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60

  if (!config.is_running) {
    return (
      <div className="flex items-center gap-2 text-cream/50 font-cinzel text-xs tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-cream/30" />
        LELANG BELUM DIMULAI
      </div>
    )
  }

  if (secs === 0) {
    return (
      <div className="flex items-center gap-2 text-red-400 font-cinzel text-xs tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        LELANG BERAKHIR
      </div>
    )
  }

  const urgent = secs < 60

  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${urgent ? 'bg-red-400' : 'bg-green-400'}`} />
      <div className="flex gap-1 items-center font-cinzel font-bold tabular-nums">
        {h > 0 && (
          <>
            <Digit val={pad(h)} urgent={urgent} label="JAM" />
            <Sep />
          </>
        )}
        <Digit val={pad(m)} urgent={urgent} label="MENIT" />
        <Sep />
        <Digit val={pad(s)} urgent={urgent} label="DETIK" />
      </div>
    </div>
  )
}

function Digit({ val, urgent, label }: { val: string; urgent: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span className={`text-xl ${urgent ? 'text-red-400' : 'gold-text'}`}>{val}</span>
      <span className="text-[8px] text-cream/35 tracking-widest mt-0.5">{label}</span>
    </div>
  )
}

function Sep() {
  return <span className="text-gold-600 text-lg -mt-2">:</span>
}
