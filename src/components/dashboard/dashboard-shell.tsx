'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, useTree } from '@/lib/store'
import { runMigrationIfNeeded } from '@/lib/migrate'
import type { Application, ApplicationStatus, EnrichedApplication, CompanyWithApplications, CoInternExport } from '@/app/types'
import { STATUS_COLORS } from '@/app/types'
import { LogPositionModal } from './log-position-modal'
import { EditApplicationModal } from './edit-application-modal'
import { ApplicationCat } from './application-cat'

const ALL_STATUSES: ApplicationStatus[] = [
  'Bookmarked', 'Applied', 'OA', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Withdrawn',
]

function daysUntil(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const d     = new Date(iso); d.setHours(0,0,0,0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

function safeHttpUrl(raw: string | null): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed)
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.toString() : null
  } catch {
    return null
  }
}

const grassBackPoints: [number, number][] = [
  [0,50],[10,28],[25,32],[40,24],[55,30],[70,26],[85,35],[100,25],
  [115,33],[130,27],[145,30],[160,28],[175,32],[180,50],
]
const grassFrontPoints: [number, number][] = [
  [0,50],[12,35],[28,38],[42,32],[58,37],[72,33],[88,40],[102,34],
  [118,38],[132,36],[148,42],[162,38],[178,35],[180,50],
]
const petals = [
  {x:5,y:15,size:1.5,delay:0},{x:20,y:25,size:2.2,delay:1},
  {x:35,y:10,size:1.8,delay:0.5},{x:50,y:18,size:2.5,delay:1.2},
  {x:65,y:5,size:1.2,delay:0.3},{x:80,y:20,size:2.0,delay:1.8},
  {x:95,y:12,size:1.7,delay:0.7},{x:110,y:22,size:2.3,delay:2},
  {x:130,y:8,size:1.6,delay:0.4},{x:150,y:19,size:2.1,delay:1.5},
  {x:170,y:14,size:1.9,delay:0.9},{x:185,y:6,size:1.3,delay:1.1},
]

function WorldScene() {
  const left = '45%'
  return (
    <div className="scene-field">
      <svg className="floating-petals" viewBox="0 0 200 100" preserveAspectRatio="none">
        {petals.map((petal, i) => (
          <circle key={i} cx={petal.x} cy={petal.y} r={petal.size}
            fill="rgba(255,182,193,0.7)" className="petal"
            style={{ animationDelay: `${petal.delay}s` }} />
        ))}
      </svg>
      <div className="blob blob-1" /><div className="blob blob-2" />
      <div className="blob blob-3" /><div className="blob blob-4" />
      <svg className="cloud cloud-a" viewBox="0 0 200 60" preserveAspectRatio="none">
        <polygon points="0,40 20,20 50,30 80,10 120,25 160,15 200,35 200,60 0,60" fill="#f0f0f0" />
      </svg>
      <svg className="cloud cloud-b" viewBox="0 0 180 50" preserveAspectRatio="none">
        <polygon points="0,30 20,10 60,25 100,5 140,20 180,0 180,50 0,50" fill="#e0e0e0" />
      </svg>
      <svg className="cloud cloud-c" viewBox="0 0 220 70" preserveAspectRatio="none">
        <polygon points="0,50 30,20 70,40 110,15 150,35 190,10 220,40 220,70 0,70" fill="#d8d8d8" />
      </svg>
      <div className="hot-air-balloon" style={{ position:'absolute', width:'60px', height:'120px', left, top:'50%' }}>
        <svg viewBox="0 0 60 120" style={{ width:'100%', height:'100%' }}>
          <ellipse cx="30" cy="40" rx="25" ry="35" fill="#f26d6d" stroke="#e63946" strokeWidth={2} />
          <path d="M30,10 C20,40 20,40 30,80 C40,40 40,40 30,10 Z" fill="#f9c74f" opacity={0.7} />
          <rect x="23" y="90" width="14" height="12" fill="#8b5e3c" stroke="#6d4227" strokeWidth={1} rx={2} ry={2} />
          <line x1="20" y1="72.5" x2="27" y2="90" stroke="#6d4227" strokeWidth={1.6} />
          <line x1="40" y1="72.5" x2="33" y2="90" stroke="#6d4227" strokeWidth={1.6} />
        </svg>
      </div>
      <div className="dot-grid absolute inset-0" />
      <div className="ground-container">
        <svg className="grass-layer back" viewBox="0 0 200 50" preserveAspectRatio="none">
          <polygon points={grassBackPoints.map(([x,y]) => `${x},${y}`).join(' ')} fill="#70a050" />
        </svg>
        <svg className="grass-layer front" viewBox="0 0 200 50" preserveAspectRatio="none">
          <polygon points={grassFrontPoints.map(([x,y]) => `${x},${y}`).join(' ')} fill="#88c070" />
        </svg>
      </div>
      <div className="ground-fog" />
    </div>
  )
}

