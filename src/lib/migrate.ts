// ─────────────────────────────────────────────────────────────────────────────
// CoIntern — localStorage → IndexedDB migration
//
// Runs once on first load after upgrading to the IndexedDB version.
// After migration the localStorage keys are removed so this is a no-op
// on every subsequent load.
//
// Old schema:
//   localStorage['ci_apps']    = Application[]  (with company_name string key)
//   localStorage['ci_actions'] = ActionItem[]
//
// New schema: IndexedDB (see db.ts)
// ─────────────────────────────────────────────────────────────────────────────

import { v4 as uuid } from 'uuid'
import type { Company, Application, ActionItem } from '@/app/types'
import { importAllData, getSetting, setSetting } from '@/lib/db'

const MIGRATED_KEY = 'ci_migrated_v2'

// Old flat Application shape from localStorage (pre-types update)
interface OldApplication {
  id: string
  company_name: string
  position: string
  status: string
  type: string
  mode: string
  applied_date?: string | null
  link?: string | null
  notes?: string | null
  vault_link?: string | null
}

interface OldActionItem {
  id: string
  application_id: string
  label: string
  done: boolean
}

export async function runMigrationIfNeeded(): Promise<boolean> {
  // Check IndexedDB settings first
  const alreadyMigrated = await getSetting<boolean>(MIGRATED_KEY)
  if (alreadyMigrated) return false

  // Also check old localStorage flag (belt + suspenders)
  if (typeof window === 'undefined') return false
  if (localStorage.getItem(MIGRATED_KEY)) {
    await setSetting(MIGRATED_KEY, true)
    return false
  }

  const rawApps    = localStorage.getItem('ci_apps')
  const rawActions = localStorage.getItem('ci_actions')

  if (!rawApps) {
    // Nothing to migrate — just mark done
    await setSetting(MIGRATED_KEY, true)
    return false
  }

  let oldApps:    OldApplication[] = []
  let oldActions: OldActionItem[]  = []

  try {
    oldApps    = JSON.parse(rawApps)
    oldActions = rawActions ? JSON.parse(rawActions) : []
  } catch {
    console.warn('[migrate] Could not parse localStorage data — skipping migration')
    await setSetting(MIGRATED_KEY, true)
    return false
  }

  // Build company map (name → UUID)
  const companyMap = new Map<string, string>()
  for (const app of oldApps) {
    if (!companyMap.has(app.company_name)) {
      companyMap.set(app.company_name, uuid())
    }
  }

  const companies: Company[] = Array.from(companyMap.entries()).map(([name, id]) => ({ id, name }))

  const applications: Application[] = oldApps.map(old => ({
    id: old.id,
    company_id: companyMap.get(old.company_name) ?? uuid(),
    company_name: old.company_name,
    position: old.position ?? '',
    status: (old.status ?? 'Bookmarked') as Application['status'],
    type: (old.type ?? 'Internship') as Application['type'],
    mode: (old.mode ?? 'Ongoing') as Application['mode'],
    applied_date: old.applied_date ?? null,
    deadline: null,                  // new field, no historical data
    link: old.link ?? null,
    notes: old.notes ?? null,
    vault_link: old.vault_link ?? null,
    vault_folder_name: null,         // new field
    created_at: new Date().toISOString(),
  }))

  const actionItems: ActionItem[] = oldActions.map(old => ({
    id: old.id,
    application_id: old.application_id,
    label: old.label ?? '',
    done: old.done ?? false,
  }))

  await importAllData({ companies, applications, actionItems })
  await setSetting(MIGRATED_KEY, true)

  // Clean up localStorage
  localStorage.removeItem('ci_apps')
  localStorage.removeItem('ci_actions')
  localStorage.setItem(MIGRATED_KEY, 'true')

  console.log(`[migrate] ✓ Migrated ${applications.length} applications to IndexedDB`)
  return true
}
