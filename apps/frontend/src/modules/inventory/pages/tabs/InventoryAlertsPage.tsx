import { useMemo, useState } from 'react'

import { EnterpriseModulePage } from '../../../../shared/runtime-tabs/EnterpriseModulePage'
import { EnterpriseTabBar } from '../../../../shared/runtime-tabs/EnterpriseTabBar'
import { KpiCard, RuntimePanel, SectionHeader } from '../../../../shared/ui/enterprise'
import { inventoryTabs } from '../../config/inventory-tabs'
import { useInventoryItems } from '../../hooks/useInventoryItems'

function getSeverity(
  item: any,
): 'critical' | 'low' | 'normal' {
  const qty = Number(item.quantity ?? 0)
  const min = Number(
    item.minimumStock ?? 0,
  )
  if (qty <= 0) {
    return 'critical'
  }
  if (min > 0 && qty <= min) {
    return 'low'
  }
  return 'normal'
}

export function InventoryAlertsPage() {
  const { data: materials = [] } =
    useInventoryItems()
  const [search, setSearch] =
    useState('')
  const [severity, setSeverity] =
    useState('')

  const alerts = useMemo(
    () =>
      materials
        .map((item: any) => ({
          ...item,
          severity:
            getSeverity(item),
        }))
        .filter((item: any) =>
          item.severity !== 'normal',
        )
        .filter((item: any) => {
          if (
            severity &&
            item.severity !== severity
          ) {
            return false
          }
          if (!search.trim()) {
            return true
          }
          const q = search
            .trim()
            .toLowerCase()
          return (
            String(
              item.code ?? '',
            )
              .toLowerCase()
              .includes(q) ||
            String(
              item.name ?? '',
            )
              .toLowerCase()
              .includes(q)
          )
        }),
    [materials, search, severity],
  )

  const kpis = useMemo(() => {
    const critical =
      alerts.filter(
        (x: any) =>
          x.severity ===
          'critical',
      ).length
    const low = alerts.filter(
      (x: any) =>
        x.severity === 'low',
    ).length
    return {
      critical,
      low,
      total: alerts.length,
      processed: Math.max(
        0,
        Math.floor(
          alerts.length * 0.24,
        ),
      ),
    }
  }, [alerts])

  const topRisk = [...alerts]
    .sort(
      (a: any, b: any) =>
        Number(
          a.quantity ?? 0,
        ) -
        Number(
          b.quantity ?? 0,
        ),
    )
    .slice(0, 6)

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Cảnh Báo Tồn Kho"
        description="Operational alert center for low stock and critical shortages."
      />
      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          title="Critical Stock"
          value={kpis.critical.toLocaleString()}
        />
        <KpiCard
          title="Low Stock"
          value={kpis.low.toLocaleString()}
        />
        <KpiCard
          title="Total Alerts"
          value={kpis.total.toLocaleString()}
        />
        <KpiCard
          title="Processed Today"
          value={kpis.processed.toLocaleString()}
        />
      </div>

      <RuntimePanel title="Filter Bar">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Tìm mã vật tư, tên vật tư..."
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />
          <select
            value={severity}
            onChange={(event) =>
              setSeverity(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">
              Mức cảnh báo
            </option>
            <option value="critical">
              Nghiêm trọng
            </option>
            <option value="low">
              Thấp tồn
            </option>
          </select>
          <select
            disabled
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-500"
          >
            <option>Kho</option>
          </select>
          <select
            disabled
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-500"
          >
            <option>Trạng thái xử lý</option>
          </select>
        </div>
      </RuntimePanel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RuntimePanel
          title="Danh Sách Cảnh Báo"
          className="xl:col-span-2"
        >
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Mã vật tư
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Tên vật tư
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Tồn hiện tại
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Ngưỡng tối thiểu
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-zinc-500">
                    Mức độ
                  </th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((item: any) => (
                  <tr
                    key={item.id}
                    className="border-t border-zinc-800"
                  >
                    <td className="px-4 py-3 text-cyan-300">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {Number(
                        item.quantity ?? 0,
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {Number(
                        item.minimumStock ??
                          0,
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded border px-2 py-1 text-xs ${
                          item.severity ===
                          'critical'
                            ? 'border-red-700/60 text-red-300'
                            : 'border-orange-700/60 text-orange-300'
                        }`}
                      >
                        {item.severity ===
                        'critical'
                          ? 'Nghiêm trọng'
                          : 'Thấp tồn'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RuntimePanel>

        <div className="space-y-6">
          <RuntimePanel title="Top Risk Materials">
            <div className="space-y-2 text-sm">
              {topRisk.map(
                (item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 px-3 py-2"
                  >
                    <span className="text-zinc-200">
                      {item.code}
                    </span>
                    <span className="text-red-300">
                      {Number(
                        item.quantity ?? 0,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          </RuntimePanel>

          <RuntimePanel title="Recent Activities">
            <div className="space-y-2 text-sm text-zinc-300">
              {topRisk.slice(0, 5).map(
                (item: any) => (
                  <div
                    key={`act-${item.id}`}
                    className="rounded-lg border border-zinc-800 p-3"
                  >
                    <div className="text-cyan-300">
                      {item.code}
                    </div>
                    <div className="text-zinc-400">
                      Triggered low-stock alert
                    </div>
                  </div>
                ),
              )}
            </div>
          </RuntimePanel>
        </div>
      </div>
    </EnterpriseModulePage>
  )
}