function StatPill({ label, value, bg, lit, shd }: { label: string; value: number; bg: string; lit: string; shd: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-3" style={{
      background: bg, borderRadius: 0,
      borderTop:`2px solid ${lit}`, borderLeft:`2px solid ${lit}`,
      borderRight:`2px solid ${shd}`, borderBottom:`2px solid ${shd}`,
      boxShadow:`3px 3px 0px ${shd}`,
    }}>
      <span className="text-xl font-black text-foreground/85">{value}</span>
      <span className="text-[9px] font-bold uppercase tracking-widest opacity-55">{label}</span>
    </div>
  )
}

function DueSoonBanner({ apps, onEdit }: { apps: EnrichedApplication[]; onEdit: (app: Application) => void }) {
  if (apps.length === 0) return null
  return (
    <section className="mb-6">
      <div className="filter-card p-4 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background: 'linear-gradient(90deg,#e8a060,#f0c890,#e8a060)' }} />
        <div className="flex items-center gap-2 mt-1 mb-3">
          <span className="text-base">⏰</span>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:'#c07830' }}>Due Soon</span>
          <span className="text-[9px] opacity-40 font-mono ml-1">{'// deadlines within 7 days'}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {apps.map(app => {
            const days = daysUntil(app.deadline!)
            const urgency = days < 0 ? '⚠ OVERDUE' : days === 0 ? 'TODAY' : days === 1 ? '1d left' : `${days}d`
            const col = days < 0 ? '#e03030' : days <= 1 ? '#d07020' : '#8070b0'
            return (
              <button key={app.id} onClick={() => onEdit(app)}
                className="flex items-center gap-2 px-3 py-2 text-left transition-all hover:-translate-x-px hover:-translate-y-px"
                style={{
                  background:'#ede8f8',
                  borderTop:'2px solid #faf8ff', borderLeft:'2px solid #faf8ff',
                  borderRight:`2px solid ${col}`, borderBottom:`2px solid ${col}`,
                  boxShadow:`3px 3px 0px ${col}`,
                }}>
                <span className="text-[9px] font-black uppercase" style={{ color:col }}>{urgency}</span>
                <span className="text-xs font-bold opacity-70 max-w-[140px] truncate">{app.company_name}</span>
                <span className="text-[10px] opacity-50 max-w-[120px] truncate">{app.position}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function FilterBar({ activeStatuses, onToggleStatus, filterCompany, onCompanyChange, sortBy, onSortChange, companies, isFiltered, onClear, searchQuery, onSearchChange }: {
  activeStatuses: Set<ApplicationStatus>; onToggleStatus: (s: ApplicationStatus) => void
  filterCompany: string; onCompanyChange: (c: string) => void
  sortBy: string; onSortChange: (s: string) => void
  companies: string[]; isFiltered: boolean; onClear: () => void
  searchQuery: string; onSearchChange: (q: string) => void
}) {
  const sel = 'bg-[#e0d8f0] border-t-2 border-l-2 border-t-[#ece8fc] border-l-[#ece8fc] border-r-2 border-b-2 border-r-[#7868a8] border-b-[#7868a8] text-[11px] font-black uppercase tracking-wider px-2 py-1 font-mono cursor-pointer focus:outline-none'
  return (
    <div className="filter-card p-4 mb-6 relative">
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ background:'linear-gradient(90deg,#a898c8,#c4b4d8,#9aab98)' }} />
      <div className="mt-1 flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] opacity-35 pointer-events-none">🔍</span>
          <input
            type="text" value={searchQuery} onChange={e => onSearchChange(e.target.value)}
            placeholder="Search company, role, notes…"
            className="w-full pl-8 pr-8 py-2 text-[11px] font-mono placeholder:opacity-30 focus:outline-none bg-white/50"
            style={{ borderTop:'2px solid #faf8ff', borderLeft:'2px solid #faf8ff', borderRight:'2px solid #8070b0', borderBottom:'2px solid #8070b0' }}
          />
          {searchQuery && (
            <button onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 font-black text-sm leading-none">✕</button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mr-1">Status:</span>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => onToggleStatus(s)}
              className={`status-badge cursor-pointer transition-all duration-100 ${activeStatuses.has(s) ? STATUS_COLORS[s]+' opacity-100' : 'border-foreground/20 bg-white/30 opacity-50 hover:opacity-75'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Company:</span>
          <select value={filterCompany} onChange={e => onCompanyChange(e.target.value)} className={sel}>
            <option value="All">All</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-2">Sort:</span>
          <select value={sortBy} onChange={e => onSortChange(e.target.value)} className={sel}>
            <option value="date">Date Added</option>
            <option value="deadline">Deadline</option>
            <option value="company">Company A-Z</option>
            <option value="status">Status</option>
          </select>
          {isFiltered && <button onClick={onClear} className="btn-block btn-ps1-ghost px-3 py-1 text-[10px]">CLEAR ✕</button>}
        </div>
      </div>
    </div>
  )
}

const CARD_ACCENTS = [
  { fill:'#e8e0f4', strip:'#ccc0e8', bar:'#a898c8', lit:'#f4f0fc', shd:'#8070b0' },
  { fill:'#f4e8e0', strip:'#f4d0c4', bar:'#e8b8a8', lit:'#fdf4f0', shd:'#b07060' },
  { fill:'#dceee0', strip:'#b0dcc0', bar:'#8ec8a0', lit:'#f0faf2', shd:'#508060' },
]

function CatCard({ app, accentIndex=0, showCompany=false, onToggleTask, onEdit }: {
  app: EnrichedApplication; accentIndex?: number; showCompany?: boolean
  onToggleTask: (itemId: string) => void; onEdit: (app: Application) => void
}) {
  const ac   = CARD_ACCENTS[accentIndex % CARD_ACCENTS.length]
  const done = app.action_items.filter(i => i.done).length
  const total = app.action_items.length
  const deadlineDays = app.deadline ? daysUntil(app.deadline) : null
  const isBookmarked = app.status === 'Bookmarked'
  const showDeadline = isBookmarked && deadlineDays !== null && deadlineDays <= 14
  const deadlineColor = deadlineDays !== null ? (deadlineDays < 0 ? '#e03030' : deadlineDays <= 1 ? '#d07020' : '#8070b0') : '#8070b0'
  const safeLink = safeHttpUrl(app.link)

  return (
    <div className="cat-card" style={{
      background:ac.fill,
      borderTop:`3px solid ${ac.lit}`, borderLeft:`3px solid ${ac.lit}`,
      borderRight:`3px solid ${ac.shd}`, borderBottom:`3px solid ${ac.shd}`,
      boxShadow:`5px 5px 0px ${ac.shd}`,
    }}>
      {showDeadline
        ? <div className="h-1 w-full shrink-0" style={{ background:deadlineColor, opacity:0.7 }} />
        : <div className="h-2 w-full shrink-0" style={{ background:ac.strip, borderBottom:`1px solid ${ac.shd}` }} />
      }
      <div className="flex justify-center items-end pt-3 pb-1 relative" style={{ minHeight:'130px' }}>
        <ApplicationCat status={app.status as ApplicationStatus} size={100} />
        <button onClick={() => onEdit(app)} title="Edit"
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center group"
          style={{ background:ac.fill, borderTop:`2px solid ${ac.lit}`, borderLeft:`2px solid ${ac.lit}`, borderRight:`2px solid ${ac.shd}`, borderBottom:`2px solid ${ac.shd}`, boxShadow:`2px 2px 0px ${ac.shd}`, transition:'box-shadow .1s,transform .1s' }}
          onMouseDown={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.boxShadow='none';b.style.transform='translate(2px,2px)'}}
          onMouseUp={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.boxShadow=`2px 2px 0px ${ac.shd}`;b.style.transform=''}}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-50 group-hover:opacity-90 transition-opacity">
            <rect x="7" y="1" width="3" height="3" fill="#28203c" transform="rotate(45 8.5 2.5)"/>
            <rect x="1" y="7" width="3" height="5" fill="#28203c" transform="rotate(45 2.5 9.5)"/>
            <rect x="5" y="3" width="2" height="6" fill="#28203c" transform="rotate(45 6 6)"/>
            <polygon points="0,11 2,9 3,10" fill="#28203c"/>
          </svg>
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1 border-t-2" style={{ borderColor:`${ac.shd}40` }}>
        {showCompany && <p className="text-[9px] font-black uppercase tracking-widest opacity-50" style={{ color:ac.bar }}>{app.company_name}</p>}
        <div className="flex justify-between items-start gap-2">
          <p className="font-black text-base text-lg text-[25px] leading-tight text-foreground/90 flex-1">{app.position}</p>
          <span className={`status-badge shrink-0 mt-1 ${STATUS_COLORS[app.status as ApplicationStatus]}`}>{app.status}</span>
        </div>
        {isBookmarked && app.deadline && (
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color:deadlineColor }}>
              {deadlineDays !== null && (deadlineDays < 0 ? '⚠ OVERDUE' : deadlineDays === 0 ? '⏰ TODAY' : `⏰ ${deadlineDays}d left`)}
            </span>
            <span className="text-[8px] opacity-30">· {app.deadline}</span>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {app.type && <span className="text-[15px] font-bold opacity-40 uppercase tracking-wider">{app.type}</span>}
          {app.applied_date && <span className="text-[13px] font-bold opacity-35 uppercase">📅 {app.applied_date}</span>}
          {safeLink && <a href={safeLink} target="_blank" rel="noopener noreferrer" className="text-[9px] font-bold opacity-55 hover:opacity-90 transition-opacity uppercase" style={{ color:ac.bar }}>↗ Link</a>}
          {app.vault_folder_name && <span className="text-[13px] font-bold opacity-50 uppercase" style={{ color:ac.bar }}>📁 {app.vault_folder_name}</span>}
        </div>
        {app.notes && <p className="text-[13px] opacity-45 italic leading-snug pl-2" style={{ borderLeft:`2px solid ${ac.bar}` }}>{app.notes}</p>}
        {total > 0 && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[15px] font-bold uppercase tracking-widest opacity-35">Tasks</span>
              <span className="text-[15px] font-bold opacity-45">{done}/{total}</span>
            </div>
            <div className="w-full h-2 overflow-hidden" style={{ background:'#d0c8e0', border:`1px solid ${ac.shd}`, boxShadow:`1px 1px 0px ${ac.shd}` }}>
              <div className="h-full progress-bar" style={{ width:`${total>0?(done/total)*100:0}%`, background:ac.bar }} />
            </div>
          </div>
        )}
        {total > 0 && (
          <div className="space-y-1.5 mt-0.5">
            {app.action_items.map(item => (
              <button key={item.id} onClick={() => onToggleTask(item.id)} className="flex items-center gap-2 text-[11px] font-medium w-full text-left group">
                <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0 transition-all" style={{ border:item.done?`2px solid #5e9870`:`2px solid ${ac.shd}`, background:item.done?'#8ec8a0':'rgba(255,255,255,0.45)', boxShadow:item.done?'none':`1px 1px 0px ${ac.shd}` }}>
                  {item.done && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 10 10"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`leading-tight transition-opacity ${item.done?'line-through opacity-25':'opacity-60 group-hover:opacity-85'}`}>{item.label}</span>
              </button>
            ))}
          </div>
        )}
        {total === 0 && <p className="text-[10px] opacity-20 italic">No tasks yet…</p>}
      </div>
    </div>
  )
}

