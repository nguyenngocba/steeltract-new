import {
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Plus,
  RotateCcw,
} from 'lucide-react'
import {
  useMemo,
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
  useCreateInventoryTransactionMutation,
  useInventoryTransactionsQuery,
  useReturnRequestsQuery,
} from '../../modules/inventory'

import type {
  TransactionPayload,
} from '../../modules/inventory'

const transactionModes = [
  {
    label: 'Inbound receiving',
    type: 'IMPORT',
    icon: ArrowDownToLine,
    tone: 'success',
  },
  {
    label: 'Outbound issuing',
    type: 'EXPORT',
    icon: ArrowUpFromLine,
    tone: 'danger',
  },
  {
    label: 'Transfer',
    type: 'TRANSFER',
    icon: ArrowRightLeft,
    tone: 'info',
  },
  {
    label: 'Return',
    type: 'RETURN',
    icon: RotateCcw,
    tone: 'warning',
  },
] as const

export function TransactionsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [type, setType] =
    useState<TransactionPayload['type']>('IMPORT')
  const [transactionTypeId, setTransactionTypeId] =
    useState('')
  const [inventoryItemId, setInventoryItemId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitId, setUnitId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [performedBy, setPerformedBy] = useState('')
  const [remarks, setRemarks] = useState('')

  const transactionsQuery = useInventoryTransactionsQuery()
  const inventoryQuery = useInventoryQuery()
  const uomQuery = useActiveUomQuery()
  const transactionTypesQuery = useMasterDataRecordsQuery(
    'transaction-types',
    { active: true },
  )
  const warehousesQuery = useMasterDataRecordsQuery(
    'warehouses',
    { active: true },
  )
  const zonesQuery = useMasterDataRecordsQuery('yard-zones', {
    active: true,
  })
  const returnsQuery = useReturnRequestsQuery()
  const createMutation =
    useCreateInventoryTransactionMutation()

  const transactions = transactionsQuery.data ?? []
  const inventory = inventoryQuery.data ?? []
  const pressure = useMemo(() => {
    const inbound = transactions.filter(
      (transaction) => transaction.direction === 'inbound',
    ).length
    const outbound = transactions.filter(
      (transaction) => transaction.direction === 'outbound',
    ).length
    const internal = transactions.filter(
      (transaction) => transaction.direction === 'internal',
    ).length

    return {
      inbound,
      outbound,
      internal,
      returns: returnsQuery.data?.length ?? 0,
    }
  }, [returnsQuery.data?.length, transactions])

  async function createTransaction() {
    try {
      await createMutation.mutateAsync({
        type,
        transactionTypeId: transactionTypeId || undefined,
        warehouseId: warehouseId || undefined,
        zoneId: zoneId || undefined,
        performedBy: performedBy || undefined,
        remarks: remarks || undefined,
        items: [
          {
            inventoryItemId,
            quantity: Number(quantity),
            unitId: unitId || undefined,
            warehouseId: warehouseId || undefined,
            zoneId: zoneId || undefined,
          },
        ],
      })
      toast.success('Inventory transaction committed')
      setDrawerOpen(false)
      setInventoryItemId('')
      setQuantity('')
      setRemarks('')
    } catch {
      toast.error('Failed to commit transaction')
    }
  }

  return (
    <PageLayout
      title="Inventory Transaction Engine"
      description="Central stock movement ledger for receiving, issuing, transfers, returns, adjustments and future allocation workflows."
      actions={
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          Commit Transaction
        </button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-4">
          <section className="grid gap-3 md:grid-cols-4">
            {transactionModes.map((mode) => {
              const Icon = mode.icon
              const value =
                mode.type === 'IMPORT'
                  ? pressure.inbound
                  : mode.type === 'EXPORT'
                    ? pressure.outbound
                    : mode.type === 'TRANSFER'
                      ? pressure.internal
                      : pressure.returns

              return (
                <div
                  key={mode.type}
                  className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4"
                >
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-xs uppercase tracking-[0.16em]">
                      {mode.label}
                    </span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-white">
                    {value}
                  </p>
                </div>
              )
            })}
          </section>

          <DataTable
            data={transactions}
            loading={transactionsQuery.isLoading}
            rowKey={(transaction) => transaction.id}
            density="compact"
            empty="No inventory transactions yet"
            statusTone={(transaction) =>
              transaction.direction === 'outbound'
                ? 'danger'
                : transaction.direction === 'inbound'
                  ? 'success'
                  : 'info'
            }
            columns={[
              {
                key: 'transaction',
                header: 'Transaction',
                render: (transaction) => (
                  <div>
                    <p className="font-semibold text-white">
                      {transaction.transactionNo ?? transaction.code}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {transaction.transactionType?.name ??
                        transaction.type}
                    </p>
                  </div>
                ),
              },
              {
                key: 'direction',
                header: 'Direction',
                render: (transaction) => (
                  <StatusBadge
                    tone={
                      transaction.direction === 'outbound'
                        ? 'danger'
                        : transaction.direction === 'inbound'
                          ? 'success'
                          : 'info'
                    }
                  >
                    {transaction.direction ?? 'internal'}
                  </StatusBadge>
                ),
              },
              {
                key: 'item',
                header: 'Material',
                render: (transaction) =>
                  transaction.items?.[0]?.inventoryItem?.name ?? '-',
              },
              {
                key: 'qty',
                header: 'Qty',
                align: 'right',
                render: (transaction) => {
                  const item = transaction.items?.[0]

                  return `${item?.quantity ?? 0} ${
                    item?.unit?.symbol ?? ''
                  }`
                },
              },
              {
                key: 'warehouse',
                header: 'Warehouse',
                render: (transaction) =>
                  transaction.warehouse?.name ??
                  transaction.zone?.name ??
                  '-',
              },
              {
                key: 'performed',
                header: 'Performed by',
                render: (transaction) =>
                  transaction.performedBy ?? '-',
              },
            ]}
          />
        </main>

        <aside className="space-y-4">
          <section className="rounded-xl border border-cyan-500/10 bg-[#07111f] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">
              warehouse ledger
            </p>
            <h2 className="mt-2 text-base font-semibold text-white">
              Operational truth source
            </h2>
            <div className="mt-4 space-y-3 text-sm text-zinc-300">
              <p>Stock changes are committed as transaction lines.</p>
              <p>Master transaction types define direction and approval policy.</p>
              <p>Return workflow disposition creates RETURN or SCRAP movements.</p>
            </div>
          </section>
        </aside>
      </div>

      <DrawerShell
        open={drawerOpen}
        title="Commit inventory transaction"
        onClose={() => setDrawerOpen(false)}
      >
        <div className="space-y-4">
          <Field label="Operation">
            <select
              value={type}
              onChange={(event) =>
                setType(
                  event.target.value as TransactionPayload['type'],
                )
              }
              className={inputClass}
            >
              <option value="IMPORT">Inbound receiving</option>
              <option value="EXPORT">Outbound issuing</option>
              <option value="TRANSFER">Transfer</option>
              <option value="RETURN">Return</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </Field>
          <Field label="Transaction type">
            <select
              value={transactionTypeId}
              onChange={(event) =>
                setTransactionTypeId(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Use operation default</option>
              {(transactionTypesQuery.data ?? []).map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.code} - {item.name}
                </option>
              ))}
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
              {inventory.map((item) => (
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
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
                type="number"
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
          <Field label="Warehouse">
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
          <Field label="Zone">
            <select
              value={zoneId}
              onChange={(event) =>
                setZoneId(event.target.value)
              }
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {(zonesQuery.data ?? []).map((zone) => (
                <option
                  key={zone.id}
                  value={zone.id}
                >
                  {zone.code} - {zone.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Performed by">
            <input
              value={performedBy}
              onChange={(event) =>
                setPerformedBy(event.target.value)
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
            onClick={createTransaction}
            className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-400"
          >
            Commit to ledger
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
