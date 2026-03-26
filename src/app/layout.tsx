import type { Metadata, Viewport } from 'next'
import { VT323, Rubik } from 'next/font/google'
import './globals.css'
import { PWARegistrar } from '@/components/PWARegistrar'

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
  title: 'CoIntern | Command Center',
  description: 'Your local-first internship tracker. Low-poly dreamy PS1 aesthetic.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CoIntern',
  },
  // Open Graph (looks nice if you ever share a link)
  openGraph: {
    title: 'CoIntern',
    description: 'Internship command center',
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
      <head>
        {/* Apple touch icon for home-screen install on iOS */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Explicit meta for iOS standalone mode */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased">
        {children}
        {/* Registers the service worker + shows the install banner */}
        <PWARegistrar />
      </body>
    </html>
  )
}
