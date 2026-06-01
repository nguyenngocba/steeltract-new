import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { KpiCard, RuntimePanel, SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useCreateTransaction } from '../../hooks/useCreateTransaction'
import { useInventoryItems } from '../../hooks/useInventoryItems'
import { useInventoryTransactions } from '../../hooks/useInventoryTransactions'

type CountRow = {
  materialId: string
  physicalQuantity: string
  method?: string
}

export function InventoryStockTakePage() {
  const { data: materials = [] } =
    useInventoryItems()
  const {
    data: adjustments = [],
  } = useInventoryTransactions({
    type: 'ADJUSTMENT',
  })
  const createMutation =
    useCreateTransaction()

  const [sessionNo, setSessionNo] =
    useState(
      `CNT-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
    )
  const [sessionDate, setSessionDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10),
    )
  const [createdBy, setCreatedBy] =
    useState('Warehouse Operator')
  const [statusFilter, setStatusFilter] =
    useState('')
  const [rows, setRows] = useState<
    CountRow[]
  >([])

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        materialId: '',
        physicalQuantity: '',
        method: 'CYCLE_COUNT',
      },
    ])
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.filter(
        (_row, rowIndex) =>
          rowIndex !== index,
      ),
    )
  }

  async function submitCountSession() {
    const adjustmentItems =
      rows
        .map((row) => {
          const material =
            materials.find(
              (item: any) =>
                item.id === row.materialId,
            )
          if (!material) {
            return null
          }

          const physicalQty = Number(
            row.physicalQuantity,
          )
          const systemQty = Number(
            material.quantity ?? 0,
          )
          const difference =
            physicalQty - systemQty

          if (
            !Number.isFinite(
              difference,
            ) ||
            difference === 0
          ) {
            return null
          }

          return {
            inventoryItemId:
              material.id,
            quantity: difference,
          }
        })
        .filter(
          Boolean,
        ) as Array<{
        inventoryItemId: string
        quantity: number
      }>

    if (
      adjustmentItems.length === 0
    ) {
      return
    }

    await createMutation.mutateAsync({
      type: 'ADJUSTMENT',
      code: sessionNo,
      transactionNo: sessionNo,
      transactionDate: sessionDate,
      performedBy: createdBy,
      remarks: `Stock count session ${sessionNo}`,
      items: adjustmentItems,
    })

    setRows([])
    setSessionNo(
      `CNT-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`,
    )
  }

  const countSheet = useMemo(() => {
    return rows.map((row) => {
      const material =
        materials.find(
          (item: any) =>
            item.id === row.materialId,
        )
      const systemQuantity =
        Number(
          material?.quantity ?? 0,
        )
      const physicalQuantity =
        Number(
          row.physicalQuantity ?? 0,
        )
      const difference =
        physicalQuantity -
        systemQuantity

      return {
        row,
        material,
        systemQuantity,
        physicalQuantity:
          Number.isFinite(
            physicalQuantity,
          )
            ? physicalQuantity
            : 0,
        difference:
          Number.isFinite(difference)
            ? difference
            : 0,
      }
    })
  }, [materials, rows])

  const sessionMetrics = useMemo(() => {
    const now = new Date()
    const today = now
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

    const base =
      statusFilter ===
      'WITH_DIFFERENCE'
        ? countSheet.filter(
            (sheet) =>
              sheet.difference !== 0,
          )
        : countSheet

    const todayCount =
      adjustments.filter(
        (item: any) =>
          new Date(
            item.transactionDate ??
              item.createdAt,
          )
            .toISOString()
            .slice(0, 10) === today,
      ).length
    const weekCount =
      adjustments.filter(
        (item: any) =>
          new Date(
            item.transactionDate ??
              item.createdAt,
          ) >= weekAgo,
      ).length
    const monthCount =
      adjustments.filter(
        (item: any) =>
          new Date(
            item.transactionDate ??
              item.createdAt,
          ) >= monthStart,
      ).length

    return {
      totalDocs: base.length,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
    }
  }, [
    countSheet,
    adjustments,
    statusFilter,
  ])

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Kiểm Kê Kho"
        description="Count session and count sheet for physical reconciliation."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          title="Total Documents"
          value={sessionMetrics.totalDocs.toLocaleString()}
        />
        <KpiCard
          title="Today"
          value={sessionMetrics.today.toLocaleString()}
        />
        <KpiCard
          title="This Week"
          value={sessionMetrics.thisWeek.toLocaleString()}
        />
        <KpiCard
          title="This Month"
          value={sessionMetrics.thisMonth.toLocaleString()}
        />
      </div>

      <RuntimePanel title="Filter Bar">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="date"
            value={sessionDate}
            onChange={(event) =>
              setSessionDate(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
          <select
            value={rows[0]?.materialId ?? ''}
            onChange={(event) => {
              const value =
                event.target.value
              setRows((prev) =>
                prev.length === 0
                  ? [
                      {
                        materialId:
                          value,
                        physicalQuantity:
                          '',
                        method:
                          'CYCLE_COUNT',
                      },
                    ]
                  : prev.map(
                      (
                        row,
                        index,
                      ) =>
                        index === 0
                          ? {
                              ...row,
                              materialId:
                                value,
                            }
                          : row,
                    ),
              )
            }}
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
              Zone (via count sheet)
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
            <option value="WITH_DIFFERENCE">
              WITH_DIFFERENCE
            </option>
          </select>
        </div>
      </RuntimePanel>

      <RuntimePanel title="Quick Actions">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            'Start Session',
            'Scan Materials',
            'Recount List',
            'Approve Adjustments',
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
        <RuntimePanel title="Count Session">
          <div className="space-y-3">
            <input
              value={sessionNo}
              onChange={(event) =>
                setSessionNo(
                  event.target.value,
                )
              }
              placeholder="Session No"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
            />
            <input
              type="date"
              value={sessionDate}
              onChange={(event) =>
                setSessionDate(
                  event.target.value,
                )
              }
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

            <button
              onClick={addRow}
              className="w-full rounded-lg border border-cyan-700 px-3 py-2 text-cyan-300"
            >
              + Add Count Row
            </button>

            <button
              onClick={
                submitCountSession
              }
              disabled={
                createMutation.isPending
              }
              className="w-full rounded-lg bg-cyan-500 px-3 py-2 font-medium text-black disabled:opacity-60"
            >
              {createMutation.isPending
                ? 'Đang ghi nhận...'
                : 'Ghi nhận kiểm kê'}
            </button>
          </div>
        </RuntimePanel>

        <RuntimePanel title="Count Sheet">
          <div className="space-y-3">
            {rows.length === 0 && (
              <div className="text-sm text-zinc-500">
                Add rows to start count sheet.
              </div>
            )}

            {rows.map((row, index) => (
              <div
                key={index}
                className="rounded-lg border border-zinc-800 p-3"
              >
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={row.materialId}
                    onChange={(event) =>
                      setRows((prev) =>
                        prev.map(
                          (
                            currentRow,
                            rowIndex,
                          ) =>
                            rowIndex ===
                            index
                              ? {
                              ...currentRow,
                              materialId:
                                event
                                  .target
                                  .value,
                                }
                              : currentRow,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                  >
                    <option value="">
                      Material
                    </option>
                    {materials.map(
                      (item: any) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.code} -{' '}
                          {item.name}
                        </option>
                      ),
                    )}
                  </select>
                  <input
                    type="number"
                    min="0"
                    value={
                      row.physicalQuantity
                    }
                    onChange={(event) =>
                      setRows((prev) =>
                        prev.map(
                          (
                            currentRow,
                            rowIndex,
                          ) =>
                            rowIndex ===
                            index
                              ? {
                                  ...currentRow,
                                  physicalQuantity:
                                    event
                                      .target
                                      .value,
                                }
                              : currentRow,
                        ),
                      )
                    }
                    placeholder="Physical Quantity"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                  />
                  <select
                    value={
                      row.method ??
                      'CYCLE_COUNT'
                    }
                    onChange={(event) =>
                      setRows((prev) =>
                        prev.map(
                          (
                            currentRow,
                            rowIndex,
                          ) =>
                            rowIndex ===
                            index
                              ? {
                                  ...currentRow,
                                  method:
                                    event
                                      .target
                                      .value,
                                }
                              : currentRow,
                        ),
                      )
                    }
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
                  >
                    <option value="CYCLE_COUNT">
                      Cycle Count
                    </option>
                    <option value="FULL_COUNT">
                      Full Count
                    </option>
                    <option value="SPOT_CHECK">
                      Spot Check
                    </option>
                  </select>
                  <button
                    onClick={() =>
                      removeRow(index)
                    }
                    className="rounded-lg border border-red-700 px-3 py-1.5 text-xs text-red-300"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </RuntimePanel>

        <RuntimePanel title="Right Insight Panel">
          <div className="space-y-2 text-sm">
            {countSheet.map(
              (
                sheet,
                index,
              ) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-800 p-3"
                >
                  <div className="text-white">
                    {sheet.material
                      ? `${sheet.material.code} - ${sheet.material.name}`
                      : 'Material chưa chọn'}
                  </div>
                  <div className="text-zinc-400">
                    System Quantity:{' '}
                    {sheet.systemQuantity}
                  </div>
                  <div className="text-zinc-400">
                    Physical Quantity:{' '}
                    {
                      sheet.physicalQuantity
                    }
                  </div>
                  <div
                    className={
                      sheet.difference > 0
                        ? 'text-emerald-400'
                        : sheet.difference < 0
                          ? 'text-red-400'
                          : 'text-zinc-400'
                    }
                  >
                    Difference:{' '}
                    {sheet.difference}
                  </div>
                </div>
              ),
            )}
          </div>
        </RuntimePanel>
      </div>

      <RuntimePanel title="Main Table — Count Sheet">
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full">
            <thead className="bg-zinc-950">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Material
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  System Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Physical Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                  Difference
                </th>
              </tr>
            </thead>
            <tbody>
              {countSheet.map(
                (sheet, index) => (
                  <tr
                    key={index}
                    className="border-t border-zinc-800"
                  >
                    <td className="px-4 py-3 text-white">
                      {sheet.material
                        ? `${sheet.material.code} - ${sheet.material.name}`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {sheet.systemQuantity}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {sheet.physicalQuantity}
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        sheet.difference > 0
                          ? 'text-emerald-400'
                          : sheet.difference < 0
                            ? 'text-red-400'
                            : 'text-zinc-400'
                      }`}
                    >
                      {sheet.difference}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </RuntimePanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RuntimePanel title="Count Session Table" className="xl:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Material Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Difference Qty
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {adjustments.slice(0, 8).map((tx: any) => (
                  <tr
                    key={tx.id}
                    className="border-t border-zinc-800"
                  >
                    <td className="px-4 py-3 text-cyan-300">
                      {tx.transactionNo ??
                        tx.code}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {new Date(
                        tx.transactionDate ??
                          tx.createdAt,
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {tx.items?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {Number(
                        tx.items?.[0]
                          ?.quantity ?? 0,
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded border border-cyan-700/50 px-2 py-1 text-xs text-cyan-300">
                        Counted
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RuntimePanel>

        <RuntimePanel title="Difference Analysis Panel">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-zinc-800 p-3">
              <div className="text-zinc-400">
                Positive Difference
              </div>
              <div className="text-lg font-semibold text-emerald-400">
                {
                  countSheet.filter(
                    (row) =>
                      row.difference > 0,
                  ).length
                }
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 p-3">
              <div className="text-zinc-400">
                Negative Difference
              </div>
              <div className="text-lg font-semibold text-red-400">
                {
                  countSheet.filter(
                    (row) =>
                      row.difference < 0,
                  ).length
                }
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 p-3">
              <div className="text-zinc-400">
                Net Difference
              </div>
              <div className="text-lg font-semibold text-cyan-300">
                {countSheet.reduce(
                  (sum, row) =>
                    sum +
                    row.difference,
                  0,
                )}
              </div>
            </div>
          </div>
        </RuntimePanel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RuntimePanel title="Accuracy Metrics" className="xl:col-span-2">
          <div className="space-y-3">
            {countSheet.map(
              (row, index) => {
                const base =
                  row.systemQuantity <=
                  0
                    ? 1
                    : row.systemQuantity
                const accuracy =
                  Math.max(
                    0,
                    100 -
                      (Math.abs(
                        row.difference,
                      ) /
                        base) *
                        100,
                  )
                return (
                  <div
                    key={index}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        {row.material
                          ? row.material.code
                          : 'N/A'}
                      </span>
                      <span>
                        {accuracy.toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 rounded bg-zinc-800">
                      <div
                        className="h-2 rounded bg-emerald-500"
                        style={{
                          width: `${Math.min(100, accuracy)}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </RuntimePanel>

        <RuntimePanel title="Method Distribution Charts">
          <div className="space-y-3 text-sm">
            {[
              'CYCLE_COUNT',
              'FULL_COUNT',
              'SPOT_CHECK',
            ].map((method) => {
              const count =
                rows.filter(
                  (row) =>
                    (row.method ??
                      'CYCLE_COUNT') ===
                    method,
                ).length
              return (
                <div
                  key={method}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between text-zinc-300">
                    <span>
                      {method}
                    </span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 rounded bg-zinc-800">
                    <div
                      className="h-2 rounded bg-cyan-500"
                      style={{
                        width: `${Math.min(100, count * 20)}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </RuntimePanel>
      </div>
    </EnterpriseModulePage>
  )
}