function CompanySection({ company, onEdit }: { company: CompanyWithApplications; onEdit: (app: Application) => void }) {
  const toggleTask = useStore(s => s.toggleTask)
  const totalTasks = company.applications.reduce((s,a) => s+a.action_items.length, 0)
  const doneTasks  = company.applications.reduce((s,a) => s+a.action_items.filter(i=>i.done).length, 0)
  const pct = totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0
  return (
    <section className="company-card p-7 relative overflow-hidden animate-float-up">
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background:'linear-gradient(90deg,#a898c8,#c4b4d8,#9aab98)', borderBottom:'1px solid #7060a0' }} />
      <div className="flex flex-wrap items-start justify-between gap-2 mt-2 mb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground/90">{company.name}<span className="text-dt-lavender opacity-50">_</span></h2>
          <p className="text-[17px] opacity-30 mt-0.5 font-bold uppercase tracking-wider">{company.applications.length} position{company.applications.length!==1?'s':''}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold uppercase tracking-widest opacity-40">Progress</span>
            <span className="text-sm font-black" style={{ color:'#a898c8' }}>{pct}%</span>
          </div>
          <div className="w-32 h-3 overflow-hidden" style={{ background:'#c4bcd4', borderTop:'2px solid #d8d0e8', borderLeft:'2px solid #d8d0e8', borderRight:'2px solid #8878b0', borderBottom:'2px solid #8878b0', boxShadow:'2px 2px 0px #7868a4' }}>
            <div className="h-full progress-bar" style={{ width:`${pct}%`, background:pct===100?'linear-gradient(90deg,#8ec8a0,#6ea880)':'linear-gradient(90deg,#a898c8,#c4a8c8)' }} />
          </div>
          <span className="text-[17px] opacity-28 font-bold">{doneTasks}/{totalTasks} tasks</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {company.applications.map((app,idx) => (
          <CatCard key={app.id} app={app} accentIndex={idx} onToggleTask={toggleTask} onEdit={onEdit} />
        ))}
      </div>
    </section>
  )
}

