import {
  useQuery,
} from '@tanstack/react-query'
import {
  ClipboardList,
  ShoppingCart,
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

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierName: string
  projectName?: string | null
  status: string
  totalAmount: number
}

interface MaterialRequest {
  id: string
  requestNumber: string
  projectName: string
  requestedBy: string
  status: string
}

function useProcurementQueries() {
  const purchaseOrders = useQuery({
    queryKey: ['purchase-orders', 'operations'],
    queryFn: async () => {
      const response =
        await api.get<PurchaseOrder[]>('/purchase-orders')

      return response.data
    },
  })
  const materialRequests = useQuery({
    queryKey: ['material-requests', 'operations'],
    queryFn: async () => {
      const response =
        await api.get<MaterialRequest[]>('/material-requests')

      return response.data
    },
  })

  return { purchaseOrders, materialRequests }
}

export function ProcurementOperationsPage() {
  const { purchaseOrders, materialRequests } =
    useProcurementQueries()
  const orders = purchaseOrders.data ?? []
  const requests = materialRequests.data ?? []
  const pendingOrders = orders.filter((order) =>
    ['PENDING', 'DRAFT', 'APPROVAL'].includes(order.status),
  )
  const openRequests = requests.filter(
    (request) => request.status !== 'CLOSED',
  )

  return (
    <PageLayout
      title="Procurement Operations"
      description="Purchase order execution, material request pressure, and supply readiness."
    >
      <OperationalWorkspaceHero
        eyebrow="supply chain / procurement control"
        title="Procurement Operations Center"
        description="Purchase order execution, approval pressure, material request readiness and incoming supply telemetry."
        metrics={[
          {
            label: 'POs',
            value: orders.length,
            tone: 'info',
          },
          {
            label: 'Pending',
            value: pendingOrders.length,
            tone: pendingOrders.length > 0 ? 'warning' : 'success',
          },
          {
            label: 'Requests',
            value: requests.length,
            tone: 'info',
          },
          {
            label: 'Open requests',
            value: openRequests.length,
            tone: openRequests.length > 0 ? 'warning' : 'success',
          },
        ]}
        actions={
          <>
            <StatusBadge tone="info">
              incoming materials
            </StatusBadge>
            <StatusBadge tone="warning">
              approval visibility
            </StatusBadge>
            <StatusBadge tone="success">
              lead-time watch
            </StatusBadge>
          </>
        }
      />
      <StickyOpsToolbar
        domain="procurement"
        quickFilters={
          <>
            <StatusBadge tone="warning">
              pending PO {pendingOrders.length}
            </StatusBadge>
            <StatusBadge tone="info">
              requests {openRequests.length}
            </StatusBadge>
          </>
        }
        counters={
          <StatusBadge tone="neutral">
            supply lane {orders.length + requests.length}
          </StatusBadge>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Purchase orders"
          value={orders.length}
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <StatCard
          label="Material requests"
          value={requests.length}
          icon={<ClipboardList className="h-5 w-5" />}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Purchase orders">
          <DataTable
            data={orders}
            loading={purchaseOrders.isLoading}
            rowKey={(row) => row.id}
            density="compact"
            selectable
            savedViewName="Purchase order control"
            statusTone={(row) =>
              ['CANCELLED', 'REJECTED'].includes(row.status)
                ? 'danger'
                : ['PENDING', 'DRAFT', 'APPROVAL'].includes(
                      row.status,
                    )
                  ? 'warning'
                  : 'success'
            }
            rowActions={() => (
              <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                Open
              </button>
            )}
            columns={[
              {
                key: 'po',
                header: 'PO',
                render: (row) => (
                  <div>
                    <p className="font-medium">{row.poNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {row.supplierName}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <StatusBadge tone="info">{row.status}</StatusBadge>
                ),
              },
              {
                key: 'total',
                header: 'Total',
                align: 'right',
                render: (row) => row.totalAmount,
              },
            ]}
          />
        </SectionCard>
        <SectionCard title="Material requests">
          <DataTable
            data={requests}
            loading={materialRequests.isLoading}
            rowKey={(row) => row.id}
            density="compact"
            selectable
            savedViewName="Material request control"
            statusTone={(row) =>
              row.status === 'CLOSED' ? 'success' : 'warning'
            }
            rowActions={() => (
              <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300">
                Allocate
              </button>
            )}
            columns={[
              {
                key: 'request',
                header: 'Request',
                render: (row) => row.requestNumber,
              },
              {
                key: 'project',
                header: 'Project',
                render: (row) => row.projectName,
              },
              {
                key: 'status',
                header: 'Status',
                render: (row) => (
                  <StatusBadge tone="warning">{row.status}</StatusBadge>
                ),
              },
            ]}
          />
        </SectionCard>
      </div>
    </PageLayout>
  )
}
