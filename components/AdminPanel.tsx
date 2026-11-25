'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Artwork, AuctionConfig } from '@/lib/types'
import { formatRp, parseRp, displayRp } from '@/lib/format'
import Timer from './Timer'

// ─── Admin Login ───────────────────────────────────────────────
function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [pw, setPw]       = useState('')
  const [err, setErr]     = useState('')
  const [busy, setBusy]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('')
    const res  = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    const data = await res.json()
    if (res.ok) { sessionStorage.setItem('admin_token', data.token); onLogin(data.token) }
    else setErr(data.error)
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-xs p-8">
        <div className="text-center mb-8">
          <p className="font-cinzel font-black text-2xl gold-text tracking-widest">ADMIN</p>
          <p className="font-cinzel text-[10px] text-gold-500/50 tracking-[0.35em] mt-1">FELICITY ART AUCTION</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-cream/60 text-xs font-cinzel tracking-widest mb-1.5">PASSWORD</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="field" placeholder="••••••••" autoFocus />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button type="submit" disabled={busy} className="btn-gold w-full text-sm tracking-widest">
            {busy ? 'MEMVERIFIKASI...' : 'MASUK'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Admin Panel ──────────────────────────────────────────
export default function AdminPanel() {
  const [token, setToken]       = useState<string | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [config, setConfig]     = useState<AuctionConfig>({ id: 1, end_time: null, is_running: false })
  const [tab, setTab]           = useState<'artworks' | 'timer'>('artworks')

  // Artwork form
  const [form, setForm]         = useState({ title: '', description: '', starting_price: '' })
  const [imageFile, setImageFile]     = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadPct, setUploadPct]     = useState(0)
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const [fMsg, setFMsg]         = useState({ err: '', ok: '' })
  const [fBusy, setFBusy]       = useState(false)

  // Timer
  const [mins, setMins]         = useState('30')
  const [tMsg, setTMsg]         = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_token')
    if (stored) setToken(stored)
  }, [])

  useEffect(() => {
    if (!token) return

    // Initial fetch
    fetchData()

    const ch = supabase.channel('admin-v1')
    ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'artworks' }, (p) => {
      setArtworks((prev) => [p.new as Artwork, ...prev])
    })
    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'artworks' }, (p) => {
      setArtworks((prev) => prev.map((a) => a.id === p.new.id ? p.new as Artwork : a))
    })
    ch.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'artworks' }, (p) => {
      setArtworks((prev) => prev.filter((a) => a.id !== p.old.id))
    })
    ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auction_config' }, (p) => {
      setConfig(p.new as AuctionConfig)
    })
    ch.subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    const [a, c] = await Promise.all([
      fetch('/api/artworks').then((r) => r.json()),
      fetch('/api/timer').then((r) => r.json()),
    ])
    setArtworks(Array.isArray(a) ? a : [])
    if (c && !c.error) setConfig(c)
  }

  const adminFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token!, ...(opts.headers ?? {}) },
    })

  // ── File select ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setFMsg({ err: 'Ukuran gambar maksimal 10MB', ok: '' }); return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFMsg({ err: '', ok: '' })
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Add artwork ──
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFMsg({ err: '', ok: '' })
    const price = parseRp(form.starting_price)
    if (!form.title.trim()) return setFMsg({ err: 'Judul wajib diisi', ok: '' })
    if (!price)             return setFMsg({ err: 'Harga awal wajib diisi', ok: '' })

    setFBusy(true)
    setUploadPct(0)

    // Upload gambar ke Supabase Storage
    let image_url = ''
    if (imageFile) {
      setUploadPct(10)
      const ext  = imageFile.name.split('.').pop() ?? 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('artworks')
        .upload(path, imageFile, { cacheControl: '3600', upsert: false })

      if (upErr) {
        setFMsg({ err: 'Gagal upload gambar: ' + upErr.message, ok: '' })
        setFBusy(false); setUploadPct(0); return
      }

      setUploadPct(80)
      const { data: { publicUrl } } = supabase.storage.from('artworks').getPublicUrl(path)
      image_url = publicUrl
      setUploadPct(100)
    }

    const res  = await adminFetch('/api/artworks', {
      method: 'POST',
      body: JSON.stringify({ ...form, image_url, starting_price: price }),
    })
    const data = await res.json()
    if (res.ok) {
      setForm({ title: '', description: '', starting_price: '' })
      clearImage()
      setFMsg({ err: '', ok: 'Karya berhasil ditambahkan!' })
      setTimeout(() => setFMsg({ err: '', ok: '' }), 3000)
    } else {
      setFMsg({ err: data.error ?? 'Gagal', ok: '' })
    }
    setFBusy(false); setUploadPct(0)
  }

  const toggleActive = (art: Artwork) =>
    adminFetch(`/api/artworks/${art.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !art.is_active }) })

  const deleteArt = async (id: string) => {
    if (!confirm('Hapus karya ini? Semua bid akan ikut terhapus.')) return
    await adminFetch(`/api/artworks/${id}`, { method: 'DELETE' })
  }

  // ── Timer ──
  const startTimer = async () => {
    setTMsg('')
    const m = parseInt(mins)
    if (!m || m < 1) return setTMsg('Durasi minimal 1 menit')
    const end = new Date(Date.now() + m * 60_000).toISOString()
    const res = await adminFetch('/api/timer', { method: 'PUT', body: JSON.stringify({ end_time: end, is_running: true }) })
    const d   = await res.json()
    if (res.ok) { setConfig(d); setTMsg('✓ Timer dimulai!') }
    else setTMsg(d.error ?? 'Gagal')
    setTimeout(() => setTMsg(''), 3000)
  }

  const stopTimer = async () => {
    const res = await adminFetch('/api/timer', { method: 'PUT', body: JSON.stringify({ is_running: false, end_time: null }) })
    if (res.ok) setConfig(await res.json())
  }

  const extendTimer = async (m: number) => {
    const base = config.end_time ? Math.max(new Date(config.end_time).getTime(), Date.now()) : Date.now()
    const end  = new Date(base + m * 60_000).toISOString()
    const res  = await adminFetch('/api/timer', { method: 'PUT', body: JSON.stringify({ end_time: end, is_running: true }) })
    if (res.ok) setConfig(await res.json())
  }

  if (!token) return <Login onLogin={setToken} />

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-gold-500/20 bg-crimson-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div>
            <p className="font-cinzel font-black text-lg gold-text tracking-widest leading-none">ADMIN PANEL</p>
            <p className="font-cinzel text-[9px] text-gold-500/50 tracking-[0.35em]">FELICITY VOL. 4</p>
          </div>
          <div className="flex items-center gap-4">
            <Timer config={config} />
            <a href="/" target="_blank" className="text-cream/40 hover:text-cream font-cinzel text-xs tracking-widest transition-colors hidden sm:block">
              SITE →
            </a>
            <button
              onClick={() => { sessionStorage.removeItem('admin_token'); setToken(null) }}
              className="text-cream/35 hover:text-red-400 font-cinzel text-xs tracking-widest transition-colors"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-crimson-900/60 rounded-xl w-fit mb-8">
          {(['artworks', 'timer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-cinzel text-sm px-6 py-2 rounded-lg tracking-widest transition-all duration-200 ${
                tab === t
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
                  : 'text-cream/45 hover:text-cream/70'
              }`}
            >
              {t === 'artworks' ? '🎨 KARYA' : '⏱ TIMER'}
            </button>
          ))}
        </div>

        {/* ─── Artworks Tab ─── */}
        {tab === 'artworks' && (
          <div className="space-y-8">
            {/* Add form */}
            <div className="card p-6">
              <h2 className="font-cinzel font-bold text-base gold-text tracking-widest mb-5">TAMBAH KARYA BARU</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-cream/55 text-xs font-cinzel tracking-widest mb-1.5">JUDUL KARYA *</label>
                    <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="field" placeholder="Nama karya..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-cream/55 text-xs font-cinzel tracking-widest mb-1.5">DESKRIPSI</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="field h-20 resize-none" placeholder="Deskripsi singkat..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-cream/55 text-xs font-cinzel tracking-widest mb-1.5">GAMBAR KARYA</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {imagePreview ? (
                      <div className="relative rounded-lg overflow-hidden border border-gold-500/30 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="preview" className="w-full max-h-56 object-contain bg-crimson-900" />
                        <div className="absolute inset-0 bg-crimson-950/0 group-hover:bg-crimson-950/50 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn-gold text-xs py-1.5 px-3"
                          >
                            GANTI
                          </button>
                          <button
                            type="button"
                            onClick={clearImage}
                            className="btn-danger"
                          >
                            HAPUS
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-crimson-950/70 px-3 py-1.5 flex items-center justify-between">
                          <span className="text-cream/60 text-xs truncate">{imageFile?.name}</span>
                          <span className="text-cream/40 text-xs flex-shrink-0 ml-2">
                            {imageFile ? (imageFile.size / 1024 < 1024
                              ? `${(imageFile.size / 1024).toFixed(0)} KB`
                              : `${(imageFile.size / 1024 / 1024).toFixed(1)} MB`) : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gold-500/25 hover:border-gold-500/50 rounded-lg p-8 text-center transition-all group"
                      >
                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">🖼️</div>
                        <p className="font-cinzel text-cream/50 text-sm tracking-widest group-hover:text-cream/70 transition-colors">
                          KLIK UNTUK UPLOAD
                        </p>
                        <p className="text-cream/30 text-xs mt-1">JPG, PNG, WEBP — maks. 10 MB</p>
                      </button>
                    )}
                    {/* Upload progress bar */}
                    {uploadPct > 0 && uploadPct < 100 && (
                      <div className="mt-2 h-1 bg-crimson-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-500 transition-all duration-300 rounded-full"
                          style={{ width: `${uploadPct}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-cream/55 text-xs font-cinzel tracking-widest mb-1.5">HARGA AWAL (IDR) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500/55 text-sm font-cinzel pointer-events-none">Rp</span>
                      <input
                        type="text" inputMode="numeric"
                        value={form.starting_price}
                        onChange={(e) => setForm({ ...form, starting_price: displayRp(e.target.value) })}
                        className="field pl-10" placeholder="50.000"
                      />
                    </div>
                  </div>
                </div>

                {fMsg.err && <p className="text-red-400 text-sm">{fMsg.err}</p>}
                {fMsg.ok  && <p className="text-green-400 text-sm">{fMsg.ok}</p>}

                <button type="submit" disabled={fBusy} className="btn-gold text-sm tracking-widest">
                  {fBusy
                    ? uploadPct > 0
                      ? `MENGUPLOAD... ${uploadPct}%`
                      : 'MENYIMPAN...'
                    : '+ TAMBAH KARYA'}
                </button>
              </form>
            </div>

            {/* List */}
            <div>
              <h2 className="font-cinzel font-bold text-base gold-text tracking-widest mb-4">
                DAFTAR KARYA ({artworks.length})
              </h2>

              {artworks.length === 0 ? (
                <div className="card p-8 text-center text-cream/35 font-cormorant italic">Belum ada karya</div>
              ) : (
                <div className="space-y-2.5">
                  {artworks.map((art) => (
                    <div key={art.id} className="card p-4 flex items-center gap-4">
                      {/* thumb */}
                      <div className="w-14 h-14 bg-crimson-800 rounded-lg overflow-hidden flex-shrink-0">
                        {art.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gold-500/25 text-xl">🖼</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-cinzel font-semibold text-cream truncate">{art.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-gold-400 text-sm font-cinzel">{formatRp(art.current_price)}</span>
                          <span className="text-cream/35 text-xs">Start: {formatRp(art.starting_price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-cinzel tracking-widest px-2 py-0.5 rounded border ${
                          art.is_active
                            ? 'bg-green-900/30 text-green-400 border-green-500/30'
                            : 'bg-crimson-800 text-cream/35 border-gold-500/10'
                        }`}>
                          {art.is_active ? 'AKTIF' : 'NONAKTIF'}
                        </span>
                        <button onClick={() => toggleActive(art)} className="btn-outline text-xs py-1 px-3">
                          {art.is_active ? 'TUTUP' : 'BUKA'}
                        </button>
                        <button onClick={() => deleteArt(art.id)} className="btn-danger">HAPUS</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Timer Tab ─── */}
        {tab === 'timer' && (
          <div className="space-y-6 max-w-md">
            {/* Status */}
            <div className="card p-8 text-center">
              <p className="text-cream/40 text-xs font-cinzel tracking-widest mb-5">STATUS TIMER</p>
              <div className="flex justify-center mb-4"><Timer config={config} /></div>
              <div className={`text-xs font-cinzel tracking-widest ${config.is_running ? 'text-green-400' : 'text-cream/35'}`}>
                {config.is_running ? '● BERJALAN' : '○ BERHENTI'}
              </div>
            </div>

            {/* Controls */}
            <div className="card p-6 space-y-6">
              <h2 className="font-cinzel font-bold text-base gold-text tracking-widest">KONTROL TIMER</h2>

              <div>
                <label className="block text-cream/55 text-xs font-cinzel tracking-widest mb-2">DURASI (MENIT)</label>
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="number" value={mins} onChange={(e) => setMins(e.target.value)}
                    className="field w-24 text-center" min="1" max="300"
                  />
                  <div className="flex gap-1.5">
                    {[10, 15, 30, 60].map((m) => (
                      <button key={m} onClick={() => setMins(String(m))} className={`text-xs font-cinzel px-3 py-1.5 rounded-lg border transition-colors ${
                        mins === String(m) ? 'border-gold-500/60 text-gold-400 bg-gold-500/10' : 'border-gold-500/20 text-cream/50 hover:text-cream'
                      }`}>
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={startTimer} className="btn-gold flex-1 text-sm tracking-widest">▶ MULAI</button>
                <button onClick={stopTimer} disabled={!config.is_running} className="btn-outline flex-1 text-sm tracking-widest">■ STOP</button>
              </div>

              {config.is_running && (
                <div>
                  <p className="text-cream/40 text-xs font-cinzel tracking-widest mb-2">PERPANJANG</p>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 10, 15, 30].map((m) => (
                      <button key={m} onClick={() => extendTimer(m)} className="btn-outline text-xs py-1.5 px-3">+{m}m</button>
                    ))}
                  </div>
                </div>
              )}

              {tMsg && (
                <p className={`text-sm font-cinzel ${tMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{tMsg}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