function CatGallery({ apps, onEdit }: { apps: EnrichedApplication[]; onEdit: (app: Application) => void }) {
  const toggleTask = useStore(s => s.toggleTask)
  if (apps.length === 0) return (
    <div className="company-card p-16 text-center flex flex-col items-center gap-4 relative">
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background:'linear-gradient(90deg,#a898c8,#c4b4d8,#9aab98)', borderBottom:'1px solid #7060a0' }} />
      <div className="text-3xl opacity-15 select-none mt-2">◈ ◉ ◇</div>
      <p className="font-black opacity-40 text-sm uppercase tracking-widest">NO_MATCHES_FOUND</p>
    </div>
  )
  return (
    <div className="company-card p-6 relative">
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background:'linear-gradient(90deg,#a898c8,#c4b4d8,#9aab98)', borderBottom:'1px solid #7060a0' }} />
      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-2 mb-4">Filtered — {apps.length} result{apps.length!==1?'s':''}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {apps.map((app,idx) => <CatCard key={app.id} app={app} accentIndex={idx} showCompany onToggleTask={toggleTask} onEdit={onEdit} />)}
      </div>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="company-card p-20 text-center flex flex-col items-center gap-6 relative">
      <div className="absolute top-0 left-0 right-0 h-2" style={{ background:'linear-gradient(90deg,#a898c8,#c4b4d8,#9aab98)', borderBottom:'1px solid #7060a0' }} />
      <div className="text-4xl opacity-15 select-none mt-2">◈ ◉ ◇</div>
      <div>
        <p className="font-black text-xl tracking-tight mb-1" style={{ color:'#a898c8' }}>NO_RECORDS_FOUND</p>
        <p className="text-xs opacity-35 font-mono">{'// awaiting your first position log'}</p>
      </div>
      <button onClick={onAdd} className="btn-block btn-ps1-mint px-8 py-3 text-sm">+ LOG_FIRST_POSITION</button>
    </div>
  )
}

