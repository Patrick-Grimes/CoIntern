'use client'

import { useState, useRef, useEffect } from 'react'
import type { Application, ActionItem, ApplicationStatus, ApplicationType, ApplicationMode } from '@/app/types'

interface LogPositionModalProps {
  isOpen: boolean
  onClose: () => void
  existingCompanies: string[]
  // Matches Zustand store's addApplication signature — store assigns id/company_id/created_at
  onSave: (
    appData: Omit<Application, 'id' | 'company_id' | 'created_at'>,
    items: Pick<ActionItem, 'label' | 'done'>[]
  ) => Promise<void>
}

const ALL_STATUSES: ApplicationStatus[] = [
  'Bookmarked', 'Applied', 'OA', 'Phone Screen', 'Interview', 'Offer', 'Rejected', 'Withdrawn',
]
const ALL_TYPES: ApplicationType[] = ['Internship', 'Co-op', 'New Grad', 'Fellowship']
const ALL_MODES: ApplicationMode[] = ['Ongoing', 'Submitted']

const inputClass =
  'bg-white/60 text-sm font-mono w-full px-3 py-2 focus:outline-none transition-colors placeholder:opacity-30 ' +
  'border-t-2 border-l-2 border-t-[#faf8ff] border-l-[#faf8ff] ' +
  'border-r-2 border-b-2 border-r-[#8070b0] border-b-[#8070b0]'

const inputErrorClass =
  'bg-white/60 text-sm font-mono w-full px-3 py-2 focus:outline-none transition-colors placeholder:opacity-30 ' +
  'border-t-2 border-l-2 border-t-[#faf8ff] border-l-[#faf8ff] ' +
  'border-r-2 border-b-2 border-r-[#e03030] border-b-[#e03030]'

const selectClass =
  'bg-white/60 text-sm font-mono w-full px-3 py-2 focus:outline-none transition-colors appearance-none cursor-pointer ' +
  'border-t-2 border-l-2 border-t-[#faf8ff] border-l-[#faf8ff] ' +
  'border-r-2 border-b-2 border-r-[#8070b0] border-b-[#8070b0]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-widest opacity-50">{label}</label>
      {children}
    </div>
  )
}

