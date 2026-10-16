import type { Metadata, Viewport } from 'next'
import { VT323, Rubik } from 'next/font/google'
import './globals.css'

// ── Fonts ─────────────────────────────────────────────────────────────────────
// VT323 — PS1 / retro pixel display font for headers + UI chrome
const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// Rubik — friendly rounded sans for body copy
const rubik = Rubik({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'ApplyOS',
  description: 'Your local-first application tracker. Low-poly dreamy PS1 aesthetic.',
  openGraph: {
    title: 'ApplyOS',
    description: 'Application command center',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#a898c8',
  width: 'device-width',
  initialScale: 1,
  // Prevent layout shifts when the keyboard opens on mobile
  interactiveWidget: 'resizes-content',
}

// ── Root Layout ───────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${vt323.variable} ${rubik.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
