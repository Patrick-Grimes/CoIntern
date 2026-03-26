// ─────────────────────────────────────────────────────────────────────────────
// CoIntern — Core Types
// ─────────────────────────────────────────────────────────────────────────────

export type ApplicationStatus =
  | 'Bookmarked'
  | 'Applied'
  | 'OA'
  | 'Phone Screen'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn'

export type ApplicationType = 'Internship' | 'Co-op' | 'New Grad' | 'Fellowship'
export type ApplicationMode = 'Ongoing' | 'Submitted'

export interface Company {
  id: string          // UUID — the stable key, never the name
  name: string
}

export interface Application {
  id: string          // UUID
  company_id: string  // FK → Company.id
  company_name: string // denormalised for display convenience
  position: string
  status: ApplicationStatus
  type: ApplicationType
  mode: ApplicationMode
  applied_date: string | null
  deadline: string | null         // ← NEW: ISO date string e.g. "2025-11-01"
  link: string | null
  notes: string | null
  vault_link: string | null       // URL (Google Drive / Notion)
  vault_folder_name: string | null // ← NEW: local filename shown after picker
  created_at: string              // ISO timestamp for chronological sort
}

export interface ActionItem {
  id: string
  application_id: string
  label: string
  done: boolean
}

// Enriched application used in UI (includes its action items inline)
export type EnrichedApplication = Application & { action_items: ActionItem[] }

// Company node used throughout the dashboard
export interface CompanyWithApplications {
  id: string
  name: string
  applications: EnrichedApplication[]
}

// ── Status colours (Tailwind classes) ────────────────────────────────────────
export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Bookmarked:    'border-dt-lavender/60 bg-dt-lavender/20 text-dt-lavender',
  Applied:       'border-dt-baby-blue/60 bg-dt-baby-blue/20 text-blue-700',
  OA:            'border-dt-mint/60 bg-dt-mint/20 text-green-700',
  'Phone Screen':'border-dt-peach/60 bg-dt-peach/20 text-orange-700',
  Interview:     'border-yellow-400/60 bg-yellow-100 text-yellow-800',
  Offer:         'border-yellow-500/60 bg-yellow-200 text-yellow-900',
  Rejected:      'border-gray-400/60 bg-gray-100 text-gray-600',
  Withdrawn:     'border-gray-300/60 bg-gray-50 text-gray-500',
}

// ── Export/Import shape ───────────────────────────────────────────────────────
export interface CoInternExport {
  version: 2
  exported_at: string
  companies: Company[]
  applications: Application[]
  action_items: ActionItem[]
}
