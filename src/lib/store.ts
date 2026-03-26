// ─────────────────────────────────────────────────────────────────────────────
// CoIntern — Zustand store  (npm install zustand idb)
//
// Single source of truth for all app state.
// Every mutation writes to IndexedDB then updates local state atomically.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  Company, Application, ActionItem,
  CompanyWithApplications,
  CoInternExport,
} from '@/app/types'
import {
  loadAllData, putCompany, putApplication, putActionItem,
  deleteApplication, deleteActionItem, importAllData,
  deleteCompany,
} from '@/lib/db'

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildTree(
  companies: Company[],
  applications: Application[],
  actionItems: ActionItem[],
): CompanyWithApplications[] {
  const itemsByApp = new Map<string, ActionItem[]>()
  for (const item of actionItems) {
    if (!itemsByApp.has(item.application_id)) itemsByApp.set(item.application_id, [])
    itemsByApp.get(item.application_id)!.push(item)
  }
  return companies.map(c => ({
    ...c,
    applications: applications
      .filter(a => a.company_id === c.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(a => ({ ...a, action_items: itemsByApp.get(a.id) ?? [] })),
  })).filter(c => c.applications.length > 0)
}

// ── State shape ───────────────────────────────────────────────────────────────

interface CoInternState {
  // Raw data
  companies: Company[]
  applications: Application[]
  actionItems: ActionItem[]

  // Derived (rebuilt after every mutation)
  tree: CompanyWithApplications[]

  // Loading
  isLoaded: boolean

  // ── Actions ──────────────────────────────────────────────────────────────
  hydrate: () => Promise<void>

  addApplication: (
    appData: Omit<Application, 'id' | 'company_id' | 'created_at'>,
    items: Omit<ActionItem, 'id' | 'application_id'>[]
  ) => Promise<void>

  updateApplication: (updated: Application) => Promise<void>

  deleteApplication: (appId: string) => Promise<void>

  toggleTask: (itemId: string) => Promise<void>

  addTask: (applicationId: string, label: string) => Promise<void>

  deleteTask: (itemId: string) => Promise<void>

  exportData: () => CoInternExport

  importData: (data: CoInternExport) => Promise<void>
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<CoInternState>((set, get) => ({
  companies:    [],
  applications: [],
  actionItems:  [],
  tree:         [],
  isLoaded:     false,

  // ── hydrate: load from IndexedDB on mount ─────────────────────────────────
  hydrate: async () => {
    const { companies, applications, actionItems } = await loadAllData()
    set({
      companies,
      applications,
      actionItems,
      tree: buildTree(companies, applications, actionItems),
      isLoaded: true,
    })
  },

  // ── addApplication ────────────────────────────────────────────────────────
  addApplication: async (appData, rawItems) => {
    const { companies, applications, actionItems } = get()

    // Find or create company
    let company = companies.find(c => c.name === appData.company_name)
    if (!company) {
      company = { id: uuid(), name: appData.company_name }
      await putCompany(company)
    }

    const app: Application = {
      ...appData,
      id: uuid(),
      company_id: company.id,
      created_at: new Date().toISOString(),
    }
    await putApplication(app)

    const items: ActionItem[] = rawItems.map(i => ({
      id: uuid(),
      application_id: app.id,
      label: i.label,
      done: i.done ?? false,
    }))
    await Promise.all(items.map(i => putActionItem(i)))

    const newCompanies = company && companies.find(c => c.id === company!.id)
      ? companies
      : [...companies, company]
    const newApps  = [...applications, app]
    const newItems = [...actionItems, ...items]

    set({
      companies: newCompanies,
      applications: newApps,
      actionItems: newItems,
      tree: buildTree(newCompanies, newApps, newItems),
    })
  },

  // ── updateApplication ─────────────────────────────────────────────────────
  updateApplication: async (updated) => {
    const { companies, applications, actionItems } = get()

    // Find company by existing ID first (reliable), fall back to name (handles renames)
    let company = companies.find(c => c.id === updated.company_id)
               ?? companies.find(c => c.name === updated.company_name)
    if (!company) {
      company = { id: uuid(), name: updated.company_name }
      await putCompany(company)
    } else if (company.name !== updated.company_name) {
      // User renamed the company — update the record in place
      company = { ...company, name: updated.company_name }
      await putCompany(company)
    }

    const finalApp: Application = { ...updated, company_id: company.id }
    await putApplication(finalApp)

    const newCompanies = companies.find(c => c.id === company!.id)
      ? companies
      : [...companies, company]
    const newApps = applications.map(a => a.id === updated.id ? finalApp : a)

    // Prune companies with no apps left
    const usedIds = new Set(newApps.map(a => a.company_id))
    const prunedCompanies = newCompanies.filter(c => usedIds.has(c.id))
    // Delete orphaned companies from DB
    for (const c of newCompanies) {
      if (!usedIds.has(c.id)) await deleteCompany(c.id)
    }

    set({
      companies: prunedCompanies,
      applications: newApps,
      tree: buildTree(prunedCompanies, newApps, actionItems),
    })
  },

  // ── deleteApplication ─────────────────────────────────────────────────────
  deleteApplication: async (appId) => {
    await deleteApplication(appId)   // DB cascades action items

    const { companies, applications, actionItems } = get()
    const newApps  = applications.filter(a => a.id !== appId)
    const newItems = actionItems.filter(i => i.application_id !== appId)

    const usedIds = new Set(newApps.map(a => a.company_id))
    const prunedCompanies = companies.filter(c => usedIds.has(c.id))
    for (const c of companies) {
      if (!usedIds.has(c.id)) await deleteCompany(c.id)
    }

    set({
      companies: prunedCompanies,
      applications: newApps,
      actionItems: newItems,
      tree: buildTree(prunedCompanies, newApps, newItems),
    })
  },

  // ── toggleTask ────────────────────────────────────────────────────────────
  toggleTask: async (itemId) => {
    const { actionItems, companies, applications } = get()
    const item = actionItems.find(i => i.id === itemId)
    if (!item) return
    const updated = { ...item, done: !item.done }
    await putActionItem(updated)
    const newItems = actionItems.map(i => i.id === itemId ? updated : i)
    set({ actionItems: newItems, tree: buildTree(companies, applications, newItems) })
  },

  // ── addTask ───────────────────────────────────────────────────────────────
  addTask: async (applicationId, label) => {
    const { actionItems, companies, applications } = get()
    const item: ActionItem = { id: uuid(), application_id: applicationId, label, done: false }
    await putActionItem(item)
    const newItems = [...actionItems, item]
    set({ actionItems: newItems, tree: buildTree(companies, applications, newItems) })
  },

  // ── deleteTask ────────────────────────────────────────────────────────────
  deleteTask: async (itemId) => {
    await deleteActionItem(itemId)
    const { actionItems, companies, applications } = get()
    const newItems = actionItems.filter(i => i.id !== itemId)
    set({ actionItems: newItems, tree: buildTree(companies, applications, newItems) })
  },

  // ── exportData ────────────────────────────────────────────────────────────
  exportData: () => {
    const { companies, applications, actionItems } = get()
    return {
      version: 2 as const,
      exported_at: new Date().toISOString(),
      companies,
      applications,
      action_items: actionItems,
    }
  },

  // ── importData ────────────────────────────────────────────────────────────
  importData: async (data) => {
    await importAllData({
      companies: data.companies,
      applications: data.applications,
      actionItems: data.action_items,
    })
    const { companies, applications, actionItems } = await loadAllData()
    set({
      companies,
      applications,
      actionItems,
      tree: buildTree(companies, applications, actionItems),
    })
  },
}))

// Convenience selector hooks
export const useTree          = () => useStore(s => s.tree)
export const useIsLoaded      = () => useStore(s => s.isLoaded)
export const useApplications  = () => useStore(s => s.applications)