function DataBar() {
  const exportData = useStore(s => s.exportData)
  const importData = useStore(s => s.importData)
  const importRef  = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function handleExport() {
    const data = exportData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `cointern-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click(); URL.revokeObjectURL(url)
    setMsg('Exported ✓'); setTimeout(() => setMsg(null), 2500)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as CoInternExport
      if (data.version !== 2) throw new Error('Unknown version')
      await importData(data)
      setMsg(`Imported ${data.applications.length} entries ✓`)
    } catch { setMsg('Import failed') }
    setTimeout(() => setMsg(null), 3500)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button onClick={handleExport} className="btn-block btn-ps1-ghost px-3 py-1.5 text-[10px]">↓ Export</button>
      <button onClick={() => importRef.current?.click()} className="btn-block btn-ps1-ghost px-3 py-1.5 text-[10px]">↑ Import</button>
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      {msg && <span className="text-[10px] font-bold opacity-60 font-mono">{msg}</span>}
    </div>
  )
}

export function DashboardShell() {
  const hydrate   = useStore(s => s.hydrate)
  const isLoaded  = useStore(s => s.isLoaded)
  const tree      = useTree()
  const applications   = useStore(s => s.applications)
  const actionItems    = useStore(s => s.actionItems)
  const addApplication = useStore(s => s.addApplication)
  const updateApplication = useStore(s => s.updateApplication)
  const deleteApp = useStore(s => s.deleteApplication)

  const [isAddOpen, setIsAddOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Application | null>(null)
  const [activeStatuses, setActiveStatuses] = useState<Set<ApplicationStatus>>(new Set())
  const [filterCompany, setFilterCompany]   = useState('All')
  const [sortBy, setSortBy]                 = useState('date')
  const [searchQuery, setSearchQuery]       = useState('')

  useEffect(() => {
    async function init() { await runMigrationIfNeeded(); await hydrate() }
    init()
    const handler = () => setIsAddOpen(true)
    window.addEventListener('cointern:open-log', handler)
    return () => window.removeEventListener('cointern:open-log', handler)
  }, [hydrate])

  const dueSoon = useMemo(() =>
    tree.flatMap(c => c.applications)
      .filter(a => a.deadline && daysUntil(a.deadline) <= 7 && a.status === 'Bookmarked')
      .sort((a,b) => (a.deadline??'').localeCompare(b.deadline??''))
  , [tree])

  const isFiltered = activeStatuses.size > 0 || filterCompany !== 'All' || searchQuery.trim() !== '' || sortBy !== 'date'

  const filteredApps = useMemo(() => {
    let apps = tree.flatMap(c => c.applications)
    if (activeStatuses.size > 0) apps = apps.filter(a => activeStatuses.has(a.status as ApplicationStatus))
    if (filterCompany !== 'All')  apps = apps.filter(a => a.company_name === filterCompany)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      apps = apps.filter(a =>
        a.company_name.toLowerCase().includes(q) ||
        a.position.toLowerCase().includes(q) ||
        (a.notes ?? '').toLowerCase().includes(q)
      )
    }
    if (sortBy === 'company')  apps = [...apps].sort((a,b) => a.company_name.localeCompare(b.company_name))
    if (sortBy === 'status')   apps = [...apps].sort((a,b) => a.status.localeCompare(b.status))
    if (sortBy === 'deadline') apps = [...apps].sort((a,b) => (a.deadline??'9999').localeCompare(b.deadline??'9999'))
    return apps
  }, [tree, activeStatuses, filterCompany, sortBy, searchQuery])

  const totalTasks = actionItems.length
  const doneTasks  = actionItems.filter(i => i.done).length

  function toggleStatus(s: ApplicationStatus) {
    setActiveStatuses(prev => {
      const n = new Set(prev)
      if (n.has(s)) n.delete(s)
      else n.add(s)
      return n
    })
  }

  if (!isLoaded) return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="header-card px-8 py-6 relative">
        <div className="absolute top-0 left-0 right-0 h-2" style={{ background:'linear-gradient(90deg,#7868b0,#a898c8,#7868b0)' }} />
        <p className="text-sm font-black uppercase tracking-widest opacity-60 mt-2">Loading…</p>
      </div>
    </div>
  )

  return (
    <>
      <WorldScene />
      <div className="pixel-scanlines" />
      <div className="dither-overlay" />
      <div className="grain-overlay fixed inset-0 z-0 pointer-events-none" />
      <main className="relative z-10 min-h-screen px-6 md:px-12 py-10 max-w-7xl mx-auto animate-bounce-in">
        <header className="mb-8">
          <div className="header-card px-7 py-5 flex flex-wrap items-center justify-between gap-5">
            <div className="absolute top-0 left-0 right-0 h-2" style={{ background:'linear-gradient(90deg,#7868b0,#a898c8,#7868b0)' }} />
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1"><span className="pulse-dot" /><span className="text-[9px] font-bold uppercase tracking-widest opacity-40">System Online</span></div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none title-shimmer">CoIntern</h1>
              <p className="text-[9px] font-mono opacity-20 mt-0.5">internship_command_center v2.0</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <StatPill label="Companies"    value={tree.length}       bg="#ccc0e4" lit="#e4dcf8" shd="#7060a0" />
              <StatPill label="Applications" value={applications.length} bg="#f0d8d0" lit="#fdf0ec" shd="#b07060" />
              <StatPill label="Done"         value={doneTasks}          bg="#c8e4cc" lit="#e4f4e4" shd="#508060" />
              <StatPill label="Total Tasks"  value={totalTasks}         bg="#c4d8e8" lit="#dceef8" shd="#5080a0" />
            </div>
            <div className="flex flex-col gap-2 items-end shrink-0">
              <button onClick={() => setIsAddOpen(true)} className="btn-block btn-ps1-lavender px-6 py-3 text-sm w-full">New Internship</button>
              <DataBar />
            </div>
          </div>
        </header>
        <DueSoonBanner apps={dueSoon} onEdit={setEditTarget} />
        {tree.length > 0 && (
          <FilterBar
            activeStatuses={activeStatuses} onToggleStatus={toggleStatus}
            filterCompany={filterCompany} onCompanyChange={setFilterCompany}
            sortBy={sortBy} onSortChange={setSortBy}
            companies={tree.map(c => c.name)} isFiltered={isFiltered}
            onClear={() => { setActiveStatuses(new Set()); setFilterCompany('All'); setSortBy('date'); setSearchQuery('') }}
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
          />
        )}
        <div className="grid grid-cols-1 gap-7">
          {tree.length === 0 ? <EmptyState onAdd={() => setIsAddOpen(true)} />
            : isFiltered ? <CatGallery apps={filteredApps} onEdit={setEditTarget} />
            : tree.map(company => <CompanySection key={company.id} company={company} onEdit={setEditTarget} />)
          }
        </div>
        <footer className="mt-16 pb-36 text-center">
          <p className="text-[9px] font-mono opacity-15 tracking-widest uppercase">cointern // local-first // your data stays yours ◈</p>
        </footer>
      </main>
      <LogPositionModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} existingCompanies={tree.map(c => c.name)} onSave={addApplication} />
      <EditApplicationModal
        key={editTarget?.id ?? 'none'}
        app={editTarget}
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSave={async (updated) => { await updateApplication(updated); setEditTarget(null) }}
        onDelete={async (id) => { await deleteApp(id); setEditTarget(null) }} />
    </>
  )
}
