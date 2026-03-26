// ─────────────────────────────────────────────────────────────────────────────
// CoIntern — IndexedDB layer  (npm install idb)
//
// Schema v2:
//   companies    { id, name }
//   applications { id, company_id, company_name, position, status, type,
//                  mode, applied_date, deadline, link, notes,
//                  vault_link, vault_folder_name, created_at }
//   action_items { id, application_id, label, done }
//   settings     { key, value }   ← for misc persisted prefs / FS handles
// ─────────────────────────────────────────────────────────────────────────────

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { Company, Application, ActionItem } from '@/app/types'

interface CoInternDB extends DBSchema {
  companies: {
    key: string
    value: Company
  }
  applications: {
    key: string
    value: Application
    indexes: { 'by-company': string }
  }
  action_items: {
    key: string
    value: ActionItem
    indexes: { 'by-application': string }
  }
  settings: {
    key: string
    value: { key: string; value: unknown }
  }
}

let _db: IDBPDatabase<CoInternDB> | null = null

async function getDB(): Promise<IDBPDatabase<CoInternDB>> {
  if (_db) return _db
  _db = await openDB<CoInternDB>('cointern', 2, {
    upgrade(db, oldVersion) {
      // Fresh install
      if (oldVersion < 1) {
        db.createObjectStore('companies', { keyPath: 'id' })

        const apps = db.createObjectStore('applications', { keyPath: 'id' })
        apps.createIndex('by-company', 'company_id')

        const items = db.createObjectStore('action_items', { keyPath: 'id' })
        items.createIndex('by-application', 'application_id')

        db.createObjectStore('settings', { keyPath: 'key' })
      }
      // v1 → v2: add deadline + vault_folder_name columns (no-op in IDB, just schema marker)
    },
  })
  return _db
}

// ── Companies ─────────────────────────────────────────────────────────────────

export async function getAllCompanies(): Promise<Company[]> {
  return (await getDB()).getAll('companies')
}

export async function putCompany(company: Company): Promise<void> {
  await (await getDB()).put('companies', company)
}

export async function deleteCompany(id: string): Promise<void> {
  await (await getDB()).delete('companies', id)
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function getAllApplications(): Promise<Application[]> {
  return (await getDB()).getAll('applications')
}

export async function putApplication(app: Application): Promise<void> {
  await (await getDB()).put('applications', app)
}

export async function deleteApplication(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('applications', id)
  // Cascade: remove action items
  const items = await db.getAllFromIndex('action_items', 'by-application', id)
  const tx = db.transaction('action_items', 'readwrite')
  await Promise.all([...items.map(i => tx.store.delete(i.id)), tx.done])
}

// ── Action Items ──────────────────────────────────────────────────────────────

export async function getAllActionItems(): Promise<ActionItem[]> {
  return (await getDB()).getAll('action_items')
}

export async function getActionItemsForApp(applicationId: string): Promise<ActionItem[]> {
  return (await getDB()).getAllFromIndex('action_items', 'by-application', applicationId)
}

export async function putActionItem(item: ActionItem): Promise<void> {
  await (await getDB()).put('action_items', item)
}

export async function deleteActionItem(id: string): Promise<void> {
  await (await getDB()).delete('action_items', id)
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSetting<T>(key: string): Promise<T | null> {
  const db = await getDB()
  const row = await db.get('settings', key)
  return row ? (row.value as T) : null
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await (await getDB()).put('settings', { key, value })
}

// ── Bulk load (for initial state hydration) ───────────────────────────────────

export async function loadAllData(): Promise<{
  companies: Company[]
  applications: Application[]
  actionItems: ActionItem[]
}> {
  const db = await getDB()
  const [companies, applications, actionItems] = await Promise.all([
    db.getAll('companies'),
    db.getAll('applications'),
    db.getAll('action_items'),
  ])
  return { companies, applications, actionItems }
}

// ── Bulk write (for import) ───────────────────────────────────────────────────

export async function importAllData(data: {
  companies: Company[]
  applications: Application[]
  actionItems: ActionItem[]
}): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['companies', 'applications', 'action_items'], 'readwrite')
  await Promise.all([
    ...data.companies.map(c => tx.objectStore('companies').put(c)),
    ...data.applications.map(a => tx.objectStore('applications').put(a)),
    ...data.actionItems.map(i => tx.objectStore('action_items').put(i)),
    tx.done,
  ])
}
