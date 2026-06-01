import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { KpiCard, RuntimePanel, SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'
import { useZones } from '../../hooks/useZones'

export function InventoryTransferPage() {
  const { data: materials = [] } =
    useInventoryItems()
  const { data: zones = [] } = useZones()
  const {
    data: transfers = [],
    isLoading,
  } = useInventoryTransactions({
    type: 'TRANSFER',
  })

  const createMutation =
    useCreateTransaction()

  const [transferNo, setTransferNo] =
    useState(
      `TR-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
    )
  const [transferDate, setTransferDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10),
    )
  const [fromZoneId, setFromZoneId] =
    useState('')
  const [toZoneId, setToZoneId] =
    useState('')
  const [materialId, setMaterialId] =
    useState('')
  const [quantity, setQuantity] =
    useState('')
  const [reason, setReason] =
    useState('')
  const [statusFilter, setStatusFilter] =
    useState('')

  const filteredTransfers = useMemo(() => {
    const from = transferDate
      ? new Date(transferDate)
      : null

    return transfers.filter((item: any) => {
      if (from) {
        const itemDate = new Date(
          item.transactionDate ??
            item.createdAt,
        )
        const sameDay =
          itemDate
            .toISOString()
            .slice(0, 10) ===
          transferDate
        if (!sameDay) {
          return false
        }
      }

      if (materialId) {
        const hasMaterial =
          item.items?.some(
            (line: any) =>
              line.inventoryItemId ===
              materialId,
          )
        if (!hasMaterial) {
          return false
        }
      }

      if (
        fromZoneId &&
        !item.items?.some(
          (line: any) =>
            line.zoneId ===
              fromZoneId &&
            Number(
              line.quantity,
            ) < 0,
        )
      ) {
        return false
      }

      if (
        toZoneId &&
        !item.items?.some(
          (line: any) =>
            line.zoneId === toZoneId &&
            Number(
              line.quantity,
            ) > 0,
        )
      ) {
        return false
      }

      if (
        statusFilter &&
        String(
          item.status ??
            'COMPLETED',
        ).toUpperCase() !==
          statusFilter
      ) {
        return false
      }

      return true
    })
  }, [
    transfers,
    transferDate,
    materialId,
    fromZoneId,
    toZoneId,
    statusFilter,
  ])

  const kpis = useMemo(() => {
    const now = new Date()
    const dayKey = now
      .toISOString()
      .slice(0, 10)
    const weekAgo = new Date(
      now.getTime() -
        7 * 24 * 60 * 60 * 1000,
    )
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    )

    const totalDocs =
      filteredTransfers.length
    const today = filteredTransfers.filter(
      (item: any) =>
        new Date(
          item.transactionDate ??
            item.createdAt,
        )
          .toISOString()
          .slice(0, 10) === dayKey,
    ).length
    const thisWeek =
      filteredTransfers.filter(
        (item: any) =>
          new Date(
            item.transactionDate ??
              item.createdAt,
          ) >= weekAgo,
      ).length
    const thisMonth =
      filteredTransfers.filter(
        (item: any) =>
          new Date(
            item.transactionDate ??
              item.createdAt,
          ) >= monthStart,
      ).length

    return {
      totalDocs,
      today,
      thisWeek,
      thisMonth,
    }
  }, [filteredTransfers])

  const transferFlow = useMemo(() => {
    const flowMap = new Map<
      string,
      { from: string; to: string; count: number }
    >()
    filteredTransfers.forEach((item: any) => {
      const from =
        item.items?.find(
          (line: any) =>
            Number(
              line.quantity,
            ) < 0,
        )?.zone?.code ?? 'NA'
      const to =
        item.items?.find(
          (line: any) =>
            Number(
              line.quantity,
            ) > 0,
        )?.zone?.code ?? 'NA'
      const key = `${from}->${to}`
      const current =
        flowMap.get(key)
      flowMap.set(key, {
        from,
        to,
        count:
          (current?.count ?? 0) +
          1,
      })
    })

    return Array.from(
      flowMap.values(),
    )
      .sort(
        (a, b) =>
          b.count - a.count,
      )
      .slice(0, 6)
  }, [filteredTransfers])

  async function submitTransfer() {
    const qty = Number(quantity)
    if (
      !materialId ||
      !fromZoneId ||
      !toZoneId ||
      !Number.isFinite(qty) ||
      qty <= 0 ||
      fromZoneId === toZoneId
    ) {
      return
    }

    await createMutation.mutateAsync({
      type: 'TRANSFER',
      code: transferNo,
      transactionNo: transferNo,
      transactionDate: transferDate,
      remarks: reason,
      items: [
        {
          inventoryItemId: materialId,
          quantity: -Math.abs(qty),
          zoneId: fromZoneId,
        },
        {
          inventoryItemId: materialId,
          quantity: Math.abs(qty),
          zoneId: toZoneId,
        },
      ],
    })

    setTransferNo(
      `TR-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
    )
    setQuantity('')
    setReason('')
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Điều Chuyển Kho"
        description="Transfer runtime between warehouse zones with transaction-driven stock movement."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Documents"
          value={kpis.totalDocs.toLocaleString()}
        />
        <KpiCard
          title="Today"
          value={kpis.today.toLocaleString()}
        />
        <KpiCard
          title="This Week"
          value={kpis.thisWeek.toLocaleString()}
        />
        <KpiCard
          title="This Month"
          value={kpis.thisMonth.toLocaleString()}
        />
      </div>

      <RuntimePanel title="Filter Bar">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            type="date"
            value={transferDate}
            onChange={(event) =>
              setTransferDate(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
          <select
            value={materialId}
            onChange={(event) =>
              setMaterialId(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">
              Material
            </option>
            {materials.map((item: any) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.code} - {item.name}
              </option>
            ))}
          </select>
          <select
            value={fromZoneId}
            onChange={(event) =>
              setFromZoneId(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">
              From Zone
            </option>
            {zones.map((zone: any) => (
              <option
                key={zone.id}
                value={zone.id}
              >
                {zone.code} - {zone.name}
              </option>
            ))}
          </select>
          <select
            value={toZoneId}
            onChange={(event) =>
              setToZoneId(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">
              To Zone
            </option>
            {zones.map((zone: any) => (
              <option
                key={zone.id}
                value={zone.id}
              >
                {zone.code} - {zone.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">
              Status
            </option>
            <option value="COMPLETED">
              COMPLETED
            </option>
          </select>
        </div>
      </RuntimePanel>

      <RuntimePanel title="Quick Actions">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            'Create Transfer',
            'Review Conflicts',
            'Zone Capacity',
            'Export History',
          ].map((label) => (
            <button
              key={label}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-left text-sm text-zinc-200 hover:border-cyan-600"
            >
              {label}
            </button>
          ))}
        </div>
      </RuntimePanel>

      <RuntimePanel title="Main Table — Transfer History">
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Transfer No
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Transfer Date
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  From Zone
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  To Zone
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Material
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-zinc-400"
                  >
                    Loading transfers...
                  </td>
                </tr>
              )}
              {!isLoading &&
                filteredTransfers.map((item: any) => {
                  const negativeLine =
                    item.items?.find(
                      (line: any) =>
                        Number(
                          line.quantity,
                        ) < 0,
                    )
                  const positiveLine =
                    item.items?.find(
                      (line: any) =>
                        Number(
                          line.quantity,
                        ) > 0,
                    )

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-800 hover:bg-zinc-900/40"
                    >
                      <td className="px-4 py-3 text-cyan-300">
                        {item.transactionNo ??
                          item.code}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(
                          item.transactionDate ??
                            item.createdAt,
                        ).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {negativeLine?.zone
                          ?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-300">
                        {positiveLine?.zone
                          ?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {positiveLine
                          ?.inventoryItem
                          ?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-200">
                        {Math.abs(
                          Number(
                            positiveLine?.quantity ??
                              0,
                          ),
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {item.remarks || '-'}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </RuntimePanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RuntimePanel title="Transfer Form">
          <div className="space-y-3">
            <input
              value={transferNo}
              onChange={(event) =>
                setTransferNo(
                  event.target.value,
                )
              }
              placeholder="Transfer No"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
            <input
              type="date"
              value={transferDate}
              onChange={(event) =>
                setTransferDate(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />

            <select
              value={fromZoneId}
              onChange={(event) =>
                setFromZoneId(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="">
                From Zone
              </option>
              {zones.map((zone: any) => (
                <option
                  key={zone.id}
                  value={zone.id}
                >
                  {zone.code} - {zone.name}
                </option>
              ))}
            </select>

            <select
              value={toZoneId}
              onChange={(event) =>
                setToZoneId(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="">
                To Zone
              </option>
              {zones.map((zone: any) => (
                <option
                  key={zone.id}
                  value={zone.id}
                >
                  {zone.code} - {zone.name}
                </option>
              ))}
            </select>

            <select
              value={materialId}
              onChange={(event) =>
                setMaterialId(
                  event.target.value,
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            >
              <option value="">
                Material
              </option>
              {materials.map((item: any) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.code} - {item.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  event.target.value,
                )
              }
              placeholder="Quantity"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />

            <textarea
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value,
                )
              }
              placeholder="Reason"
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />

            <button
              onClick={submitTransfer}
              disabled={
                createMutation.isPending
              }
              className="w-full rounded-lg bg-cyan-500 px-3 py-2 font-medium text-black disabled:opacity-60"
            >
              {createMutation.isPending
                ? 'Đang tạo...'
                : 'Tạo điều chuyển'}
            </button>
          </div>
        </RuntimePanel>

        <div className="space-y-6">
          <RuntimePanel title="Insight: Transfer Load by Zone">
            <div className="space-y-2">
              {zones
                .slice(0, 5)
                .map((zone: any) => {
                  const count =
                    filteredTransfers.filter(
                      (item: any) =>
                        item.items?.some(
                          (line: any) =>
                            line.zoneId ===
                            zone.id,
                        ),
                    ).length
                  const width = Math.min(
                    100,
                    count * 12,
                  )
                  return (
                    <div
                      key={zone.id}
                      className="space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>
                          {zone.code}
                        </span>
                        <span>
                          {count}
                        </span>
                      </div>
                      <div className="h-2 rounded bg-zinc-800">
                        <div
                          className="h-2 rounded bg-cyan-500"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </RuntimePanel>

          <RuntimePanel title="Recent Activity">
            <div className="space-y-2 text-sm">
              {filteredTransfers
                .slice(0, 5)
                .map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-zinc-800 p-3"
                  >
                    <div className="text-cyan-300">
                      {item.transactionNo ??
                        item.code}
                    </div>
                    <div className="text-zinc-400">
                      {new Date(
                        item.transactionDate ??
                          item.createdAt,
                      ).toLocaleString()}
                    </div>
                  </div>
                ))}
            </div>
          </RuntimePanel>

          <RuntimePanel title="Top Materials">
            <div className="space-y-2 text-sm">
              {materials
                .slice(0, 5)
                .map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
                  >
                    <span className="text-zinc-200">
                      {item.code}
                    </span>
                    <span className="text-cyan-300">
                      {item.quantity}
                    </span>
                  </div>
                ))}
            </div>
          </RuntimePanel>
        </div>
      </div>

      <RuntimePanel title="Warehouse Flow Diagram">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {transferFlow.length === 0 && (
            <div className="text-sm text-zinc-500">
              No transfer flow data.
            </div>
          )}
          {transferFlow.map((flow) => (
            <div
              key={`${flow.from}-${flow.to}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-300">
                  {flow.from}
                  <span className="mx-2 text-cyan-400">
                    →
                  </span>
                  {flow.to}
                </div>
                <span className="rounded-full bg-cyan-900/40 px-2 py-1 text-xs text-cyan-300">
                  {flow.count} moves
                </span>
              </div>
              <div className="mt-2 h-2 rounded bg-zinc-800">
                <div
                  className="h-2 rounded bg-cyan-500"
                  style={{
                    width: `${Math.min(100, flow.count * 14)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </RuntimePanel>
    </EnterpriseModulePage>
  )
}
