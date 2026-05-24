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
  emphasis?: boolean
}

export function AnimatedMetricCard({
  metric,
  emphasis = false,
}: AnimatedMetricCardProps) {
  const severity =
    metric.severity ?? 'normal'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={
        emphasis
          ? 'relative overflow-hidden rounded-xl border border-cyan-500/30 bg-[linear-gradient(135deg,rgba(8,145,178,0.2),rgba(9,9,11,0.95))] p-5 shadow-[0_0_40px_rgba(34,211,238,0.12)] sm:col-span-2 xl:col-span-3'
          : 'relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/85 p-5 shadow-[0_0_24px_rgba(0,0,0,0.18)] xl:col-span-1'
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.12),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.025),transparent)]" />
      <motion.div
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-transparent"
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

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            {metric.label}
          </p>
          <motion.p
            key={String(metric.value)}
            initial={{ opacity: 0.5, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={
              emphasis
                ? 'mt-3 text-4xl font-semibold text-white'
                : 'mt-2 text-2xl font-semibold text-white'
            }
          >
            {metric.value}
            {metric.unit ? (
              <span className="ml-1 text-sm text-zinc-500">
                {metric.unit}
              </span>
            ) : null}
          </motion.p>
        </div>

        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
          <Activity className="h-5 w-5" />
        </div>
      </div>

      {metric.description ? (
        <p className="relative mt-3 text-xs text-zinc-500">
          {metric.description}
        </p>
      ) : null}

      <div className="relative mt-4 flex items-center justify-between gap-3">
        <StatusBadge tone={severityTone(severity)}>
          {severity}
        </StatusBadge>
        {metric.trend ? (
          <div className="text-sm text-zinc-300">
            {metric.trend}
          </div>
        ) : null}
      </div>

      {emphasis ? (
        <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full overflow-hidden bg-zinc-900">
          <motion.div
            className="h-full w-1/3 rounded-r-full bg-cyan-300"
            animate={{ x: ['-120%', '340%'] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      ) : null}
    </motion.div>
  )
}
