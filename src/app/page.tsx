import { DashboardShell } from '@/components/dashboard/dashboard-shell'

/** Entry opens straight on the dashboard for a snappy local-app feel. */
export default function Home() {
  return (
    <div className="grain-overlay">
      <DashboardShell />
    </div>
  )
}
