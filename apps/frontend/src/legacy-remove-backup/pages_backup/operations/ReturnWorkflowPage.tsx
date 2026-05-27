import {
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  Plus,
  RotateCcw,
} from 'lucide-react'
import {
  useState,
} from 'react'
import type {
  ReactNode,
} from 'react'
import toast from 'react-hot-toast'

import {
  DataTable,
  DrawerShell,
  PageLayout,
  StatusBadge,
} from '../../components/ui-system'
import {
  useInventoryQuery,
} from '../../hooks/query/useInventoryQueries'
import {
  useActiveUomQuery,
} from '../../modules/master-data/uom'
import {
  useMasterDataRecordsQuery,
} from '../../modules/master-data'
import {
  useAdvanceReturnRequestMutation,
  useCreateReturnRequestMutation,
  useReturnRequestsQuery,
} from '../../modules/inventory'
import type {
  ReturnFlowType,
} from '../../modules/inventory'

export function ReturnWorkflowPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [flowType, setFlowType] =
    useState<ReturnFlowType>('SITE_RETURN')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [requestedQuantity, setRequestedQuantity] =
    useState('')
  const [unitId, setUnitId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [requestedBy, setRequestedBy] = useState('')
  const [remarks, setRemarks] = useState('')

  const returnsQuery = useReturnRequestsQuery()
  const inventoryQuery = useInventoryQuery()
  const uomQuery = useActiveUomQuery()
  const warehousesQuery = useMasterDataRecordsQuery(
    'warehouses',
    { active: true },
  )
  const createMutation = useCreateReturnRequestMutation()
  const advanceMutation = useAdvanceReturnRequestMutation()
  const requests = returnsQuery.data ?? []

  async function createReturn() {
    try {
      await createMutation.mutateAsync({
        flowType,
        warehouseId: warehouseId || undefined,
        requestedBy: requestedBy || undefined,
        remarks: remarks || undefined,
        items: [
          {
            inventoryItemId,
            requestedQuantity: Number(requestedQuantity),
            unitId: unitId || undefined,
          },
        ],
      })
      toast.success('Return request created')
      setDrawerOpen(false)
      setInventoryItemId('')
      setRequestedQuantity('')
      setRemarks('')
    } catch {
      toast.error('Failed to create return request')
    }
  }

  async function quickAdvance(id: string, status: string) {
    const request = requests.find((item) => item.id === id)
    const firstItem = request?.items[0]

    if (!request || !firstItem) return

    try {
      if (status === 'REQUESTED') {
        await advanceMutation.mutateAsync({
          id,
          action: 'approve',
          payload: { approvedBy: 'warehouse-control' },
        })
      } else if (status === 'APPROVED') {
        await advanceMutation.mutateAsync({
          id,
          action: 'receive',
          payload: {
            receivedBy: 'warehouse-control',
            items: [
              {
                id: firstItem.id,
                receivedQuantity:
                  firstItem.requestedQuantity,
              },
            ],
          },
        })
      } else if (status === 'RECEIVED') {
        await advanceMutation.mutateAsync({
          id,
          action: 'inspect',
          payload: {
            inspectedBy: 'qc-control',
            items: [
              {
                id: firstItem.id,
                inspectedQuantity:
                  firstItem.receivedQuantity ??
                  firstItem.requestedQuantity,
                disposition: 'USABLE_STOCK',
              },
            ],
          },
        })
      } else if (status === 'INSPECTED') {
        await advanceMutation.mutateAsync({
          id,
          action: 'dispose',
          payload: { performedBy: 'warehouse-control' },
        })
      }

      toast.success('Return workflow advanced')
    } catch {
      toast.error('Failed to advance return workflow')
    }
  }

  return (
    <PageLayout
      title="Return Material Workflow"
      description="Request, approve, receive, inspect and dispose returned materials into usable stock, QC hold, damaged, scrap or repair paths."
      actions={
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          Request Return
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          <section className="grid gap-3 md:grid-cols-4">
            <Stage label="Requested" value={requests.filter((r) => r.status === 'REQUESTED').length} icon={<RotateCcw className="h-4 w-4" />} />
            <Stage label="Received" value={requests.filter((r) => r.status === 'RECEIVED').length} icon={<PackageCheck className="h-4 w-4" />} />
            <Stage label="Inspected" value={requests.filter((r) => r.status === 'INSPECTED').length} icon={<ClipboardCheck className="h-4 w-4" />} />
            <Stage label="Disposed" value={requests.filter((r) => r.status === 'DISPOSED').length} icon={<CheckCircle2 className="h-4 w-4" />} />
          </section>

          <DataTable
            data={requests}
            loading={returnsQuery.isLoading}
            rowKey={(request) => request.id}
            density="compact"
            empty="No return requests"
            statusTone={(request) =>
              request.status === 'DISPOSED'
                ? 'success'
                : request.status === 'REQUESTED'
                  ? 'warning'
                  : 'info'
            }
            rowActions={(request) =>
              request.status !== 'DISPOSED' ? (
                <button
                  type="button"
                  onClick={() =>
                    quickAdvance(request.id, request.status)
                  }
                  className="rounded-md border border-cyan-500/10 px-2 py-1 text-xs text-cyan-200 hover:border-cyan-400/50"
                >
                  Advance
                </button>
              ) : null
            }
            columns={[
              {
                key: 'return',
                header: 'Return',
                render: (request) => (
                  <div>
                    <p className="font-semibold text-white">
                      {request.returnNo}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {request.flowType}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (request) => (
                  <StatusBadge
                    tone={
                      request.status === 'DISPOSED'
                        ? 'success'
                        : request.status === 'REQUESTED'
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {request.status}
                  </StatusBadge>
                ),
              },
              {
                key: 'item',
                header: 'Material',
                render: (request) =>
                  request.items[0]?.inventoryItem.name ?? '-',
              },
              {
                key: 'qty',
                header: 'Qty',
                align: 'right',
                render: (request) =>
                  request.items[0]?.requestedQuantity ?? 0,
              },
              {
                key: 'warehouse',
                header: 'Warehouse',
                render: (request) =>
                  request.warehouse?.name ?? '-',
              },
            ]}
          />
        </main>

        <aside className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
            return disposition
          </p>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <p>Usable stock creates inbound RETURN transaction.</p>
            <p>Scrap creates stock adjustment through SCRAP transaction type.</p>
            <p>QC hold, damaged and repair remain visible workflow states for follow-up handling.</p>
          </div>
        </aside>
      </div>

      <DrawerShell
        open={drawerOpen}
        title="Request material return"
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-4">
          <Field label="Return flow">
            <select
              value={flowType}
              onChange={(event) =>
                setFlowType(event.target.value as ReturnFlowType)
              }
              className={inputClass}
            >
              <option value="SITE_RETURN">Site Return</option>
              <option value="PRODUCTION_RETURN">Production Return</option>
              <option value="SUPPLIER_RETURN">Supplier Return</option>
            </select>
          </Field>
          <Field label="Material">
            <select
              value={inventoryItemId}
              onChange={(event) =>
                setInventoryItemId(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Select material</option>
              {(inventoryQuery.data ?? []).map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity">
              <input
                type="number"
                value={requestedQuantity}
                onChange={(event) =>
                  setRequestedQuantity(event.target.value)
                }
                className={inputClass}
              />
            </Field>
            <Field label="UOM">
              <select
                value={unitId}
                onChange={(event) =>
                  setUnitId(event.target.value)
                }
                className={inputClass}
              >
                <option value="">Item default</option>
                {(uomQuery.data ?? []).map((unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                  >
                    {unit.code}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Receive warehouse">
            <select
              value={warehouseId}
              onChange={(event) =>
                setWarehouseId(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {(warehousesQuery.data ?? []).map((warehouse) => (
                <option
                  key={warehouse.id}
                  value={warehouse.id}
                >
                  {warehouse.code} - {warehouse.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Requested by">
            <input
              value={requestedBy}
              onChange={(event) =>
                setRequestedBy(event.target.value)
              }
              className={inputClass}
            />
          </Field>
          <Field label="Remarks">
            <textarea
              value={remarks}
              onChange={(event) =>
                setRemarks(event.target.value)
              }
              rows={3}
              className={inputClass}
            />
          </Field>
          <button
            type="button"
            onClick={createReturn}
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
          >
            Open return workflow
          </button>
        </div>
      </DrawerShell>
    </PageLayout>
  )
}

const inputClass =
  'w-full rounded-lg border border-cyan-500/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400'

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="space-y-2 text-xs text-zinc-400">
      {label}
      {children}
    </label>
  )
}

function Stage({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
      <div className="flex items-center justify-between text-zinc-400">
        <span className="text-xs uppercase tracking-[0.16em]">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-semibold text-white">
        {value}
      </p>
    </div>
  )
}
