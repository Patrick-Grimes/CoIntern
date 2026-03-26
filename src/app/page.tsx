'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 relative overflow-hidden">

      {/* Background blobs */}
      <div className="blob-field">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="dot-grid absolute inset-0" />
      </div>

      {/* Grain */}
      <div className="grain-overlay fixed inset-0 z-0 pointer-events-none" />

      {/* Card */}
      <div className="company-card p-12 text-center max-w-xl z-10 relative animate-bounce-in">
        {/* Decorative top strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[20px]"
          style={{ background: 'linear-gradient(90deg, #b8a9d4, #fcd5ce, #a8ddb5)' }}
        />

        {/* Status line */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="pulse-dot" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">
            Local node ready
          </span>
        </div>

        {/* Logo */}
        <h1 className="text-7xl font-black tracking-tighter mb-2 title-shimmer">
          CoIntern
        </h1>
        <p className="text-[11px] font-mono opacity-30 uppercase tracking-widest mb-8">
          internship_command_center // v2.0
        </p>

        {/* Greeting */}
        <p className="text-base mb-10 opacity-60 font-mono leading-relaxed">
          SYSTEM_BOOT // LOCAL_STORAGE_ACTIVE
          <br />
          <span className="text-dt-lavender font-black">Welcome back.</span>
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="btn-block bg-dt-mint px-10 py-4 font-black text-xl inline-block text-foreground"
        >
          INITIALIZE_SYSTEM →
        </Link>

        {/* Decorative symbol row */}
        <div className="flex justify-center gap-4 mt-10 opacity-15 select-none text-dt-lavender text-sm tracking-widest">
          {['◈', '◉', '◇', '◆', '◉', '◈'].map((s, i) => <span key={i}>{s}</span>)}
        </div>
      </div>

      {/* Corner geometry */}
      <div className="absolute top-10 left-10 w-28 h-28 opacity-20 rotate-12 border-4 border-dt-lavender rounded-xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-44 h-44 opacity-15 -rotate-12 border-4 border-dt-peach rounded-2xl pointer-events-none" />
      <div className="absolute bottom-24 left-16 w-16 h-16 opacity-20 rotate-45 border-3 border-dt-mint pointer-events-none" />
    </main>
  )
}
