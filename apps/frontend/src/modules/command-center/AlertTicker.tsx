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
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
        No active operational alerts
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
      <motion.div
        className="flex gap-4"
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
