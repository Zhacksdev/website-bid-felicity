import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Felicity Vol. 4 — Art Auction',
  description: 'Pelelangan karya seni Felicity Vol. 4 · Satu Arena, Lima Kekuatan, Satu Kejayaan · 26 November 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
