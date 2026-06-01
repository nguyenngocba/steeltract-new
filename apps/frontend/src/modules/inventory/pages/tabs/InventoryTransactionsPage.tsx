import { useMemo, useState } from 'react'

import {
  EnterpriseModulePage,
} from '../../../../shared/runtime-tabs/EnterpriseModulePage'

import {
  EnterpriseTabBar,
} from '../../../../shared/runtime-tabs/EnterpriseTabBar'

import {
  inventoryTabs,
} from '../../config/inventory-tabs'

import {
  RuntimePanel,
  SectionHeader,
} from '../../../../shared/ui/enterprise'

import {
  useInventoryTransactions,
} from '../../hooks/useInventoryTransactions'
import { useSuppliers } from '../../hooks/useSuppliers'
import { useProjects } from '../../hooks/useProjects'

export function InventoryTransactionsPage() {
  const [fromDate, setFromDate] =
    useState('')
  const [toDate, setToDate] =
    useState('')
  const [supplierId, setSupplierId] =
    useState('')
  const [projectId, setProjectId] =
    useState('')
  const [type, setType] =
    useState('')

  const filters = useMemo(
    () => ({
      fromDate:
        fromDate || undefined,
      toDate:
        toDate || undefined,
      supplierId:
        supplierId || undefined,
      projectId:
        projectId || undefined,
      type: type || undefined,
    }),
    [
      fromDate,
      toDate,
      supplierId,
      projectId,
      type,
    ],
  )

  const {
    data: logs = [],
    isLoading,
  } = useInventoryTransactions(filters)

  const {
    data: suppliers = [],
  } = useSuppliers()

  const {
    data: projects = [],
  } = useProjects()

  function exportCsv() {
    const headers = [
      'transactionNo',
      'type',
      'direction',
      'materialCode',
      'materialName',
      'supplierName',
      'projectName',
      'quantity',
      'totalAmount',
      'transactionDate',
    ]

    const lines = logs.map((item: any) => {
      const firstLine =
        item.items?.[0]
      const quantity =
        Number(
          firstLine?.quantity ?? 0,
        )
      const amount =
        Number(
          firstLine?.totalAmount ?? 0,
        )

      return [
        item.transactionNo ?? '',
        item.type ?? '',
        item.direction ?? '',
        firstLine?.inventoryItem?.code ?? '',
        firstLine?.inventoryItem?.name ?? '',
        item.supplierName ?? '',
        item.projectName ?? '',
        String(Math.abs(quantity)),
        String(Math.abs(amount)),
        item.createdAt
          ? new Date(
              item.createdAt,
            ).toISOString()
          : '',
      ]
    })

    const csvContent = [
      headers.join(','),
      ...lines.map((line) =>
        line
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`,
          )
          .join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download =
      `inventory-transactions-${Date.now()}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <EnterpriseModulePage>
      <SectionHeader
        title="Inventory Transactions"
        description="Realtime stock movement and transaction telemetry."
      />

      <EnterpriseTabBar
        tabs={inventoryTabs}
      />

      <RuntimePanel
        title="Filters"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <input
            type="date"
            value={fromDate}
            onChange={(event) =>
              setFromDate(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />

          <input
            type="date"
            value={toDate}
            onChange={(event) =>
              setToDate(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          />

          <select
            value={supplierId}
            onChange={(event) =>
              setSupplierId(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">All suppliers</option>
            {suppliers.map(
              (supplier: any) => (
                <option
                  key={supplier.id}
                  value={supplier.id}
                >
                  {supplier.code} - {supplier.name}
                </option>
              ),
            )}
          </select>

          <select
            value={projectId}
            onChange={(event) =>
              setProjectId(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">All projects</option>
            {projects.map(
              (project: any) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.code} - {project.name}
                </option>
              ),
            )}
          </select>

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target.value,
              )
            }
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          >
            <option value="">All types</option>
            <option value="INBOUND">INBOUND</option>
            <option value="OUTBOUND">OUTBOUND</option>
            <option value="TRANSFER">TRANSFER</option>
            <option value="RETURN">RETURN</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>

          <button
            onClick={exportCsv}
            className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-black"
          >
            Export CSV
          </button>
        </div>
      </RuntimePanel>

      <RuntimePanel
        title="Transaction History"
      >

        {isLoading && (
          <div className="text-zinc-400">
            Loading transactions...
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-zinc-800">

          <table className="w-full">

            <thead className="bg-zinc-950">

              <tr>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Transaction No
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Type
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Direction
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Material
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Supplier
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Project
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Quantity
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Cost
                </th>

                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-zinc-500">
                  Date
                </th>

              </tr>

            </thead>

            <tbody>

              {logs.map((item: any) => {
                const firstLine =
                  item.items?.[0]
                const quantity =
                  Number(
                    firstLine?.quantity ?? 0,
                  )
                const totalAmount =
                  Number(
                    firstLine?.totalAmount ?? 0,
                  )
                const direction =
                  String(
                    item.direction ?? '',
                  ).toUpperCase()
                const isOutbound =
                  direction === 'OUT' ||
                  direction === 'OUTBOUND'

                return (
                  <tr
                    key={item.id}
                    className="border-t border-zinc-800 hover:bg-zinc-900"
                  >

                    <td className="px-4 py-4 text-cyan-400">
                      {item.transactionNo}
                    </td>

                    <td className="px-4 py-4 text-white">
                      {item.type}
                    </td>

                    <td className="px-4 py-4">

                      <span
                        className={
                          isOutbound
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }
                      >
                        {item.direction}
                      </span>

                    </td>

                    <td className="px-4 py-4 text-zinc-300">
                      {firstLine?.inventoryItem?.name ??
                        item.remarks ??
                        '-'}
                    </td>

                    <td className="px-4 py-4 text-zinc-300">
                      {item.supplierName ?? '-'}
                    </td>

                    <td className="px-4 py-4 text-zinc-300">
                      {item.projectName ?? '-'}
                    </td>

                    <td className="px-4 py-4 text-zinc-300">
                      {Math.abs(quantity)}
                    </td>

                    <td className="px-4 py-4 text-zinc-300">
                      {Math.abs(totalAmount).toLocaleString()}
                    </td>

                    <td className="px-4 py-4 text-zinc-500">
                      {new Date(
                        item.createdAt,
                      ).toLocaleString()}
                    </td>

                  </tr>
                )
              })}

            </tbody>

          </table>

        </div>

      </RuntimePanel>

    </EnterpriseModulePage>

  )
}
