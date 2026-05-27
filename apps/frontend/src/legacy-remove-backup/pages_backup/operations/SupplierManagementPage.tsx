import {
  useQuery,
} from '@tanstack/react-query'
import {
  Truck,
} from 'lucide-react'

import {
  DataTable,
  PageLayout,
  SectionCard,
  StatCard,
  StatusBadge,
} from '../../components/ui-system'
import { api } from '../../lib/api'
import {
  OperationalWorkspaceHero,
  StickyOpsToolbar,
} from './operations-utils'

interface SupplierScore {
  id: string
  supplierName: string
  quality: number
  delivery: number
  pricing: number
  overall: number
}

function useSupplierScoresQuery() {
  return useQuery({
    queryKey: ['supplier-score', 'operations'],
    queryFn: async () => {
      const response =
        await api.get<SupplierScore[]>('/supplier-score')

      return response.data
    },
  })
}

export function SupplierManagementPage() {
  const suppliersQuery = useSupplierScoresQuery()
  const suppliers = suppliersQuery.data ?? []
  const average =
    suppliers.length > 0
      ? Math.round(
          suppliers.reduce(
            (sum, supplier) => sum + supplier.overall,
            0,
          ) / suppliers.length,
        )
      : 0

  return (
    <PageLayout
      title="Supplier Management"
      description="Supplier quality, delivery, pricing scorecards, and procurement readiness."
    >
      <OperationalWorkspaceHero
        eyebrow="supply chain / supplier health"
        title="Supplier Operations Center"
        description="Supplier quality, delivery, pricing, scorecard risk and procurement readiness for industrial supply chain control."
        metrics={[
          {
            label: 'Suppliers',
            value: suppliers.length,
            tone: 'info',
          },
          {
            label: 'Average',
            value: average,
            tone: average >= 85 ? 'success' : 'warning',
          },
          {
            label: 'Approved',
            value: suppliers.filter((item) => item.overall >= 85).length,
            tone: 'success',
          },
          {
            label: 'Watch',
            value: suppliers.filter((item) => item.overall < 85).length,
            tone: suppliers.some((item) => item.overall < 85) ? 'warning' : 'success',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="success">
              performance indicators
            </StatusBadge>
            <StatusBadge tone="warning">
              risk strip
            </StatusBadge>
            <StatusBadge tone="info">
              procurement linkage
            </StatusBadge>
          </>
        }
      />
      <StickyOpsToolbar
        domain="suppliers"
        quickFilters={
          <>
            <StatusBadge tone="success">
              approved {suppliers.filter((item) => item.overall >= 85).length}
            </StatusBadge>
            <StatusBadge tone="warning">
              watch {suppliers.filter((item) => item.overall < 85).length}
            </StatusBadge>
          </>
        }
        counters={
          <StatusBadge tone="neutral">
            average {average}
          </StatusBadge>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Suppliers"
          value={suppliers.length}
          icon={<Truck className="h-5 w-5" />}
        />
        <StatCard
          label="Average score"
          value={average}
          icon={<Truck className="h-5 w-5" />}
        />
      </div>
      <SectionCard title="Supplier scorecards">
        <DataTable
          data={suppliers}
          loading={suppliersQuery.isLoading}
          rowKey={(row) => row.id}
          empty="No supplier scores"
          density="compact"
          selectable
          savedViewName="Supplier scorecard"
          statusTone={(row) =>
            row.overall >= 85 ? 'success' : 'warning'
          }
          rowActions={() => (
            <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
              Review
            </button>
          )}
          columns={[
            {
              key: 'supplier',
              header: 'Supplier',
              render: (row) => row.supplierName,
            },
            {
              key: 'quality',
              header: 'Quality',
              align: 'right',
              render: (row) => row.quality,
            },
            {
              key: 'delivery',
              header: 'Delivery',
              align: 'right',
              render: (row) => row.delivery,
            },
            {
              key: 'overall',
              header: 'Overall',
              render: (row) => (
                <StatusBadge
                  tone={row.overall >= 85 ? 'success' : 'warning'}
                >
                  {String(row.overall)}
                </StatusBadge>
              ),
            },
          ]}
        />
      </SectionCard>
    </PageLayout>
  )
}