export function LogPositionModal({ isOpen, onClose, existingCompanies, onSave }: LogPositionModalProps) {
  const [companyName, setCompanyName] = useState('')
  const [position,    setPosition]    = useState('')
  const [status,      setStatus]      = useState<ApplicationStatus>('Bookmarked')
  const [type,        setType]        = useState<ApplicationType>('Internship')
  const [mode,        setMode]        = useState<ApplicationMode>('Ongoing')
  const [appliedDate, setAppliedDate] = useState('')
  const [deadline,    setDeadline]    = useState('')
  const [link,        setLink]        = useState('')
  const [notes,       setNotes]       = useState('')
  const [tasks,       setTasks]       = useState<string[]>([''])
  const [saving,      setSaving]      = useState(false)
  const [showDrop,    setShowDrop]    = useState(false)
  const [errors,      setErrors]      = useState<{ company?: string; position?: string }>({})
  const compRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (compRef.current && !compRef.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setCompanyName(''); setPosition(''); setStatus('Bookmarked')
      setType('Internship'); setMode('Ongoing'); setAppliedDate('')
      setDeadline(''); setLink(''); setNotes(''); setTasks(['']); setErrors({})
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const suggestions = existingCompanies.filter(c =>
    c.toLowerCase().includes(companyName.toLowerCase()) && c !== companyName
  )

  const updateTask = (i: number, val: string) => { const n = [...tasks]; n[i] = val; setTasks(n) }
  const addTask    = () => setTasks([...tasks, ''])
  const removeTask = (i: number) => setTasks(tasks.filter((_, idx) => idx !== i))

  function deadlineLabel(iso: string): string {
    const today = new Date(); today.setHours(0,0,0,0)
    const d = new Date(iso); d.setHours(0,0,0,0)
    const days = Math.round((d.getTime() - today.getTime()) / 86_400_000)
    if (days < 0)  return '⚠ This date has passed'
    if (days === 0) return '⏰ Due today!'
    if (days === 1) return '⏰ Due tomorrow'
    return `⏰ ${days} days from today`
  }

  async function handleSubmit() {
    const errs: typeof errors = {}
    if (!companyName.trim()) errs.company = 'Required'
    if (!position.trim())    errs.position = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await onSave(
        {
          company_name:      companyName.trim(),
          position:          position.trim(),
          status, type, mode,
          applied_date:      appliedDate || null,
          deadline:          deadline    || null,
          link:              link        || null,
          notes:             notes       || null,
          vault_link:        null,
          vault_folder_name: null,
        },
        tasks.filter(t => t.trim()).map(t => ({ label: t.trim(), done: false }))
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px]" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col"
          style={{
            background: '#e8e4f4',
            borderTop: '4px solid #f4f0fc', borderLeft: '4px solid #f4f0fc',
            borderRight: '4px solid #7060a0', borderBottom: '4px solid #7060a0',
            boxShadow: '9px 9px 0px #5848a0',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-2 w-full shrink-0"
            style={{ background: 'linear-gradient(90deg,#a898c8,#c4b4d8,#9aab98)', borderBottom: '1px solid #7060a0' }} />

          <div className="px-7 pt-5 pb-4 flex justify-between items-start border-b-2 border-[#b0a0d0]/30">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-dt-lavender opacity-55 mb-0.5">New Entry</p>
              <h2 className="text-xl font-black tracking-tighter">
                LOG_POSITION<span className="text-dt-lavender animate-pulse">_</span>
              </h2>
            </div>
            <button onClick={onClose} className="text-foreground/30 hover:text-foreground/70 transition-colors font-black text-xl leading-none mt-1">✕</button>
          </div>

          <div className="px-7 py-5 flex flex-col gap-4 flex-1">

            <Field label="Company *">
              <div className="relative" ref={compRef}>
                <input
                  className={errors.company ? inputErrorClass : inputClass}
                  placeholder="Stripe, Figma, Notion…"
                  value={companyName}
                  onChange={e => { setCompanyName(e.target.value); setShowDrop(true) }}
                  onFocus={() => setShowDrop(true)}
                />
                {errors.company && <p className="text-[9px] text-red-400 font-bold mt-0.5">{errors.company}</p>}
                {showDrop && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-10 overflow-hidden"
                    style={{ background:'#ede8f8', border:'2px solid #8070b0', boxShadow:'4px 4px 0px #7060a0' }}>
                    {suggestions.map(s => (
                      <button key={s} className="w-full text-left px-4 py-2.5 text-sm font-mono hover:bg-[#a898c8]/20 transition-colors"
                        onClick={() => { setCompanyName(s); setShowDrop(false) }}>
                        {s}<span className="text-[10px] text-dt-lavender opacity-60 ml-2">existing ↑</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <Field label="Role / Position *">
              <input className={errors.position ? inputErrorClass : inputClass} placeholder="Software Engineer Intern"
                value={position} onChange={e => setPosition(e.target.value)} />
              {errors.position && <p className="text-[9px] text-red-400 font-bold mt-0.5">{errors.position}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <div className="relative">
                  <select className={selectClass} value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}>
                    {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▾</span>
                </div>
              </Field>
              <Field label="Type">
                <div className="relative">
                  <select className={selectClass} value={type} onChange={e => setType(e.target.value as ApplicationType)}>
                    {ALL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▾</span>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Mode">
                <div className="relative">
                  <select className={selectClass} value={mode} onChange={e => setMode(e.target.value as ApplicationMode)}>
                    {ALL_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▾</span>
                </div>
              </Field>
              <Field label="Applied Date">
                <input type="date" className={inputClass} value={appliedDate} onChange={e => setAppliedDate(e.target.value)} />
              </Field>
            </div>

            <Field label="⏰ Application Deadline">
              <input type="date" className={inputClass} value={deadline} onChange={e => setDeadline(e.target.value)} />
              {deadline && (
                <p className="text-[9px] font-bold mt-0.5" style={{ color:'#8070b0' }}>{deadlineLabel(deadline)}</p>
              )}
            </Field>

            <Field label="Job Posting URL">
              <input className={inputClass} placeholder="https://…" value={link} onChange={e => setLink(e.target.value)} />
            </Field>

            <Field label="Notes">
              <textarea className={`${inputClass} resize-none`} rows={2}
                placeholder="Referral contact? Salary range? Interesting role?"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </Field>

            <Field label={`Action Items (${tasks.filter(t => t.trim()).length})`}>
              <div className="flex flex-col gap-2">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 shrink-0 border-2 border-[#8070b0] bg-white/40"
                      style={{ boxShadow:'1px 1px 0px #7060a0' }} />
                    <input className={`${inputClass} flex-1`} placeholder={`Task ${i + 1}…`}
                      value={task} onChange={e => updateTask(i, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask() } }} />
                    {tasks.length > 1 && (
                      <button onClick={() => removeTask(i)}
                        className="text-foreground/25 hover:text-red-400 transition-colors text-lg leading-none shrink-0">×</button>
                    )}
                  </div>
                ))}
                <button onClick={addTask}
                  className="text-[11px] font-black uppercase tracking-widest text-dt-lavender opacity-60 hover:opacity-100 transition-opacity text-left mt-1">
                  + add task
                </button>
              </div>
            </Field>
          </div>

          <div className="px-7 pb-7 flex justify-end gap-3 border-t-2 border-[#b0a0d0]/20 pt-4">
            <button onClick={onClose} className="btn-block btn-ps1-ghost px-5 py-2.5 text-sm">Cancel</button>
            <button onClick={handleSubmit} disabled={saving}
              className="btn-block btn-ps1-lavender px-6 py-2.5 text-sm disabled:opacity-50">
              {saving ? 'SAVING…' : 'LOG_IT →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
