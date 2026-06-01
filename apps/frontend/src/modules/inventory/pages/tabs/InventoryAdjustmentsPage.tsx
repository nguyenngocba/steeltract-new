import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { KpiCard, RuntimePanel, SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'

export function InventoryAdjustmentsPage() {
  const { data: materials = [] } =
    useInventoryItems()
  const {
    data: adjustments = [],
    isLoading,
  } = useInventoryTransactions({
    type: 'ADJUSTMENT',
  })
  const createMutation =
    useCreateTransaction()

  const [materialId, setMaterialId] =
    useState('')
  const [quantityDifference, setQuantityDifference] =
    useState('')
  const [reason, setReason] =
    useState('')
  const [createdBy, setCreatedBy] =
    useState('Warehouse Operator')
  const [adjustmentNo, setAdjustmentNo] =
    useState(
      `ADJ-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
    )
  const [dateFilter, setDateFilter] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10),
    )
  const [statusFilter, setStatusFilter] =
    useState('')

  async function submitAdjustment() {
    const difference =
      Number(
        quantityDifference,
      )
    if (
      !materialId ||
      !Number.isFinite(
        difference,
      ) ||
      difference === 0
    ) {
      return
    }

    await createMutation.mutateAsync({
      type: 'ADJUSTMENT',
      code: adjustmentNo,
      transactionNo:
        adjustmentNo,
      performedBy: createdBy,
      remarks: reason,
      items: [
        {
          inventoryItemId:
            materialId,
          quantity:
            difference,
        },
      ],
    })

    setQuantityDifference('')
    setReason('')
    setAdjustmentNo(
      `ADJ-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
    )
  }

  const filteredAdjustments =
    adjustments.filter((item: any) => {
      if (dateFilter) {
        const itemDate = new Date(
          item.transactionDate ??
            item.createdAt,
        )
          .toISOString()
          .slice(0, 10)
        if (itemDate !== dateFilter) {
          return false
        }
      }

      if (
        materialId &&
        !item.items?.some(
          (line: any) =>
            line.inventoryItemId ===
            materialId,
        )
      ) {
        return false
      }

      if (
        statusFilter &&
        String(
          item.status ??
            'POSTED',
        ).toUpperCase() !==
          statusFilter
      ) {
        return false
      }

      return true
    })

  const reasonAnalysis = useMemo(() => {
    const map = new Map<
      string,
      number
    >()
    filteredAdjustments.forEach(
      (item: any) => {
        const key =
          item.remarks?.trim() ||
          'Unspecified'
        map.set(
          key,
          (map.get(key) ?? 0) + 1,
        )
      },
    )
    return Array.from(
      map.entries(),
    )
      .map(
        ([
          reasonText,
          count,
        ]) => ({
          reasonText,
          count,
        }),
      )
      .sort(
        (a, b) =>
          b.count - a.count,
      )
      .slice(0, 5)
  }, [filteredAdjustments])

  const topAdjustedMaterials =
    useMemo(() => {
      const map = new Map<
        string,
        number
      >()
      filteredAdjustments.forEach(
        (item: any) => {
          const line =
            item.items?.[0]
          if (!line) {
            return
          }
          const code =
            line.inventoryItem
              ?.code ??
            line.inventoryItem
              ?.name ??
            'N/A'
          const qty = Math.abs(
            Number(
              line.quantity ?? 0,
            ),
          )
          map.set(
            code,
            (map.get(code) ?? 0) +
              qty,
          )
        },
      )
      return Array.from(
        map.entries(),
      )
        .map(
          ([
            materialCode,
            qty,
          ]) => ({
            materialCode,
            qty,
          }),
        )
        .sort(
          (a, b) =>
            b.qty - a.qty,
        )
        .slice(0, 5)
    }, [filteredAdjustments])

  const now = new Date()
  const todayKey = now
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

  const kpis = {
    totalDocs:
      filteredAdjustments.length,
    today: adjustments.filter(
      (item: any) =>
        new Date(
          item.transactionDate ??
            item.createdAt,
        )
          .toISOString()
          .slice(0, 10) === todayKey,
    ).length,
    thisWeek:
      adjustments.filter(
        (item: any) =>
          new Date(
            item.transactionDate ??
              item.createdAt,
          ) >= weekAgo,
      ).length,
    thisMonth:
      adjustments.filter(
        (item: any) =>
          new Date(
            item.transactionDate ??
              item.createdAt,
          ) >= monthStart,
      ).length,
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Điều Chỉnh Tồn Kho"
        description="Manual stock difference adjustment using transaction-driven update."
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
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
            value=""
            disabled
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-500"
          >
            <option>
              Zone (from line)
            </option>
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
            <option value="POSTED">
              POSTED
            </option>
          </select>
        </div>
      </RuntimePanel>

      <RuntimePanel title="Quick Actions">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            'Create Adjustment',
            'Review Negative Delta',
            'Approval Queue',
            'Export Variance',
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RuntimePanel title="Quick Adjustment Wizard">
          <div className="space-y-3">
            <input
              value={adjustmentNo}
              onChange={(event) =>
                setAdjustmentNo(
                  event.target.value,
                )
              }
              placeholder="Adjustment No"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />

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
              value={
                quantityDifference
              }
              onChange={(event) =>
                setQuantityDifference(
                  event.target.value,
                )
              }
              placeholder="Quantity Difference (+/-)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />

            <input
              value={createdBy}
              onChange={(event) =>
                setCreatedBy(
                  event.target.value,
                )
              }
              placeholder="Created By"
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
              onClick={
                submitAdjustment
              }
              disabled={
                createMutation.isPending
              }
              className="w-full rounded-lg bg-cyan-500 px-3 py-2 font-medium text-black disabled:opacity-60"
            >
              {createMutation.isPending
                ? 'Đang lưu...'
                : 'Tạo điều chỉnh'}
            </button>
          </div>
        </RuntimePanel>

        <RuntimePanel title="Adjustment Reason Analysis">
          <div className="space-y-2 text-sm">
            {reasonAnalysis.length ===
              0 && (
              <div className="text-zinc-500">
                No reason data.
              </div>
            )}
            {reasonAnalysis.map(
              (row) => (
                <div
                  key={
                    row.reasonText
                  }
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="truncate">
                      {
                        row.reasonText
                      }
                    </span>
                    <span>
                      {row.count}
                    </span>
                  </div>
                  <div className="h-2 rounded bg-zinc-800">
                    <div
                      className="h-2 rounded bg-orange-500"
                      style={{
                        width: `${Math.min(100, row.count * 20)}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </RuntimePanel>

        <RuntimePanel title="Top Adjusted Materials">
          <div className="space-y-2 text-sm text-zinc-300">
            {topAdjustedMaterials.map(
              (row) => (
                <div
                  key={
                    row.materialCode
                  }
                  className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
                >
                  <span>
                    {
                      row.materialCode
                    }
                  </span>
                  <span className="text-cyan-300">
                    {row.qty}
                  </span>
                </div>
              ),
            )}
          </div>
        </RuntimePanel>

        <RuntimePanel title="Recent Adjustment Activities">
          <div className="space-y-3 text-sm text-zinc-300">
            <div>
              Total adjustments:{' '}
              <span className="text-cyan-300">
                {filteredAdjustments.length}
              </span>
            </div>
            <div>
              Positive:
              <span className="ml-2 text-emerald-400">
                {
                  adjustments.filter(
                    (tx: any) =>
                      Number(
                        tx.items?.[0]
                          ?.quantity ?? 0,
                      ) > 0,
                  ).length
                }
              </span>
            </div>
            <div>
              Negative:
              <span className="ml-2 text-red-400">
                {
                  adjustments.filter(
                    (tx: any) =>
                      Number(
                        tx.items?.[0]
                          ?.quantity ?? 0,
                      ) < 0,
                  ).length
                }
              </span>
            </div>
            <div className="space-y-1 pt-2">
              <div className="text-xs text-zinc-500">
                Adjustment Intensity
              </div>
              <div className="h-2 rounded bg-zinc-800">
                <div
                  className="h-2 rounded bg-cyan-500"
                  style={{
                    width: `${Math.min(100, filteredAdjustments.length * 8)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </RuntimePanel>

        <RuntimePanel title="Last Adjustment">
          <div className="space-y-2 text-sm">
            {filteredAdjustments
              .slice(0, 6)
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
                    {item.items?.[0]
                      ?.inventoryItem
                      ?.name ?? '-'}
                  </div>
                  <div className="text-zinc-200">
                    Diff:{' '}
                    {Number(
                      item.items?.[0]
                        ?.quantity ?? 0,
                    )}
                  </div>
                </div>
              ))}
          </div>
        </RuntimePanel>
      </div>

      <RuntimePanel title="Main Table — Adjustment History">
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Material
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Quantity Difference
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Created By
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-zinc-400"
                  >
                    Loading adjustments...
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredAdjustments.map((item: any) => (
                  <tr
                    key={item.id}
                    className="border-t border-zinc-800 hover:bg-zinc-900/40"
                  >
                    <td className="px-4 py-3 text-cyan-300">
                      {item.transactionNo ??
                        item.code}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {item.items?.[0]
                        ?.inventoryItem
                        ?.name ?? '-'}
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        Number(
                          item.items?.[0]
                            ?.quantity ?? 0,
                        ) >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {Number(
                        item.items?.[0]
                          ?.quantity ?? 0,
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {item.remarks || '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {item.performedBy ||
                        '-'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </RuntimePanel>
    </EnterpriseModulePage>
  )
}
