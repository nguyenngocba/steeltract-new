import { motion } from 'framer-motion'
import {
  Activity,
} from 'lucide-react'

import {
  StatusBadge,
} from '../../components/ui-system'
import { severityTone } from './command-center-utils'

import type {
  CommandMetric,
} from './command-center.types'

interface AnimatedMetricCardProps {
  metric: CommandMetric
}

export function AnimatedMetricCard({
  metric,
}: AnimatedMetricCardProps) {
  const severity =
    metric.severity ?? 'normal'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5"
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-0.5 bg-cyan-400"
        animate={{
          opacity:
            severity === 'normal'
              ? [0.3, 0.6, 0.3]
              : [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-400">
            {metric.label}
          </p>
          <motion.p
            key={String(metric.value)}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-2xl font-semibold text-white"
          >
            {metric.value}
            {metric.unit ? (
              <span className="ml-1 text-sm text-zinc-500">
                {metric.unit}
              </span>
            ) : null}
          </motion.p>
        </div>

        <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-300">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <StatusBadge tone={severityTone(severity)}>
          {severity}
        </StatusBadge>
        {metric.trend ? (
          <div className="text-sm text-zinc-300">
            {metric.trend}
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
