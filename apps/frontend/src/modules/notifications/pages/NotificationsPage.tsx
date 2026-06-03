import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

import { AlertCard } from '../components/AlertCard'
import { ActivityTimeline } from '../components/ActivityTimeline'

type AnalyticsAlert = {
  id: string
  domain: string
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  createdAt: string
}

function alertTone(severity: AnalyticsAlert['severity']) {
  switch (severity) {
    case 'CRITICAL':
      return 'danger'
    case 'WARNING':
      return 'warning'
    default:
      return 'info'
  }
}

async function getAlerts() {
  const response =
    await api.get<{ data: AnalyticsAlert[] }>(
      '/analytics-engine/alerts',
      {
        params: {
          limit: 12,
        },
      },
    )

  return response.data.data
}

export function NotificationsPage() {
  const { data: analyticsAlerts = [] } =
    useQuery({
      queryKey: ['analytics-engine', 'alerts'],
      queryFn: getAlerts,
      refetchInterval: 5000,
    })
  const alerts =
    analyticsAlerts.map((alert) => ({
      id: alert.id,
      type: alertTone(alert.severity),
      title: alert.title,
      description: alert.message,
      module: alert.domain,
      time: new Date(alert.createdAt).toLocaleTimeString(),
    }))
  const criticalCount =
    analyticsAlerts.filter((alert) => alert.severity === 'CRITICAL').length
  const warningCount =
    analyticsAlerts.filter((alert) => alert.severity === 'WARNING').length

  return (
    <div className="flex h-full flex-col overflow-auto bg-zinc-950 p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-bold text-white">
            Alerts & Activity Center
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Smart Factory Monitoring Runtime
          </p>

        </div>

        <div className="flex gap-3">

          <button className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white">
            Alert Rules
          </button>

          <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white">
            Notification Settings
          </button>

        </div>

      </div>

      {/* KPI */}
      <div className="mb-6 grid grid-cols-4 gap-4">

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Active Alerts
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-400">
            {alerts.length}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Warning
          </p>

          <h2 className="mt-4 text-5xl font-bold text-orange-400">
            {warningCount}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Critical
          </p>

          <h2 className="mt-4 text-5xl font-bold text-red-500">
            {criticalCount}
          </h2>

        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5">

          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Realtime Events
          </p>

          <h2 className="mt-4 text-5xl font-bold text-cyan-400">
            {analyticsAlerts.length}
          </h2>

        </div>

      </div>

      {/* BODY */}
      <div className="grid grid-cols-2 gap-6">

        {/* ALERTS */}
        <div>

          <div className="mb-4">

            <h2 className="text-2xl font-bold text-white">
              Active Alerts
            </h2>

          </div>

          <div className="space-y-4">

            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
              />
            ))}

          </div>

        </div>

        {/* TIMELINE */}
        <ActivityTimeline />

      </div>

    </div>
  )
}
