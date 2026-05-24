import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  FolderKanban,
  Layers3,
} from 'lucide-react'

import {
  StatCard,
} from '../ui-system'

import type {
  DashboardStats,
} from '../../services/api/dashboard.api'

interface KpiOverviewWidgetProps {
  stats: DashboardStats
}

export function KpiOverviewWidget({
  stats,
}: KpiOverviewWidgetProps) {
  const cards = [
    {
      label: 'Inventory',
      value: stats.inventoryCount,
      icon: <Boxes size={20} />,
    },
    {
      label: 'Projects',
      value: stats.projectCount,
      icon: <FolderKanban size={20} />,
    },
    {
      label: 'Components',
      value: stats.componentCount,
      icon: <Layers3 size={20} />,
    },
    {
      label: 'Transactions',
      value: stats.transactionCount,
      icon: <ArrowLeftRight size={20} />,
    },
    {
      label: 'Low Stock',
      value: stats.lowStockCount,
      icon: <AlertTriangle size={20} />,
    },
  ]

  return (
    <div className="enterprise-grid">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: index * 0.04,
            duration: 0.18,
          }}
        >
          <StatCard
            label={card.label}
            value={card.value}
            icon={card.icon}
          />
        </motion.div>
      ))}
    </div>
  )
}
