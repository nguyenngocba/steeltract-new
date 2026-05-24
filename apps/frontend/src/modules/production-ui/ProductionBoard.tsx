import {
  SectionCard,
  StatusBadge,
} from '../../components/ui-system'
import {
  asProductionList,
  stageTone,
} from './production-utils'

import type {
  ProductionOrder,
  ProductionStageCode,
} from './production.types'

interface ProductionBoardProps {
  orders:
    | ProductionOrder[]
    | {
        data: ProductionOrder[]
      }
    | undefined
}

const stages: ProductionStageCode[] = [
  'CUTTING',
  'ASSEMBLY',
  'WELDING',
  'DRILLING',
  'PAINTING',
  'GALVANIZING',
  'PACKING',
]

export function ProductionBoard({
  orders,
}: ProductionBoardProps) {
  const list = asProductionList(orders)

  return (
    <SectionCard
      title="Production Board"
      description="Kanban-ready stage view"
    >
      <div className="grid gap-3 overflow-x-auto lg:grid-cols-7">
        {stages.map((stage) => {
          const stageOrders = list.filter(
            (order) =>
              order.currentStageCode === stage,
          )

          return (
            <div
              key={stage}
              className="min-w-52 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-zinc-300">
                  {stage}
                </p>
                <StatusBadge tone="neutral">
                  {String(stageOrders.length)}
                </StatusBadge>
              </div>

              <div className="space-y-2">
                {stageOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
                  >
                    <p className="truncate text-sm font-medium text-white">
                      {order.orderNo}
                    </p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {order.title}
                    </p>
                    <div className="mt-3">
                      <StatusBadge
                        tone={stageTone(order.status)}
                      >
                        {order.status}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
