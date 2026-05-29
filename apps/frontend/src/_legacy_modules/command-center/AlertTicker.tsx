import { motion } from 'framer-motion'

import {
  StatusBadge,
} from '../../components/ui-system'
import { severityTone } from './command-center-utils'

import type {
  AnalyticsAlert,
} from '../analytics-ui'

interface AlertTickerProps {
  alerts: AnalyticsAlert[]
}

export function AlertTicker({
  alerts,
}: AlertTickerProps) {
  const visibleAlerts = alerts.slice(0, 5)

  if (visibleAlerts.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-[linear-gradient(90deg,rgba(16,185,129,0.12),rgba(9,9,11,0.92))] px-4 py-3 text-sm text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
        <div className="absolute inset-y-0 left-0 w-24 animate-[factory-shimmer_7s_linear_infinite] bg-gradient-to-r from-transparent via-emerald-300/10 to-transparent" />
        <span className="relative">
          No active operational alerts
        </span>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-[linear-gradient(90deg,rgba(245,158,11,0.16),rgba(9,9,11,0.94))] px-4 py-3 shadow-[0_0_34px_rgba(245,158,11,0.12)]">
      <div className="absolute inset-y-0 left-0 w-28 animate-[factory-shimmer_5.8s_linear_infinite] bg-gradient-to-r from-transparent via-amber-300/14 to-transparent" />
      <motion.div
        className="relative flex gap-4"
        animate={{ x: ['0%', '-10%', '0%'] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex shrink-0 items-center gap-2 text-sm text-amber-100"
          >
            <StatusBadge
              tone={severityTone(alert.severity)}
            >
              {alert.severity}
            </StatusBadge>
            <span>{alert.title}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
