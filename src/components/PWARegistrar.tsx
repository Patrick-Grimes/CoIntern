'use client'

import { useEffect, useState } from 'react'

// Extend Window type for the install prompt event
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}

export function PWARegistrar() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches
  })

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then(reg => console.log('[CoIntern SW] Registered', reg.scope))
        .catch(err => console.warn('[CoIntern SW] Registration failed', err))
    }

    // Capture the install prompt so we can show our own button
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Handle shortcut action param (?action=log)
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'log') {
      // Dispatch a custom event the dashboard shell can listen for
      window.dispatchEvent(new CustomEvent('cointern:open-log'))
      // Clean up the URL
      window.history.replaceState({}, '', '/dashboard')
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
    }
  }

  // Show install banner if the prompt is available and not yet installed
  if (!installPrompt || isInstalled) return null

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3"
      style={{
        background: '#dcd4ec',
        borderTop: '3px solid #ece8f8', borderLeft: '3px solid #ece8f8',
        borderRight: '3px solid #7060a0', borderBottom: '3px solid #7060a0',
        boxShadow: '6px 6px 0px #5848a0',
        borderRadius: 0,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <span className="text-[11px] font-black uppercase tracking-wider opacity-70">
        Install CoIntern as a desktop app?
      </span>
      <button
        onClick={handleInstall}
        className="btn-block btn-ps1-lavender px-4 py-1.5 text-[11px]"
      >
        INSTALL ↗
      </button>
      <button
        onClick={() => setInstallPrompt(null)}
        className="text-foreground/30 hover:text-foreground/60 font-black text-sm"
      >
        ✕
      </button>
    </div>
  )
}
