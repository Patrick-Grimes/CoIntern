'use client'

import { useState, useEffect } from 'react'
import { Application, ApplicationStatus, ApplicationType, ApplicationMode } from '@/app/types'

interface EditApplicationModalProps {
  app: Application | null
  isOpen: boolean
  onClose: () => void
  onSave: (updated: Application) => void
  onDelete: (appId: string) => void
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

// ── File System Access API for local CV vault ─────────────────────────────────
// Returns the selected filename (for display) and stores handle in IndexedDB via
// a custom event so store.ts can persist it. Falls back gracefully if API not supported.
type ShowOpenFilePicker = (options?: {
  multiple?: boolean
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}) => Promise<Array<{ name: string }>>

async function pickLocalFile(): Promise<{ name: string } | null> {
  const picker = (window as unknown as { showOpenFilePicker?: ShowOpenFilePicker }).showOpenFilePicker
  if (!picker) return null
  try {
    const [handle] = await picker({
      types: [
        { description: 'CV / Resume', accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] } },
      ],
      multiple: false,
    })
    // Store handle in sessionStorage key (can be persisted to IDB separately)
    return { name: handle.name }
  } catch {
    return null
  }
}

export function EditApplicationModal({ app, isOpen, onClose, onSave, onDelete }: EditApplicationModalProps) {
  const [form, setForm] = useState<Application | null>(() => (app ? { ...app } : null))
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen || !form) return null

  function set<K extends keyof Application>(key: K, value: Application[K]) {
    setForm(prev => prev ? { ...prev, [key]: value } : prev)
  }

  async function handlePickFile() {
    const result = await pickLocalFile()
    if (result) set('vault_folder_name', result.name)
  }

  function handleSave() {
    if (!form) return
    onSave(form)
    onClose()
  }

  function handleDelete() {
    if (!form) return
    onDelete(form.id)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col"
          style={{
            background: '#e8e0f4',
            borderTop: '4px solid #f4f0fc', borderLeft: '4px solid #f4f0fc',
            borderRight: '4px solid #7060a0', borderBottom: '4px solid #7060a0',
            boxShadow: '9px 9px 0px #5848a0',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="h-2 w-full shrink-0" style={{ background: 'linear-gradient(90deg,#a898c8,#c4b4d8,#9aab98)', borderBottom: '1px solid #7060a0' }} />

          <div className="px-7 pt-5 pb-4 flex justify-between items-start border-b-2 border-[#b0a0d0]/30">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-dt-lavender opacity-55 mb-0.5">Edit Entry</p>
              <h2 className="text-xl font-black tracking-tighter">EDIT_POSITION<span className="text-dt-lavender animate-pulse">_</span></h2>
              <p className="text-[9px] opacity-35 mt-0.5">{form.company_name}</p>
            </div>
            <button onClick={onClose} className="text-foreground/30 hover:text-foreground/70 transition-colors font-black text-xl leading-none mt-1">✕</button>
          </div>

          <div className="px-7 py-5 flex flex-col gap-4 flex-1">

            <Field label="Role / Position *">
              <input className={inputClass} value={form.position} onChange={e => set('position', e.target.value)} placeholder="Software Engineer Intern" />
            </Field>

            <Field label="Company">
              <input className={inputClass} value={form.company_name} onChange={e => set('company_name', e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <div className="relative">
                  <select className={selectClass} value={form.status} onChange={e => set('status', e.target.value as ApplicationStatus)}>
                    {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▾</span>
                </div>
              </Field>
              <Field label="Type">
                <div className="relative">
                  <select className={selectClass} value={form.type} onChange={e => set('type', e.target.value as ApplicationType)}>
                    {ALL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▾</span>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Applied Date">
                <input type="date" className={inputClass} value={form.applied_date ?? ''} onChange={e => set('applied_date', e.target.value || null)} />
              </Field>
              {/* ← NEW: Deadline field */}
              <Field label="Deadline ⏰">
                <input type="date" className={inputClass} value={form.deadline ?? ''} onChange={e => set('deadline', e.target.value || null)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Mode">
                <div className="relative">
                  <select className={selectClass} value={form.mode} onChange={e => set('mode', e.target.value as ApplicationMode)}>
                    {ALL_MODES.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-xs">▾</span>
                </div>
              </Field>
            </div>

            <Field label="Job Posting URL">
              <input className={inputClass} value={form.link ?? ''} onChange={e => set('link', e.target.value || null)} placeholder="https://…" />
            </Field>

            <Field label="Notes">
              <textarea className={`${inputClass} resize-none`} rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} placeholder="Referral? Interesting role? Deadline?" />
            </Field>

            {/* CV Vault — URL or local file */}
            <Field label="CV / Vault Link (URL)">
              <input className={inputClass} value={form.vault_link ?? ''} onChange={e => set('vault_link', e.target.value || null)} placeholder="Google Drive, Notion, Dropbox…" />
            </Field>

            {/* ← NEW: Local file picker */}
            <Field label="CV / Vault — Local File">
              <div className="flex gap-2 items-center">
                <div className={`${inputClass} flex-1 opacity-60 cursor-default`}>
                  {form.vault_folder_name ?? 'No file selected'}
                </div>
                <button
                  type="button"
                  onClick={handlePickFile}
                  className="btn-block btn-ps1-ghost px-3 py-2 text-[11px] shrink-0"
                  title="Uses the File System Access API (Chrome/Edge)"
                >
                  Browse
                </button>
                {form.vault_folder_name && (
                  <button type="button" onClick={() => set('vault_folder_name', null)}
                    className="text-foreground/30 hover:text-foreground/60 font-black shrink-0">✕</button>
                )}
              </div>
              <p className="text-[8px] opacity-30 mt-0.5">Requires Chrome or Edge · file name saved for display only</p>
            </Field>

          </div>

          <div className="px-7 pb-6 flex items-center justify-between gap-3 border-t-2 border-[#b0a0d0]/20 pt-4">
            <div>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} className="text-[10px] font-black uppercase tracking-wider text-red-400/60 hover:text-red-500 transition-colors">
                  Delete Entry
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-red-500">Sure?</span>
                  <button onClick={handleDelete} className="btn-block px-3 py-1 text-[10px]" style={{ background:'#e03030', color:'white', borderColor:'#ff8080', boxShadow:'3px 3px 0px #a01010' }}>YES</button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-block btn-ps1-ghost px-3 py-1 text-[10px]">Cancel</button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-block btn-ps1-ghost px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleSave} className="btn-block btn-ps1-lavender px-6 py-2 text-sm">SAVE_CHANGES →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
