import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  EnterpriseModulePage,
} from '../../../shared/runtime-tabs/EnterpriseModulePage'

import {
  EnterpriseTabBar,
} from '../../../shared/runtime-tabs/EnterpriseTabBar'

import {
  SectionHeader,
  RuntimePanel,
} from '../../../shared/ui/enterprise'

import { inventoryTabs } from '../config/inventory-tabs'
import { useMaterialDetail } from '../hooks/useMaterialDetail'
import { useQuery } from '@tanstack/react-query'
import { getTransactionDetail } from '../api/endpoints/inventory.endpoint'

const detailTabs = [
  'Overview',
  'Inbound History',
  'Outbound History',
  'Cost Analysis',
] as const

export function MaterialDetailPage() {
  const { id } = useParams()
  const {
    data,
    isLoading,
    error,
  } = useMaterialDetail(id)
  const [activeTab, setActiveTab] = useState<(typeof detailTabs)[number]>('Overview')
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string | null>(null)
  const {
    data: selectedTransaction,
  } = useQuery({
    queryKey: [
      'inventory-transaction-detail',
      selectedTransactionId,
    ],
    queryFn: () =>
      getTransactionDetail(
        selectedTransactionId as string,
      ),
    enabled: Boolean(selectedTransactionId),
  })

  const costSummary = useMemo(() => {
    const inbound = data?.inboundHistory ?? []
    const outbound = data?.outboundHistory ?? []

    const inboundQty = inbound.reduce(
      (acc: number, line: any) => acc + Number(line.quantity ?? 0),
      0,
    )
    const inboundCost = inbound.reduce(
      (acc: number, line: any) =>
        acc +
        Number(
          line.totalAmount ??
            (line.unitPrice != null
              ? Number(line.unitPrice) * Number(line.quantity ?? 0)
              : 0),
        ),
      0,
    )
    const outboundQty = outbound.reduce(
      (acc: number, line: any) => acc + Number(line.quantity ?? 0),
      0,
    )
    const outboundCost = outbound.reduce(
      (acc: number, line: any) =>
        acc +
        Number(
          line.totalAmount ??
            (line.unitPrice != null
              ? Number(line.unitPrice) * Number(line.quantity ?? 0)
              : 0),
        ),
      0,
    )

    return {
      inboundQty,
      inboundCost,
      outboundQty,
      outboundCost,
      averageCost: Number(data?.averageCost ?? 0),
      currentStock: Number(data?.currentStock ?? 0),
    }
  }, [data])

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Material Detail"
        description="Stock and transaction history driven by inventory transactions."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <div className="mb-4 flex items-center justify-between">
        <Link
          to="/inventory/materials"
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
        >
          Back to Materials
        </Link>

        <div className="flex gap-2">
          {detailTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? 'rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-black'
                  : 'rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300'
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <RuntimePanel title="Material Detail">
          <div className="text-zinc-400">Loading...</div>
        </RuntimePanel>
      )}

      {error && (
        <RuntimePanel title="Material Detail">
          <div className="text-red-400">Failed to load material detail</div>
        </RuntimePanel>
      )}

      {data && activeTab === 'Overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <RuntimePanel title="Current Stock">
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="text-2xl font-bold text-white">
                {Number(data.currentStock ?? 0).toLocaleString()} {data.item?.unit ?? 'PCS'}
              </div>
              <div>Code: <span className="text-cyan-300">{data.item?.code}</span></div>
              <div>Name: <span className="text-white">{data.item?.name}</span></div>
              <div>Category: <span className="text-zinc-100">{data.item?.category ?? '-'}</span></div>
              <div>Material Type: <span className="text-zinc-100">{data.item?.materialType ?? '-'}</span></div>
            </div>
          </RuntimePanel>

          <RuntimePanel title="Cost Snapshot">
            <div className="space-y-3 text-sm text-zinc-300">
              <div>
                Average Cost: <span className="text-emerald-300">{costSummary.averageCost.toLocaleString()}</span>
              </div>
              <div>
                Inbound Value: <span className="text-cyan-300">{costSummary.inboundCost.toLocaleString()}</span>
              </div>
              <div>
                Outbound Value: <span className="text-amber-300">{costSummary.outboundCost.toLocaleString()}</span>
              </div>
            </div>
          </RuntimePanel>

          <RuntimePanel title="History Summary">
            <div className="space-y-3 text-sm text-zinc-300">
              <div>Inbound transactions: <span className="text-white">{(data.inboundHistory ?? []).length}</span></div>
              <div>Outbound transactions: <span className="text-white">{(data.outboundHistory ?? []).length}</span></div>
              <div>Supplier refs: <span className="text-white">{(data.supplierHistory ?? []).length}</span></div>
              <div>Project refs: <span className="text-white">{(data.projectConsumptionHistory ?? []).length}</span></div>
            </div>
          </RuntimePanel>
        </div>
      )}

      {data && activeTab === 'Inbound History' && (
        <RuntimePanel title="Inbound History">
          <div className="space-y-2 text-sm">
            {(data.inboundHistory ?? []).map((line: any) => (
              <button
                type="button"
                key={line.transactionId + line.transactionDate}
                onClick={() =>
                  setSelectedTransactionId(
                    line.transactionId,
                  )
                }
                className="w-full rounded-lg border border-zinc-800 p-3 text-left hover:bg-zinc-900/50"
              >
                <div className="text-cyan-300">{line.transactionNo}</div>
                <div className="text-zinc-400">{new Date(line.transactionDate).toLocaleString()}</div>
                <div className="text-white">+{line.quantity} {line.unit}</div>
                <div className="text-zinc-300">Supplier: {line.supplierName ?? '-'}</div>
                <div className="text-zinc-300">Total: {Number(line.totalAmount ?? 0).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </RuntimePanel>
      )}

      {data && activeTab === 'Outbound History' && (
        <RuntimePanel title="Outbound History">
          <div className="space-y-2 text-sm">
            {(data.outboundHistory ?? []).map((line: any) => (
              <button
                type="button"
                key={line.transactionId + line.transactionDate}
                onClick={() =>
                  setSelectedTransactionId(
                    line.transactionId,
                  )
                }
                className="w-full rounded-lg border border-zinc-800 p-3 text-left hover:bg-zinc-900/50"
              >
                <div className="text-cyan-300">{line.transactionNo}</div>
                <div className="text-zinc-400">{new Date(line.transactionDate).toLocaleString()}</div>
                <div className="text-white">-{line.quantity} {line.unit}</div>
                <div className="text-zinc-300">Project: {line.projectName ?? '-'}</div>
                <div className="text-zinc-300">Total: {Number(line.totalAmount ?? 0).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </RuntimePanel>
      )}

      {data && activeTab === 'Cost Analysis' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RuntimePanel title="Quantity & Value">
            <div className="space-y-3 text-sm text-zinc-300">
              <div>Inbound Quantity: <span className="text-cyan-300">{costSummary.inboundQty.toLocaleString()}</span></div>
              <div>Outbound Quantity: <span className="text-amber-300">{costSummary.outboundQty.toLocaleString()}</span></div>
              <div>Current Stock: <span className="text-white">{costSummary.currentStock.toLocaleString()}</span></div>
              <div>Inbound Value: <span className="text-cyan-300">{costSummary.inboundCost.toLocaleString()}</span></div>
              <div>Outbound Value: <span className="text-amber-300">{costSummary.outboundCost.toLocaleString()}</span></div>
            </div>
          </RuntimePanel>

          <RuntimePanel title="Average Cost">
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="text-3xl font-bold text-emerald-300">{costSummary.averageCost.toLocaleString()}</div>
              <div className="text-zinc-400">Calculated from inbound weighted value.</div>
            </div>
          </RuntimePanel>
        </div>
      )}

      {selectedTransactionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Transaction Detail
              </h3>
              <button
                onClick={() =>
                  setSelectedTransactionId(
                    null,
                  )
                }
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300"
              >
                Close
              </button>
            </div>

            {!selectedTransaction && (
              <div className="text-zinc-400">
                Loading detail...
              </div>
            )}

            {selectedTransaction && (
              <div className="space-y-4 text-sm text-zinc-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    No: <span className="text-cyan-300">{selectedTransaction.transactionNo ?? selectedTransaction.code}</span>
                  </div>
                  <div>
                    Type: <span className="text-white">{selectedTransaction.type}</span>
                  </div>
                  <div>
                    Supplier: <span className="text-white">{selectedTransaction.supplierName ?? '-'}</span>
                  </div>
                  <div>
                    Project: <span className="text-white">{selectedTransaction.projectName ?? '-'}</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="w-full">
                    <thead className="bg-zinc-900">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500">Material</th>
                        <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500">Qty</th>
                        <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500">Unit Price</th>
                        <th className="px-3 py-2 text-left text-xs uppercase text-zinc-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTransaction.items ?? []).map((line: any) => (
                        <tr key={line.id} className="border-t border-zinc-800">
                          <td className="px-3 py-2 text-zinc-200">{line.inventoryItem?.code} - {line.inventoryItem?.name}</td>
                          <td className="px-3 py-2 text-zinc-200">{Number(line.quantity ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-zinc-200">{Number(line.unitPrice ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-2 text-zinc-200">{Number(line.totalAmount ?? 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </EnterpriseModulePage>
  )
}
