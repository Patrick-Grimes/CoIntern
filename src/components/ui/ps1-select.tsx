'use client'

import { useEffect, useId, useRef, useState } from 'react'

export interface Ps1SelectOption {
  value: string
  label: string
}

interface Ps1SelectProps {
  value: string
  onChange: (value: string) => void
  options: Ps1SelectOption[]
  /** Compact filter-bar style vs full-width modal field */
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const TRIGGER_SM =
  'bg-[#e0d8f0] border-t-2 border-l-2 border-t-[#ece8fc] border-l-[#ece8fc] ' +
  'border-r-2 border-b-2 border-r-[#7868a8] border-b-[#7868a8] ' +
  'text-[11px] font-black uppercase tracking-wider px-2 py-1 font-mono ' +
  'cursor-pointer focus:outline-none min-w-[7rem]'

const TRIGGER_MD =
  'bg-white text-[#1c162c] text-sm font-mono w-full px-3 py-2.5 focus:outline-none ' +
  'focus-visible:shadow-[0_0_0_2px_#a898c8] ' +
  'border-t-2 border-l-2 border-t-[#faf8ff] border-l-[#faf8ff] ' +
  'border-r-2 border-b-2 border-r-[#8070b0] border-b-[#8070b0] ' +
  'cursor-pointer uppercase tracking-wider font-black rounded-none'

const MENU =
  'absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto ' +
  'bg-[#e8e0f4] border-t-2 border-l-2 border-t-[#f4f0fc] border-l-[#f4f0fc] ' +
  'border-r-2 border-b-2 border-r-[#7060a0] border-b-[#7060a0] ' +
  'shadow-[4px_4px_0px_#5848a0]'

export function Ps1Select({
  value,
  onChange,
  options,
  size = 'md',
  className = '',
  'aria-label': ariaLabel,
}: Ps1SelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const selected = options.find(o => o.value === value) ?? options[0]
  const triggerClass = size === 'sm' ? TRIGGER_SM : TRIGGER_MD

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const idx = options.findIndex(o => o.value === value)
    setActiveIndex(idx >= 0 ? idx : 0)
  }, [open, options, value])

  function pick(next: string) {
    onChange(next)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % options.length)
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + options.length) % options.length)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const opt = options[activeIndex]
      if (opt) pick(opt.value)
    }
  }

  return (
    <div ref={rootRef} className={`relative inline-block ${size === 'md' ? 'w-full' : ''} ${className}`}>
      <button
        type="button"
        className={`${triggerClass} flex items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <span className="shrink-0 text-soft text-xs leading-none" aria-hidden>▾</span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          className={MENU}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isActive = i === activeIndex
            return (
              <li key={opt.value} role="option" aria-selected={isSelected} id={`${listId}-opt-${i}`}>
                <button
                  type="button"
                  className={
                    'w-full text-left px-3 py-2 font-mono font-black uppercase tracking-wider ' +
                    (size === 'sm' ? 'text-[11px]' : 'text-sm') +
                    ' transition-colors ' +
                    (isSelected
                      ? 'bg-[#a898c8] text-white'
                      : isActive
                        ? 'bg-[#a898c8]/35 text-foreground'
                        : 'text-foreground hover:bg-[#a898c8]/25')
                  }
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(opt.value)}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
