import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ── Service Worker headers ───────────────────────────────────────────────
  // sw.js must be served with Service-Worker-Allowed header to cover the full
  // app scope, and Cache-Control: no-cache so the browser always checks for
  // an updated worker.
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control',        value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
