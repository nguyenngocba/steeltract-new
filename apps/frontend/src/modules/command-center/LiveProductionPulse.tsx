import { motion } from 'framer-motion'

import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'

interface LiveProductionPulseProps {
  total?: number
  delayed?: number
  utilization?: number
}

export function LiveProductionPulse({
  total = 0,
  delayed = 0,
  utilization = 0,
}: LiveProductionPulseProps) {
  return (
    <SectionCard
      title="Production pulse"
      actions={
        <StatusBadge
          tone={delayed > 0 ? 'warning' : 'success'}
        >
          {delayed > 0 ? 'delays' : 'stable'}
        </StatusBadge>
      }
    >
      <div className="flex items-center gap-5">
        <motion.div
          className="h-24 w-24 rounded-full border border-cyan-400/30 bg-cyan-400/10"
          animate={{
            scale: [1, 1.04, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
          }}
        />
        <div>
          <p className="text-3xl font-semibold text-white">
            {total}
          </p>
          <p className="text-sm text-zinc-400">
            active production orders
          </p>
          <p className="mt-3 text-sm text-zinc-300">
            {utilization}% machine utilization
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
